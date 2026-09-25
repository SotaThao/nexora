import { OneQrAudience, toOneQrViewAs } from '../constants/oneQr'

const ONEQR_RETURN_AUDIENCE_KEY = 'oneQrAs'

function parseAudience(value: string | null): OneQrAudience | null {
  return Object.values(OneQrAudience).find((audience) => toOneQrViewAs(audience) === value) ?? null
}

export function readOneQrReturnAudience(): OneQrAudience | null {
  try {
    return parseAudience(sessionStorage.getItem(ONEQR_RETURN_AUDIENCE_KEY))
  } catch {
    return null
  }
}

export function rememberOneQrReturnAudience(audience: OneQrAudience) {
  try {
    sessionStorage.setItem(ONEQR_RETURN_AUDIENCE_KEY, toOneQrViewAs(audience))
  } catch {
    return
  }
}

export function withOneQrReturnAudience(href: string, audience: OneQrAudience): string {
  try {
    const url = new URL(href, window.location.origin)
    if (url.origin !== window.location.origin) return href
    url.searchParams.set(ONEQR_RETURN_AUDIENCE_KEY, toOneQrViewAs(audience))
    return href.startsWith('/') ? `${url.pathname}${url.search}${url.hash}` : url.toString()
  } catch {
    return href
  }
}

export function captureOneQrReturnAudienceFromUrl() {
  const audience = parseAudience(new URLSearchParams(window.location.search).get(ONEQR_RETURN_AUDIENCE_KEY))
  if (audience) rememberOneQrReturnAudience(audience)
}
