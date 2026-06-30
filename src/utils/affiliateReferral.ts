import { getWebUrlOrigin } from './webUrlBase'
import { storage } from './storage'

const REF_CODE_KEY = 'referral_ref_code'

export function saveRefCode(code: string) {
  const trimmed = code.trim()
  if (trimmed) {
    storage.setItem(REF_CODE_KEY, trimmed)
  }
}

export function getSavedRefCode(): string {
  return storage.getItem(REF_CODE_KEY) || ''
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
