import React, { useEffect, useState } from 'react'
import {
  Crown,
  Layers3,
  MessageCircle,
  PhoneCall,
  RefreshCw,
  ShieldCheck,
  ShoppingBag,
  AlertTriangle,
  Wallet,
} from 'lucide-react'
import { useTranslation } from '../../../contexts/LanguageContext'
import { getErrorI18nKey } from '../../../data/errorCodes'
import {
  useMerchantVoiceCreditWallet,
  useMerchantVoiceUsageActivity,
} from '../../../data/hooks/useMerchantVoiceBookings'
import { useMyVoiceTrialRequest } from '../../../data/hooks/useMyVoiceTrialRequest'
import {
  CreditsUsageHistoryFilter,
  CreditsUsageProduct,
  VoiceCreditActivityKind,
  VoiceCreditType,
  VoicePlanStatus,
  VOICE_CREDIT_TYPE_TO_PRODUCT,
  mapCreditsUsageHistoryFilterToCreditType,
  type VoiceUsageActivityDto,
} from '../../../data/repositories/merchantVoice'
import { usePagination } from '../../../hooks/usePagination'
import { getApiErrorCode } from '../../../types/domain'
import Pagination from '../../ui/Pagination'
import {
  BOOKING_HUB_EMPTY_CELL,
  BOOKING_HUB_PAGINATION_CLASSNAME,
  formatBookingHubDateTimeParts,
} from './bookingHubFormatters'
import {
  BookingCreditsHistoryTableSkeleton,
  BookingCreditsUsageSkeleton,
} from './BookingHubSkeletons'
import { useBookingHubVoiceEnabled } from './BookingHubVoiceContext'
import BookingTrialModal from './BookingTrialModal'
import SmsBuyCreditsModal from './smsCampaigns/SmsBuyCreditsModal'
import VoiceBuyCreditsModal from './voiceCredits/VoiceBuyCreditsModal'

const CREDITS_HISTORY_PAGE_SIZE = 10

const TK = 'components.dashboard.views.BookingHubView.plans'

type PlanId = 'Starter' | 'Pro' | 'Elite'
type PlansView = 'package' | 'credits'

const PLAN_BUTTON_LABEL_KEY: Record<PlanId, string> = {
  Starter: 'selectStarter',
  Pro: 'startTrial',
  Elite: 'selectElite',
}

const HISTORY_FILTERS: { id: CreditsUsageHistoryFilter; labelKey: string }[] = [
  { id: CreditsUsageHistoryFilter.All, labelKey: 'filterAll' },
  { id: CreditsUsageHistoryFilter.Sms, labelKey: 'filterSms' },
  { id: CreditsUsageHistoryFilter.Voice, labelKey: 'filterVoice' },
]

const ACTIVITY_KIND_I18N_KEY: Record<VoiceCreditActivityKind, string> = {
  [VoiceCreditActivityKind.Unknown]: 'unknown',
  [VoiceCreditActivityKind.InboundCall]: 'inboundCall',
  [VoiceCreditActivityKind.OutboundCall]: 'outboundCall',
  [VoiceCreditActivityKind.SmsCampaign]: 'smsCampaign',
  [VoiceCreditActivityKind.SmsAutoReply]: 'smsAutoReply',
  [VoiceCreditActivityKind.SmsNotification]: 'smsNotification',
  [VoiceCreditActivityKind.Purchase]: 'purchase',
  [VoiceCreditActivityKind.PlanGrant]: 'planGrant',
  [VoiceCreditActivityKind.PlanReset]: 'planReset',
  [VoiceCreditActivityKind.AdminAdjustment]: 'adminAdjustment',
  [VoiceCreditActivityKind.Refund]: 'refund',
}

function PlanFeature({ included, children }: { included: boolean; children: React.ReactNode }) {
  return (
    <div className="plan-feature">
      <span className={`plan-check ${included ? '' : 'muted'}`}>{included ? '✓' : '—'}</span>
      <span>{children}</span>
    </div>
  )
}

function resolveActivityLabel(
  item: VoiceUsageActivityDto,
  t: (key: string) => string,
  CTK: string,
): string {
  const label = item.activityLabel?.trim()
  if (label) return label
  const kindKey = ACTIVITY_KIND_I18N_KEY[item.activityKind] ?? ACTIVITY_KIND_I18N_KEY[VoiceCreditActivityKind.Unknown]
  return t(`${CTK}.activity.${kindKey}`)
}

function CreditsUsagePanel() {
  const { t, currentLanguage } = useTranslation()
  const CTK = `${TK}.credits`
  const voiceEnabled = useBookingHubVoiceEnabled()
  const [historyFilter, setHistoryFilter] = useState<CreditsUsageHistoryFilter>(
    CreditsUsageHistoryFilter.All,
  )
  const [smsBuyOpen, setSmsBuyOpen] = useState(false)
  const [voiceBuyOpen, setVoiceBuyOpen] = useState(false)
  const { pageNumber, pageSize, setPage, reset: resetPage } = usePagination({
    pageSize: CREDITS_HISTORY_PAGE_SIZE,
  })

  const creditType = mapCreditsUsageHistoryFilterToCreditType(historyFilter)

  const {
    data: wallet,
    isLoading: isWalletLoading,
    isError: isWalletError,
    error: walletError,
    refetch: refetchWallet,
  } = useMerchantVoiceCreditWallet({ enabled: voiceEnabled })

  const {
    data: activityResponse,
    isLoading: isActivityLoading,
    isFetching: isActivityFetching,
    isError: isActivityError,
    error: activityError,
    refetch: refetchActivity,
  } = useMerchantVoiceUsageActivity(
    {
      pageNumber,
      pageSize,
      creditType,
    },
    { enabled: voiceEnabled },
  )

  const numberLocale = currentLanguage === 'vi' ? 'vi-VN' : 'en-US'
  const isHistoryLoading = isActivityLoading || isActivityFetching

  useEffect(() => {
    resetPage()
  }, [historyFilter, resetPage])

  const voicePlanRemaining = wallet?.callMinutes.grantedBalance ?? 0
  const smsPlanRemaining = wallet?.smsSegments.grantedBalance ?? 0
  const voiceTopupBalance = wallet?.callMinutes.purchasedBalance ?? 0
  const smsTopupBalance = wallet?.smsSegments.purchasedBalance ?? 0
  const voiceAvailable = wallet?.callMinutes.available ?? 0
  const smsAvailable = wallet?.smsSegments.available ?? 0
  /**
   * GET /credits — banner from wallet flags:
   * - CallMinutes.isLow / isBlocked → “AI Voice running low”
   * - SmsSegments.isLow / isBlocked (and voice ok) → “Need more credits?”
   * - neither → hide
   */
  const isVoiceLow = Boolean(
    wallet?.callMinutes.isLow || wallet?.callMinutes.isBlocked,
  )
  const isSmsLow = Boolean(
    wallet?.smsSegments.isLow || wallet?.smsSegments.isBlocked,
  )
  const showCreditsPrompt = isVoiceLow || isSmsLow
  const showVoiceWarning = isVoiceLow
  const showNeedMoreCredits = !isVoiceLow && isSmsLow

  const planName = wallet?.planTier ?? t(`${CTK}.planNameFallback`)
  const planStatus = wallet?.planStatus
  const expiresAt = wallet?.periodEnd
  const expiresParts = formatBookingHubDateTimeParts(expiresAt, currentLanguage)
  const expiresDateLabel = expiresParts?.date ?? BOOKING_HUB_EMPTY_CELL
  const expiresDateTimeAttr = expiresAt ? expiresAt.slice(0, 10) : undefined
  const planStatusLabel =
    planStatus && planStatus !== VoicePlanStatus.Active
      ? t(`${CTK}.planStatus.${planStatus}`)
      : null

  const historyItems = activityResponse?.items ?? []
  const totalCount = activityResponse?.totalCount ?? 0
  const totalPages = Math.max(1, activityResponse?.totalPages ?? 1)

  const formatAmount = (item: VoiceUsageActivityDto) => {
    const amount = Math.abs(item.units)
    const count = amount.toLocaleString(numberLocale)
    const isCredit = item.units >= 0
    if (item.creditType === VoiceCreditType.SmsSegment) {
      return isCredit
        ? t(`${CTK}.amountCreditSms`, { count })
        : t(`${CTK}.amountDebitSms`, { count })
    }
    return isCredit
      ? t(`${CTK}.amountCreditMin`, { count })
      : t(`${CTK}.amountDebitMin`, { count })
  }

  const handleRetryAll = () => {
    void refetchWallet()
    void refetchActivity()
  }

  if (!voiceEnabled) return null

  if (isWalletLoading && !wallet) {
    return <BookingCreditsUsageSkeleton />
  }

  if (isWalletError && !wallet) {
    return (
      <section className="credits-page" aria-labelledby="credits-page-title">
        <h2 id="credits-page-title" className="sr-only">
          {t(`${CTK}.pageTitle`)}
        </h2>
        <div className="booking-empty-cell credits-load-error">
          <div>{t(getErrorI18nKey(getApiErrorCode(walletError)))}</div>
          <button className="booking-mini-button" type="button" onClick={handleRetryAll}>
            {t(`${CTK}.retry`)}
          </button>
        </div>
      </section>
    )
  }

  const showHistorySkeleton = isHistoryLoading && historyItems.length === 0

  return (
    <section
      className="credits-page"
      aria-busy={isWalletLoading || isHistoryLoading}
      aria-labelledby="credits-page-title"
    >
      <h2 id="credits-page-title" className="sr-only">
        {t(`${CTK}.pageTitle`)}
      </h2>

      <div className="credits-balance-grid">
        <article className="credits-card credits-card-plan" aria-labelledby="plan-credits-title">
          <div className="credits-card-head">
            <div className="credits-card-icon credits-card-icon-plan">
              <Crown aria-hidden="true" />
            </div>
            <div>
              <h2 id="plan-credits-title">{planName}</h2>
              <p className="credits-plan-subtitle">
                {t(`${CTK}.planSubtitle`)}
                {planStatusLabel ? (
                  <>
                    {' · '}
                    <span className="credits-plan-status">{planStatusLabel}</span>
                  </>
                ) : null}
              </p>
            </div>
            {expiresAt ? (
              <span className="credits-reset-action">
                <RefreshCw aria-hidden="true" />
                <span>
                  {t(`${CTK}.expires`)}{' '}
                  <time dateTime={expiresDateTimeAttr}>{expiresDateLabel}</time>
                </span>
              </span>
            ) : null}
          </div>

          <div className="credits-plan-remaining" aria-label={t(`${CTK}.remainingPlanAria`)}>
            <span className="credits-label">{t(`${CTK}.remaining`)}</span>
            <div className="credits-plan-remaining-values">
              <strong>{voicePlanRemaining.toLocaleString(numberLocale)}</strong>
              <span className="credits-plan-remaining-unit">{t(`${CTK}.unitMin`)}</span>
              <span className="credits-plan-remaining-separator" aria-hidden="true">
                ·
              </span>
              <strong>{smsPlanRemaining.toLocaleString(numberLocale)}</strong>
              <span className="credits-plan-remaining-unit">{t(`${CTK}.unitSms`)}</span>
            </div>
          </div>
        </article>

        <article className="credits-card credits-card-topup" aria-labelledby="voice-sms-credits-title">
          <div className="credits-card-head">
            <div className="credits-card-icon credits-card-icon-topup">
              <Layers3 aria-hidden="true" />
            </div>
            <div>
              <h2 id="voice-sms-credits-title">{t(`${CTK}.topupTitle`)}</h2>
              <p className="credits-topup-subtitle">{t(`${CTK}.topupSubtitle`)}</p>
            </div>
            <span className="credits-rollover-badge">
              <ShieldCheck aria-hidden="true" />
              <span>{t(`${CTK}.neverExpires`)}</span>
            </span>
          </div>

          <div
            className="credits-plan-remaining credits-topup-remaining"
            aria-label={t(`${CTK}.remainingTopupAria`)}
          >
            <span className="credits-label">{t(`${CTK}.remaining`)}</span>
            <div className="credits-plan-remaining-values">
              <strong>{voiceTopupBalance.toLocaleString(numberLocale)}</strong>
              <span className="credits-plan-remaining-unit">{t(`${CTK}.unitMin`)}</span>
              <span className="credits-plan-remaining-separator" aria-hidden="true">
                ·
              </span>
              <strong>{smsTopupBalance.toLocaleString(numberLocale)}</strong>
              <span className="credits-plan-remaining-unit">{t(`${CTK}.unitSms`)}</span>
            </div>
          </div>
        </article>
      </div>

      {showCreditsPrompt ? (
        <div
          className={`credits-voice-warning${showVoiceWarning ? '' : ' is-neutral'}`}
          role="status"
          aria-live="polite"
        >
          {showVoiceWarning ? (
            <div className="credits-voice-warning-content">
              <div className="credits-voice-warning-icon">
                <AlertTriangle aria-hidden="true" />
              </div>
              <div>
                <strong>{t(`${CTK}.voiceWarningTitle`)}</strong>
                <p>
                  {t(`${CTK}.voiceWarningBody`, {
                    remaining: voiceAvailable.toLocaleString(numberLocale),
                  })}
                </p>
              </div>
            </div>
          ) : null}
          {showNeedMoreCredits ? (
            <div className="credits-voice-warning-content">
              <div className="credits-voice-warning-icon">
                <Wallet aria-hidden="true" />
              </div>
              <div>
                <strong>{t(`${CTK}.buyBarTitle`)}</strong>
                <p>
                  {t(`${CTK}.buyBarBodySms`, {
                    remaining: smsAvailable.toLocaleString(numberLocale),
                  })}
                </p>
              </div>
            </div>
          ) : null}
          <div className="credits-actions" aria-label={t(`${CTK}.buyActionsAria`)}>
            <button
              className="credits-action credits-action-secondary"
              type="button"
              onClick={() => setVoiceBuyOpen(true)}
            >
              <PhoneCall aria-hidden="true" />
              <span>{t(`${CTK}.buyVoice`)}</span>
            </button>
            <button
              className="credits-action credits-action-secondary"
              type="button"
              onClick={() => setSmsBuyOpen(true)}
            >
              <MessageCircle aria-hidden="true" />
              <span>{t(`${CTK}.buySms`)}</span>
            </button>
          </div>
        </div>
      ) : null}

      <section className="credits-history-section" aria-labelledby="credits-history-title">
        <div className="credits-section-heading">
          <div>
            <span className="credits-kicker">{t(`${CTK}.activityKicker`)}</span>
            <h2 id="credits-history-title">{t(`${CTK}.historyTitle`)}</h2>
          </div>
          <div className="credits-history-tools">
            <div className="credits-history-filters" role="group" aria-label={t(`${CTK}.historyFilterAria`)}>
              {HISTORY_FILTERS.map((filter) => (
                <button
                  key={filter.id}
                  className={`credits-history-filter${historyFilter === filter.id ? ' is-active' : ''}`}
                  type="button"
                  aria-pressed={historyFilter === filter.id}
                  onClick={() => setHistoryFilter(filter.id)}
                >
                  {t(`${CTK}.${filter.labelKey}`)}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="credits-history-scroll">
          <table className="credits-history-table">
            <caption className="sr-only">{t(`${CTK}.tableCaption`)}</caption>
            <thead>
              <tr>
                <th scope="col">{t(`${CTK}.colProduct`)}</th>
                <th scope="col">{t(`${CTK}.colActivity`)}</th>
                <th scope="col">{t(`${CTK}.colChange`)}</th>
                <th scope="col">{t(`${CTK}.colDate`)}</th>
              </tr>
            </thead>
            <tbody>
              {showHistorySkeleton ? (
                <BookingCreditsHistoryTableSkeleton rows={CREDITS_HISTORY_PAGE_SIZE} />
              ) : isActivityError && historyItems.length === 0 ? (
                <tr>
                  <td className="booking-empty-cell" colSpan={4}>
                    <div>{t(getErrorI18nKey(getApiErrorCode(activityError)))}</div>
                    <button
                      className="booking-mini-button"
                      type="button"
                      onClick={() => void refetchActivity()}
                    >
                      {t(`${CTK}.retry`)}
                    </button>
                  </td>
                </tr>
              ) : historyItems.length === 0 ? (
                <tr>
                  <td className="booking-empty-cell" colSpan={4}>
                    {t(`${CTK}.emptyState`)}
                  </td>
                </tr>
              ) : (
                historyItems.map((item) => {
                  const product = VOICE_CREDIT_TYPE_TO_PRODUCT[item.creditType]
                  const parts = formatBookingHubDateTimeParts(item.occurredAt, currentLanguage)
                  const rowKey = [
                    item.referenceId ?? '',
                    item.activityKind,
                    item.creditType,
                    item.occurredAt,
                    item.units,
                  ].join('-')
                  return (
                    <tr key={rowKey}>
                      <td>
                        <span className={`credits-product-badge credits-product-badge-${product}`}>
                          {product === CreditsUsageProduct.Sms
                            ? t(`${CTK}.productSms`)
                            : t(`${CTK}.productVoice`)}
                        </span>
                      </td>
                      <td>
                        <span className="credits-history-activity">
                          <strong>{resolveActivityLabel(item, t, CTK)}</strong>
                        </span>
                      </td>
                      <td
                        className={
                          item.units >= 0 ? 'credits-amount-positive' : 'credits-amount-negative'
                        }
                      >
                        {formatAmount(item)}
                      </td>
                      <td>
                        <span className="credits-history-date">
                          {parts?.date ?? BOOKING_HUB_EMPTY_CELL}
                          <small>{parts?.time ?? BOOKING_HUB_EMPTY_CELL}</small>
                        </span>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {!showHistorySkeleton && totalCount > 0 ? (
          <Pagination
            pageNumber={pageNumber}
            pageSize={pageSize}
            totalPages={totalPages}
            totalCount={totalCount}
            hasNextPage={activityResponse?.hasNextPage}
            hasPreviousPage={activityResponse?.hasPreviousPage}
            onPageChange={setPage}
            isLoading={isActivityFetching}
            className={BOOKING_HUB_PAGINATION_CLASSNAME}
          />
        ) : null}
      </section>

      <div id="nx-campaign-root">
        <SmsBuyCreditsModal open={smsBuyOpen} onClose={() => setSmsBuyOpen(false)} />
        <VoiceBuyCreditsModal open={voiceBuyOpen} onClose={() => setVoiceBuyOpen(false)} />
      </div>
    </section>
  )
}

export default function BookingPlansPanel() {
  const { t } = useTranslation()
  const { data: myTrialRequest, isLoading: isTrialRequestLoading } = useMyVoiceTrialRequest()
  const [selectedPlan, setSelectedPlan] = useState<PlanId | null>(null)
  const [trialOpen, setTrialOpen] = useState(false)
  const [plansView, setPlansView] = useState<PlansView>('package')

  const hasExistingTrialRequest = myTrialRequest != null

  const getPlanButtonLabel = (plan: PlanId) => {
    if (plan === 'Pro' && hasExistingTrialRequest) {
      return t(`${TK}.trialRequestSubmitted`)
    }
    if (selectedPlan === plan) {
      return t(`${TK}.planSelected`, { plan })
    }
    return t(`${TK}.${PLAN_BUTTON_LABEL_KEY[plan]}`)
  }

  const isPlanButtonPrimary = (plan: PlanId) => {
    if (selectedPlan) return selectedPlan === plan
    return plan === 'Pro'
  }

  const handlePlanClick = (plan: PlanId) => {
    // Match HTML: Pro opens trial modal; Starter/Elite only toggle selection.
    if (plan === 'Pro') {
      if (hasExistingTrialRequest || isTrialRequestLoading) return
      setTrialOpen(true)
      return
    }
    setSelectedPlan(plan)
  }

  return (
    <>
      <div className="plans-panel-shell">
        <div className="booking-view-switch" role="group" aria-label={t(`${TK}.viewMode`)}>
          <button
            className={`booking-view-button${plansView === 'package' ? ' is-active' : ''}`}
            type="button"
            aria-pressed={plansView === 'package'}
            onClick={() => setPlansView('package')}
          >
            <ShoppingBag aria-hidden="true" />
            {t(`${TK}.buyPackage`)}
          </button>
          <button
            className={`booking-view-button${plansView === 'credits' ? ' is-active' : ''}`}
            type="button"
            aria-pressed={plansView === 'credits'}
            onClick={() => setPlansView('credits')}
          >
            <Wallet aria-hidden="true" />
            {t(`${TK}.creditUsage`)}
          </button>
        </div>

        {plansView === 'package' ? (
          <div className="plans-stack">
            <div className="plans-hero">{t(`${TK}.hero`)}</div>

            <div className="plans-grid">
              <article
                className={`service-plan-card ${selectedPlan === 'Starter' ? 'is-selected' : ''}`}
                data-plan-card="starter"
              >
                <div className="plan-rec" aria-hidden="true" />
                <div className="service-plan-name">Starter</div>
                <div className="service-plan-price">
                  $99
                  <span>{t(`${TK}.perMonth`)}</span>
                </div>
                <div className="service-plan-cross">{t(`${TK}.crossPriceStarter`)}</div>
                <div className="plan-features">
                  <PlanFeature included>{t(`${TK}.featVoice247`)}</PlanFeature>
                  <PlanFeature included>{t(`${TK}.featMissedCallSms`)}</PlanFeature>
                  <PlanFeature included>{t(`${TK}.featStarterUsage`)}</PlanFeature>
                  <PlanFeature included={false}>{t(`${TK}.dashboardInPro`)}</PlanFeature>
                  <PlanFeature included={false}>{t(`${TK}.googleReviewInPro`)}</PlanFeature>
                </div>
                <button
                  className={`plan-select-button ${isPlanButtonPrimary('Starter') ? 'is-primary' : ''}`}
                  type="button"
                  onClick={() => handlePlanClick('Starter')}
                >
                  {getPlanButtonLabel('Starter')}
                </button>
              </article>

              <article
                className={`service-plan-card is-recommended ${selectedPlan === 'Pro' ? 'is-selected' : ''}`}
                data-plan-card="pro"
              >
                <div className="plan-rec">{t(`${TK}.recommended`)}</div>
                <div className="service-plan-name">Pro</div>
                <div className="service-plan-price">
                  $199
                  <span>{t(`${TK}.perMonth`)}</span>
                </div>
                <div className="service-plan-cross">{t(`${TK}.crossPricePro`)}</div>
                <div className="plan-features">
                  <PlanFeature included>{t(`${TK}.featVoiceSmsCampaigns`)}</PlanFeature>
                  <PlanFeature included>{t(`${TK}.featOwnerDashboard`)}</PlanFeature>
                  <PlanFeature included>{t(`${TK}.featAutoGoogleReview`)}</PlanFeature>
                  <PlanFeature included>{t(`${TK}.landingPagesAiDesign`)}</PlanFeature>
                  <PlanFeature included>{t(`${TK}.featProUsage`)}</PlanFeature>
                  <div className="plan-aio">{t(`${TK}.aioEngine`)}</div>
                </div>
                <button
                  className={`plan-select-button ${isPlanButtonPrimary('Pro') ? 'is-primary' : ''}`}
                  type="button"
                  disabled={hasExistingTrialRequest || isTrialRequestLoading}
                  onClick={() => handlePlanClick('Pro')}
                >
                  {getPlanButtonLabel('Pro')}
                </button>
              </article>

              <article
                className={`service-plan-card ${selectedPlan === 'Elite' ? 'is-selected' : ''}`}
                data-plan-card="elite"
              >
                <div className="plan-rec" aria-hidden="true" />
                <div className="service-plan-name">Elite</div>
                <div className="service-plan-price">
                  $349
                  <span>{t(`${TK}.perMonth`)}</span>
                </div>
                <div className="service-plan-cross">{t(`${TK}.crossPriceElite`)}</div>
                <div className="plan-features">
                  <PlanFeature included>{t(`${TK}.everythingInPro`)}</PlanFeature>
                  <div className="plan-aio">{t(`${TK}.aioMax`)}</div>
                  <PlanFeature included>{t(`${TK}.featStaffDashboardTaxIq`)}</PlanFeature>
                  <PlanFeature included>{t(`${TK}.eliteUsage`)}</PlanFeature>
                  <PlanFeature included>{t(`${TK}.emailMarketingWinback`)}</PlanFeature>
                </div>
                <button
                  className={`plan-select-button ${isPlanButtonPrimary('Elite') ? 'is-primary' : ''}`}
                  type="button"
                  onClick={() => handlePlanClick('Elite')}
                >
                  {getPlanButtonLabel('Elite')}
                </button>
              </article>
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
                  <div className="roi-value">$199</div>
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
                <div>✓ {t(`${TK}.noCreditCard`)}</div>
                <div>✓ {t(`${TK}.setup24h`)}</div>
                <div>✓ {t(`${TK}.cancelAnytime`)}</div>
              </div>
            </article>
          </div>
        ) : (
          <CreditsUsagePanel />
        )}
      </div>

      <BookingTrialModal open={trialOpen} onClose={() => setTrialOpen(false)} />
    </>
  )
}
