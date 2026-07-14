/**
 * Base origin for customer-facing URLs embedded in QR codes and share links.
 * Set via VITE_VLINKPAY_WEB_URL_BASE (e.g. https://test-web.nexoratouch.com).
 */
function isNativeShellOrigin(origin: string): boolean {
  if (!origin) return true
  if (/^(capacitor|ionic|file):\/\//i.test(origin)) return true
  try {
    const { hostname } = new URL(origin)
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      const platform =
        typeof document !== 'undefined'
          ? document.documentElement?.dataset?.capacitorPlatform
          : undefined
      return Boolean(platform)
    }
  } catch {
    return true
  }
  return false
}

export function getWebUrlOrigin(): string {
  const configured = (import.meta.env.VITE_VLINKPAY_WEB_URL_BASE ?? '').trim()
  if (configured) {
    return configured.replace(/\/$/, '')
  }
  if (typeof window !== 'undefined') {
    const origin = window.location.origin
    if (origin && !isNativeShellOrigin(origin)) {
      return origin
    }
  }
  return ''
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
