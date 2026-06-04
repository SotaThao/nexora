/**
 * HTTP client scaffold — fetch wrapper with:
 *   - Base URL from VITE_API_BASE_URL (fallback '')
 *   - credentials: 'include' (httpOnly-cookie ready)
 *   - JSON encode/decode
 *   - Normalized error shape: { status, code, message, details }
 *   - Request / response interceptor hook points
 *
 * Not yet wired to any screen. The future apiAdapter / apiAuthAdapter will
 * import this module to make real API calls.
 */

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

/**
 * Parse an error body from a non-2xx response into a normalized shape.
 *
 * @param {Response} response
 * @returns {Promise<{ status: number, code: string, message: string, details: unknown }>}
 */
async function buildError(response) {
  let code = 'HTTP_ERROR'
  let message = response.statusText || `HTTP ${response.status}`
  let details = null

  try {
    const text = await response.text()
    if (text) {
      const body = JSON.parse(text)
      if (body.code) code = body.code
      if (body.message) message = body.message
      if (body.details !== undefined) details = body.details
    }
  } catch {
    // response body was not JSON — use defaults above
  }

  return { status: response.status, code, message, details }
}

/**
 * Core request executor.
 *
 * @param {string} path - Path relative to baseUrl (e.g. '/api/users')
 * @param {RequestInit} init - fetch init options
 * @returns {Promise<unknown>} - Parsed JSON response body
 */
async function request(path, init = {}) {
  const defaultHeaders = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  }

  let finalInit = {
    ...init,
    credentials: 'include',
    headers: {
      ...defaultHeaders,
      ...(init.headers ?? {}),
    },
  }

  // Apply request interceptors in order
  for (const interceptor of requestInterceptors) {
    finalInit = interceptor(finalInit)
  }

  let response
  try {
    response = await fetch(`${baseUrl}${path}`, finalInit)
  } catch (err) {
    return Promise.reject({
      status: 0,
      code: 'NETWORK_ERROR',
      message: err?.message ?? 'Network error',
      details: null,
    })
  }

  // Apply response interceptors in order (e.g. 401 → logout)
  for (const interceptor of responseInterceptors) {
    interceptor(response)
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
 * @param {RequestInit} [opts]
 */
export function get(path, opts = {}) {
  return request(path, { ...opts, method: 'GET' })
}

/**
 * POST /path with JSON body
 * @param {string} path
 * @param {unknown} body
 * @param {RequestInit} [opts]
 */
export function post(path, body, opts = {}) {
  return request(path, { ...opts, method: 'POST', body: JSON.stringify(body) })
}

/**
 * PUT /path with JSON body
 * @param {string} path
 * @param {unknown} body
 * @param {RequestInit} [opts]
 */
export function put(path, body, opts = {}) {
  return request(path, { ...opts, method: 'PUT', body: JSON.stringify(body) })
}

/**
 * PATCH /path with JSON body
 * @param {string} path
 * @param {unknown} body
 * @param {RequestInit} [opts]
 */
export function patch(path, body, opts = {}) {
  return request(path, { ...opts, method: 'PATCH', body: JSON.stringify(body) })
}

/**
 * DELETE /path
 * @param {string} path
 * @param {RequestInit} [opts]
 */
export function del(path, opts = {}) {
  return request(path, { ...opts, method: 'DELETE' })
}

export default { get, post, put, patch, del, addRequestInterceptor, addResponseInterceptor }
