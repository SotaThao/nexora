/**
 * HTTP client for the Self Check-In kiosk.
 *
 * Separate from the main `httpClient` on purpose, and the difference is not cosmetic:
 *
 * - It sends `X-Pos-Device-Token`, never `Authorization: Bearer`. A tablet is not signed in as
 *   anybody, so there is no user session to attach.
 * - It does **not** attempt a token refresh on 401. On the main client a 401 means "access token
 *   expired, get a new one". Here it means the tablet was revoked — retrying would loop forever,
 *   and there is no refresh token to retry with. The caller clears the stored token and shows the
 *   revoked screen instead.
 *
 * Error shape matches `httpClient`'s ApiError so the same error-code helpers work.
 */
import { storage } from '../utils/storage'
import type { ApiError } from '../types/api'

const baseUrl = (import.meta.env?.VITE_API_BASE_URL ?? '').replace(/\/$/, '')

const DEVICE_TOKEN_KEY = 'pos_device_token'

// Dispatched when the server rejects the device token. The kiosk shell listens and swaps to the
// "device revoked" screen — components never have to handle it individually.
export const POS_DEVICE_REVOKED_EVENT = 'nexora-pos-device-revoked'

export const posDeviceToken = {
  get: (): string | null => storage.getItem(DEVICE_TOKEN_KEY),
  set: (token: string) => storage.setItem(DEVICE_TOKEN_KEY, token),
  clear: () => storage.removeItem(DEVICE_TOKEN_KEY),
}

interface ErrorDetailItem {
  errorCode?: string
  field?: string
  message?: string
}

async function buildError(response: Response): Promise<ApiError> {
  let errorCode = 'HTTP_ERROR'
  let message = ''

  try {
    const text = await response.text()
    if (text) {
      const body = JSON.parse(text) as {
        errorCode?: string
        message?: string
        errorDetail?: ErrorDetailItem[]
        detail?: string
        title?: string
      }
      const firstDetail =
        Array.isArray(body.errorDetail) && body.errorDetail.length > 0 ? body.errorDetail[0] : undefined

      if (body.errorCode) errorCode = body.errorCode
      else if (firstDetail?.errorCode) errorCode = firstDetail.errorCode

      if (body.message) message = body.message
      else if (firstDetail?.message) message = firstDetail.message
      else if (body.detail) message = body.detail
      else if (body.title) message = body.title
    }
  } catch {
    // Body was not JSON — keep the defaults above.
  }

  return { status: response.status, errorCode, message, errors: {}, retryAfter: null }
}

interface PosDeviceRequestInit extends RequestInit {
  params?: Record<string, string | number | boolean | null | undefined>
  // Pairing runs before the tablet has a token; everything else must send one.
  anonymous?: boolean
}

async function request<T = unknown>(path: string, init: PosDeviceRequestInit = {}): Promise<T | null> {
  const { params, anonymous, ...fetchInit } = init

  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string> | undefined),
  }

  if (!anonymous) {
    const token = posDeviceToken.get()
    if (token) headers['X-Pos-Device-Token'] = token
  }

  let resolvedPath = path
  if (params) {
    const qs = new URLSearchParams()
    for (const [k, v] of Object.entries(params)) {
      if (v !== null && v !== undefined) qs.append(k, String(v))
    }
    const qsStr = qs.toString()
    if (qsStr) resolvedPath = `${path}${path.includes('?') ? '&' : '?'}${qsStr}`
  }

  let response: Response
  try {
    response = await fetch(`${baseUrl}${resolvedPath}`, { ...fetchInit, headers })
  } catch {
    return Promise.reject({
      status: 0,
      errorCode: 'NETWORK_ERROR',
      message: '',
      errors: {},
      retryAfter: null,
    } satisfies ApiError)
  }

  // No refresh attempt, by design — see the file header.
  if (response.status === 401 && !anonymous) {
    posDeviceToken.clear()
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(POS_DEVICE_REVOKED_EVENT))
    }
    return Promise.reject(await buildError(response))
  }

  if (!response.ok) {
    return Promise.reject(await buildError(response))
  }

  if (response.status === 204) return null

  const text = await response.text()
  if (!text) return null
  return JSON.parse(text) as T
}

export const posDeviceHttpClient = {
  get: <T = unknown>(path: string, init?: PosDeviceRequestInit) =>
    request<T>(path, { ...init, method: 'GET' }),

  post: <T = unknown>(path: string, body?: unknown, init?: PosDeviceRequestInit) =>
    request<T>(path, {
      ...init,
      method: 'POST',
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
}

export default posDeviceHttpClient
