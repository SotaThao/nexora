import { useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from '../../../../contexts/LanguageContext'
import { useNotification } from '../../../../contexts/NotificationContext'
import { buildDashboardMenuPath, DASHBOARD_MENU_ID } from '../../constants'
import { BOOKING_HUB_PLANS_TK } from './constants'
import {
  TipPlatformCheckoutResult,
  useTipPlatformCheckout,
} from './useTipPlatformCheckout'

const DASHBOARD_SUPPORT_PATH = buildDashboardMenuPath(DASHBOARD_MENU_ID.support)

type UseTipPlatformCheckoutFlowArgs = Parameters<typeof useTipPlatformCheckout>[0] & {
  /** Toast when deep-link / checkout plan is missing from catalog. Default true. */
  notifyOnMissingPackage?: boolean
}

/** Checkout state + missing-package guard + support redirect — shared by Subscriptions surfaces. */
export function useTipPlatformCheckoutFlow({
  notifyOnMissingPackage = true,
  ...checkoutArgs
}: UseTipPlatformCheckoutFlowArgs) {
  const { t } = useTranslation()
  const { showToast } = useNotification()
  const navigate = useNavigate()

  const {
    isCheckoutPackageMissing,
    clearCheckout,
    trySelectPlan,
    ...checkout
  } = useTipPlatformCheckout(checkoutArgs)

  useEffect(() => {
    if (!isCheckoutPackageMissing) return
    if (notifyOnMissingPackage) {
      showToast(t(`${BOOKING_HUB_PLANS_TK}.planPackageUnavailable`), 'error')
    }
    clearCheckout()
  }, [isCheckoutPackageMissing, clearCheckout, notifyOnMissingPackage, showToast, t])

  const handleSelectPlan = useCallback(
    (planId: string) => {
      const result = trySelectPlan(planId)
      if (result === TipPlatformCheckoutResult.ContactSupport) {
        navigate(DASHBOARD_SUPPORT_PATH)
      }
    },
    [trySelectPlan, navigate],
  )

  return {
    ...checkout,
    clearCheckout,
    trySelectPlan,
    handleSelectPlan,
  }
}
