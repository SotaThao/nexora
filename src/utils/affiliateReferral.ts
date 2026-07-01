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
  const fullDisplay = url.replace(/^https?:\/\//, '')
  if (!fullDisplay) return { leading: '', staffSuffix: '', fullDisplay: '' }

  try {
    const parsed = new URL(url.includes('://') ? url : `https://${fullDisplay}`)
    const staff = parsed.searchParams.get('staff')?.trim()
    if (!staff) return { leading: fullDisplay, staffSuffix: '', fullDisplay }

    const staffNeedle = `staff=${staff}`
    const staffIndex = fullDisplay.indexOf(staffNeedle)
    if (staffIndex < 0) return { leading: fullDisplay, staffSuffix: '', fullDisplay }

    const separator = staffIndex > 0 ? fullDisplay[staffIndex - 1] : ''
    const staffSuffix =
      separator === '&' || separator === '?'
        ? `${separator}${staffNeedle}`
        : staffNeedle
    const leadingEnd = staffIndex - (staffSuffix.length - staffNeedle.length)
    const leading = fullDisplay.slice(0, Math.max(0, leadingEnd))

    return { leading, staffSuffix, fullDisplay }
  } catch {
    return { leading: fullDisplay, staffSuffix: '', fullDisplay }
  }
}
