/**
 * OneQR (Mã QR Tổng) — shared enums + a last-resort presentation fallback.
 *
 * Enums mirror backend `Nexora.Domain.Enums.OneQrEnums`. The domain declares
 * them as numeric enums, but the API serialises them as strings (verified in
 * Swagger), so the string name is the wire format.
 *
 * IMPORTANT — the server owns the module catalog. Module metadata lives in the
 * `OneQrModuleDefinition` table, which a platform admin edits at runtime
 * (`/api/v1/admin/oneqr-modules`): label, icon, `urlTemplate`,
 * `allowedAudiences`, `isComingSoon`, `sortOrder` and enable/disable are all
 * *data*, not constants. So:
 *
 *  - destination URLs are never declared here — the landing payload carries a
 *    resolved `url` per module;
 *  - `ONEQR_MODULE_CATALOG` below is NOT a source of truth. It is a bundled
 *    fallback used only when the server sends no catalog at all, plus an icon
 *    name for keys whose definition arrives incomplete. Server values always
 *    win, the server decides which keys exist, and the server's order is the
 *    display order.
 *
 * The one thing the FE *does* own is the tile **label**: it is translated from
 * `moduleKey` via `oneqr.modules.<ModuleKey>` in the locale files, because the
 * definition table stores a single-language string. Adding a new module key
 * therefore requires a locale entry in both `en.json` and `vi.json` — see
 * `src/components/oneqr/oneQrModuleLabel.ts`.
 */

export enum OneQrAudience {
  Customer = 'Customer',
  Staff = 'Staff',
  Owner = 'Owner',
  AIVoice = 'AIVoice',
}

export enum OneQrIdentityPolicy {
  PublicFirst = 'PublicFirst',
  AlwaysSignIn = 'AlwaysSignIn',
}

/**
 * The **built-in** module keys, mirroring the backend's `OneQrModuleKey` enum.
 *
 * `moduleKey` is a free-form `string` on every DTO (decision 3d) — an admin can
 * add new modules through the portal without a deploy, so this enum is NOT the
 * set of valid values. Treat it as:
 *
 *  - the list of keys this build ships translations and bundled icons for;
 *  - the `IsBuiltIn` check (a key outside it is admin-authored);
 *  - `CustomLink`, the one key with special behaviour worth comparing against
 *    (uses `customUrl` instead of a template, and may repeat per audience).
 *
 * Never coerce an unknown key into a member of this enum — that would silently
 * rewrite an admin-authored module into something else on save.
 *
 * The numeric bands on the backend (0-9, 10-19, 20-29, 90+) only record which
 * role a module was originally designed for; they are NOT an access rule, since
 * every module is assignable to every audience (decision 3b).
 */
export enum OneQrModuleKey {
  // Band 0-9 — originally Customer
  Booking = 'Booking',
  CheckIn = 'CheckIn',
  Services = 'Services',
  TipAndPay = 'TipAndPay',
  Payment = 'Payment',
  Review = 'Review',
  Rewards = 'Rewards',
  Membership = 'Membership',
  VoiceBooking = 'VoiceBooking',
  // Band 10-19 — originally Staff
  ClockIn = 'ClockIn',
  TurnBoard = 'TurnBoard',
  MyTips = 'MyTips',
  StaffPortal = 'StaffPortal',
  ReceiveCustomer = 'ReceiveCustomer',
  CompleteService = 'CompleteService',
  RequestApproval = 'RequestApproval',
  // Band 20-29 — originally Owner
  OwnerDashboard = 'OwnerDashboard',
  ManageBookings = 'ManageBookings',
  ManageServices = 'ManageServices',
  // Band 90+ — shared
  CustomLink = 'CustomLink',
  AIAssistant = 'AIAssistant',
}

/**
 * Why a configured module cannot resolve right now. The backend sends this on
 * `OneQrModuleConfigDto.unavailableReason`; the builder shows the specific
 * reason instead of a generic "unavailable", because each one has a different
 * fix and a different owner (merchant vs platform admin).
 */
export enum OneQrModuleUnavailableReason {
  /** TipAndPay / Review with no active TouchPoint — merchant creates a station. */
  MissingTouchPoint = 'MissingTouchPoint',
  /** The platform admin deactivated this module definition. */
  Disabled = 'Disabled',
  /** The definition is gone from the system catalog entirely. */
  MissingDefinition = 'MissingDefinition',
  /** CustomLink saved without an https URL — merchant fills it in. */
  MissingCustomUrl = 'MissingCustomUrl',
  /** The tile points at a NexoraVoice page but this business has no Voice tenant. */
  MissingVoiceTenant = 'MissingVoiceTenant',
  /** The admin's `urlTemplate` could not be resolved for this business. */
  InvalidTemplate = 'InvalidTemplate',
}

/** Tab order in the builder and in the "preview as" switcher. */
export const ONEQR_AUDIENCE_ORDER = [
  OneQrAudience.Customer,
  OneQrAudience.Staff,
  OneQrAudience.Owner,
  OneQrAudience.AIVoice,
] as const

export const ONEQR_IDENTITY_POLICY_OPTIONS = [
  OneQrIdentityPolicy.PublicFirst,
  OneQrIdentityPolicy.AlwaysSignIn,
] as const

/** Column widths from the entity spec — enforced client-side before save. */
export const ONEQR_FIELD_LIMITS = {
  name: 100,
  welcomeMessage: 200,
  customLabel: 60,
  customIcon: 40,
  customIconUrl: 500,
  customUrl: 500,
} as const

/**
 * Client-side compression target for an uploaded module icon. Tiles render at
 * 36px (builder grid/preview), so 128px covers up to ~3x pixel density while
 * keeping the upload small — see `compressImageFile` in `utils/imageFile.ts`.
 */
export const ONEQR_ICON_UPLOAD_MAX_DIMENSION_PX = 128
export const ONEQR_ICON_UPLOAD_MAX_BYTES = 80 * 1024

export const ONEQR_ROUTE = {
  path: '/o/:businessSlug',
  param: 'businessSlug',
  /** `?as=customer` renders the customer view for a signed-in staff/owner. */
  asQuery: 'as',
  asCustomerValue: 'customer',
  asStaffValue: 'staff',
  asOwnerValue: 'owner',
} as const

export function buildOneQrPath(businessSlug: string): string {
  return `/o/${encodeURIComponent(businessSlug)}`
}

/**
 * The `?as=` value that asks the landing page for a given role's view.
 *
 * This is a *request*, never an entitlement: the backend resolves the real role
 * from the JWT and only honours `as` when it does not grant more than the
 * caller already has. A scanner with no session asking for `as=staff` still
 * gets the Customer grid — which is what makes it safe to print a role-specific
 * code (e.g. an `as=staff` sticker in the back room).
 */
export function toOneQrViewAs(audience: OneQrAudience): string {
  return audience.toLowerCase()
}

/** Builds `/o/{slug}` with the role hint attached. */
export function buildOneQrPathFor(
  businessSlug: string,
  audience: OneQrAudience,
): string {
  return `${buildOneQrPath(businessSlug)}?${ONEQR_ROUTE.asQuery}=${toOneQrViewAs(audience)}`
}

export type OneQrModuleCatalogEntry = {
  moduleKey: OneQrModuleKey
  /** Lucide icon name, resolved through `OneQrModuleIcon`. */
  defaultIcon: string
  /**
   * Seed values for the offline fallback only. The live values come from the
   * admin-managed definition, so never read these to decide what the merchant
   * may configure.
   */
  allowedAudiences: OneQrAudience[]
  requiresTouchPoint?: boolean
  repeatable?: boolean
  comingSoon?: boolean
}

/**
 * Seed value for the fallback. Live `allowedAudiences` is per-definition and
 * admin-editable, so a module being open to every role is a *default*, not
 * a rule the FE may assume.
 */
const ALL_AUDIENCES = [
  OneQrAudience.Customer,
  OneQrAudience.Staff,
  OneQrAudience.Owner,
  OneQrAudience.AIVoice,
]

/**
 * Bundled fallback, seeded from the v1 registry table in `oneqr-technical.md`.
 * Ordered the way the mockup lists modules (customer journey → staff operations
 * → owner management → escape hatches), but note this order is only used when
 * the server sends no catalog: live ordering is the admin's `sortOrder`.
 */
export const ONEQR_MODULE_CATALOG: OneQrModuleCatalogEntry[] = [
  {
    moduleKey: OneQrModuleKey.CheckIn,
    defaultIcon: 'check',
    allowedAudiences: ALL_AUDIENCES,
  },
  {
    moduleKey: OneQrModuleKey.Booking,
    defaultIcon: 'calendar-days',
    allowedAudiences: ALL_AUDIENCES,
  },
  {
    moduleKey: OneQrModuleKey.Services,
    defaultIcon: 'list',
    allowedAudiences: ALL_AUDIENCES,
  },
  {
    moduleKey: OneQrModuleKey.Payment,
    defaultIcon: 'dollar-sign',
    allowedAudiences: ALL_AUDIENCES,
  },
  {
    moduleKey: OneQrModuleKey.TipAndPay,
    defaultIcon: 'heart',
    allowedAudiences: ALL_AUDIENCES,
    requiresTouchPoint: true,
  },
  {
    moduleKey: OneQrModuleKey.Review,
    defaultIcon: 'star',
    allowedAudiences: ALL_AUDIENCES,
    requiresTouchPoint: true,
  },
  {
    moduleKey: OneQrModuleKey.Rewards,
    defaultIcon: 'gift',
    allowedAudiences: ALL_AUDIENCES,
    comingSoon: true,
  },
  {
    moduleKey: OneQrModuleKey.Membership,
    defaultIcon: 'crown',
    allowedAudiences: ALL_AUDIENCES,
    comingSoon: true,
  },
  {
    moduleKey: OneQrModuleKey.VoiceBooking,
    defaultIcon: 'calendar-clock',
    allowedAudiences: ALL_AUDIENCES,
  },
  {
    moduleKey: OneQrModuleKey.StaffPortal,
    defaultIcon: 'user-round',
    allowedAudiences: ALL_AUDIENCES,
  },
  {
    moduleKey: OneQrModuleKey.AIAssistant,
    defaultIcon: 'bot',
    allowedAudiences: ALL_AUDIENCES,
    comingSoon: true,
  },
  {
    moduleKey: OneQrModuleKey.ClockIn,
    defaultIcon: 'circle-check',
    allowedAudiences: ALL_AUDIENCES,
  },
  {
    moduleKey: OneQrModuleKey.TurnBoard,
    defaultIcon: 'users-round',
    allowedAudiences: ALL_AUDIENCES,
  },
  {
    moduleKey: OneQrModuleKey.ReceiveCustomer,
    defaultIcon: 'check',
    allowedAudiences: ALL_AUDIENCES,
  },
  {
    moduleKey: OneQrModuleKey.CompleteService,
    defaultIcon: 'star',
    allowedAudiences: ALL_AUDIENCES,
  },
  {
    moduleKey: OneQrModuleKey.RequestApproval,
    defaultIcon: 'square-arrow-out-up-right',
    allowedAudiences: ALL_AUDIENCES,
  },
  {
    moduleKey: OneQrModuleKey.MyTips,
    defaultIcon: 'wallet',
    allowedAudiences: ALL_AUDIENCES,
  },
  {
    moduleKey: OneQrModuleKey.OwnerDashboard,
    defaultIcon: 'layout-dashboard',
    allowedAudiences: ALL_AUDIENCES,
  },
  {
    moduleKey: OneQrModuleKey.ManageBookings,
    defaultIcon: 'calendar-check',
    allowedAudiences: ALL_AUDIENCES,
  },
  {
    moduleKey: OneQrModuleKey.ManageServices,
    defaultIcon: 'settings-2',
    allowedAudiences: ALL_AUDIENCES,
  },
  {
    moduleKey: OneQrModuleKey.CustomLink,
    defaultIcon: 'link',
    allowedAudiences: ALL_AUDIENCES,
    repeatable: true,
  },
]

export const ONEQR_MODULE_CATALOG_BY_KEY: Record<string, OneQrModuleCatalogEntry> =
  ONEQR_MODULE_CATALOG.reduce<Record<string, OneQrModuleCatalogEntry>>(
    (acc, entry) => {
      acc[entry.moduleKey] = entry
      return acc
    },
    {},
  )

/** False for a module an admin added through the portal. */
export function isBuiltInOneQrModuleKey(moduleKey: string): boolean {
  return (Object.values(OneQrModuleKey) as string[]).includes(moduleKey)
}

export function isOneQrModuleRepeatable(moduleKey: string): boolean {
  return Boolean(ONEQR_MODULE_CATALOG_BY_KEY[moduleKey]?.repeatable)
}

/*
 * There is deliberately no `isOneQrModuleComingSoon(moduleKey)` helper.
 *
 * "Coming soon" is admin-editable state on `OneQrModuleDefinition`, and every
 * response that shows a module also carries its `isComingSoon`. A key-based
 * lookup against the bundled table can only ever contradict the server — which
 * is exactly what happened: the badge stayed pinned on Rewards / Membership /
 * AIAssistant after the admin cleared the flag. The seed values below are for
 * `buildOneQrFallbackCatalog()` only.
 */

/**
 * A CustomLink destination is merchant-typed free text — only absolute https
 * URLs are accepted, per the Non-Functional constraint (blocks `javascript:`
 * and `data:`). Mirrors the Application-layer validator.
 */
export function isValidOneQrCustomUrl(value: string): boolean {
  const trimmed = String(value ?? '').trim()
  if (!trimmed || trimmed.length > ONEQR_FIELD_LIMITS.customUrl) return false
  try {
    return new URL(trimmed).protocol === 'https:'
  } catch {
    return false
  }
}
