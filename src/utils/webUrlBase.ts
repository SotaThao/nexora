/**
 * Base origin for customer-facing URLs embedded in QR codes and share links.
 * Set via VITE_VLINKPAY_WEB_URL_BASE (e.g. https://test-web.nexoratouch.com).
 */
export function getWebUrlOrigin(): string {
  const configured = (import.meta.env.VITE_VLINKPAY_WEB_URL_BASE ?? '').trim()
  if (configured) {
    return configured.replace(/\/$/, '')
  }
  return typeof window !== 'undefined' ? window.location.origin : ''
}

/** Base URL for legacy customer-flow QR links (`?flow=customer&…`). */
export function getCustomerAppBaseUrl(): string {
  const origin = getWebUrlOrigin()
  const configured = (import.meta.env.VITE_VLINKPAY_WEB_URL_BASE ?? '').trim()
  if (configured) {
    return origin
  }
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '/'
  return `${origin}${pathname}`
}
