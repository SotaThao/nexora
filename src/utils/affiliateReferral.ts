import { getWebUrlOrigin } from './webUrlBase'
import { storage } from './storage'

const REF_CODE_KEY = 'referral_ref_code'
const STAFF_SHARE_CODE_KEY = 'referral_staff_share_code'
const LEG_KEY = 'referral_leg'

/** Which side of the binary referral tree an account gets placed under. */
export type Leg = 'left' | 'right'
export const LEG_VALUES: readonly Leg[] = ['left', 'right']

/** Narrows and validates a possibly-untrusted value (URL param, storage, user input) to a Leg. */
export function isValidLeg(value: unknown): value is Leg {
  return typeof value === 'string' && (LEG_VALUES as readonly string[]).includes(value)
}

/** Maps a Leg to the PascalCase string VlinkPay's signup API expects. */
export function legToApiValue(leg: Leg): 'Left' | 'Right' {
  return leg === 'left' ? 'Left' : 'Right'
}

/** Used where a leg is needed but there's no picker UI (e.g. the merchant's own referral link). */
export const DEFAULT_LEG: Leg = 'left'

export function saveRefCode(code: string) {
  const trimmed = code.trim()
  if (trimmed) {
    storage.setItem(REF_CODE_KEY, trimmed)
  }
}

export function getSavedRefCode(): string {
  return storage.getItem(REF_CODE_KEY) || ''
}

/** Persist the chosen binary tree side ('left' | 'right') from a referral link's ?leg= param. */
export function saveLeg(leg: string) {
  const trimmed = leg.trim().toLowerCase()
  if (isValidLeg(trimmed)) {
    storage.setItem(LEG_KEY, trimmed)
  }
}

export function getSavedLeg(): string {
  return storage.getItem(LEG_KEY) || ''
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
  origin = getWebUrlOrigin(),
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

/** Combined staff link + affiliate ref: /?ref=CODE&leg=left/right&staff=STAFF_ID */
export function buildStaffShareUrl({
  origin = getWebUrlOrigin(),
  referralCode,
  staffCode,
  leg,
}: {
  origin?: string
  referralCode?: string | null
  staffCode: string
  leg?: string | null
}) {
  const staff = String(staffCode || '').trim()
  if (!staff || !origin) return ''

  const params = new URLSearchParams()
  const ref = String(referralCode || '').trim()
  if (ref) params.set('ref', ref)
  const trimmedLeg = String(leg || '').trim().toLowerCase()
  if (isValidLeg(trimmedLeg)) params.set('leg', trimmedLeg)
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
    if (!parsed.searchParams.get(paramName)?.trim()) {
      return { leading: fullDisplay, suffix: '', fullDisplay }
    }

    // Match against the raw (still percent-encoded) query pair rather than the
    // decoded value — searchParams.get() decodes escapes, so building the
    // needle from it and searching the raw string would miss any value
    // containing characters that get percent-encoded (e.g. spaces, '/').
    const rawQuery = parsed.search.startsWith('?') ? parsed.search.slice(1) : parsed.search
    const needle = rawQuery
      .split('&')
      .find((pair) => decodeURIComponent(pair.split('=')[0] || '') === paramName)
    const paramIndex = needle ? fullDisplay.indexOf(needle) : -1
    if (!needle || paramIndex < 0) return { leading: fullDisplay, suffix: '', fullDisplay }

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
