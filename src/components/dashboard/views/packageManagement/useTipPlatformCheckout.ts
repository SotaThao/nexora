import { useCallback, useEffect, useMemo, useState } from 'react'
import type { SetURLSearchParams } from 'react-router-dom'
import {
  SubscriptionBillingCycle,
  SubscriptionPackageType,
} from '../../../../data/repositories/subscriptionPayments'
import type {
  PurchasableSubscriptionPlan,
  SubscriptionPackage,
} from '../../../../data/repositories/subscriptionPayments'
import { useSubscriptionPackages } from '../../../../data/hooks/useSubscriptionPayments'
import {
  getTipPlatformSubscription,
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

    const planId = purchasablePlanToPlanId(deepLinkPlan)
    if (!canOpenTipPlatformCheckout(planId, currentTipPlanId)) {
      const next = stripPlanQueryParam(searchParams)
      if (next) setSearchParams(next, { replace: true })
      return
    }
    openCheckout(deepLinkPlan)
  }, [deepLinkEnabled, searchParams, currentTipPlanId, setSearchParams, openCheckout])

  const trySelectPlan = useCallback(
    (
      planId: string,
      billingCycle: SubscriptionBillingCycle = SubscriptionBillingCycle.Monthly,
    ): TipPlatformCheckoutResultValue => {
      if (!canOpenTipPlatformCheckout(planId, currentTipPlanId)) {
        return TipPlatformCheckoutResult.Blocked
      }
      const purchasablePlan = planIdToPurchasablePlan(planId)
      if (!purchasablePlan) return TipPlatformCheckoutResult.ContactSupport
      openCheckout(purchasablePlan, billingCycle)
      return TipPlatformCheckoutResult.Opened
    },
    [currentTipPlanId, openCheckout],
  )

  const isYearlyCheckout = checkoutBillingCycle === SubscriptionBillingCycle.Yearly

  return {
    tipPlatformSubscription,
    currentTipPlanId,
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
