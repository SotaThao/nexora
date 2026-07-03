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
import { buildPublicQrImageUrl } from '../data/repositories/publicQr'

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
  allowDefaultTouchPointSlug = true,
}: {
  origin: string
  businessSlug?: string | null
  touchPointSlug?: string | null
  staffProfileId?: string | null
  canonicalUrl?: string | null
  allowDefaultTouchPointSlug?: boolean
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
  } else if (businessSlug && touchPointSlug) {
    pathname = `/touch/${businessSlug}/${touchPointSlug}`
  } else if (businessSlug && allowDefaultTouchPointSlug) {
    pathname = `/touch/${businessSlug}/${DEFAULT_MASTER_TOUCH_POINT_SLUG}`
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
  { allowDefaultTouchPointSlug = true }: { allowDefaultTouchPointSlug?: boolean } = {},
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
    allowDefaultTouchPointSlug,
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

  if (!resolvedTouchSlug && allowDefaultTouchPointSlug) {
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
  // Always encode tipUrl when available so scanned QR matches copy-link URL
  // (API qrImageUrl often points at production host, e.g. test-web).
  if (tipUrl?.trim()) {
    return buildPublicQrImageUrl(tipUrl.trim(), size)
  }
  if (qrImageUrl) return qrImageUrl
  return ''
}

/** Customer staff direct-payment URL — {origin}/pay/staff/{staffProfileId}. */
export function buildStaffDirectPaymentPageUrl(
  staffProfileId: string,
  origin = typeof window !== 'undefined' ? window.location.origin : '',
): string {
  const id = String(staffProfileId || '').trim()
  if (!id || !origin) return ''
  return `${origin}/pay/staff/${encodeURIComponent(id)}`
}

/** Resolve staff payment QR customer URL from API payload or staff profile id. */
export function resolveStaffDirectPaymentPageUrl({
  staffProfileId,
  paymentUrlFromApi,
  origin = typeof window !== 'undefined' ? window.location.origin : '',
}: {
  staffProfileId?: string | null
  paymentUrlFromApi?: string | null
  origin?: string
}): string {
  const id = String(staffProfileId || '').trim()
  if (!id) return ''

  if (paymentUrlFromApi?.trim()) {
    try {
      const parsed = new URL(
        paymentUrlFromApi.startsWith('http') ? paymentUrlFromApi : `${origin}${paymentUrlFromApi}`,
      )
      return `${origin}${parsed.pathname}`
    } catch {
      if (paymentUrlFromApi.startsWith('/')) return `${origin}${paymentUrlFromApi}`
    }
  }

  return buildStaffDirectPaymentPageUrl(id, origin)
}
