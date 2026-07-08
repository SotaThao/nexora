import type { UserProfile } from '../types/domain'

/** Resolve merchant business UUID from GET /api/v1/userprofile/me (business.id). */
export function resolveMerchantBusinessIdFromProfile(
  profile: UserProfile | null | undefined,
): string {
  if (!profile) return ''

  const business = profile.business as Record<string, unknown> | null | undefined
  const fromBusiness =
    business?.id ??
    business?.businessId ??
    business?.Id ??
    business?.BusinessId

  if (fromBusiness) return String(fromBusiness).trim()

  return String(profile.id || '').trim()
}

/** Customer direct-payment URL — {origin}/pay/{businessId} per direct-payment QR spec. */
export function buildDirectPaymentPageUrl(
  businessId: string,
  origin = typeof window !== 'undefined' ? window.location.origin : '',
): string {
  const id = String(businessId || '').trim()
  if (!id || !origin) return ''
  return `${origin}/pay/${encodeURIComponent(id)}`
}

/**
 * Build the customer payment URL for Settings QR tab.
 * businessId always comes from GET /api/v1/userprofile/me; QR API validates merchant setup.
 */
export function resolveDirectPaymentPageUrl({
  businessId,
  paymentUrlFromApi,
  origin = typeof window !== 'undefined' ? window.location.origin : '',
}: {
  businessId: string
  paymentUrlFromApi?: string | null
  origin?: string
}): string {
  const id = String(businessId || '').trim()
  if (!id) return ''

  // Path uses profile businessId; QR API paymentUrl only confirms BE readiness + canonical format.
  if (paymentUrlFromApi?.trim()) {
    return buildDirectPaymentPageUrl(id, origin)
  }

  return buildDirectPaymentPageUrl(id, origin)
}
