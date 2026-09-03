import { useCallback, useEffect, useMemo, useState } from 'react'
import type { SetURLSearchParams } from 'react-router-dom'
import {
  SubscriptionBillingCycle,
  SubscriptionMyPackageStatus,
  SubscriptionMyPackageType,
  SubscriptionPackageType,
} from '../../../../data/repositories/subscriptionPayments'
import type {
  PurchasableSubscriptionPlan,
  SubscriptionPackage,
} from '../../../../data/repositories/subscriptionPayments'
import {
  useSubscriptionMyPackages,
  useSubscriptionPackages,
} from '../../../../data/hooks/useSubscriptionPayments'
import {
  getTipPlatformSubscription,
  periodInMonthsFromBillingCycle,
  resolveTipPlatformPlanId,
} from '../../../../utils/subscriptionDisplay'
import { PACKAGE_MANAGEMENT_TAB_QUERY, PACKAGE_QUERY_PARAM } from './constants'
import {
  canOpenTipPlatformCheckout,
  findTipPlatformPackage,
  planIdToPurchasablePlan,
  purchasablePlanToPlanId,
  stripPlanQueryParam,
  toComparePlanId,
} from './tipPlatformCheckout'

export const TipPlatformCheckoutResult = {
  Opened: 'opened',
  Blocked: 'blocked',
  ContactSupport: 'contact_support',
} as const

export type TipPlatformCheckoutResultValue =
  (typeof TipPlatformCheckoutResult)[keyof typeof TipPlatformCheckoutResult]

type UseTipPlatformCheckoutArgs = {
  profile: LooseObject | null | undefined
  searchParams: URLSearchParams
  setSearchParams: SetURLSearchParams
  /** When false, skips TipPlatform packages query (e.g. other Package Management tabs). */
  packagesEnabled?: boolean
  /** When false, ignores `?plan=` deep-link open. */
  deepLinkEnabled?: boolean
}

/**
 * Shared TipPlatform catalog + checkout modal state for Package Management / Subscriptions.
 * One query owner; callers only decide when packages/deep-link are enabled.
 */
export function useTipPlatformCheckout({
  profile,
  searchParams,
  setSearchParams,
  packagesEnabled = true,
  deepLinkEnabled = true,
}: UseTipPlatformCheckoutArgs) {
  const tipPlatformSubscription = useMemo(
    () => getTipPlatformSubscription(profile),
    [profile],
  )
  const currentTipPlanId = useMemo(
    () => resolveTipPlatformPlanId(tipPlatformSubscription),
    [tipPlatformSubscription],
  )
  const comparePlanId = toComparePlanId(currentTipPlanId)

  // `/userprofile/me`'s SubscriptionDto has no `periodInMonths` — my-packages does, so the
  // upgrade-ordering gate (cycle-first-then-tier) reads the current billing cycle from there.
  const { data: myPackages = [] } = useSubscriptionMyPackages({
    enabled: Boolean(currentTipPlanId),
  })
  const currentPeriodInMonths = useMemo(() => {
    if (!currentTipPlanId) return null
    const row = myPackages.find(
      (pkg) =>
        pkg.packageType === SubscriptionMyPackageType.TipPlatform
        && (pkg.status === SubscriptionMyPackageStatus.Active
          || pkg.status === SubscriptionMyPackageStatus.Trialing),
    )
    return row?.periodInMonths ?? null
  }, [myPackages, currentTipPlanId])

  const [paymentPlan, setPaymentPlan] = useState<PurchasableSubscriptionPlan | null>(null)
  /** Snapshot at open — keeps the payment modal mounted if the catalog briefly refetches empty. */
  const [checkoutPackage, setCheckoutPackage] = useState<SubscriptionPackage | null>(null)
  const [checkoutBillingCycle, setCheckoutBillingCycle] = useState<SubscriptionBillingCycle>(
    SubscriptionBillingCycle.Monthly,
  )

  const {
    data: packages = [],
    isLoading: isPackagesLoading,
    isFetching: isPackagesFetching,
    isFetched: isPackagesFetched,
  } = useSubscriptionPackages({
    enabled: packagesEnabled || paymentPlan != null,
    packageType: SubscriptionPackageType.TipPlatform,
    ...PACKAGE_MANAGEMENT_TAB_QUERY,
  })

  const selectedPackage = checkoutPackage
    ?? (paymentPlan ? findTipPlatformPackage(packages, paymentPlan) : undefined)

  const clearCheckout = useCallback(() => {
    setPaymentPlan(null)
    setCheckoutPackage(null)
    setCheckoutBillingCycle(SubscriptionBillingCycle.Monthly)
    const next = stripPlanQueryParam(searchParams)
    if (next) setSearchParams(next, { replace: true })
  }, [searchParams, setSearchParams])

  const openCheckout = useCallback(
    (plan: PurchasableSubscriptionPlan, billingCycle: SubscriptionBillingCycle = SubscriptionBillingCycle.Monthly) => {
      const pkg = findTipPlatformPackage(packages, plan)
      setCheckoutPackage(pkg ?? null)
      setPaymentPlan(plan)
      setCheckoutBillingCycle(billingCycle)
    },
    [packages],
  )

  useEffect(() => {
    if (!deepLinkEnabled) {
      setPaymentPlan(null)
      setCheckoutPackage(null)
      return
    }
    const deepLinkPlan = planIdToPurchasablePlan(
      searchParams.get(PACKAGE_QUERY_PARAM.plan) ?? '',
    )
    if (!deepLinkPlan) return

    // Deep link never carries a billing cycle today — defaults to Monthly, same as openCheckout's default.
    const planId = purchasablePlanToPlanId(deepLinkPlan)
    if (!canOpenTipPlatformCheckout(planId, 1, currentTipPlanId, currentPeriodInMonths)) {
      const next = stripPlanQueryParam(searchParams)
      if (next) setSearchParams(next, { replace: true })
      return
    }
    openCheckout(deepLinkPlan)
  }, [
    deepLinkEnabled,
    searchParams,
    currentTipPlanId,
    currentPeriodInMonths,
    setSearchParams,
    openCheckout,
  ])

  const trySelectPlan = useCallback(
    (
      planId: string,
      billingCycle: SubscriptionBillingCycle = SubscriptionBillingCycle.Monthly,
    ): TipPlatformCheckoutResultValue => {
      const targetPeriodInMonths = periodInMonthsFromBillingCycle(billingCycle)
      if (
        !canOpenTipPlatformCheckout(planId, targetPeriodInMonths, currentTipPlanId, currentPeriodInMonths)
      ) {
        return TipPlatformCheckoutResult.Blocked
      }
      const purchasablePlan = planIdToPurchasablePlan(planId)
      if (!purchasablePlan) return TipPlatformCheckoutResult.ContactSupport
      openCheckout(purchasablePlan, billingCycle)
      return TipPlatformCheckoutResult.Opened
    },
    [currentTipPlanId, currentPeriodInMonths, openCheckout],
  )

  const isYearlyCheckout = checkoutBillingCycle === SubscriptionBillingCycle.Yearly

  return {
    tipPlatformSubscription,
    currentTipPlanId,
    currentPeriodInMonths,
    comparePlanId,
    packages,
    paymentPlan,
    selectedPackage,
    checkoutBillingCycle,
    paymentPlanPrice:
      (isYearlyCheckout ? selectedPackage?.yearlyPrice : selectedPackage?.price) ?? 0,
    clearCheckout,
    trySelectPlan,
    /** True when checkout was requested but catalog row is missing after a settled fetch. */
    isCheckoutPackageMissing:
      Boolean(paymentPlan)
      && isPackagesFetched
      && !isPackagesLoading
      && !isPackagesFetching
      && !selectedPackage,
  }
}
