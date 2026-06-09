import { tokenStore } from '../auth/tokenStore'

const baseUrl = (import.meta.env?.VITE_API_BASE_URL ?? '').replace(/\/$/, '')

/** @type {Array<(init: RequestInit) => RequestInit>} */
const requestInterceptors = []

/** @type {Array<(response: Response) => void>} */
const responseInterceptors = []

/**
 * Register a request interceptor.
 * The function receives the RequestInit object and must return it (possibly mutated).
 * Interceptors are applied in registration order.
 *
 * @param {(init: RequestInit) => RequestInit} fn
 */
export function addRequestInterceptor(fn) {
  requestInterceptors.push(fn)
}

/**
 * Register a response interceptor.
 * The function receives the raw Response object (before JSON decode).
 * Interceptors are applied in registration order.
 *
 * @param {(response: Response) => void} fn
 */
export function addResponseInterceptor(fn) {
  responseInterceptors.push(fn)
}

// Module-level refresh promise sentinel
let refreshPromise = null

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
async function buildError(response) {
  let errorCode = 'HTTP_ERROR'
  let errors = {}
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
            errors[field].push(detail.errorCode)
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
async function request(path, init = {}) {
  const defaultHeaders = {
    Accept: 'application/json',
  }

  // Do not set Content-Type for FormData uploads (browser will auto-set boundary)
  if (!(init.body instanceof FormData)) {
    defaultHeaders['Content-Type'] = 'application/json'
  }

  let finalInit = {
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
        tokenStore.set(res)
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

    try {
      await refreshPromise
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
  if (!text) return null
  return JSON.parse(text)
}

/**
 * GET /path
 * @param {string} path
 * @param {RequestInit & { anonymous?: boolean }} [opts]
 */
export function get(path, opts = {}) {
  return request(path, { ...opts, method: 'GET' })
}

/**
 * POST /path with JSON body
 * @param {string} path
 * @param {unknown} body
 * @param {RequestInit & { anonymous?: boolean }} [opts]
 */
export function post(path, body, opts = {}) {
  return request(path, { ...opts, method: 'POST', body: JSON.stringify(body) })
}

/**
 * PUT /path with JSON body
 * @param {string} path
 * @param {unknown} body
 * @param {RequestInit & { anonymous?: boolean }} [opts]
 */
export function put(path, body, opts = {}) {
  return request(path, { ...opts, method: 'PUT', body: JSON.stringify(body) })
}

/**
 * PATCH /path with JSON body
 * @param {string} path
 * @param {unknown} body
 * @param {RequestInit & { anonymous?: boolean }} [opts]
 */
export function patch(path, body, opts = {}) {
  return request(path, { ...opts, method: 'PATCH', body: JSON.stringify(body) })
}

/**
 * DELETE /path
 * @param {string} path
 * @param {RequestInit & { anonymous?: boolean }} [opts]
 */
export function del(path, opts = {}) {
  return request(path, { ...opts, method: 'DELETE' })
}

/**
 * Upload helper using FormData.
 *
 * @param {string} path
 * @param {FormData} formData
 * @param {'POST'|'PUT'} [method='POST']
 * @param {RequestInit & { anonymous?: boolean }} [opts]
 */
export function upload(path, formData, method = 'POST', opts = {}) {
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
  })
}

export default {
  get,
  post,
  put,
  patch,
  del,
  upload,
  addRequestInterceptor,
  addResponseInterceptor,
}
