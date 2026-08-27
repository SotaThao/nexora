import type { SubscriptionMyPackage, SubscriptionPackage } from '../data/repositories/subscriptionPayments'
import { periodInMonthsFromBillingCycle } from './subscriptionDisplay'

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function daysBetween(later: Date, earlier: Date): number {
  const MS_PER_DAY = 24 * 60 * 60 * 1000
  return Math.round((later.getTime() - earlier.getTime()) / MS_PER_DAY)
}

/**
 * Estimated unused-value credit for an upgrade/cycle-switch move, mirroring the backend
 * formula (`SubscriptionActivationService.EnsurePurchasableAndCalculateCredit`):
 * `oldCyclePrice × remainingDays / totalDaysInCycle`, where `remainingDays` excludes today
 * (the day of the move counts as already used) and `totalDaysInCycle` is derived from the
 * current subscription's `expiresAt` and `periodInMonths` (no `currentPeriodStart` field).
 *
 * This is a client-side ESTIMATE only — no preview API exists. The actual `creditApplied`
 * from the purchase response is the source of truth and may differ by a small rounding
 * amount (day-boundary timing between when this estimate renders and when the purchase
 * actually completes).
 */
export function estimateUpgradeCredit(params: {
  /** False for Trialing/anything else — a trial hasn't been paid for, so there's nothing to credit. */
  isCurrentActive: boolean
  currentExpiresAt: string | null | undefined
  currentPeriodInMonths: number | null | undefined
  /** Catalog price/yearlyPrice for the CURRENT package, matching `currentPeriodInMonths`. */
  currentCyclePrice: number | null | undefined
}): number {
  if (!params.isCurrentActive) return 0
  if (!params.currentExpiresAt || !params.currentPeriodInMonths || !params.currentCyclePrice) {
    return 0
  }

  const end = startOfDay(new Date(params.currentExpiresAt))
  if (Number.isNaN(end.getTime())) return 0
  const today = startOfDay(new Date())
  const remainingDays = Math.max(0, daysBetween(end, today) - 1)

  const cycleStart = new Date(end)
  cycleStart.setMonth(cycleStart.getMonth() - params.currentPeriodInMonths)
  const totalDaysInCycle = daysBetween(end, startOfDay(cycleStart))
  if (totalDaysInCycle <= 0) return 0

  return (params.currentCyclePrice * remainingDays) / totalDaysInCycle
}

/**
 * Resolves the catalog price for the current package's billing cycle
 * (Monthly → `price`, Yearly → `yearlyPrice`), matched by `packageCode`.
 */
export function resolveCurrentCyclePrice(
  currentPackageCode: string | null | undefined,
  currentPeriodInMonths: number | null | undefined,
  catalog: SubscriptionPackage[] | undefined,
): number | null {
  if (!currentPackageCode) return null
  const catalogEntry = catalog?.find(
    (pkg) => pkg.packageCode.toLowerCase() === currentPackageCode.toLowerCase(),
  )
  if (!catalogEntry) return null
  const isYearly = (currentPeriodInMonths ?? 1) >= periodInMonthsFromBillingCycle('yearly')
  return (isYearly ? catalogEntry.yearlyPrice : catalogEntry.price) ?? null
}
