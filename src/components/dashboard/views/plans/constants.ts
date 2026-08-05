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

/** Sub-views under AI Hub → Plans. */
export enum PlansView {
  Package = 'package',
  Credits = 'credits',
  History = 'history',
}

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
  const usd = method.balance * (method.rate || 1)
  if (!Number.isFinite(usd)) return BOOKING_HUB_EMPTY_CELL
  return formatCurrency(usd)
}

/**
 * Package History display name.
 * `brand` comes from i18n (`packageHistoryPackageBrand`) so EN/VI stay in one place.
 */
export function formatPackageHistoryPackageLabel(
  planName: string,
  brand: string,
): string {
  const name = planName.trim()
  const brandLabel = brand.trim()
  if (!name) return BOOKING_HUB_EMPTY_CELL
  if (!brandLabel) return name
  if (name.toLowerCase().startsWith(brandLabel.toLowerCase())) return name
  return `${brandLabel} ${name}`
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
