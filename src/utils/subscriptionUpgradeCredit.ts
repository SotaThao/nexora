import type { SubscriptionPackage } from '../data/repositories/subscriptionPayments'
import { parseApiUtcDateTime } from './localDate'
import { periodInMonthsFromBillingCycle } from './subscriptionDisplay'

const MS_PER_DAY = 24 * 60 * 60 * 1000

/**
 * Estimated unused-value credit for an upgrade/cycle-switch move, mirroring the backend
 * formula (`SubscriptionActivationService.EnsurePurchasableAndCalculateCredit`):
 * `oldCyclePrice × remainingDays / totalDaysInCycle`, where a "day" is a full 24-hour block
 * from the exact current moment (not the calendar date), and `totalDaysInCycle` is derived
 * from the current subscription's `expiresAt` and `periodInMonths` (no `currentPeriodStart`
 * field).
 *
 * This is a client-side ESTIMATE only — no preview API exists. The actual `creditApplied`
 * from the purchase response is the source of truth and may differ by a small amount if
 * time passes between when this estimate renders and when the purchase actually completes.
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

  const end = parseApiUtcDateTime(params.currentExpiresAt)
  if (!end) return 0
  const remainingDays = Math.floor(Math.max(0, (end.getTime() - Date.now()) / MS_PER_DAY))

  const cycleStart = new Date(end)
  cycleStart.setUTCMonth(cycleStart.getUTCMonth() - params.currentPeriodInMonths)
  const totalDaysInCycle = (end.getTime() - cycleStart.getTime()) / MS_PER_DAY
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
