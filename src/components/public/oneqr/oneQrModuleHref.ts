import { OneQrModuleKey } from '../../../constants/oneQr'
import type { OneQrLandingModule } from '../../../types/oneQr'
import { getWebUrlOrigin } from '../../../utils/webUrlBase'

const DEVELOPMENT_FRONTEND_ORIGINS = new Set([
  'https://staging-web.nexoratouch.com',
  'https://test-web.nexoratouch.com',
  'https://test2-web.nexoratouch.com',
  'https://nexoratouch.com',
])

interface DestinationOptions {
  currentOrigin?: string
  configuredOrigin?: string
  development?: boolean
}

function parseUrl(value: string): URL | null {
  try {
    return new URL(value)
  } catch {
    return null
  }
}

/** Keep the backend's menu path and slug while opening this app's Services page locally. */
export function resolveOneQrModuleHref(
  module: Pick<OneQrLandingModule, 'moduleKey' | 'url'>,
  {
    currentOrigin = typeof window === 'undefined' ? '' : window.location.origin,
    configuredOrigin = getWebUrlOrigin(),
    development = import.meta.env.DEV,
  }: DestinationOptions = {},
): string {
  const href = module.url.trim()
  if (module.moduleKey !== OneQrModuleKey.Services) return href

  const destination = parseUrl(href)
  if (!destination || !/^https?:$/.test(destination.protocol)
    || destination.username || destination.password
    || !/^\/menu\/[^/]+\/?$/.test(destination.pathname)) return href

  const current = parseUrl(currentOrigin)
  const configured = parseUrl(configuredOrigin)
  const isAppOrigin = destination.origin === current?.origin || destination.origin === configured?.origin
  // Local development may use a staging API whose registry points to its deployed frontend.
  const isLocalDevelopment = development && (current?.hostname === 'localhost' || current?.hostname === '127.0.0.1')
  const isDevelopmentAppOrigin = isLocalDevelopment && DEVELOPMENT_FRONTEND_ORIGINS.has(destination.origin)

  return isAppOrigin || isDevelopmentAppOrigin
    ? `${destination.pathname}${destination.search}${destination.hash}`
    : href
}
