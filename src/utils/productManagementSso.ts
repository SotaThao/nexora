import type { EcosystemItem } from '../types/domain'
import { resolveEcosystemBrandKey } from './ecosystem'

/** Deep-link inside Merchant Portal after ecosystem SSO (Gift Card). */
export const PRODUCT_MANAGEMENT_PATH = '/gift-voucher/product-management'

/** Deep-link for Membership Card issue flow. */
export const MEMBERSHIP_CARD_PATH =
  '/gift-voucher/product-management/issue-digital?type=membership'

/** Matches merchant-portal businessSolution destination. */
export const PRODUCT_MANAGEMENT_PAGE_NAME = 'businessSolution'

const MERCHANT_PORTAL_NAME = 'merchantportal'

const RETURN_URL_QUERY_KEYS = [
  'returnUrl',
  'ReturnUrl',
  'return_url',
  'redirectUrl',
  'redirect_uri',
  'callbackUrl',
  'next',
  'path',
] as const

export type ProductManagementDestination = 'gift-card' | 'membership-card'

export const PRODUCT_MANAGEMENT_DESTINATIONS: Record<
  ProductManagementDestination,
  { path: string; pageName: string | null }
> = {
  'gift-card': {
    path: PRODUCT_MANAGEMENT_PATH,
    pageName: PRODUCT_MANAGEMENT_PAGE_NAME,
  },
  'membership-card': {
    path: MEMBERSHIP_CARD_PATH,
    // Keep same pageName as Gift Card so SSO handshake stays identical;
    // deep-link is carried by `path` + returnUrl injection on the token URL.
    pageName: PRODUCT_MANAGEMENT_PAGE_NAME,
  },
}

/**
 * Find the `merchantportal` row from `GET /api/v1/Client/ecosystem`.
 * Match by normalized name / brand key only — no hardcoded client id.
 * Ignores `isEcosystem` (Gift Card Center only needs merchantPortal presence + SSO).
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

/** Build absolute Merchant Portal URL from the ecosystem's own `url` + path. */
export function buildMerchantPortalDeepLink(
  baseUrl: string,
  path: string = PRODUCT_MANAGEMENT_PATH,
): string | null {
  const trimmed = baseUrl.trim()
  if (!trimmed) return null
  try {
    const parsed = new URL(trimmed)
    if (parsed.protocol !== 'https:' || !parsed.hostname) return null
    const normalizedPath = path.startsWith('/') ? path : `/${path}`
    return `${parsed.origin}${normalizedPath}`
  } catch {
    return null
  }
}

function isAuthTokenQueryKey(key: string): boolean {
  return /token|code|state|session|sso|auth/i.test(key)
}

function hasAuthTokenParams(url: URL): boolean {
  for (const key of url.searchParams.keys()) {
    if (isAuthTokenQueryKey(key)) return true
  }
  return false
}

function setReturnTarget(url: URL, deepTarget: string, preferAbsolute: boolean): void {
  const absoluteTarget = preferAbsolute
    ? new URL(deepTarget, url.origin).toString()
    : deepTarget

  for (const key of RETURN_URL_QUERY_KEYS) {
    if (!url.searchParams.has(key)) continue
    const current = url.searchParams.get(key) || ''
    const nextValue = current.startsWith('http')
      ? new URL(deepTarget, url.origin).toString()
      : deepTarget
    url.searchParams.set(key, nextValue)
    return
  }

  // SSO token URLs usually have no return param yet — inject one so portal
  // navigates after consuming the token (do NOT rewrite the SSO pathname).
  url.searchParams.set('returnUrl', absoluteTarget)
}

/**
 * Attach the intended Merchant Portal deep link to an SSO redirect URL.
 *
 * Important: when the URL still carries an auth token, keep the SSO pathname
 * intact so the portal can consume the token, and only set/update returnUrl.
 */
export function applyDeepLinkToRedirectUrl(
  redirectUrl: string,
  deepLinkPath: string,
): string {
  try {
    const redirect = new URL(redirectUrl)
    const deep = new URL(deepLinkPath, redirect.origin)
    const deepTarget = `${deep.pathname}${deep.search}`

    if (
      redirect.pathname === deep.pathname
      && redirect.searchParams.get('type') === deep.searchParams.get('type')
      && !hasAuthTokenParams(redirect)
    ) {
      return redirect.toString()
    }

    if (hasAuthTokenParams(redirect)) {
      // Keep SSO endpoint + token intact; tell portal where to go after login.
      let hasReturnKey = false
      for (const key of RETURN_URL_QUERY_KEYS) {
        if (!redirect.searchParams.has(key)) continue
        hasReturnKey = true
        break
      }
      setReturnTarget(redirect, deepTarget, true)
      if (!hasReturnKey) {
        // Some merchant-portal builds read `path` from the SSO query (same field as sign-in).
        redirect.searchParams.set('path', deepTarget)
      }
      return redirect.toString()
    }

    // Already a normal app URL (no token) — go straight to the deep link.
    return `${redirect.origin}${deepTarget}`
  } catch {
    return redirectUrl
  }
}

/** @deprecated Prefer {@link buildMerchantPortalDeepLink}. */
export function buildProductManagementUrl(baseUrl: string): string | null {
  return buildMerchantPortalDeepLink(baseUrl, PRODUCT_MANAGEMENT_PATH)
}
