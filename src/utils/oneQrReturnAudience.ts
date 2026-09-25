import { OneQrAudience } from '../constants/oneQr'

const ONEQR_RETURN_AUDIENCE_STORAGE_KEY = 'nexora_oneqr_return_audience'

function readAll(): Record<string, OneQrAudience> {
  try {
    const raw = localStorage.getItem(ONEQR_RETURN_AUDIENCE_STORAGE_KEY)
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
    localStorage.setItem(
      ONEQR_RETURN_AUDIENCE_STORAGE_KEY,
      JSON.stringify({ ...readAll(), [businessSlug]: audience }),
    )
  } catch {
    return
  }
}
