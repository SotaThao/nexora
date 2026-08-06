import { useCallback, useEffect, useMemo } from 'react'
import { Boxes, History, LayoutGrid, Sparkles } from 'lucide-react'
import { useNavigate, useOutletContext, useSearchParams } from 'react-router-dom'
import { useTranslation } from '../../../../contexts/LanguageContext'
import { useNotification } from '../../../../contexts/NotificationContext'
import { buildDashboardMenuPath, DASHBOARD_MENU_ID } from '../../constants'
import SubscriptionPaymentModal from '../../modals/SubscriptionPaymentModal'
import PackageHistoryPanel from '../plans/PackageHistoryPanel'
import { PhoneTabIcon } from '../BookingHubIcons'
import PackageAiVoicePlansPanel from './PackageAiVoicePlansPanel'
import PackageOverviewPanel from './PackageOverviewPanel'
import PackageSubscriptionsPanel from './PackageSubscriptionsPanel'
import {
  BOOKING_HUB_PLANS_TK,
  isKnownPackageManagementTab,
  PACKAGE_MANAGEMENT_TAB_I18N_KEY,
  PACKAGE_MANAGEMENT_TAB_ORDER,
  PACKAGE_MANAGEMENT_TK,
  PACKAGE_QUERY_PARAM,
  PackageManagementTab,
  packagePanelDomId,
  packageTabDomId,
  parsePackageManagementTab,
} from './constants'
import { stripPlanQueryParam } from './tipPlatformCheckout'
import { useTipPlatformCheckout, TipPlatformCheckoutResult } from './useTipPlatformCheckout'
import './package-management.css'
import '../booking-hub.css'

const TK = PACKAGE_MANAGEMENT_TK
const DASHBOARD_SUPPORT_PATH = buildDashboardMenuPath(DASHBOARD_MENU_ID.support)

const TAB_ICON = {
  [PackageManagementTab.Overview]: LayoutGrid,
  [PackageManagementTab.Subscriptions]: Sparkles,
  [PackageManagementTab.AiVoice]: PhoneTabIcon,
  [PackageManagementTab.History]: History,
} as const

export default function PackageManagementView() {
  const { t } = useTranslation()
  const { showToast } = useNotification()
  const navigate = useNavigate()
  const ctx = useOutletContext<LooseObject>()
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = parsePackageManagementTab(
    searchParams.get(PACKAGE_QUERY_PARAM.tab),
  )
  const isSubscriptionsTab = activeTab === PackageManagementTab.Subscriptions

  const {
    tipPlatformSubscription,
    comparePlanId,
    packages,
    billingDefaults,
    paymentPlan,
    selectedPackage,
    paymentPlanPrice,
    clearCheckout,
    trySelectPlan,
    isCheckoutPackageMissing,
  } = useTipPlatformCheckout({
    profile: ctx?.profile,
    searchParams,
    setSearchParams,
    packagesEnabled: isSubscriptionsTab,
    deepLinkEnabled: isSubscriptionsTab,
  })

  /** Canonicalize ?tab= (missing / casing / invalid) and strip orphan ?plan=. */
  useEffect(() => {
    const raw = searchParams.get(PACKAGE_QUERY_PARAM.tab)
    const next = new URLSearchParams(searchParams)
    let changed = false

    if (raw == null || raw === '') {
      next.set(PACKAGE_QUERY_PARAM.tab, PackageManagementTab.Overview)
      changed = true
    } else {
      const normalized = raw.trim().toLowerCase()
      if (!isKnownPackageManagementTab(normalized)) {
        next.set(PACKAGE_QUERY_PARAM.tab, PackageManagementTab.Overview)
        next.delete(PACKAGE_QUERY_PARAM.plan)
        changed = true
      } else if (raw !== normalized) {
        next.set(PACKAGE_QUERY_PARAM.tab, normalized)
        changed = true
      }
    }

    const tab = parsePackageManagementTab(next.get(PACKAGE_QUERY_PARAM.tab))
    if (tab !== PackageManagementTab.Subscriptions && next.has(PACKAGE_QUERY_PARAM.plan)) {
      next.delete(PACKAGE_QUERY_PARAM.plan)
      changed = true
    }

    if (changed) setSearchParams(next, { replace: true })
  }, [searchParams, setSearchParams])

  useEffect(() => {
    if (!isCheckoutPackageMissing) return
    showToast(t(`${BOOKING_HUB_PLANS_TK}.planPackageUnavailable`), 'error')
    clearCheckout()
  }, [isCheckoutPackageMissing, showToast, t, clearCheckout])

  const setTab = useCallback(
    (tab: PackageManagementTab) => {
      const next = new URLSearchParams(searchParams)
      next.set(PACKAGE_QUERY_PARAM.tab, tab)
      if (tab !== PackageManagementTab.Subscriptions) {
        const stripped = stripPlanQueryParam(next)
        setSearchParams(stripped ?? next)
        return
      }
      setSearchParams(next)
    },
    [searchParams, setSearchParams],
  )

  const handleSelectPlan = useCallback(
    (planId: string) => {
      const result = trySelectPlan(planId)
      if (result === TipPlatformCheckoutResult.ContactSupport) {
        navigate(DASHBOARD_SUPPORT_PATH)
      }
    },
    [trySelectPlan, navigate],
  )

  const activePanel = useMemo(() => {
    switch (activeTab) {
      case PackageManagementTab.Subscriptions:
        return (
          <PackageSubscriptionsPanel
            currentSubscription={tipPlatformSubscription}
            packages={packages}
            currentPlanId={comparePlanId}
            onSelectPlan={handleSelectPlan}
          />
        )
      case PackageManagementTab.AiVoice:
        return <PackageAiVoicePlansPanel />
      case PackageManagementTab.History:
        return (
          <div className="booking-hub-view package-history-host">
            <PackageHistoryPanel />
          </div>
        )
      case PackageManagementTab.Overview:
      default:
        return <PackageOverviewPanel />
    }
  }, [
    activeTab,
    tipPlatformSubscription,
    packages,
    comparePlanId,
    handleSelectPlan,
  ])

  return (
    <div className="package-management-view">
      <header className="package-heading">
        <div className="package-heading-row">
          <span className="package-heading-icon" aria-hidden="true">
            <Boxes />
          </span>
          <div>
            <h1 className="page-title">{t(`${TK}.title`)}</h1>
            <p className="page-description">{t(`${TK}.description`)}</p>
          </div>
        </div>
      </header>

      <div
        className="package-tabs"
        role="tablist"
        aria-label={t(`${TK}.ariaTabs`)}
      >
        {PACKAGE_MANAGEMENT_TAB_ORDER.map((tab) => {
          const Icon = TAB_ICON[tab]
          const isActive = activeTab === tab
          return (
            <button
              key={tab}
              id={packageTabDomId(tab)}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls={packagePanelDomId(tab)}
              tabIndex={isActive ? 0 : -1}
              className={`package-tab${isActive ? ' is-active' : ''}`}
              onClick={() => setTab(tab)}
            >
              <span className="package-tab-icon">
                <Icon />
              </span>
              {t(`${TK}.${PACKAGE_MANAGEMENT_TAB_I18N_KEY[tab]}`)}
            </button>
          )
        })}
      </div>

      <div
        id={packagePanelDomId(activeTab)}
        className="package-panel"
        role="tabpanel"
        aria-labelledby={packageTabDomId(activeTab)}
      >
        {activePanel}
      </div>

      {paymentPlan && selectedPackage ? (
        <SubscriptionPaymentModal
          isOpen
          plan={paymentPlan}
          packageId={selectedPackage.id}
          price={paymentPlanPrice}
          billingDefaults={billingDefaults}
          onClose={clearCheckout}
          onSuccess={clearCheckout}
        />
      ) : null}
    </div>
  )
}
