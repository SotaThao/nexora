import React, { useEffect, useMemo, useState } from 'react'
import {
  History,
  Lock,
  ShoppingBag,
  Wallet,
} from 'lucide-react'
import { useTranslation } from '../../../contexts/LanguageContext'
import { getErrorI18nKey } from '../../../data/errorCodes'
import { refetchVoiceTenantUntilReady } from '../../../data/hooks/useMerchantVoiceBookings'
import { useMyVoiceTrialRequest } from '../../../data/hooks/useMyVoiceTrialRequest'
import { VoicePlanTier } from '../../../data/repositories/merchantVoice'
import {
  SubscriptionBillingCycle,
  SubscriptionMyPackageStatus,
  SubscriptionMyPackageType,
  SubscriptionPackageType,
  type SubscriptionPackage,
  type SubscriptionPaymentMethod,
} from '../../../data/repositories/subscriptionPayments'
import { PACKAGE_MANAGEMENT_TAB_QUERY } from './packageManagement/constants'
import {
  invalidateVoiceAiPlanPurchaseQueries,
  useSubscriptionMyPackages,
  useSubscriptionPackages,
} from '../../../data/hooks/useSubscriptionPayments'
import { useProfileSettings } from '../../../data/hooks/useProfileSettings'
import { qk } from '../../../data/queryKeys'
import { getApiErrorCode } from '../../../types/domain'
import { useQueryClient } from '@tanstack/react-query'
import { BOOKING_HUB_EMPTY_CELL } from './bookingHubFormatters'
import { BookingBuyPackageSkeleton } from './BookingHubSkeletons'
import { useBookingHubVoiceEnabled } from './BookingHubVoiceContext'
import CreditsUsagePanel from './CreditsUsagePanel'
import BookingTrialModal from './BookingTrialModal'
import PlanPaymentModal from './plans/PlanPaymentModal'
import PackageHistoryPanel from './plans/PackageHistoryPanel'
import CompleteStoreSetupGateModal from '../modals/CompleteStoreSetupGateModal'
import { useStoreSetupPurchaseGate } from '../../../data/hooks/useStoreSetupPurchaseGate'
import {
  PAID_SERVICE_PLAN_ORDER,
  PAID_SERVICE_PLAN_TITLE_KEY,
  PLAN_FALLBACK_FEATURES,
  PlansView,
  SHOW_PACKAGE_HISTORY_TAB,
  SERVICE_PLAN_MONTHLY_PRICE,
  VOICE_AI_HUB_UNLOCK_POLL_ATTEMPTS,
  VOICE_AI_HUB_UNLOCK_POLL_INTERVAL_MS,
  formatPlanPrice,
  indexVoiceAiPackagesByPlan,
  isPaidServicePlanId,
  isVoiceAiPlanCurrentCycle,
  isVoiceAiUpgradeMove,
  isVoiceAiYearlyUnavailable,
  resolvePlanBillingPeriodSuffix,
  resolveVoiceAiPeriodInMonths,
  resolveVoiceAiPlanId,
  resolveVoiceAiPlanPrice,
  type PaidServicePlanId,
  type VoiceAiCheckoutSelection,
} from './plans/constants'
import { BOOKING_HUB_PLANS_TK } from './packageManagement/constants'
import { useNotification } from '../../../contexts/NotificationContext'
import {
  getSubscriptionPlanRenewLabel,
  getVoiceAiSubscription,
  isUserSubscriptionActive,
} from '../../../utils/subscriptionDisplay'

const TK = BOOKING_HUB_PLANS_TK

const PLAN_BUTTON_LABEL_KEY: Record<PaidServicePlanId, string> = {
  ...PAID_SERVICE_PLAN_TITLE_KEY,
  [VoicePlanTier.Pro]: 'startTrial',
}

function PlanFeature({ included, children }: { included: boolean; children: React.ReactNode }) {
  return (
    <div className="plan-feature">
      <span className={`plan-check ${included ? '' : 'muted'}`}>
        {included ? '✓' : BOOKING_HUB_EMPTY_CELL}
      </span>
      <span>{children}</span>
    </div>
  )
}

/**
 * Feature bullets for the plan card. On Yearly, prefers the package's dedicated yearly copy
 * (usage numbers already multiplied by 12 server-side) and falls back to the monthly bullets
 * when the package has none yet (e.g. TipPlatform, whose bullets don't change with billing cycle).
 */
function resolvePackageFeatures(
  pkg: SubscriptionPackage | undefined,
  language: string,
  billingCycle: SubscriptionBillingCycle,
): string[] {
  if (!pkg) return []
  const isVi = language.toLowerCase().startsWith('vi')
  if (billingCycle === SubscriptionBillingCycle.Yearly) {
    const yearlyPrimary = isVi ? pkg.yearlyFeaturesVi : pkg.yearlyFeaturesEn
    const yearlyFallback = isVi ? pkg.yearlyFeaturesEn : pkg.yearlyFeaturesVi
    if (yearlyPrimary.length > 0) return yearlyPrimary
    if (yearlyFallback.length > 0) return yearlyFallback
  }
  const primary = isVi ? pkg.featuresVi : pkg.featuresEn
  const fallback = isVi ? pkg.featuresEn : pkg.featuresVi
  if (primary.length > 0) return primary
  return fallback
}

function FallbackPlanFeatures({
  planId,
  t,
}: {
  planId: PaidServicePlanId
  t: (key: string) => string
}) {
  return (
    <>
      {PLAN_FALLBACK_FEATURES[planId].map((item) =>
        item.kind === 'aio' ? (
          <div className="plan-aio" key={item.key}>
            {t(`${TK}.${item.key}`)}
          </div>
        ) : (
          <PlanFeature key={item.key} included={item.included}>
            {t(`${TK}.${item.key}`)}
          </PlanFeature>
        ),
      )}
    </>
  )
}

export default function BookingPlansPanel({ buyOnlyMode = false }: { buyOnlyMode?: boolean } = {}) {
  const { t, currentLanguage } = useTranslation()
  const { showToast } = useNotification()
  const queryClient = useQueryClient()
  const voiceEnabled = useBookingHubVoiceEnabled()
  const { data: myTrialRequest, isLoading: isTrialRequestLoading } = useMyVoiceTrialRequest()
  const { data: profile } = useProfileSettings()
  const [trialOpen, setTrialOpen] = useState(false)
  const [checkoutSelection, setCheckoutSelection] = useState<VoiceAiCheckoutSelection | null>(null)
  const [plansView, setPlansView] = useState<PlansView>(PlansView.Package)
  const [billingCycle, setBillingCycle] = useState<SubscriptionBillingCycle>(
    SubscriptionBillingCycle.Monthly,
  )
  const isYearlyBilling = billingCycle === SubscriptionBillingCycle.Yearly
  const effectivePlansView = buyOnlyMode ? PlansView.Package : plansView
  const {
    requireSetup,
    gateOpen: storeSetupGateOpen,
    closeGate: closeStoreSetupGate,
  } = useStoreSetupPurchaseGate()

  const {
    data: voicePackages = [],
    isLoading: isPackagesLoading,
    isFetching: isPackagesFetching,
    isError: isPackagesError,
    error: packagesError,
    refetch: refetchPackages,
  } = useSubscriptionPackages({
    enabled: buyOnlyMode || plansView === PlansView.Package,
    packageType: SubscriptionPackageType.VoiceAI,
    ...(buyOnlyMode
      ? PACKAGE_MANAGEMENT_TAB_QUERY
      : {
          staleTime: 0,
          refetchOnMount: 'always' as const,
        }),
  })

  const packagesByPlan = useMemo(
    () => indexVoiceAiPackagesByPlan(voicePackages),
    [voicePackages],
  )

  const yearlyDiscountBadge = useMemo(() => {
    const percents = voicePackages
      .filter((p) => p.yearlyPrice != null)
      .map((p) => Math.round(p.yearlyDiscountPercent ?? 0))
    if (percents.length === 0) return null
    const max = Math.max(...percents)
    if (max <= 0) return null
    const allEqual = percents.every((pct) => pct === percents[0])
    return { percent: max, isUpTo: !allEqual }
  }, [voicePackages])

  const voiceAiSubscription = useMemo(() => getVoiceAiSubscription(profile), [profile])
  const currentVoicePlanId = useMemo(() => {
    if (!voiceAiSubscription || !isUserSubscriptionActive(voiceAiSubscription)) return null
    return resolveVoiceAiPlanId({
      packageCode: voiceAiSubscription.packageCode ?? '',
      name: voiceAiSubscription.name,
      plan: voiceAiSubscription.name,
    })
  }, [voiceAiSubscription])

  const { data: myVoicePackages = [] } = useSubscriptionMyPackages({
    enabled: Boolean(currentVoicePlanId),
  })
  const currentVoicePeriodInMonths = useMemo(() => {
    if (!currentVoicePlanId) return null
    const row = myVoicePackages.find(
      (pkg) =>
        pkg.packageType === SubscriptionMyPackageType.VoiceAI
        && (pkg.status === SubscriptionMyPackageStatus.Active
          || pkg.status === SubscriptionMyPackageStatus.Trialing),
    )
    return row?.periodInMonths ?? null
  }, [myVoicePackages, currentVoicePlanId])
  const voiceRenewLabel = useMemo(
    () => getSubscriptionPlanRenewLabel(voiceAiSubscription, t, currentLanguage),
    [voiceAiSubscription, t, currentLanguage],
  )

  const hasExistingTrialRequest = myTrialRequest != null
  // Hide Credit Usage when AI Hub only has Plans (no voice tenant).
  const showCreditUsageTab = voiceEnabled
  const showPackageHistoryTab = SHOW_PACKAGE_HISTORY_TAB
  const showPackageSkeleton =
    (isPackagesLoading || isPackagesFetching) && voicePackages.length === 0
  const hasMappedPackages = Object.keys(packagesByPlan).length > 0

  useEffect(() => {
    if (buyOnlyMode) return
    if (!showCreditUsageTab && plansView === PlansView.Credits) {
      setPlansView(PlansView.Package)
      return
    }
    if (!showPackageHistoryTab && plansView === PlansView.History) {
      setPlansView(PlansView.Package)
    }
  }, [buyOnlyMode, showCreditUsageTab, showPackageHistoryTab, plansView])

  // Leaving Buy Package marks catalog stale/invalid so the next visit always re-calls
  // GET .../packages?packageType=VoiceAI.
  useEffect(() => {
    if (buyOnlyMode || plansView === PlansView.Package) return
    void queryClient.invalidateQueries({
      queryKey: qk.merchantSubscriptionPackages(SubscriptionPackageType.VoiceAI),
    })
  }, [buyOnlyMode, plansView, queryClient])

  const getPlanButtonLabel = (plan: PaidServicePlanId) => {
    if (plan === VoicePlanTier.Pro && hasExistingTrialRequest) {
      return t(`${TK}.trialRequestSubmitted`)
    }
    return t(`${TK}.${PLAN_BUTTON_LABEL_KEY[plan]}`)
  }

  const handleTrialClick = () => {
    if (hasExistingTrialRequest || isTrialRequestLoading) return
    setTrialOpen(true)
  }

  const openCheckoutForPlan = (plan: PaidServicePlanId) => {
    if (!isPaidServicePlanId(plan)) return
    if (
      !isVoiceAiUpgradeMove(
        plan,
        resolveVoiceAiPeriodInMonths(billingCycle),
        currentVoicePlanId,
        currentVoicePeriodInMonths,
      )
    ) {
      return
    }
    const pkg = packagesByPlan[plan]
    if (!pkg?.id) {
      showToast(t(`${TK}.planPackageUnavailable`), 'error')
      return
    }
    if (isVoiceAiYearlyUnavailable(pkg, billingCycle)) return
    const { price } = resolveVoiceAiPlanPrice(pkg, billingCycle, SERVICE_PLAN_MONTHLY_PRICE[plan])
    requireSetup(() => {
      setCheckoutSelection({
        planId: plan,
        packageId: pkg.id,
        packageCode: pkg.packageCode,
        name: pkg.name || plan,
        price,
        billingCycle,
        periodInMonths: resolveVoiceAiPeriodInMonths(billingCycle),
      })
    })
  }

  const handleBuyPlanClick = (plan: PaidServicePlanId) => {
    openCheckoutForPlan(plan)
  }

  const handlePlanClick = (plan: PaidServicePlanId) => {
    if (
      !isVoiceAiUpgradeMove(
        plan,
        resolveVoiceAiPeriodInMonths(billingCycle),
        currentVoicePlanId,
        currentVoicePeriodInMonths,
      )
    ) {
      return
    }
    // Match HTML: Starter/Elite open payment; Pro trial is a separate CTA.
    if (plan === VoicePlanTier.Pro) {
      handleTrialClick()
      return
    }
    handleBuyPlanClick(plan)
  }

  const handlePlanPaymentSuccess = (
    selection: VoiceAiCheckoutSelection,
    payment: SubscriptionPaymentMethod,
  ) => {
    const paymentLabel = payment.name || payment.symbol
    const periodSuffix = resolvePlanBillingPeriodSuffix(selection.billingCycle, t, TK)
    setCheckoutSelection(null)
    // Unlock AI Hub tabs (Booking, Customers, …) gated on hasVoiceTenant — no full reload.
    // Panels mount + fetch only when the user opens each tab.
    invalidateVoiceAiPlanPurchaseQueries(queryClient)
    showToast(
      t(`${TK}.planPaymentSuccess`, {
        plan: selection.planId,
        price: selection.price.toFixed(2),
        period: periodSuffix,
        payment: paymentLabel,
      }),
      'success',
    )
    void refetchVoiceTenantUntilReady(queryClient, {
      maxAttempts: VOICE_AI_HUB_UNLOCK_POLL_ATTEMPTS,
      intervalMs: VOICE_AI_HUB_UNLOCK_POLL_INTERVAL_MS,
    })
  }

  const renderPlanFeatures = (planId: PaidServicePlanId, pkg?: SubscriptionPackage) => {
    const features = resolvePackageFeatures(pkg, currentLanguage, billingCycle)
    if (features.length === 0) {
      return <FallbackPlanFeatures planId={planId} t={t} />
    }
    return features.map((feature) => (
      <PlanFeature key={feature} included>
        {feature}
      </PlanFeature>
    ))
  }

  const renderPlanPrice = (planId: PaidServicePlanId, pkg?: SubscriptionPackage) => {
    const { price, originalPrice } = resolveVoiceAiPlanPrice(
      pkg,
      billingCycle,
      SERVICE_PLAN_MONTHLY_PRICE[planId],
    )
    return (
      <>
        <div className="service-plan-price">
          {formatPlanPrice(price)}
          <span>{resolvePlanBillingPeriodSuffix(billingCycle, t, TK)}</span>
        </div>
        {originalPrice != null && originalPrice > price ? (
          <div className="service-plan-cross">{formatPlanPrice(originalPrice)}</div>
        ) : null}
      </>
    )
  }

  const renderCurrentActivePlanCta = () => (
    <div className="plan-action-stack is-current-actions">
      {voiceRenewLabel ? (
        <span className="plan-renew-label">{voiceRenewLabel}</span>
      ) : (
        <span className="plan-renew-label is-spacer" aria-hidden="true" />
      )}
      <button
        className="plan-select-button is-current"
        type="button"
        disabled
      >
        {t(`${TK}.currentActivePlan`)}
      </button>
    </div>
  )

  const renderYearlyUnavailableCta = () => (
    <div className="plan-action-stack">
      <span className="plan-renew-label is-spacer" aria-hidden="true" />
      <button
        className="plan-select-button is-locked"
        type="button"
        disabled
        aria-label={t('manage_plan.yearly_coming_soon')}
      >
        {t('manage_plan.yearly_coming_soon')}
      </button>
    </div>
  )

  const renderLockedPlanCta = () => (
    <div className="plan-action-stack is-locked-actions">
      <span className="plan-renew-label is-spacer" aria-hidden="true" />
      <button
        className="plan-select-button is-locked"
        type="button"
        disabled
        aria-label={t(`${TK}.planLocked`)}
      >
        <Lock aria-hidden="true" className="plan-lock-icon" />
        {t(`${TK}.planLocked`)}
      </button>
    </div>
  )

  return (
    <>
      <div className="plans-panel-shell">
        {!buyOnlyMode ? (
        <div className="booking-view-switch" role="group" aria-label={t(`${TK}.viewMode`)}>
          <button
            className={`booking-view-button${plansView === PlansView.Package ? ' is-active' : ''}`}
            type="button"
            aria-pressed={plansView === PlansView.Package}
            onClick={() => setPlansView(PlansView.Package)}
          >
            <ShoppingBag aria-hidden="true" />
            {t(`${TK}.buyPackage`)}
          </button>
          {showCreditUsageTab ? (
            <button
              className={`booking-view-button${plansView === PlansView.Credits ? ' is-active' : ''}`}
              type="button"
              aria-pressed={plansView === PlansView.Credits}
              onClick={() => setPlansView(PlansView.Credits)}
            >
              <Wallet aria-hidden="true" />
              {t(`${TK}.creditUsage`)}
            </button>
          ) : null}
          {showPackageHistoryTab ? (
            <button
              className={`booking-view-button${plansView === PlansView.History ? ' is-active' : ''}`}
              type="button"
              aria-pressed={plansView === PlansView.History}
              onClick={() => setPlansView(PlansView.History)}
            >
              <History aria-hidden="true" />
              {t(`${TK}.packageHistory`)}
            </button>
          ) : null}
        </div>
        ) : null}

        {effectivePlansView === PlansView.Credits && showCreditUsageTab ? (
          <CreditsUsagePanel />
        ) : effectivePlansView === PlansView.History && showPackageHistoryTab ? (
          <PackageHistoryPanel />
        ) : showPackageSkeleton ? (
          <BookingBuyPackageSkeleton />
        ) : isPackagesError && !hasMappedPackages ? (
          <div className="plans-stack">
            <div className="booking-empty-cell">
              <div>{t(getErrorI18nKey(getApiErrorCode(packagesError)))}</div>
              <button
                className="booking-mini-button"
                type="button"
                onClick={() => void refetchPackages()}
              >
                {t(`${TK}.buyPackageRetry`)}
              </button>
            </div>
          </div>
        ) : !hasMappedPackages ? (
          <div className="plans-stack">
            <div className="booking-empty-cell">{t(`${TK}.buyPackageEmpty`)}</div>
          </div>
        ) : (
          <div className="plans-stack">
            <div className="plans-hero">{t(`${TK}.hero`)}</div>

            <div className="plans-billing-toggle">
              <div
                role="tablist"
                aria-label={t('manage_plan.billing_cycle_label')}
                className="plans-billing-tablist"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={!isYearlyBilling}
                  tabIndex={!isYearlyBilling ? 0 : -1}
                  className={`plans-billing-tab${!isYearlyBilling ? ' is-active' : ''}`}
                  onClick={() => setBillingCycle(SubscriptionBillingCycle.Monthly)}
                >
                  {t('manage_plan.billing_monthly')}
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={isYearlyBilling}
                  tabIndex={isYearlyBilling ? 0 : -1}
                  className={`plans-billing-tab${isYearlyBilling ? ' is-active' : ''}`}
                  onClick={() => setBillingCycle(SubscriptionBillingCycle.Yearly)}
                >
                  {t('manage_plan.billing_yearly')}
                  {yearlyDiscountBadge ? (
                    <span className="plans-billing-discount-badge">
                      {yearlyDiscountBadge.isUpTo
                        ? t('manage_plan.yearly_discount_upto', { percent: yearlyDiscountBadge.percent })
                        : `-${yearlyDiscountBadge.percent}%`}
                    </span>
                  ) : null}
                </button>
              </div>
            </div>

            <div className="plans-grid">
              {PAID_SERVICE_PLAN_ORDER.map((planId) => {
                const pkg = packagesByPlan[planId]
                if (!pkg) return null
                const isPro = planId === VoicePlanTier.Pro
                const targetPeriodInMonths = resolveVoiceAiPeriodInMonths(billingCycle)
                const isCurrent = isVoiceAiPlanCurrentCycle(
                  planId,
                  targetPeriodInMonths,
                  currentVoicePlanId,
                  currentVoicePeriodInMonths,
                )
                const isLocked =
                  !isCurrent
                  && !isVoiceAiUpgradeMove(
                    planId,
                    targetPeriodInMonths,
                    currentVoicePlanId,
                    currentVoicePeriodInMonths,
                  )
                const isYearlyUnavailable = isVoiceAiYearlyUnavailable(pkg, billingCycle)
                return (
                  <article
                    key={pkg.id || planId}
                    className={[
                      'service-plan-card',
                      isPro && !isCurrent && !isLocked ? 'is-recommended' : '',
                      isCurrent ? 'is-current-plan' : '',
                      isLocked ? 'is-locked-plan' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    data-plan-card={planId.toLowerCase()}
                  >
                    <div className="plan-rec" aria-hidden={!isPro && !isCurrent}>
                      {isCurrent
                        ? t(`${TK}.currentActivePlan`)
                        : isPro && !isLocked
                          ? t(`${TK}.recommended`)
                          : null}
                    </div>
                    <div className="service-plan-name">{pkg.name || planId}</div>
                    {renderPlanPrice(planId, pkg)}
                    <div className="plan-features">{renderPlanFeatures(planId, pkg)}</div>
                    {isCurrent ? (
                      renderCurrentActivePlanCta()
                    ) : isLocked ? (
                      renderLockedPlanCta()
                    ) : isYearlyUnavailable ? (
                      renderYearlyUnavailableCta()
                    ) : isPro ? (
                      <div className="plan-action-stack">
                        <span className="plan-renew-label is-spacer" aria-hidden="true" />
                        <button
                          className="plan-select-button is-primary"
                          type="button"
                          disabled={hasExistingTrialRequest || isTrialRequestLoading}
                          onClick={handleTrialClick}
                        >
                          {getPlanButtonLabel(VoicePlanTier.Pro)}
                        </button>
                        <button
                          className="plan-select-button plan-buy-button"
                          type="button"
                          onClick={() => handleBuyPlanClick(VoicePlanTier.Pro)}
                        >
                          {t(`${TK}.selectPro`)}
                        </button>
                      </div>
                    ) : (
                      <div className="plan-action-stack">
                        <span className="plan-renew-label is-spacer" aria-hidden="true" />
                        <button
                          className="plan-select-button"
                          type="button"
                          onClick={() => handlePlanClick(planId)}
                        >
                          {getPlanButtonLabel(planId)}
                        </button>
                      </div>
                    )}
                  </article>
                )
              })}
            </div>

            <article className="roi-panel">
              <div className="card-heading">
                <h2 className="card-title">{t(`${TK}.roiTitle`)}</h2>
                <span className="card-meta">{t(`${TK}.roiMeta`)}</span>
              </div>
              <div className="roi-grid">
                <div className="roi-metric is-loss">
                  <div className="roi-value">$3,200</div>
                  <div className="roi-label">{t(`${TK}.lostPerMonth`)}</div>
                </div>
                <div className="roi-metric is-cost">
                  <div className="roi-value">
                    {formatPlanPrice(packagesByPlan[VoicePlanTier.Pro]?.price ?? SERVICE_PLAN_MONTHLY_PRICE[VoicePlanTier.Pro])}
                  </div>
                  <div className="roi-label">{t(`${TK}.nexoraCost`)}</div>
                </div>
                <div className="roi-metric is-gain">
                  <div className="roi-value">+$2,200</div>
                  <div className="roi-label">{t(`${TK}.extraRevenue`)}</div>
                </div>
              </div>
              <div className="business-sub roi-summary">
                {t(`${TK}.roiLabel`)}: <strong>16x</strong> {t(`${TK}.roiPaybackPrefix`)}{' '}
                <strong>{t(`${TK}.roiPaybackDays`)}</strong>
              </div>
            </article>

            <article className="guarantee-panel">
              <div className="card-heading">
                <h2 className="card-title">{t(`${TK}.guaranteeTitle`)}</h2>
                <span className="card-meta">{t(`${TK}.guaranteeMeta`)}</span>
              </div>
              <div className="guarantee-grid">
                <div>✓ {t(`${TK}.pilotFree`)}</div>
                <div>✓ {t(`${TK}.setup24h`)}</div>
              </div>
            </article>
          </div>
        )}
      </div>

      <BookingTrialModal
        open={trialOpen}
        onClose={() => setTrialOpen(false)}
      />
      {/* Class (not id) — CreditsUsageView already owns `#nx-campaign-root` when mounted. */}
      <div className="nx-campaign-root">
        <PlanPaymentModal
          open={checkoutSelection != null}
          selection={checkoutSelection}
          currentPlanId={currentVoicePlanId}
          currentPeriodInMonths={currentVoicePeriodInMonths}
          onClose={() => setCheckoutSelection(null)}
          onSuccess={handlePlanPaymentSuccess}
        />
      </div>
      <CompleteStoreSetupGateModal
        open={storeSetupGateOpen}
        onClose={closeStoreSetupGate}
      />
    </>
  )
}
