export function slugifyInviteSegment(value = '') {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export function buildPublicInviteLink({
  origin,
  businessName,
  businessSlug,
  referralCode,
  email,
  source,
}: {
  origin: string
  businessName?: string
  businessSlug?: string
  referralCode: string
  email?: string | null
  /**
   * Tracking source label carried in the URL (US-014 AC #10). Defaults to
   * `email_invite` when an invitee `email` is present (directed email invite),
   * otherwise `public_link` (open QR/link). FE/analytics-level only — the
   * `join-public-invite` API does not accept a `source` field.
   */
  source?: string
}) {
  const slug = businessSlug || slugifyInviteSegment(businessName || 'business')
  const resolvedSource = source || (email ? 'email_invite' : 'public_link')
  const params = new URLSearchParams({ ref: referralCode, source: resolvedSource })
  if (email) params.set('email', email)
  return `${origin}/invite/public/${encodeURIComponent(slug)}?${params.toString()}`
}
