import { payoutTypeToUiKey } from '../paymentMethodTypes'
import type { PaymentMethodDto } from '../../types/domain'

function normalizePaymentMethodDto(raw: LooseObject): PaymentMethodDto {
  const type = String(raw.type || raw.name || '')
  return {
    id: raw.id,
    type,
    uiKey: payoutTypeToUiKey(type),
    accountInfo: raw.accountInfo ?? raw.account_info ?? null,
    imageUrl: raw.imageUrl ?? null,
    isActive: raw.isActive !== false,
    name: raw.name,
  }
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

export function normalizeTouchPageData(raw: LooseObject | null | undefined): LooseObject | null {
  if (!raw) return null

  const business = raw.business || {}
  const businessId =
    readBusinessIdFromObject(business) ||
    readBusinessIdFromObject(raw.businessProfile) ||
    readBusinessIdFromObject(raw.profile) ||
    raw.businessId ||
    raw.BusinessId ||
    null

  const businessPaymentMethods = readEmbeddedPaymentMethods(raw)
  const resolvedBusinessId = businessId || readBusinessIdFromObject(business.profile)

  return {
    ...raw,
    businessId: resolvedBusinessId,
    businessPaymentMethods,
    business: {
      ...business,
      id: resolvedBusinessId || readBusinessIdFromObject(business),
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
