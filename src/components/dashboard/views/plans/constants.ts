import {
  normalizeVoicePlanTier,
  VoicePlanTier,
} from '../../../../data/merchantVoice/domain'
import {
  PackageHistoryUiStatus,
  type SubscriptionPackage,
  type SubscriptionPaymentMethod,
} from '../../../../data/repositories/subscriptionPayments'
import { formatCurrency } from '../../utils'
import { BOOKING_HUB_EMPTY_CELL } from '../bookingHubFormatters'

/** Paid VoiceAI plans that open checkout — same wire values as `VoicePlanTier`. */
export type PaidServicePlanId = VoicePlanTier

export const PAID_SERVICE_PLAN_ORDER: PaidServicePlanId[] = [
  VoicePlanTier.Starter,
  VoicePlanTier.Pro,
  VoicePlanTier.Elite,
]

/** Rank in `PAID_SERVICE_PLAN_ORDER` (0 = lowest). Unknown → -1. */
export function getVoiceAiPlanRank(planId: PaidServicePlanId): number {
  return PAID_SERVICE_PLAN_ORDER.indexOf(planId)
}

/** True when `planId` is a lower tier than the merchant's active VoiceAI plan. */
export function isVoiceAiPlanBelowCurrent(
  planId: PaidServicePlanId,
  currentPlanId: PaidServicePlanId | null | undefined,
): boolean {
  if (!currentPlanId) return false
  const currentRank = getVoiceAiPlanRank(currentPlanId)
  const planRank = getVoiceAiPlanRank(planId)
  if (currentRank < 0 || planRank < 0) return false
  return planRank < currentRank
}

/** Sub-views under AI Hub → Plans. */
export enum PlansView {
  Package = 'package',
  Credits = 'credits',
  History = 'history',
}

/**
 * Poll GET tenant/status after VoiceAI plan Paid until BE flips hasVoiceTenant.
 * AI Hub then shows all tabs in-place (no page reload); each tab fetches on open.
 */
export const VOICE_AI_HUB_UNLOCK_POLL_ATTEMPTS = 8
export const VOICE_AI_HUB_UNLOCK_POLL_INTERVAL_MS = 750

/** Low-balance banner on Credit Usage (priority: Voice > SMS). */
export enum CreditsLowBannerKind {
  Voice = 'voice',
  Sms = 'sms',
}

export type CreditsLowBannerCopy = {
  titleKey: string
  bodyKey: string
  /** Which available balance feeds `{{remaining}}`. */
  remainingSource: 'voice' | 'sms'
  /** Warning tone uses amber; SMS-only uses neutral styling. */
  tone: 'warning' | 'neutral'
}

export const CREDITS_LOW_BANNER_COPY: Record<CreditsLowBannerKind, CreditsLowBannerCopy> = {
  [CreditsLowBannerKind.Voice]: {
    titleKey: 'voiceWarningTitle',
    bodyKey: 'voiceWarningBody',
    remainingSource: 'voice',
    tone: 'warning',
  },
  [CreditsLowBannerKind.Sms]: {
    titleKey: 'buyBarTitle',
    bodyKey: 'buyBarBodySms',
    remainingSource: 'sms',
    tone: 'neutral',
  },
}

export function resolveCreditsLowBannerKind(
  isVoiceLow: boolean,
  isSmsLow: boolean,
): CreditsLowBannerKind | null {
  if (isVoiceLow) return CreditsLowBannerKind.Voice
  if (isSmsLow) return CreditsLowBannerKind.Sms
  return null
}

/** Package History sub-tab under AI Hub → Plans. */
export const SHOW_PACKAGE_HISTORY_TAB = false

/** Stable VoiceAI `packageCode` values from catalog (prefer over GUID for UI matching). */
export enum VoiceAiPackageCode {
  Starter = 'voice-starter',
  Pro = 'voice-pro',
  Elite = 'voice-elite',
}

export const VOICE_AI_PACKAGE_CODE_TO_PLAN: Record<VoiceAiPackageCode, PaidServicePlanId> = {
  [VoiceAiPackageCode.Starter]: VoicePlanTier.Starter,
  [VoiceAiPackageCode.Pro]: VoicePlanTier.Pro,
  [VoiceAiPackageCode.Elite]: VoicePlanTier.Elite,
}

/** Checkout payment id for credit/debit card (Stripe) — not a wallet symbol. */
export const PLAN_CARD_PAYMENT_SYMBOL = '__card__' as const

export function isPlanCardPaymentSymbol(symbol: string | null | undefined): boolean {
  return symbol === PLAN_CARD_PAYMENT_SYMBOL
}

/** Fallback prices when catalog is still loading or a card is missing from API. */
export const SERVICE_PLAN_MONTHLY_PRICE: Record<PaidServicePlanId, number> = {
  [VoicePlanTier.Starter]: 99,
  [VoicePlanTier.Pro]: 199,
  [VoicePlanTier.Elite]: 349,
}

/** i18n key under BookingHubView.plans for modal title / CTA. */
export const PAID_SERVICE_PLAN_TITLE_KEY: Record<PaidServicePlanId, string> = {
  [VoicePlanTier.Starter]: 'selectStarter',
  [VoicePlanTier.Pro]: 'selectPro',
  [VoicePlanTier.Elite]: 'selectElite',
}

export function isPaidServicePlanId(value: string): value is PaidServicePlanId {
  return Object.prototype.hasOwnProperty.call(SERVICE_PLAN_MONTHLY_PRICE, value)
}

/** Shared USD amount formatter for plan cards / invoice / history. */
export function formatUsdAmount(amount: number): string {
  if (!Number.isFinite(amount)) return BOOKING_HUB_EMPTY_CELL
  if (Number.isInteger(amount)) return `$${amount}`
  return formatCurrency(amount)
}

export function formatPlanPrice(price: number): string {
  return formatUsdAmount(price)
}

/** Invoice total: `$199` + localized `/mo` (pass `t(...perMonth)`). */
export function formatPlanMonthlyTotal(price: number, perMonthSuffix: string): string {
  return `${formatUsdAmount(price)}${perMonthSuffix}`
}

export function formatPackageHistoryAmount(amount: number, currency = 'USD'): string {
  if (currency.toUpperCase() === 'USD') return formatUsdAmount(amount)
  if (!Number.isFinite(amount)) return BOOKING_HUB_EMPTY_CELL
  return `${amount.toFixed(2)} ${currency}`
}

/** Wallet row balance in USD (balance × rate). */
export function formatWalletBalanceUsd(method: SubscriptionPaymentMethod): string {
  const usd = getWalletBalanceUsd(method)
  if (!Number.isFinite(usd)) return BOOKING_HUB_EMPTY_CELL
  return formatCurrency(usd)
}

/** Wallet available amount in USD (balance × rate). */
export function getWalletBalanceUsd(method: SubscriptionPaymentMethod): number {
  const usd = method.balance * (method.rate || 1)
  return Number.isFinite(usd) ? usd : 0
}

/** True when wallet USD covers `priceUsd` (cent-safe compare). */
export function hasEnoughWalletBalance(
  method: SubscriptionPaymentMethod,
  priceUsd: number | null | undefined,
): boolean {
  const price = Number(priceUsd)
  if (!Number.isFinite(price) || price <= 0) return true
  const balanceCents = Math.round(getWalletBalanceUsd(method) * 100)
  const priceCents = Math.round(price * 100)
  return balanceCents >= priceCents
}

/**
 * Package History display name — use API `planName` as-is.
 */
export function formatPackageHistoryPackageLabel(planName: string): string {
  const name = planName.trim()
  return name || BOOKING_HUB_EMPTY_CELL
}

/**
 * Middle-ellipsis transaction / reference id: `abcdef…uvwxyz`.
 * Keeps short ids intact; full value remains available via `title` in the UI.
 */
export function formatPackageHistoryTransactionId(
  value: string | null | undefined,
  head = 8,
  tail = 6,
): string {
  const id = String(value ?? '').trim()
  if (!id) return BOOKING_HUB_EMPTY_CELL
  if (id.length <= head + tail + 3) return id
  return `${id.slice(0, head)}...${id.slice(-tail)}`
}

/** Map VoiceAI catalog row → Starter | Pro | Elite via packageCode, then name/plan. */
export function resolveVoiceAiPlanId(
  pkg: Pick<SubscriptionPackage, 'packageCode' | 'name' | 'plan'>,
): PaidServicePlanId | null {
  const code = pkg.packageCode.trim().toLowerCase()
  const byCode = (Object.values(VoiceAiPackageCode) as string[]).find(
    (value) => value === code,
  ) as VoiceAiPackageCode | undefined
  if (byCode) return VOICE_AI_PACKAGE_CODE_TO_PLAN[byCode]
  return normalizeVoicePlanTier(pkg.name || pkg.plan)
}

export function indexVoiceAiPackagesByPlan(
  packages: SubscriptionPackage[],
): Partial<Record<PaidServicePlanId, SubscriptionPackage>> {
  const map: Partial<Record<PaidServicePlanId, SubscriptionPackage>> = {}
  for (const pkg of packages) {
    const planId = resolveVoiceAiPlanId(pkg)
    if (!planId || map[planId]) continue
    map[planId] = pkg
  }
  return map
}

export const PACKAGE_HISTORY_PAGE_SIZE = 10

/** Em dash for missing term (e.g. credit top-up with `periodInMonths: 0`). */
export const PACKAGE_HISTORY_EMPTY_TERM = '—' as const

/**
 * Term column label. `periodInMonths <= 0` (credit packs) → em dash.
 * Positive months → localized “N month(s)”.
 */
export function formatPackageHistoryTerm(
  periodInMonths: number,
  t: (key: string, params?: Record<string, string | number>) => string,
  plansTk: string,
): string {
  const months = Math.trunc(Number(periodInMonths))
  if (!Number.isFinite(months) || months <= 0) return PACKAGE_HISTORY_EMPTY_TERM
  if (months === 1) return t(`${plansTk}.packageHistoryTermMonths`, { count: months })
  return t(`${plansTk}.packageHistoryTermMonthsPlural`, { count: months })
}

/** True when the row is a recurring subscription term (hide for one-off credit packs). */
export function isPackageHistorySubscriptionTerm(periodInMonths: number): boolean {
  const months = Math.trunc(Number(periodInMonths))
  return Number.isFinite(months) && months > 0
}

/** Selection passed into checkout after Choose Starter/Pro/Elite. */
export type VoiceAiCheckoutSelection = {
  planId: PaidServicePlanId
  packageId: string
  packageCode: string
  name: string
  price: number
}

/** CSS modifier for Package History status badge. */
export const PACKAGE_HISTORY_STATUS_CLASS: Record<PackageHistoryUiStatus, string> = {
  [PackageHistoryUiStatus.Active]: 'is-active',
  [PackageHistoryUiStatus.Expired]: 'is-expired',
  [PackageHistoryUiStatus.Pending]: 'is-pending',
  [PackageHistoryUiStatus.Failed]: 'is-failed',
}

/** i18n key under BookingHubView.plans for status label. */
export const PACKAGE_HISTORY_STATUS_LABEL_KEY: Record<PackageHistoryUiStatus, string> = {
  [PackageHistoryUiStatus.Active]: 'packageHistoryStatusActive',
  [PackageHistoryUiStatus.Expired]: 'packageHistoryStatusExpired',
  [PackageHistoryUiStatus.Pending]: 'packageHistoryStatusPending',
  [PackageHistoryUiStatus.Failed]: 'packageHistoryStatusFailed',
}

/** Display datetime preference: paidAt when present, else createdAt. */
export function resolvePackageHistoryDisplayAt(item: {
  paidAt: string | null
  createdAt: string
}): string {
  return item.paidAt || item.createdAt
}

/** Fallback feature list when VoiceAI catalog omits featuresEn/Vi. */
export type PlanFallbackFeature =
  | { kind: 'feature'; key: string; included: boolean }
  | { kind: 'aio'; key: string }

export const PLAN_FALLBACK_FEATURES: Record<PaidServicePlanId, PlanFallbackFeature[]> = {
  [VoicePlanTier.Starter]: [
    { kind: 'feature', key: 'featVoice247', included: true },
    { kind: 'feature', key: 'featMissedCallSms', included: true },
    { kind: 'feature', key: 'featStarterUsage', included: true },
    { kind: 'feature', key: 'dashboardInPro', included: false },
    { kind: 'feature', key: 'googleReviewInPro', included: false },
  ],
  [VoicePlanTier.Pro]: [
    { kind: 'feature', key: 'featVoiceSmsCampaigns', included: true },
    { kind: 'feature', key: 'featOwnerDashboard', included: true },
    { kind: 'feature', key: 'featAutoGoogleReview', included: true },
    { kind: 'feature', key: 'landingPagesAiDesign', included: true },
    { kind: 'feature', key: 'featProUsage', included: true },
    { kind: 'aio', key: 'aioEngine' },
  ],
  [VoicePlanTier.Elite]: [
    { kind: 'feature', key: 'everythingInPro', included: true },
    { kind: 'aio', key: 'aioMax' },
    { kind: 'feature', key: 'featStaffDashboardTaxIq', included: true },
    { kind: 'feature', key: 'eliteUsage', included: true },
    { kind: 'feature', key: 'emailMarketingWinback', included: true },
  ],
}
