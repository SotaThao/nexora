const DEFAULT_HOME_URL = 'https://nexoratouch.com'

function normalizeHomeUrl(url: string): string {
  const trimmed = url.trim().replace(/\/$/, '')
  try {
    const parsed = new URL(trimmed)
    if (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1') {
      parsed.protocol = 'http:'
      return parsed.toString().replace(/\/$/, '')
    }
  } catch {
    return trimmed
  }
  return trimmed
}

export function getNexoraHomeUrl(): string {
  const fromEnv = import.meta.env.VITE_VLINKPAY_WEB_URL_BASE
  if (typeof fromEnv === 'string' && fromEnv.trim()) {
    return normalizeHomeUrl(fromEnv)
  }
  return DEFAULT_HOME_URL
}
