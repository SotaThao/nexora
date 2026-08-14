import type { PaymentMethodCryptoAddressDto, PaymentMethodDto } from '../../types/domain'
import {
  normalizeCryptoAddresses,
  normalizePaymentMethodDto as normalizeSharedPaymentMethodDto,
} from './paymentMethodDto'

function normalizePaymentMethodDto(raw: LooseObject): PaymentMethodDto {
  return normalizeSharedPaymentMethodDto({
    id: raw.id as string | undefined,
    type: String(raw.type || raw.name || ''),
    accountInfo: (raw.accountInfo ?? raw.account_info ?? null) as string | null,
    accountName: (raw.accountName ?? raw.account_name ?? null) as string | null,
    imageUrl: (raw.imageUrl as string | null | undefined) ?? null,
    isActive: raw.isActive !== false,
    isConfigured: raw.isConfigured as boolean | undefined,
    name: raw.name as string | undefined,
    cryptoAddresses: (raw.cryptoAddresses ?? raw.CryptoAddresses) as
      | Array<{ network?: string; symbol?: string; address?: string }>
      | null
      | undefined,
  })
}

/** Touch-page staff field for VlinkPay address picker (BE: vlinkPayCryptoAddresses). */
function normalizeStaffVlinkPayCryptoAddresses(
  staff: LooseObject,
): PaymentMethodCryptoAddressDto[] | null {
  const raw =
    staff.vlinkPayCryptoAddresses ??
    staff.VlinkPayCryptoAddresses ??
    staff.vlinkpayCryptoAddresses ??
    null
  return normalizeCryptoAddresses(
    raw as Array<{ network?: string; symbol?: string; address?: string }> | null,
  )
}

function normalizeTouchStaffList(rawStaff: unknown): unknown {
  if (Array.isArray(rawStaff)) {
    return (rawStaff as LooseObject[]).map((staff) => ({
      ...staff,
      vlinkPayCryptoAddresses: normalizeStaffVlinkPayCryptoAddresses(staff),
    }))
  }

  if (rawStaff && typeof rawStaff === 'object') {
    const container = rawStaff as LooseObject
    const items = container.items
    if (Array.isArray(items)) {
      return {
        ...container,
        items: (items as LooseObject[]).map((staff) => ({
          ...staff,
          vlinkPayCryptoAddresses: normalizeStaffVlinkPayCryptoAddresses(staff),
        })),
      }
    }
  }

  return rawStaff
}

function readBusinessIdFromObject(value: LooseObject | null | undefined): string | null {
  if (!value || typeof value !== 'object') return null
  const candidates = [
    value.id,
    value.Id,
    value.ID,
    value.businessId,
    value.BusinessId,
  ]
  for (const candidate of candidates) {
    if (candidate) return String(candidate)
  }
  return null
}

function readEmbeddedPaymentMethods(raw: LooseObject): PaymentMethodDto[] {
  const business = raw.business || {}
  const candidates =
    raw.businessPaymentMethods ||
    raw.business?.paymentMethods ||
    business.paymentMethods ||
    []

  return Array.isArray(candidates) ? candidates.map(normalizePaymentMethodDto) : []
}

function firstNonEmptyString(...values: unknown[]): string {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim()
  }
  return ''
}

export function normalizeTouchPageData(raw: LooseObject | null | undefined): LooseObject | null {
  if (!raw) return null

  const business = raw.business || {}
  const businessReviewLinks = business.reviewLinks || {}
  const rootReviewLinks = raw.reviewLinks || {}
  const businessId =
    readBusinessIdFromObject(business) ||
    readBusinessIdFromObject(raw.businessProfile) ||
    readBusinessIdFromObject(raw.profile) ||
    raw.touchPoint?.businessId ||
    raw.touchPoint?.BusinessId ||
    raw.touchpoint?.businessId ||
    raw.touchpoint?.BusinessId ||
    raw.businessId ||
    raw.BusinessId ||
    null

  const businessPaymentMethods = readEmbeddedPaymentMethods(raw)
  const resolvedBusinessId = businessId || readBusinessIdFromObject(business.profile)
  const googleReviewUrl = firstNonEmptyString(
    business.googleReviewUrl,
    business.googleReview,
    business.googleReviewLink,
    business.reviewGoogleUrl,
    businessReviewLinks.googleReview,
    businessReviewLinks.googleReviewUrl,
    businessReviewLinks.googleReviewLink,
    raw.googleReviewUrl,
    raw.googleReview,
    raw.googleReviewLink,
    rootReviewLinks.googleReview,
    rootReviewLinks.googleReviewUrl,
    rootReviewLinks.googleReviewLink,
  )
  const yelpUrl = firstNonEmptyString(
    business.yelpUrl,
    business.yelpReview,
    business.yelpReviewUrl,
    business.yelpReviewLink,
    businessReviewLinks.yelpReview,
    businessReviewLinks.yelpUrl,
    businessReviewLinks.yelpReviewUrl,
    businessReviewLinks.yelpReviewLink,
    raw.yelpUrl,
    raw.yelpReview,
    raw.yelpReviewUrl,
    raw.yelpReviewLink,
    rootReviewLinks.yelpReview,
    rootReviewLinks.yelpUrl,
    rootReviewLinks.yelpReviewUrl,
    rootReviewLinks.yelpReviewLink,
  )
  const feedbackEmail = firstNonEmptyString(
    business.feedbackEmail,
    businessReviewLinks.feedbackEmail,
    raw.feedbackEmail,
    rootReviewLinks.feedbackEmail,
  )

  const normalizedStaff = normalizeTouchStaffList(raw.staff)

  return {
    ...raw,
    businessId: resolvedBusinessId,
    businessPaymentMethods,
    staff: normalizedStaff,
    business: {
      ...business,
      id: resolvedBusinessId || readBusinessIdFromObject(business),
      googleReviewUrl,
      yelpUrl,
      feedbackEmail,
      reviewLinks: {
        ...businessReviewLinks,
        googleReview: googleReviewUrl,
        yelpReview: yelpUrl,
        feedbackEmail,
      },
    },
  }
}

function parseBusinessIdMap(): Record<string, string> {
  const raw = import.meta.env.VITE_TOUCH_BUSINESS_ID_MAP
  if (!raw) return {}
  try {
    const parsed = JSON.parse(raw) as Record<string, string>
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

export function resolveTouchBusinessId(
  touchPage: LooseObject | null | undefined,
  businessSlug?: string | null,
  queryBusinessId?: string | null,
): string | null {
  const fromPage = touchPage?.businessId || touchPage?.business?.id || null
  if (fromPage) return String(fromPage)
  if (queryBusinessId) return queryBusinessId

  if (businessSlug) {
    const mapped = parseBusinessIdMap()[businessSlug]
    if (mapped) return mapped
  }

  const fallback = import.meta.env.VITE_TOUCH_BUSINESS_ID
  return fallback || null
}
