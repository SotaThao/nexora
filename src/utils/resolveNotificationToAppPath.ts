import { getWebUrlOrigin } from './webUrlBase'

const NEXORA_HOST_SUFFIX = 'nexoratouch.com'

const STATIC_APP_HOSTS = new Set([
  'localhost',
  '127.0.0.1',
  'nexoratouch.com',
  'www.nexoratouch.com',
  'test-web.nexoratouch.com',
  'staging-web.nexoratouch.com',
])

function isKnownAppHostname(hostname: string): boolean {
  const normalized = hostname.trim().toLowerCase()
  if (!normalized) return false
  if (STATIC_APP_HOSTS.has(normalized)) return true
  if (normalized === NEXORA_HOST_SUFFIX || normalized.endsWith(`.${NEXORA_HOST_SUFFIX}`)) {
    return true
  }

  const configuredOrigin = getWebUrlOrigin()
  if (configuredOrigin) {
    try {
      if (new URL(configuredOrigin).hostname.toLowerCase() === normalized) {
        return true
      }
    } catch {
      // ignore invalid env URL
    }
  }

  return false
}

function toAppPath(pathname: string, search: string, hash: string): string {
  const path = `${pathname || '/'}${search || ''}${hash || ''}`
  return path.startsWith('/') ? path : `/${path}`
}

function parseCustomSchemePath(raw: string): string | null {
  if (/^nexora:\/\//i.test(raw)) {
    const path = raw.replace(/^nexora:\/\//i, '/').replace(/^nexora:/i, '/')
    return path.startsWith('/') ? path : `/${path}`
  }

  if (/^net\.vlinkgroup\.nexora:\/\//i.test(raw)) {
    const path = raw.replace(/^net\.vlinkgroup\.nexora:\/\//i, '/')
    return path.startsWith('/') ? path : `/${path}`
  }

  return null
}

/**
 * Maps a notification Launch URL to an in-app React Router path.
 * Never opens an external browser — unknown http(s) URLs still use their pathname.
 */
export function resolveNotificationToAppPath(target: string): string | null {
  const raw = target.trim()
  if (!raw) return null

  if (raw.startsWith('/') && !raw.startsWith('//')) {
    return raw
  }

  const customSchemePath = parseCustomSchemePath(raw)
  if (customSchemePath) return customSchemePath

  let url: URL
  try {
    url = new URL(raw)
  } catch {
    if (!raw.includes('://') && !raw.startsWith('//')) {
      return raw.startsWith('/') ? raw : `/${raw}`
    }
    return null
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return null
  }

  return toAppPath(url.pathname, url.search, url.hash)
}

export function isNexoraAppHostname(hostname: string): boolean {
  return isKnownAppHostname(hostname)
}

export default resolveNotificationToAppPath
