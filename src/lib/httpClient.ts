import { tokenStore } from '../auth/tokenStore'
import type { AuthTokens } from '../types/auth'
import type {
  ApiError,
  HttpRequestInit,
  RequestInterceptor,
  ResponseInterceptor,
} from '../types/api'

const baseUrl = (import.meta.env?.VITE_API_BASE_URL ?? '').replace(/\/$/, '')

const requestInterceptors: RequestInterceptor[] = []
const responseInterceptors: ResponseInterceptor[] = []

export function addRequestInterceptor(fn: RequestInterceptor) {
  requestInterceptors.push(fn)
}

export function addResponseInterceptor(fn: ResponseInterceptor) {
  responseInterceptors.push(fn)
}

let refreshPromise: Promise<AuthTokens> | null = null

function runTokenRefresh(): Promise<AuthTokens> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const tokens = tokenStore.get()
      if (!tokens?.refreshToken) {
        throw new Error('No refresh token available')
      }
      const res = await post<AuthTokens>(
        '/api/v1/authentication/refresh-token',
        { refreshToken: tokens.refreshToken },
        { anonymous: true, _isRefresh: true },
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
  return refreshPromise
}

addRequestInterceptor((init) => {
  if (init.anonymous) {
    return init
  }
  const tokens = tokenStore.get()
  if (tokens?.accessToken) {
    const headers: Record<string, string> = {
      ...(init.headers as Record<string, string> | undefined),
    }
    headers['Authorization'] = `Bearer ${tokens.accessToken}`
    return {
      ...init,
      headers,
    }
  }
  return init
})

interface ErrorDetailItem {
  errorCode?: string
  field?: string
  message?: string
}

async function buildError(response: Response): Promise<ApiError> {
  let errorCode = 'HTTP_ERROR'
  let message = ''
  let errors: Record<string, string[]> = {}
  let retryAfter: number | string | null = null

  try {
    const text = await response.text()
    if (text) {
      const body = JSON.parse(text) as {
        errorCode?: string
        message?: string
        errors?: Record<string, string[]>
        retryAfter?: number | string
        errorDetail?: ErrorDetailItem[]
      }
      if (body.errorCode) errorCode = body.errorCode
      if (body.message) message = body.message
      if (body.errors !== undefined) errors = body.errors
      if (body.retryAfter !== undefined) retryAfter = body.retryAfter

      if (!body.errorCode && Array.isArray(body.errorDetail) && body.errorDetail.length > 0) {
        const firstDetail = body.errorDetail[0]
        if (firstDetail.errorCode) errorCode = firstDetail.errorCode
        if (!message && firstDetail.message) message = firstDetail.message
        for (const detail of body.errorDetail) {
          if (detail.errorCode) {
            const field = detail.field || '_general'
            if (!errors[field]) errors[field] = []
            errors[field].push(detail.errorCode)
          }
        }
      }
    }
  } catch {
    // response body was not JSON — use defaults above
  }

  if (retryAfter === null || retryAfter === undefined) {
    const headerVal = response.headers.get('Retry-After')
    if (headerVal) {
      const parsedHeader = parseInt(headerVal, 10)
      retryAfter = Number.isNaN(parsedHeader) ? headerVal : parsedHeader
    } else {
      retryAfter = null
    }
  }

  return { status: response.status, errorCode, message, errors, retryAfter }
}

async function request<T = unknown>(path: string, init: HttpRequestInit = {}): Promise<T | null> {
  const defaultHeaders: Record<string, string> = {
    Accept: 'application/json',
  }

  if (!(init.body instanceof FormData)) {
    defaultHeaders['Content-Type'] = 'application/json'
  }

  let finalInit: HttpRequestInit = {
    ...init,
    headers: {
      ...defaultHeaders,
      ...(init.headers as Record<string, string> | undefined),
    },
  }

  for (const interceptor of requestInterceptors) {
    finalInit = interceptor(finalInit)
  }

  const { params, anonymous, _isRefresh, ...fetchInit } = finalInit

  let resolvedPath = path
  if (params) {
    const qs = new URLSearchParams()
    for (const [k, v] of Object.entries(params)) {
      if (v !== null && v !== undefined) qs.append(k, String(v))
    }
    const sep = path.includes('?') ? '&' : '?'
    const qsStr = qs.toString()
    if (qsStr) resolvedPath = `${path}${sep}${qsStr}`
  }

  let response: Response
  try {
    response = await fetch(`${baseUrl}${resolvedPath}`, fetchInit)
  } catch {
    return Promise.reject({
      status: 0,
      errorCode: 'NETWORK_ERROR',
      message: '',
      errors: {},
      retryAfter: null,
    } satisfies ApiError)
  }

  for (const interceptor of responseInterceptors) {
    interceptor(response)
  }

  if (
    response.status === 401 &&
    !anonymous &&
    !_isRefresh &&
    path !== '/api/v1/authentication/refresh-token'
  ) {
    try {
      await runTokenRefresh()
      return await request<T>(path, init)
    } catch (err: unknown) {
      return Promise.reject(err)
    }
  }

  if (!response.ok) {
    return Promise.reject(await buildError(response))
  }

  const text = await response.text()
  if (!text) return null
  return JSON.parse(text) as T
}

export function get<T = unknown>(path: string, opts: HttpRequestInit = {}) {
  return request<T>(path, { ...opts, method: 'GET' })
}

export async function getBlob(path: string, opts: HttpRequestInit = {}) {
  let finalInit: HttpRequestInit = {
    ...opts,
    method: 'GET',
    headers: { ...(opts.headers as Record<string, string> | undefined) },
  }

  for (const interceptor of requestInterceptors) {
    finalInit = interceptor(finalInit)
  }

  const { params, anonymous, _isRefresh, ...fetchInit } = finalInit

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

  let response: Response
  try {
    response = await fetch(`${baseUrl}${url}`, fetchInit)
  } catch {
    return Promise.reject({
      status: 0,
      errorCode: 'NETWORK_ERROR',
      message: '',
      errors: {},
      retryAfter: null,
    } satisfies ApiError)
  }

  for (const interceptor of responseInterceptors) {
    interceptor(response)
  }

  if (
    response.status === 401 &&
    !anonymous &&
    !_isRefresh &&
    path !== '/api/v1/authentication/refresh-token'
  ) {
    try {
      await runTokenRefresh()
      return await getBlob(path, opts)
    } catch (err: unknown) {
      return Promise.reject(err)
    }
  }

  if (!response.ok) {
    return Promise.reject(await buildError(response))
  }
  return await response.blob()
}

export function post<T = unknown>(path: string, body?: unknown, opts: HttpRequestInit = {}) {
  const init: HttpRequestInit = { ...opts, method: 'POST' }
  if (body !== undefined) init.body = JSON.stringify(body)
  return request<T>(path, init)
}

export function put<T = unknown>(path: string, body?: unknown, opts: HttpRequestInit = {}) {
  const init: HttpRequestInit = { ...opts, method: 'PUT' }
  if (body !== undefined) init.body = JSON.stringify(body)
  return request<T>(path, init)
}

export function patch<T = unknown>(path: string, body?: unknown, opts: HttpRequestInit = {}) {
  const init: HttpRequestInit = { ...opts, method: 'PATCH' }
  if (body !== undefined) init.body = JSON.stringify(body)
  return request<T>(path, init)
}

export function del<T = unknown>(path: string, opts: HttpRequestInit = {}) {
  return request<T>(path, { ...opts, method: 'DELETE' })
}

export function upload<T = unknown>(
  path: string,
  formData: FormData,
  method: 'POST' | 'PUT' = 'POST',
  opts: HttpRequestInit = {},
) {
  const { headers, ...restOpts } = opts
  const customHeaders: Record<string, string> = {
    Accept: 'application/json',
    ...(headers as Record<string, string> | undefined),
  }
  delete customHeaders['Content-Type']

  return request<T>(path, {
    ...restOpts,
    method,
    body: formData,
    headers: customHeaders,
  })
}

const httpClient = {
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

export default httpClient
