/**
 * Shared TipPlatform checkout helpers — used by Package Management + Subscriptions route.
 */
import type {
  PurchasableSubscriptionPlan,
  SubscriptionPackage,
} from '../../../../data/repositories/subscriptionPayments'
import { isTipPlatformUpgradeMove } from '../../../../utils/subscriptionDisplay'
import {
  PACKAGE_QUERY_PARAM,
  TIP_PLATFORM_COMPARE_PLAN_IDS,
  TipPlatformUiPlanId,
  type TipPlatformComparePlanId,
  type TipPlatformUiPlanIdValue,
} from './constants'

const PURCHASABLE_BY_UI_PLAN: Partial<
  Record<TipPlatformUiPlanIdValue, PurchasableSubscriptionPlan>
> = {
  [TipPlatformUiPlanId.Starter]: 'Starter',
  [TipPlatformUiPlanId.Pro]: 'Pro',
}

const UI_PLAN_BY_PURCHASABLE: Record<PurchasableSubscriptionPlan, TipPlatformUiPlanIdValue> = {
  Starter: TipPlatformUiPlanId.Starter,
  Pro: TipPlatformUiPlanId.Pro,
}

const COMPARE_PLAN_ID_SET = new Set<string>(TIP_PLATFORM_COMPARE_PLAN_IDS)

export function planIdToPurchasablePlan(
  planId: string,
): PurchasableSubscriptionPlan | null {
  const normalized = planId.trim().toLowerCase() as TipPlatformUiPlanIdValue
  return PURCHASABLE_BY_UI_PLAN[normalized] ?? null
}

export function purchasablePlanToPlanId(
  plan: PurchasableSubscriptionPlan,
): TipPlatformUiPlanIdValue {
  return UI_PLAN_BY_PURCHASABLE[plan]
}

export function toComparePlanId(
  planId: string | null | undefined,
): TipPlatformComparePlanId | null {
  if (!planId || !COMPARE_PLAN_ID_SET.has(planId)) return null
  return planId as TipPlatformComparePlanId
}

export function findTipPlatformPackage(
  packages: SubscriptionPackage[],
  paymentPlan: PurchasableSubscriptionPlan,
): SubscriptionPackage | undefined {
  const needle = paymentPlan.toLowerCase()
  return packages.find(
    (pkg) =>
      pkg.packageCode.toLowerCase() === needle
      || (pkg.plan ?? '').toLowerCase() === needle,
  )
}

/**
 * False when selecting the exact current plan+cycle, or a move that isn't an upgrade per the
 * backend's cycle-first-then-tier ordering (downgrade in tier on the same cycle, or any move
 * from a longer to a shorter billing cycle).
 */
export function canOpenTipPlatformCheckout(
  planId: string,
  targetPeriodInMonths: number | null | undefined,
  currentTipPlanId: string | null | undefined,
  currentPeriodInMonths: number | null | undefined,
): boolean {
  return isTipPlatformUpgradeMove(
    planId,
    targetPeriodInMonths,
    currentTipPlanId,
    currentPeriodInMonths,
  )
}

export function stripPlanQueryParam(
  searchParams: URLSearchParams,
): URLSearchParams | null {
  if (!searchParams.has(PACKAGE_QUERY_PARAM.plan)) return null
  const next = new URLSearchParams(searchParams)
  next.delete(PACKAGE_QUERY_PARAM.plan)
  return next
}
