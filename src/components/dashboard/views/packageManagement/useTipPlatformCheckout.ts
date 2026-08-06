import { useCallback, useEffect, useMemo, useState } from 'react'
import type { SetURLSearchParams } from 'react-router-dom'
import { SubscriptionPackageType } from '../../../../data/repositories/subscriptionPayments'
import type { PurchasableSubscriptionPlan } from '../../../../data/repositories/subscriptionPayments'
import { useSubscriptionPackages } from '../../../../data/hooks/useSubscriptionPayments'
import { buildSubscriptionBillingDefaultsFromProfile } from '../../../../utils/subscriptionBillingDefaults'
import {
  getTipPlatformSubscription,
  resolveTipPlatformPlanId,
} from '../../../../utils/subscriptionDisplay'
import { PACKAGE_QUERY_PARAM } from './constants'
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

  const {
    data: packages = [],
    isLoading: isPackagesLoading,
    isFetched: isPackagesFetched,
  } = useSubscriptionPackages({
    enabled: packagesEnabled || paymentPlan != null,
    packageType: SubscriptionPackageType.TipPlatform,
  })

  const billingDefaults = useMemo(
    () => buildSubscriptionBillingDefaultsFromProfile(profile),
    [profile],
  )

  const selectedPackage = paymentPlan
    ? findTipPlatformPackage(packages, paymentPlan)
    : undefined

  const clearCheckout = useCallback(() => {
    setPaymentPlan(null)
    const next = stripPlanQueryParam(searchParams)
    if (next) setSearchParams(next, { replace: true })
  }, [searchParams, setSearchParams])

  useEffect(() => {
    if (!deepLinkEnabled) {
      setPaymentPlan(null)
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
    setPaymentPlan(deepLinkPlan)
  }, [deepLinkEnabled, searchParams, currentTipPlanId, setSearchParams])

  const trySelectPlan = useCallback(
    (planId: string): TipPlatformCheckoutResultValue => {
      if (!canOpenTipPlatformCheckout(planId, currentTipPlanId)) {
        return TipPlatformCheckoutResult.Blocked
      }
      const purchasablePlan = planIdToPurchasablePlan(planId)
      if (!purchasablePlan) return TipPlatformCheckoutResult.ContactSupport
      setPaymentPlan(purchasablePlan)
      return TipPlatformCheckoutResult.Opened
    },
    [currentTipPlanId],
  )

  return {
    tipPlatformSubscription,
    currentTipPlanId,
    comparePlanId,
    packages,
    billingDefaults,
    paymentPlan,
    selectedPackage,
    paymentPlanPrice: selectedPackage?.price ?? 0,
    clearCheckout,
    trySelectPlan,
    /** True when checkout was requested but catalog row is missing after fetch. */
    isCheckoutPackageMissing:
      Boolean(paymentPlan)
      && isPackagesFetched
      && !isPackagesLoading
      && !selectedPackage,
  }
}
