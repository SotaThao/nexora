/** Package Management — tabs, mock overview data, TipPlatform compare rows. */

import {
  SubscriptionMyPackageStatus,
  SubscriptionMyPackageType,
  type SubscriptionMyPackage,
} from '../../../../data/repositories/subscriptionPayments'
import { parseApiUtcDateTime } from '../../../../utils/localDate'

export const PACKAGE_MANAGEMENT_TK =
  'components.dashboard.views.PackageManagementView'

/** Reuse VoiceAI / plans copy for TipPlatform package-unavailable toast. */
export const BOOKING_HUB_PLANS_TK =
  'components.dashboard.views.BookingHubView.plans'

export const PACKAGE_QUERY_PARAM = {
  tab: 'tab',
  plan: 'plan',
} as const

/** Always hit the network when a Package Management tab panel mounts — no stale cache. */
export const PACKAGE_MANAGEMENT_TAB_QUERY = {
  staleTime: 0,
  gcTime: 0,
  refetchOnMount: 'always' as const,
} as const

export type PackageManagementTabQueryOptions = typeof PACKAGE_MANAGEMENT_TAB_QUERY

export const PACKAGE_EMPTY_CELL = '—' as const

export const PACKAGE_COMPARE_SYMBOL = {
  included: '✓',
  excluded: '—',
} as const

/** TipPlatform UI plan ids (catalog + compare columns). */
export const TipPlatformUiPlanId = {
  Lite: 'lite',
  Starter: 'starter',
  Pro: 'pro',
  Enterprise: 'enterprise',
} as const

export type TipPlatformUiPlanIdValue =
  (typeof TipPlatformUiPlanId)[keyof typeof TipPlatformUiPlanId]

export type TipPlatformComparePlanId =
  | typeof TipPlatformUiPlanId.Starter
  | typeof TipPlatformUiPlanId.Pro
  | typeof TipPlatformUiPlanId.Enterprise

export const TIP_PLATFORM_COMPARE_PLAN_IDS: TipPlatformComparePlanId[] = [
  TipPlatformUiPlanId.Starter,
  TipPlatformUiPlanId.Pro,
  TipPlatformUiPlanId.Enterprise,
]

export enum PackageManagementTab {
  Overview = 'overview',
  Subscriptions = 'subscriptions',
  AiVoice = 'ai-voice',
  History = 'history',
}

export const PACKAGE_MANAGEMENT_TAB_ORDER: PackageManagementTab[] = [
  PackageManagementTab.Overview,
  PackageManagementTab.Subscriptions,
  PackageManagementTab.AiVoice,
  PackageManagementTab.History,
]

export const PACKAGE_MANAGEMENT_TAB_I18N_KEY: Record<
  PackageManagementTab,
  string
> = {
  [PackageManagementTab.Overview]: 'tabs.overview',
  [PackageManagementTab.Subscriptions]: 'tabs.subscriptions',
  [PackageManagementTab.AiVoice]: 'tabs.aiVoice',
  [PackageManagementTab.History]: 'tabs.history',
}

export function packageTabDomId(tab: PackageManagementTab) {
  return `package-tab-${tab}`
}

export function packagePanelDomId(tab: PackageManagementTab) {
  return `package-panel-${tab}`
}

export function parsePackageManagementTab(
  value: string | null | undefined,
): PackageManagementTab {
  const raw = String(value ?? '').trim().toLowerCase()
  const match = PACKAGE_MANAGEMENT_TAB_ORDER.find((tab) => tab === raw)
  return match ?? PackageManagementTab.Overview
}

export function isKnownPackageManagementTab(
  value: string | null | undefined,
): value is PackageManagementTab {
  const raw = String(value ?? '').trim().toLowerCase()
  return PACKAGE_MANAGEMENT_TAB_ORDER.some((tab) => tab === raw)
}

/** Overview tab only lists these my-packages wire statuses. */
export const PACKAGE_OVERVIEW_VISIBLE_STATUSES = new Set<SubscriptionMyPackageStatus>([
  SubscriptionMyPackageStatus.Active,
])

export function isPackageOverviewVisibleStatus(
  status: SubscriptionMyPackageStatus,
): boolean {
  return PACKAGE_OVERVIEW_VISIBLE_STATUSES.has(status)
}

export type PackageOverviewProductKey = 'nexora' | 'voice'

export const PackageOverviewProduct = {
  Nexora: 'nexora',
  Voice: 'voice',
} as const satisfies Record<string, PackageOverviewProductKey>

export const PACKAGE_OVERVIEW_SKELETON_CARD_COUNT = 4

export const PACKAGE_OVERVIEW_TIP_PLATFORM_PLAN = {
  Starter: 'starter',
  Pro: 'pro',
} as const

/** VoiceAI owned-card copy keyed by catalog `packageCode` tier. */
export const PACKAGE_OVERVIEW_VOICE_PLAN = {
  Starter: 'starter',
  Pro: 'pro',
  Elite: 'elite',
} as const

export const PACKAGE_OVERVIEW_I18N = {
  nexora: {
    starter: {
      nameKey: 'overview.owned.nexoraStarterName',
      descriptionKey: 'overview.owned.nexoraStarterDesc',
    },
    pro: {
      nameKey: 'overview.owned.nexoraProName',
      descriptionKey: 'overview.owned.nexoraProDesc',
    },
  },
  voice: {
    starter: {
      nameKey: 'overview.owned.voiceStarterName',
      descriptionKey: 'overview.owned.voiceStarterDesc',
    },
    pro: {
      nameKey: 'overview.owned.voiceProName',
      descriptionKey: 'overview.owned.voiceProDesc',
    },
    elite: {
      nameKey: 'overview.owned.voiceEliteName',
      descriptionKey: 'overview.owned.voiceEliteDesc',
    },
  },
} as const

export type PackageOverviewPlanCopy = {
  nameKey: string
  descriptionKey: string
}

type PlanTokenMatcher = {
  token: string
  copy: PackageOverviewPlanCopy
}

/** Elite before Starter so `voice-elite` does not fall through as starter-ish. */
const VOICE_OWNED_PLAN_MATCHERS: PlanTokenMatcher[] = [
  {
    token: PACKAGE_OVERVIEW_VOICE_PLAN.Elite,
    copy: PACKAGE_OVERVIEW_I18N.voice.elite,
  },
  {
    token: PACKAGE_OVERVIEW_VOICE_PLAN.Starter,
    copy: PACKAGE_OVERVIEW_I18N.voice.starter,
  },
]

const TIP_PLATFORM_OWNED_PLAN_MATCHERS: PlanTokenMatcher[] = [
  {
    token: PACKAGE_OVERVIEW_TIP_PLATFORM_PLAN.Starter,
    copy: PACKAGE_OVERVIEW_I18N.nexora.starter,
  },
]

function resolvePlanCopyByToken(
  identity: string,
  matchers: PlanTokenMatcher[],
  fallback: PackageOverviewPlanCopy,
): PackageOverviewPlanCopy {
  const match = matchers.find(({ token }) => identity.includes(token))
  return match?.copy ?? fallback
}

/** Map my-packages VoiceAI `packageCode` → overview card copy. */
export function resolveVoiceOwnedPlanCopy(
  packageCode: string,
): PackageOverviewPlanCopy {
  return resolvePlanCopyByToken(
    packageCode.trim().toLowerCase(),
    VOICE_OWNED_PLAN_MATCHERS,
    PACKAGE_OVERVIEW_I18N.voice.pro,
  )
}

/** Map my-packages TipPlatform `packageCode`/`name` → overview card copy. */
export function resolveTipPlatformOwnedPlanCopy(
  packageCode: string,
  name = '',
): PackageOverviewPlanCopy {
  return resolvePlanCopyByToken(
    `${packageCode} ${name}`.toLowerCase(),
    TIP_PLATFORM_OWNED_PLAN_MATCHERS,
    PACKAGE_OVERVIEW_I18N.nexora.pro,
  )
}

export const PACKAGE_OVERVIEW_RENEW_TAB: Record<
  PackageOverviewProductKey,
  PackageManagementTab
> = {
  [PackageOverviewProduct.Nexora]: PackageManagementTab.Subscriptions,
  [PackageOverviewProduct.Voice]: PackageManagementTab.AiVoice,
}

export const PACKAGE_OVERVIEW_RENEW_CTA_KEY: Record<
  PackageOverviewProductKey,
  string
> = {
  [PackageOverviewProduct.Nexora]: 'remainingExpiredRenewSubscriptions',
  [PackageOverviewProduct.Voice]: 'remainingExpiredRenewAiVoice',
}

export const PACKAGE_OVERVIEW_AUTO_RENEW_TOAST_KEY = {
  enabled: 'autoRenewEnabled',
  disabled: 'autoRenewDisabled',
  error: 'autoRenewError',
} as const

export const PACKAGE_OVERVIEW_AUTO_RENEW_STATE_KEY = {
  on: 'autoRenewOn',
  off: 'autoRenewOff',
} as const

export function resolvePackageRenewTab(
  productKey: PackageOverviewProductKey,
): PackageManagementTab {
  return PACKAGE_OVERVIEW_RENEW_TAB[productKey]
}

export function resolveAutoRenewToastKey(autoRenew: boolean): string {
  return autoRenew
    ? PACKAGE_OVERVIEW_AUTO_RENEW_TOAST_KEY.enabled
    : PACKAGE_OVERVIEW_AUTO_RENEW_TOAST_KEY.disabled
}

export function resolveAutoRenewStateKey(autoRenew: boolean): string {
  return autoRenew
    ? PACKAGE_OVERVIEW_AUTO_RENEW_STATE_KEY.on
    : PACKAGE_OVERVIEW_AUTO_RENEW_STATE_KEY.off
}

function shiftIsoDate(days: number, endOfDay = false) {
  const date = new Date()
  date.setHours(endOfDay ? 23 : 0, endOfDay ? 59 : 0, endOfDay ? 59 : 0, endOfDay ? 999 : 0)
  date.setDate(date.getDate() + days)
  return date.toISOString()
}

/** Hard-data owned packages for Overview (until BE owned-packages API exists). */
export type PackageOverviewOwnedItem = {
  id: string
  productKey: PackageOverviewProductKey
  /** Display name from API (`MerchantPackageDto.name`). */
  name: string
  nameKey: string
  descriptionKey: string
  featureKeys: string[]
  activatedAt: string
  expiresAt: string
  autoRenew: boolean
}

type OwnedPackagePlanResolver = (pkg: {
  packageCode: string
  name: string
}) => {
  productKey: PackageOverviewProductKey
  planCopy: PackageOverviewPlanCopy
}

const OWNED_PLAN_BY_PACKAGE_TYPE: Partial<
  Record<SubscriptionMyPackageType, OwnedPackagePlanResolver>
> = {
  [SubscriptionMyPackageType.TipPlatform]: (pkg) => ({
    productKey: PackageOverviewProduct.Nexora,
    planCopy: resolveTipPlatformOwnedPlanCopy(pkg.packageCode, pkg.name),
  }),
  [SubscriptionMyPackageType.VoiceAI]: (pkg) => ({
    productKey: PackageOverviewProduct.Voice,
    planCopy: resolveVoiceOwnedPlanCopy(pkg.packageCode),
  }),
}

/** Map a my-packages DTO row → Overview owned card model (or null if incomplete). */
export function mapMyPackageToOwnedItem(
  pkg: SubscriptionMyPackage,
): PackageOverviewOwnedItem | null {
  const activatedAt = String(pkg.activatedAt ?? '').trim()
  const expiresAt = String(pkg.expiresAt ?? '').trim()
  if (!pkg.id || !activatedAt || !expiresAt) return null

  const resolve = OWNED_PLAN_BY_PACKAGE_TYPE[pkg.packageType]
  if (!resolve) return null

  const { productKey, planCopy } = resolve(pkg)
  const name = String(pkg.name ?? '').trim() || String(pkg.packageCode ?? '').trim()
  return {
    id: String(pkg.id),
    productKey,
    name,
    nameKey: planCopy.nameKey,
    descriptionKey: planCopy.descriptionKey,
    featureKeys: [],
    activatedAt,
    expiresAt,
    autoRenew: Boolean(pkg.autoRenew),
  }
}

/** Relative mock dates so Overview countdown stays demo-valid over time. */
export const PACKAGE_OVERVIEW_OWNED_MOCK: PackageOverviewOwnedItem[] = [
  {
    id: 'nexora-pro',
    productKey: PackageOverviewProduct.Nexora,
    name: 'Nexora Pro',
    nameKey: 'overview.owned.nexoraProName',
    descriptionKey: 'overview.owned.nexoraProDesc',
    featureKeys: [
      'overview.owned.featOwnerDashboard',
      'overview.owned.featAutoReview',
      'overview.owned.featLandingPages',
    ],
    activatedAt: shiftIsoDate(-14),
    expiresAt: shiftIsoDate(30, true),
    autoRenew: true,
  },
  {
    id: 'voice-pro',
    productKey: PackageOverviewProduct.Voice,
    name: 'Voice AI Pro',
    nameKey: 'overview.owned.voiceProName',
    descriptionKey: 'overview.owned.voiceProDesc',
    featureKeys: [
      'overview.owned.featVoiceSms',
      'overview.owned.featMinutes',
      'overview.owned.featAutoReview',
    ],
    activatedAt: shiftIsoDate(-7),
    expiresAt: shiftIsoDate(21, true),
    autoRenew: false,
  },
  {
    id: 'nexora-starter-lapsed',
    productKey: PackageOverviewProduct.Nexora,
    name: 'Nexora Starter',
    nameKey: 'overview.owned.nexoraStarterName',
    descriptionKey: 'overview.owned.nexoraStarterDesc',
    featureKeys: [
      'overview.owned.featOwnerDashboard',
      'overview.owned.featAutoReview',
    ],
    activatedAt: shiftIsoDate(-90),
    expiresAt: shiftIsoDate(-10, true),
    autoRenew: false,
  },
]

/** Wire tokens for compare-table cells (mapped to i18n at render). */
export const CompareCellToken = {
  Unlimited: 'Unlimited',
  Custom: 'Custom',
  Email: 'Email',
  Priority: 'Priority',
  Dedicated: '24/7 dedicated',
  Branded: 'Branded',
  PremiumNfc: 'Premium NFC',
  PriceStarter: '$29',
  PricePro: '$79',
} as const

export type CompareCellTokenValue =
  (typeof CompareCellToken)[keyof typeof CompareCellToken]

export type TipPlatformCompareCell =
  | boolean
  | null
  | CompareCellTokenValue

export type TipPlatformCompareRow = {
  featureKey: string
  starter: TipPlatformCompareCell
  pro: TipPlatformCompareCell
  enterprise: TipPlatformCompareCell
}

export const COMPARE_CELL_I18N_KEY: Partial<Record<CompareCellTokenValue, string>> = {
  [CompareCellToken.Unlimited]: 'compare.unlimited',
  [CompareCellToken.Custom]: 'compare.custom',
  [CompareCellToken.Email]: 'compare.supportEmail',
  [CompareCellToken.Priority]: 'compare.supportPriority',
  [CompareCellToken.Dedicated]: 'compare.supportDedicated',
  [CompareCellToken.Branded]: 'compare.branded',
  [CompareCellToken.PremiumNfc]: 'compare.premiumNfc',
}

/** Static Plan comparison rows (HTML nexora-packages); highlight via current plan. */
export const TIP_PLATFORM_COMPARE_ROWS: TipPlatformCompareRow[] = [
  {
    featureKey: 'compare.monthlyPrice',
    starter: CompareCellToken.PriceStarter,
    pro: CompareCellToken.PricePro,
    enterprise: CompareCellToken.Custom,
  },
  {
    featureKey: 'compare.activeStaff',
    starter: CompareCellToken.Unlimited,
    pro: CompareCellToken.Unlimited,
    enterprise: CompareCellToken.Unlimited,
  },
  {
    featureKey: 'compare.qrTipping',
    starter: CompareCellToken.Branded,
    pro: CompareCellToken.Branded,
    enterprise: CompareCellToken.PremiumNfc,
  },
  {
    featureKey: 'compare.directTips',
    starter: true,
    pro: true,
    enterprise: true,
  },
  {
    featureKey: 'compare.googleReviews',
    starter: true,
    pro: true,
    enterprise: true,
  },
  {
    featureKey: 'compare.staffAccounts',
    starter: null,
    pro: true,
    enterprise: true,
  },
  {
    featureKey: 'compare.customerRewards',
    starter: null,
    pro: true,
    enterprise: true,
  },
  {
    featureKey: 'compare.neighborCoop',
    starter: null,
    pro: true,
    enterprise: true,
  },
  {
    featureKey: 'compare.multiLocation',
    starter: null,
    pro: null,
    enterprise: true,
  },
  {
    featureKey: 'compare.posSync',
    starter: null,
    pro: null,
    enterprise: true,
  },
  {
    featureKey: 'compare.support',
    starter: CompareCellToken.Email,
    pro: CompareCellToken.Priority,
    enterprise: CompareCellToken.Dedicated,
  },
]

export const PACKAGE_COUNTDOWN_UNITS = [
  'years',
  'months',
  'days',
  'hours',
  'minutes',
  'seconds',
] as const

export type PackageCountdownUnit = (typeof PACKAGE_COUNTDOWN_UNITS)[number]

export type PackageOverviewStatus = 'active' | 'expiring' | 'expired'

const OVERVIEW_EXPIRING_WITHIN_DAYS = 7

const PACKAGE_COUNTDOWN_EXPIRED = {
  years: 0,
  months: 0,
  days: 0,
  hours: 0,
  minutes: 0,
  seconds: 0,
  expired: true as const,
}

export function formatPackageCountdownParts(expiresAtIso: string, now = Date.now()) {
  const endDate = parseApiUtcDateTime(expiresAtIso)
  if (!endDate) {
    return PACKAGE_COUNTDOWN_EXPIRED
  }
  const end = endDate.getTime()
  if (!Number.isFinite(end) || end <= now) {
    return PACKAGE_COUNTDOWN_EXPIRED
  }

  let cursor = new Date(now)
  let years = 0
  while (true) {
    const next = new Date(cursor)
    next.setFullYear(next.getFullYear() + 1)
    if (next > endDate) break
    cursor = next
    years += 1
  }

  let months = 0
  while (true) {
    const next = new Date(cursor)
    next.setMonth(next.getMonth() + 1)
    if (next > endDate) break
    cursor = next
    months += 1
  }

  let remaining = end - cursor.getTime()
  const days = Math.floor(remaining / 86400000)
  remaining -= days * 86400000
  const hours = Math.floor(remaining / 3600000)
  remaining -= hours * 3600000
  const minutes = Math.floor(remaining / 60000)
  remaining -= minutes * 60000
  const seconds = Math.floor(remaining / 1000)

  return { years, months, days, hours, minutes, seconds, expired: false as const }
}

export function getPackageOverviewStatus(
  expiresAtIso: string,
  now = Date.now(),
): PackageOverviewStatus {
  const endDate = parseApiUtcDateTime(expiresAtIso)
  const end = endDate?.getTime() ?? NaN
  if (!Number.isFinite(end) || end <= now) return 'expired'
  const daysLeft = (end - now) / 86400000
  if (daysLeft <= OVERVIEW_EXPIRING_WITHIN_DAYS) return 'expiring'
  return 'active'
}

export function formatCompareCellDisplay(
  value: TipPlatformCompareCell,
  t: (key: string) => string,
): string {
  if (value === true) return PACKAGE_COMPARE_SYMBOL.included
  if (value === null || value === false) return PACKAGE_COMPARE_SYMBOL.excluded
  const i18nSuffix = COMPARE_CELL_I18N_KEY[value]
  if (i18nSuffix) return t(`${PACKAGE_MANAGEMENT_TK}.${i18nSuffix}`)
  return value
}
