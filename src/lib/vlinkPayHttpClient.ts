/**
 * HTTP client for VlinkPay customer APIs (ecosystem SSO).
 * Uses VITE_VLINKPAY_API_BASE_URL; reuses Nexora JWT from tokenStore.
 */
import { tokenStore } from '../auth/tokenStore'
import type { ApiError } from '../types/api'

const baseUrl = (
  import.meta.env?.VITE_VLINKPAY_API_BASE_URL ?? 'https://test-web-app.vlinkpay.com'
).replace(/\/$/, '')

async function buildError(response: Response): Promise<ApiError> {
  let errorCode = 'HTTP_ERROR'
  let message = ''
  try {
    const text = await response.text()
    if (text) {
      const body = JSON.parse(text) as { errorCode?: string; message?: string }
      if (body.errorCode) errorCode = body.errorCode
      if (body.message) message = body.message
    }
  } catch {
    // non-JSON error body
  }
  return { status: response.status, errorCode, message, errors: {}, retryAfter: null }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T | null> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string> | undefined),
  }

  const tokens = tokenStore.get()
  if (tokens?.accessToken) {
    headers.Authorization = `Bearer ${tokens.accessToken}`
  }

  let response: Response
  try {
    response = await fetch(`${baseUrl}${path}`, { ...init, headers })
  } catch {
    return Promise.reject({
      status: 0,
      errorCode: 'NETWORK_ERROR',
      message: '',
      errors: {},
      retryAfter: null,
    } satisfies ApiError)
  }

  if (!response.ok) {
    return Promise.reject(await buildError(response))
  }

  const text = await response.text()
  if (!text) return null
  return JSON.parse(text) as T
}

const vlinkPayHttpClient = {
  get<T>(path: string) {
    return request<T>(path, { method: 'GET' })
  },
  post<T>(path: string, body?: unknown) {
    return request<T>(path, {
      method: 'POST',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  },
}

export default vlinkPayHttpClient
