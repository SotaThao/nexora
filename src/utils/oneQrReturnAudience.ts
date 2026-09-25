import { OneQrAudience, toOneQrViewAs } from '../constants/oneQr'

const ONEQR_RETURN_AUDIENCE_STORAGE_KEY = 'nexora_oneqr_return_audience'
const ONEQR_RETURN_SLUG_QUERY = 'oneQrSlug'
const ONEQR_RETURN_AUDIENCE_QUERY = 'oneQrAs'

function readAll(): Record<string, OneQrAudience> {
  try {
    const raw = sessionStorage.getItem(ONEQR_RETURN_AUDIENCE_STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : null
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

export function readOneQrReturnAudience(businessSlug: string): OneQrAudience | null {
  const audience = readAll()[businessSlug]
  return Object.values(OneQrAudience).includes(audience) ? audience : null
}

export function rememberOneQrReturnAudience(businessSlug: string, audience: OneQrAudience) {
  try {
    sessionStorage.setItem(
      ONEQR_RETURN_AUDIENCE_STORAGE_KEY,
      JSON.stringify({ ...readAll(), [businessSlug]: audience }),
    )
  } catch {
    return
  }
}

export function withOneQrReturnAudience(href: string, businessSlug: string, audience: OneQrAudience): string {
  let url: URL
  try {
    url = new URL(href, window.location.origin)
  } catch {
    return href
  }
  if (url.origin !== window.location.origin) return href

  url.searchParams.set(ONEQR_RETURN_SLUG_QUERY, businessSlug)
  url.searchParams.set(ONEQR_RETURN_AUDIENCE_QUERY, toOneQrViewAs(audience))
  return href.startsWith('/') ? `${url.pathname}${url.search}${url.hash}` : url.toString()
}

export function captureOneQrReturnAudienceFromUrl() {
  const url = new URL(window.location.href)
  const businessSlug = url.searchParams.get(ONEQR_RETURN_SLUG_QUERY)
  const viewAs = url.searchParams.get(ONEQR_RETURN_AUDIENCE_QUERY)
  if (businessSlug === null && viewAs === null) return

  const audience = Object.values(OneQrAudience).find((value) => toOneQrViewAs(value) === viewAs)
  if (businessSlug && audience) rememberOneQrReturnAudience(businessSlug, audience)

  url.searchParams.delete(ONEQR_RETURN_SLUG_QUERY)
  url.searchParams.delete(ONEQR_RETURN_AUDIENCE_QUERY)
  window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`)
}
