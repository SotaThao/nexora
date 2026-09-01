/**
 * OneQR wire + view shapes.
 *
 * Verified against the live backend Swagger (`OneQrConfigDto`,
 * `OneQrLandingDto`) on 2026-08-31 — no longer guessed from the design doc.
 * Normalization from the raw API DTO into these lives in
 * `src/data/repositories/{merchantOneQr,publicOneQr}.ts` only.
 */
import type {
  OneQrAudience,
  OneQrIdentityPolicy,
  OneQrModuleUnavailableReason,
} from '../constants/oneQr'

/** One configurable tile inside the merchant builder (`OneQrModuleConfigDto`). */
export interface OneQrModule {
  /** Server id. Empty string for a row added client-side but not yet saved. */
  id: string
  /** Copied down from the owning audience group — the DTO has no such field. */
  audience: OneQrAudience
  /** Free-form on the wire — an admin can add keys without a deploy. */
  moduleKey: string
  sortOrder: number
  isEnabled: boolean
  customLabel: string | null
  customIcon: string | null
  /** Only meaningful when `moduleKey === CustomLink`. */
  customUrl: string | null
  /**
   * Definition defaults, sent per module so the row needs no catalog lookup.
   * These come from the admin-managed `OneQrModuleDefinition`, so they can
   * change between loads without any FE release.
   */
  defaultLabel: string | null
  defaultIcon: string | null
  /** Admin-configured router with placeholders intact, e.g. `/booking/{businessSlug}`. */
  urlTemplate: string | null
  /** Destination resolved from that template; null when it cannot be resolved. */
  resolvedUrl: string | null
  /** False when the module cannot resolve right now. */
  isAvailable: boolean
  /** Why it cannot resolve — null while `isAvailable` is true. */
  unavailableReason: OneQrModuleUnavailableReason | null
  /** Definition has no destination page built yet. */
  isComingSoon: boolean
}

/** One audience's whole configuration (`OneQrAudienceConfigDto`). */
export interface OneQrRoleConfig {
  audience: OneQrAudience
  welcomeMessage: string | null
  identityPolicy: OneQrIdentityPolicy
  modules: OneQrModule[]
}

export interface OneQrModuleCatalogItem {
  moduleKey: string
  defaultLabel: string | null
  defaultIcon: string | null
  /** Admin-configured router with placeholders intact; null for CustomLink. */
  urlTemplate: string | null
  /** Open by design — every module is assignable to all three audiences. */
  allowedAudiences: OneQrAudience[]
  /** TipAndPay and Review both need an active TouchPoint to point at. */
  requiresTouchPoint: boolean
  /** CustomLink is useless without a merchant-supplied https URL. */
  requiresCustomUrl: boolean
  /** CustomLink may appear more than once per audience. */
  allowsMultiple: boolean
  /** Key exists but NEXORA TOUCH has no destination page yet. */
  isComingSoon: boolean
}

/** Merchant-side aggregate returned by `GET /api/v1/merchant/oneqr`. */
export interface OneQr {
  id: string
  name: string
  url: string
  qrImageUrl: string | null
  isActive: boolean
  createdAt: string | null
  /** Backend-computed: drives the TipAndPay warning without a second request. */
  hasActiveTouchPoint: boolean
  /** Always three entries, in Customer / Staff / Owner order. */
  audiences: OneQrRoleConfig[]
  /** Registry catalog, shipped inline with the config. */
  catalog: OneQrModuleCatalogItem[]
}

/** Payload for `PUT /api/v1/merchant/oneqr/modules` (`SaveOneQrModulesCommand`). */
export interface SaveOneQrModulesVars {
  audience: OneQrAudience
  /** Order of this array *is* the sort order — the command carries no index. */
  modules: Array<{
    moduleKey: string
    isEnabled: boolean
    customLabel?: string | null
    customIcon?: string | null
    customUrl?: string | null
  }>
}

export interface SaveOneQrRoleConfigVars {
  audience: OneQrAudience
  welcomeMessage: string | null
  identityPolicy: OneQrIdentityPolicy
}

/* ------------------------------------------------------------------ */
/* Public landing                                                      */
/* ------------------------------------------------------------------ */

/** One tile as rendered to a scanner — the URL is resolved by the backend. */
export interface OneQrLandingModule {
  moduleKey: string
  label: string
  icon: string | null
  url: string
}

export interface OneQrLandingBusiness {
  id: string
  name: string
  slug: string
  logoUrl: string | null
}

/**
 * `status` is a free-form string on the wire. Narrowed here so the three
 * screens the business doc demands (grid / paused / not found) stay explicit.
 */
export type OneQrLandingStatus = 'active' | 'paused' | 'notFound'

export interface OneQrLanding {
  status: OneQrLandingStatus
  business: OneQrLandingBusiness
  /** True when policy is AlwaysSignIn and the scanner has no valid session. */
  requiresAuth: boolean
  /** Which role the backend resolved this scanner into. */
  audience: OneQrAudience
  welcomeMessage: string | null
  /** Backend decides whether the "View as customer" switch applies. */
  canViewAsCustomer: boolean
  /** Only the resolved audience's enabled modules are ever sent. */
  modules: OneQrLandingModule[]
}
