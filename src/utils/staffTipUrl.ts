import { getWebUrlOrigin } from './webUrlBase'

/**
 * Resolve staff per-business tipping customer URLs.
 *
 * Customer flow:
 *   GET  /touch/{businessSlug}/{touchPointSlug}?staffProfileId={uuid}
 *   POST /touch/tip { touchPointId, staffProfileId, amount, paymentMethod, sessionId }
 *
 * sessionId is generated in the browser when the customer opens the page — never embed it in QR links.
 * touchPointSlug is the business touch point (e.g. master-store / FrontDesk), not staff-{code}.
 */

/** Fallback when BE has not yet returned a touch-point slug on /staff/businesses. */
export const DEFAULT_MASTER_TOUCH_POINT_SLUG = 'master-store'

export function slugify(str = ''): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export function stripSessionIdFromUrl(url: string): string {
  try {
    const parsed = new URL(url)
    parsed.searchParams.delete('sessionId')
    const qs = parsed.searchParams.toString()
    return `${parsed.origin}${parsed.pathname}${qs ? `?${qs}` : ''}`
  } catch {
    return url
  }
}

/** Rewrite a touch customer URL to the current origin while keeping query params (e.g. staffProfileId). */
export function toLocalCustomerTouchUrl(
  url: string,
  origin = getWebUrlOrigin(),
): string {
  try {
    const parsed = new URL(url.startsWith('http') ? url : `${origin}${url}`)
    parsed.searchParams.delete('sessionId')
    const qs = parsed.searchParams.toString()
    return `${origin}${parsed.pathname}${qs ? `?${qs}` : ''}`
  } catch {
    return stripSessionIdFromUrl(url)
  }
}

export interface MasterTouchpointRef {
  url?: string | null
  slug?: string | null
  type?: string | null
}

/** Build a staff-specific customer URL on the business master touch point (skips staff picker). */
export function resolveMerchantStaffTipQr(
  staffProfileId: string | null | undefined,
  {
    businessName,
    businessSlug,
    masterTouchpoint,
    origin = getWebUrlOrigin(),
  }: {
    businessName?: string
    businessSlug?: string | null
    masterTouchpoint?: MasterTouchpointRef | null
    origin?: string
  },
): ResolvedStaffTipQr | null {
  if (!staffProfileId?.trim()) return null
  return resolveStaffTipQr(
    {
      businessName,
      businessSlug,
      touchPointSlug: masterTouchpoint?.slug ?? null,
      tipUrl: masterTouchpoint?.url ?? null,
    },
    staffProfileId,
    origin,
  )
}

export function buildStaffTipCustomerUrl({
  origin,
  businessSlug,
  touchPointSlug,
  staffProfileId,
  canonicalUrl,
}: {
  origin: string
  businessSlug?: string | null
  touchPointSlug?: string | null
  staffProfileId?: string | null
  canonicalUrl?: string | null
}): string | null {
  let pathname = ''

  if (canonicalUrl) {
    try {
      const parsed = new URL(
        canonicalUrl.startsWith('http') ? canonicalUrl : `${origin}${canonicalUrl}`,
      )
      pathname = parsed.pathname
    } catch {
      return null
    }
  } else if (businessSlug) {
    const slug = touchPointSlug || DEFAULT_MASTER_TOUCH_POINT_SLUG
    pathname = `/touch/${businessSlug}/${slug}`
  } else {
    return null
  }

  const params = new URLSearchParams()
  if (staffProfileId) {
    params.set('staffProfileId', staffProfileId)
  }

  const qs = params.toString()
  const base = `${origin}${pathname}`
  const url = qs ? `${base}?${qs}` : base
  return stripSessionIdFromUrl(url)
}

export interface StaffTipQrSource {
  businessName?: string
  businessSlug?: string | null
  /** Business touch-point slug (FrontDesk / master-store), from API. */
  touchPointSlug?: string | null
  masterTouchPointSlug?: string | null
  tipUrl?: string | null
  url?: string | null
  qrImageUrl?: string | null
}

export interface ResolvedStaffTipQr {
  tipUrl: string | null
  businessSlug: string
  touchPointSlug: string
  qrImageUrl: string | null
}

export function resolveStaffTipQr(
  source: StaffTipQrSource,
  staffProfileId?: string | null,
  origin = getWebUrlOrigin(),
): ResolvedStaffTipQr {
  const businessSlug =
    source.businessSlug || slugify(source.businessName || '')

  const touchPointSlug =
    source.touchPointSlug ||
    source.masterTouchPointSlug ||
    null

  const tipUrl = buildStaffTipCustomerUrl({
    origin,
    businessSlug,
    touchPointSlug,
    staffProfileId,
    canonicalUrl: source.tipUrl || source.url || null,
  })

  let resolvedTouchSlug = touchPointSlug || ''
  let resolvedBusinessSlug = businessSlug

  if (tipUrl) {
    try {
      const parts = new URL(tipUrl).pathname.split('/').filter(Boolean)
      const touchIdx = parts.indexOf('touch')
      if (touchIdx >= 0) {
        resolvedBusinessSlug = parts[touchIdx + 1] || resolvedBusinessSlug
        resolvedTouchSlug = parts[touchIdx + 2] || resolvedTouchSlug
      }
    } catch {
      // keep parsed slugs above
    }
  }

  if (!resolvedTouchSlug) {
    resolvedTouchSlug = DEFAULT_MASTER_TOUCH_POINT_SLUG
  }

  return {
    tipUrl,
    businessSlug: resolvedBusinessSlug,
    touchPointSlug: resolvedTouchSlug,
    qrImageUrl: source.qrImageUrl || null,
  }
}

export function buildQrImageUrl(
  tipUrl: string,
  size = 200,
  qrImageUrl?: string | null,
): string {
  if (qrImageUrl) return qrImageUrl
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(tipUrl)}`
}
