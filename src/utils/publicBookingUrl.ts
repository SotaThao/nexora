import { getWebUrlOrigin } from './webUrlBase'

/**
 * Absolute public booking form URL for the current environment.
 * Origin: `VITE_VLINKPAY_WEB_URL_BASE` → else `window.location.origin`.
 * Shape: `{origin}/b/{businessKey}`
 */
export function buildPublicBookingFormUrl(
  businessKey?: string | null,
): string {
  const key = String(businessKey ?? '').trim()
  if (!key) return ''

  const origin = (
    getWebUrlOrigin() ||
    (typeof window !== 'undefined' ? window.location.origin : '')
  ).replace(/\/$/, '')
  if (!origin) return ''

  return `${origin}/b/${encodeURIComponent(key)}`
}
