import type { EcosystemItem } from '../types/domain'
import { resolveEcosystemBrandKey } from './ecosystem'

/** Deep-link inside Merchant Portal after ecosystem SSO. */
export const PRODUCT_MANAGEMENT_PATH = '/gift-voucher/product-management'

/** Matches merchant-portal businessSolution destination. */
export const PRODUCT_MANAGEMENT_PAGE_NAME = 'businessSolution'

const MERCHANT_PORTAL_NAME = 'merchantportal'

/**
 * Find the `merchantportal` row from `GET /api/v1/Client/ecosystem`.
 * Match by normalized name / brand key only — no hardcoded client id.
 */
export function findMerchantPortalEcosystem(
  items: EcosystemItem[] = [],
): EcosystemItem | null {
  for (const item of items) {
    const brandKey = resolveEcosystemBrandKey(item.name)
    const normalizedName = item.name
      .trim()
      .toLowerCase()
      .replace(/[\s_.-]+/g, '')

    if (brandKey === MERCHANT_PORTAL_NAME || normalizedName === MERCHANT_PORTAL_NAME) {
      return item
    }
  }
  return null
}

/** Build absolute product-management URL from the ecosystem's own `url`. */
export function buildProductManagementUrl(baseUrl: string): string | null {
  const trimmed = baseUrl?.trim()
  if (!trimmed) return null
  try {
    const parsed = new URL(trimmed)
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return null
    return `${parsed.origin}${PRODUCT_MANAGEMENT_PATH}`
  } catch {
    return null
  }
}
