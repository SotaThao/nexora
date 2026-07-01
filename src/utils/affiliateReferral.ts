import { storage } from './storage'

const REF_CODE_KEY = 'referral_ref_code'
const STAFF_SHARE_CODE_KEY = 'referral_staff_share_code'

export function saveRefCode(code: string) {
  const trimmed = code.trim()
  if (trimmed) {
    storage.setItem(REF_CODE_KEY, trimmed)
  }
}

export function getSavedRefCode(): string {
  return storage.getItem(REF_CODE_KEY) || ''
}

/** Persist staff ID from a shared personal QR link (/?staff=) for signup attribution. */
export function saveStaffShareCode(code: string) {
  const trimmed = code.trim()
  if (trimmed) {
    storage.setItem(STAFF_SHARE_CODE_KEY, trimmed)
  }
}

export function getSavedStaffShareCode(): string {
  return storage.getItem(STAFF_SHARE_CODE_KEY) || ''
}

type ReferralProfile = {
  referralCode?: string | null
  refCode?: string | null
  referralId?: string | null
}

export function getProfileReferralCode(profile: ReferralProfile = {}) {
  return String(profile.referralCode || profile.refCode || profile.referralId || '').trim()
}

export function buildAffiliateReferralUrl({
  origin = typeof window !== 'undefined' ? window.location.origin : '',
  referralCode,
  leg,
}: {
  origin?: string
  referralCode: string
  leg?: string | null
}) {
  const ref = String(referralCode || '').trim()
  if (!ref || !origin) return ''

  const params = new URLSearchParams({ ref })
  if (leg) params.set('leg', leg)
  return `${origin}/?${params.toString()}`
}

/** Combined staff link + affiliate ref: /?ref=CODE&staff=STAFF_ID */
export function buildStaffShareUrl({
  origin = typeof window !== 'undefined' ? window.location.origin : '',
  referralCode,
  staffCode,
}: {
  origin?: string
  referralCode?: string | null
  staffCode: string
}) {
  const staff = String(staffCode || '').trim()
  if (!staff || !origin) return ''

  const params = new URLSearchParams()
  const ref = String(referralCode || '').trim()
  if (ref) params.set('ref', ref)
  params.set('staff', staff)
  return `${origin}/?${params.toString()}`
}

/** Split share URL for display: leading truncates; staff query stays fully visible. */
export function splitStaffShareUrlDisplay(url: string): {
  leading: string
  staffSuffix: string
  fullDisplay: string
} {
  const { leading, suffix, fullDisplay } = splitUrlQueryParamDisplay(url, 'staff')
  return { leading, staffSuffix: suffix, fullDisplay }
}

type UrlDisplayParts = {
  leading: string
  suffix: string
  fullDisplay: string
}

function stripUrlProtocol(url: string): string {
  return url.replace(/^https?:\/\//, '')
}

/** Split URL for display: leading truncates; query param stays fully visible. */
export function splitUrlQueryParamDisplay(url: string, paramName: string): UrlDisplayParts {
  const fullDisplay = stripUrlProtocol(url)
  if (!fullDisplay) return { leading: '', suffix: '', fullDisplay: '' }

  try {
    const parsed = new URL(url.includes('://') ? url : `https://${fullDisplay}`)
    const value = parsed.searchParams.get(paramName)?.trim()
    if (!value) return { leading: fullDisplay, suffix: '', fullDisplay }

    const needle = `${paramName}=${value}`
    const paramIndex = fullDisplay.indexOf(needle)
    if (paramIndex < 0) return { leading: fullDisplay, suffix: '', fullDisplay }

    const separator = paramIndex > 0 ? fullDisplay[paramIndex - 1] : ''
    const suffix =
      separator === '&' || separator === '?'
        ? `${separator}${needle}`
        : needle
    const leadingEnd = paramIndex - (suffix.length - needle.length)
    const leading = fullDisplay.slice(0, Math.max(0, leadingEnd))

    return { leading, suffix, fullDisplay }
  } catch {
    return { leading: fullDisplay, suffix: '', fullDisplay }
  }
}

/** Split URL for display: leading truncates; trailing path segment(s) stay fully visible. */
export function splitUrlPathTailDisplay(url: string, tailSegments = 1): UrlDisplayParts {
  const fullDisplay = stripUrlProtocol(url)
  if (!fullDisplay || tailSegments < 1) return { leading: fullDisplay, suffix: '', fullDisplay }

  const pathOnly = fullDisplay.split(/[?#]/, 1)[0] || fullDisplay
  const queryAndHash = fullDisplay.slice(pathOnly.length)
  const segments = pathOnly.split('/').filter(Boolean)
  if (segments.length <= tailSegments) return { leading: fullDisplay, suffix: '', fullDisplay }

  const tail = segments.slice(-tailSegments).join('/')
  const leadingPath = segments.slice(0, -tailSegments).join('/')
  const leading = `${leadingPath ? `${leadingPath}/` : '/'}`
  const suffix = `${tail}${queryAndHash}`

  return { leading, suffix, fullDisplay }
}
