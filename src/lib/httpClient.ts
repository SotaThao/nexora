import { tokenStore } from '../auth/tokenStore'

/** Extended fetch init with httpClient-specific options. */
export interface HttpRequestInit extends Omit<RequestInit, 'body'> {
  anonymous?: boolean
  _isRefresh?: boolean
  params?: Record<string, string | number | boolean | null | undefined>
  body?: BodyInit | null
}

/** Shape of a normalised API error rejected by httpClient. */
export interface ApiError {
  status: number
  errorCode: string
  errors: Record<string, unknown>
  retryAfter: number | string | null
}

const baseUrl = (import.meta.env?.VITE_API_BASE_URL ?? '').replace(/\/$/, '')

const requestInterceptors: Array<(init: HttpRequestInit) => HttpRequestInit> = []

const responseInterceptors: Array<(response: Response) => void> = []

/**
 * Register a request interceptor.
 * The function receives the RequestInit object and must return it (possibly mutated).
 * Interceptors are applied in registration order.
 */
export function addRequestInterceptor(fn: (init: HttpRequestInit) => HttpRequestInit): void {
  requestInterceptors.push(fn)
}

/**
 * Register a response interceptor.
 * The function receives the raw Response object (before JSON decode).
 * Interceptors are applied in registration order.
 */
export function addResponseInterceptor(fn: (response: Response) => void): void {
  responseInterceptors.push(fn)
}

// Module-level refresh promise sentinel
let refreshPromise: Promise<unknown> | null = null

/**
 * Single-flight token refresh. Concurrent callers share one in-flight refresh.
 * On failure, clears tokens and dispatches the logout event.
 *
 * @returns {Promise<unknown>} The refreshed token payload
 */
function runTokenRefresh() {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const tokens = tokenStore.get()
      if (!tokens?.refreshToken) {
        throw new Error('No refresh token available')
      }
      // POST to refresh-token endpoint anonymously with _isRefresh flag
      const res = await post(
        '/api/v1/authentication/refresh-token',
        { refreshToken: tokens.refreshToken },
        { anonymous: true, _isRefresh: true }
      )
      tokenStore.set(res as any)
      return res
    })()
      .catch((err) => {
        tokenStore.clear()
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('nexora-logout'))
        }
        throw err
      })
      .finally(() => {
        refreshPromise = null
      })
  }
  return refreshPromise
}

// Register Bearer token interceptor — always active in API-only mode
addRequestInterceptor((init) => {
  if (init.anonymous) {
    return init
  }
  const tokens = tokenStore.get()
  if (tokens?.accessToken) {
    const headers = { ...init.headers }
    headers['Authorization'] = `Bearer ${tokens.accessToken}`
    return {
      ...init,
      headers,
    }
  }
  return init
})

/**
 * Parse an error body from a non-2xx response into a normalized shape.
 *
 * @param {Response} response
 * @returns {Promise<{ status: number, errorCode: string, errors: object, retryAfter: number|null }>}
 */
async function buildError(response: Response): Promise<ApiError> {
  let errorCode = 'HTTP_ERROR'
  let errors: Record<string, unknown> = {}
  let retryAfter = null

  try {
    const text = await response.text()
    if (text) {
      const body = JSON.parse(text)
      if (body.errorCode) errorCode = body.errorCode
      if (body.errors !== undefined) errors = body.errors
      if (body.retryAfter !== undefined) retryAfter = body.retryAfter

      // Backend sometimes returns errorCode inside `errorDetail` array
      // e.g. { errorDetail: [{ message: "...", errorCode: "USER_EMAIL_ALREADY_EXISTS" }] }
      if (!body.errorCode && Array.isArray(body.errorDetail) && body.errorDetail.length > 0) {
        const firstDetail = body.errorDetail[0]
        if (firstDetail.errorCode) errorCode = firstDetail.errorCode
        // Build errors map from all detail items
        for (const detail of body.errorDetail) {
          if (detail.errorCode) {
            const field = detail.field || '_general'
            if (!errors[field]) errors[field] = []
            ;(errors[field] as unknown[]).push(detail.errorCode)
          }
        }
      }
    }
  } catch (e) {
    // response body was not JSON — use defaults above
  }

  // Also read Retry-After header as fallback if not in body
  if (retryAfter === null || retryAfter === undefined) {
    const headerVal = response.headers.get('Retry-After')
    if (headerVal) {
      const parsedHeader = parseInt(headerVal, 10)
      retryAfter = isNaN(parsedHeader) ? headerVal : parsedHeader
    } else {
      retryAfter = null
    }
  }

  return { status: response.status, errorCode, errors, retryAfter }
}

/**
 * Core request executor.
 *
 * @param {string} path - Path relative to baseUrl (e.g. '/api/users')
 * @param {RequestInit & { anonymous?: boolean, _isRefresh?: boolean }} init - fetch init options
 * @returns {Promise<unknown>} - Parsed JSON response body
 */
async function request<T = unknown>(path: string, init: HttpRequestInit = {}): Promise<T> {
  const defaultHeaders: Record<string, string> = {
    Accept: 'application/json',
  }

  // Do not set Content-Type for FormData uploads (browser will auto-set boundary)
  if (!(init.body instanceof FormData)) {
    defaultHeaders['Content-Type'] = 'application/json'
  }

  let finalInit: HttpRequestInit = {
    ...init,
    headers: {
      ...defaultHeaders,
      ...(init.headers ?? {}),
    },
  }

  // Apply request interceptors in order
  for (const interceptor of requestInterceptors) {
    finalInit = interceptor(finalInit)
  }

  // Strip custom properties that must not be forwarded to fetch
  const { params, anonymous, _isRefresh, ...fetchInit } = finalInit

  // Serialize query params into the URL
  if (params) {
    const qs = new URLSearchParams()
    for (const [k, v] of Object.entries(params)) {
      if (v !== null && v !== undefined) qs.append(k, String(v))
    }
    const sep = path.includes('?') ? '&' : '?'
    const qsStr = qs.toString()
    if (qsStr) path = `${path}${sep}${qsStr}`
  }

  let response
  try {
    response = await fetch(`${baseUrl}${path}`, fetchInit)
  } catch (err) {
    // Normalize network exceptions
    return Promise.reject({
      status: 0,
      errorCode: 'NETWORK_ERROR',
      errors: {},
      retryAfter: null,
    })
  }

  // Apply response interceptors in order
  for (const interceptor of responseInterceptors) {
    interceptor(response)
  }

  // Single-flight 401 -> refresh -> retry interceptor
  if (
    response.status === 401 &&
    !anonymous &&
    !_isRefresh &&
    path !== '/api/v1/authentication/refresh-token'
  ) {
    try {
      await runTokenRefresh()
      // Retry request: interceptor will fetch the updated token
      return await request(path, init)
    } catch (err) {
      return Promise.reject(err)
    }
  }

  if (!response.ok) {
    return Promise.reject(await buildError(response))
  }

  // Parse JSON; return null for empty bodies (204 No Content, etc.)
  const text = await response.text()
  if (!text) return null as unknown as T
  return JSON.parse(text) as T
}

/**
 * GET /path
 * @param {string} path
 * @param {HttpRequestInit} [opts]
 */
export function get<T = unknown>(path: string, opts: HttpRequestInit = {}): Promise<T> {
  return request(path, { ...opts, method: 'GET' }) as Promise<T>
}

/**
 * GET /path and return Blob
 * @param {string} path
 * @param {HttpRequestInit} [opts]
 */
export async function getBlob(path: string, opts: HttpRequestInit = {}): Promise<Blob> {
  // Mirrors request() so authenticated downloads share the same params,
  // interceptors, error normalization, and 401 -> refresh -> retry behavior.
  let finalInit: HttpRequestInit = {
    ...opts,
    method: 'GET',
    headers: { ...(opts.headers ?? {}) },
  }

  for (const interceptor of requestInterceptors) {
    finalInit = interceptor(finalInit)
  }

  const { params, anonymous, _isRefresh, ...fetchInit } = finalInit

  // Serialize query params into the URL
  let url = path
  if (params) {
    const qs = new URLSearchParams()
    for (const [k, v] of Object.entries(params)) {
      if (v !== null && v !== undefined) qs.append(k, String(v))
    }
    const sep = path.includes('?') ? '&' : '?'
    const qsStr = qs.toString()
    if (qsStr) url = `${path}${sep}${qsStr}`
  }

  let response
  try {
    response = await fetch(`${baseUrl}${url}`, fetchInit)
  } catch (err) {
    return Promise.reject({
      status: 0,
      errorCode: 'NETWORK_ERROR',
      errors: {},
      retryAfter: null,
    })
  }

  for (const interceptor of responseInterceptors) {
    interceptor(response)
  }

  // Single-flight 401 -> refresh -> retry
  if (
    response.status === 401 &&
    !anonymous &&
    !_isRefresh &&
    path !== '/api/v1/authentication/refresh-token'
  ) {
    try {
      await runTokenRefresh()
      // Retry: interceptor will fetch the updated token
      return await getBlob(path, opts)
    } catch (err) {
      return Promise.reject(err)
    }
  }

  if (!response.ok) {
    return Promise.reject(await buildError(response))
  }
  return await response.blob()
}

/**
 * POST /path with JSON body
 * @param {string} path
 * @param {unknown} [body]
 * @param {HttpRequestInit} [opts]
 */
export function post<T = unknown>(path: string, body?: unknown, opts: HttpRequestInit = {}): Promise<T> {
  return request(path, { ...opts, method: 'POST', body: JSON.stringify(body) }) as Promise<T>
}

/**
 * PUT /path with JSON body
 * @param {string} path
 * @param {unknown} [body]
 * @param {HttpRequestInit} [opts]
 */
export function put<T = unknown>(path: string, body?: unknown, opts: HttpRequestInit = {}): Promise<T> {
  return request(path, { ...opts, method: 'PUT', body: JSON.stringify(body) }) as Promise<T>
}

/**
 * PATCH /path with JSON body
 * @param {string} path
 * @param {unknown} [body]
 * @param {HttpRequestInit} [opts]
 */
export function patch<T = unknown>(path: string, body?: unknown, opts: HttpRequestInit = {}): Promise<T> {
  return request(path, { ...opts, method: 'PATCH', body: JSON.stringify(body) }) as Promise<T>
}

/**
 * DELETE /path
 * @param {string} path
 * @param {HttpRequestInit} [opts]
 */
export function del<T = unknown>(path: string, opts: HttpRequestInit = {}): Promise<T> {
  return request(path, { ...opts, method: 'DELETE' }) as Promise<T>
}

/**
 * Upload helper using FormData.
 *
 * @param {string} path
 * @param {FormData} formData
 * @param {'POST'|'PUT'} [method='POST']
 * @param {HttpRequestInit} [opts]
 */
export function upload<T = unknown>(path: string, formData: FormData, method: 'POST' | 'PUT' = 'POST', opts: HttpRequestInit = {}): Promise<T> {
  const { headers, ...restOpts } = opts
  const customHeaders = {
    Accept: 'application/json',
    ...(headers ?? {}),
  }
  // Let the browser set the boundary for multipart/form-data
  delete customHeaders['Content-Type']

  return request(path, {
    ...restOpts,
    method,
    body: formData,
    headers: customHeaders,
  }) as Promise<T>
}

export default {
  get,
  getBlob,
  post,
  put,
  patch,
  del,
  upload,
  addRequestInterceptor,
  addResponseInterceptor,
}
