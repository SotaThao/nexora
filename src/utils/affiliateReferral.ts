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
