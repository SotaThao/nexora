import React, { useEffect, useMemo, useState } from 'react'
import {
  Crown,
  History,
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
  VoicePlanTier,
  VOICE_CREDIT_TYPE_TO_PRODUCT,
  mapCreditsUsageHistoryFilterToCreditType,
  type VoiceUsageActivityDto,
} from '../../../data/repositories/merchantVoice'
import {
  SubscriptionPackageType,
  type SubscriptionPackage,
  type SubscriptionPaymentMethod,
} from '../../../data/repositories/subscriptionPayments'
import {
  useSubscriptionPackages,
  useSubscriptionPurchaseHistory,
} from '../../../data/hooks/useSubscriptionPayments'
import { useProfileSettings } from '../../../data/hooks/useProfileSettings'
import { qk } from '../../../data/queryKeys'
import { usePagination } from '../../../hooks/usePagination'
import { getApiErrorCode } from '../../../types/domain'
import { useQueryClient } from '@tanstack/react-query'
import Pagination from '../../ui/Pagination'
import {
  BOOKING_HUB_EMPTY_CELL,
  BOOKING_HUB_PAGINATION_CLASSNAME,
  formatBookingHubDateTimeParts,
} from './bookingHubFormatters'
import {
  BookingBuyPackageSkeleton,
  BookingCreditsHistoryTableSkeleton,
  BookingCreditsUsageSkeleton,
  BookingPackageHistorySkeleton,
  BookingPackageHistoryTableSkeleton,
} from './BookingHubSkeletons'
import { useBookingHubVoiceEnabled } from './BookingHubVoiceContext'
import BookingTrialModal from './BookingTrialModal'
import SmsBuyCreditsModal from './smsCampaigns/SmsBuyCreditsModal'
import VoiceBuyCreditsModal from './voiceCredits/VoiceBuyCreditsModal'
import PlanPaymentModal from './plans/PlanPaymentModal'
import {
  PACKAGE_HISTORY_STATUS_CLASS,
  PACKAGE_HISTORY_STATUS_LABEL_KEY,
  PAID_SERVICE_PLAN_ORDER,
  PAID_SERVICE_PLAN_TITLE_KEY,
  PLAN_FALLBACK_FEATURES,
  PlansView,
  SERVICE_PLAN_MONTHLY_PRICE,
  formatPackageHistoryAmount,
  formatPackageHistoryPackageLabel,
  formatPlanPrice,
  indexVoiceAiPackagesByPlan,
  isPaidServicePlanId,
  resolvePackageHistoryDisplayAt,
  resolveVoiceAiPlanId,
  type PaidServicePlanId,
  type VoiceAiCheckoutSelection,
} from './plans/constants'
import { useNotification } from '../../../contexts/NotificationContext'
import { getSmsCreditNumberLocale } from './smsCampaigns/constants'
import {
  getSubscriptionPlanRenewLabel,
  getVoiceAiSubscription,
  isUserSubscriptionActive,
} from '../../../utils/subscriptionDisplay'

const CREDITS_HISTORY_PAGE_SIZE = 10
const PACKAGE_HISTORY_SKELETON_ROWS = 5

const TK = 'components.dashboard.views.BookingHubView.plans'

const PLAN_BUTTON_LABEL_KEY: Record<PaidServicePlanId, string> = {
  ...PAID_SERVICE_PLAN_TITLE_KEY,
  [VoicePlanTier.Pro]: 'startTrial',
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
      <span className={`plan-check ${included ? '' : 'muted'}`}>
        {included ? '✓' : BOOKING_HUB_EMPTY_CELL}
      </span>
      <span>{children}</span>
    </div>
  )
}

function resolveActivityLabel(
  item: VoiceUsageActivityDto,
  t: (key: string) => string,
  CTK: string,
): string {
  const kindKey =
    ACTIVITY_KIND_I18N_KEY[item.activityKind]
    ?? ACTIVITY_KIND_I18N_KEY[VoiceCreditActivityKind.Unknown]
  return t(`${CTK}.activity.${kindKey}`)
}

function PackageHistoryPanel() {
  const { t, currentLanguage } = useTranslation()
  const {
    data: rows = [],
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useSubscriptionPurchaseHistory()

  const formatTerm = (months: number) => {
    if (months === 1) return t(`${TK}.packageHistoryTermMonths`, { count: months })
    return t(`${TK}.packageHistoryTermMonthsPlural`, { count: months })
  }

  const showSkeleton = isLoading && rows.length === 0
  const showTableSkeleton = isFetching && rows.length === 0

  if (showSkeleton) {
    return <BookingPackageHistorySkeleton />
  }

  return (
    <section
      className="credits-history-section package-history-section"
      aria-busy={isFetching}
      aria-labelledby="plans-package-history-title"
    >
      <div className="credits-section-heading">
        <div>
          <span className="credits-kicker">{t(`${TK}.packageHistoryKicker`)}</span>
          <h2 id="plans-package-history-title">{t(`${TK}.packageHistoryTitle`)}</h2>
        </div>
      </div>

      <div className="credits-history-scroll">
        <table className="credits-history-table package-history-plan-table">
          <caption className="sr-only">{t(`${TK}.packageHistoryCaption`)}</caption>
          <thead>
            <tr>
              <th scope="col">{t(`${TK}.packageHistoryColDate`)}</th>
              <th scope="col">{t(`${TK}.packageHistoryColAmount`)}</th>
              <th scope="col">{t(`${TK}.packageHistoryColPackage`)}</th>
              <th scope="col">{t(`${TK}.packageHistoryColTerm`)}</th>
              <th scope="col">{t(`${TK}.packageHistoryColValidUntil`)}</th>
              <th scope="col">{t(`${TK}.packageHistoryColStatus`)}</th>
              <th scope="col">{t(`${TK}.packageHistoryColTransaction`)}</th>
            </tr>
          </thead>
          <tbody>
            {showTableSkeleton ? (
              <BookingPackageHistoryTableSkeleton rows={PACKAGE_HISTORY_SKELETON_ROWS} />
            ) : isError && rows.length === 0 ? (
              <tr>
                <td className="booking-empty-cell" colSpan={7}>
                  <div>{t(getErrorI18nKey(getApiErrorCode(error)))}</div>
                  <button
                    className="booking-mini-button"
                    type="button"
                    onClick={() => void refetch()}
                  >
                    {t(`${TK}.packageHistoryRetry`)}
                  </button>
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td className="booking-empty-cell" colSpan={7}>
                  {t(`${TK}.packageHistoryEmpty`)}
                </td>
              </tr>
            ) : (
              rows.map((row) => {
                const displayAt = resolvePackageHistoryDisplayAt(row)
                const purchased = formatBookingHubDateTimeParts(displayAt, currentLanguage)
                const validUntil = row.validUntil
                  ? formatBookingHubDateTimeParts(row.validUntil, currentLanguage)?.date
                    ?? BOOKING_HUB_EMPTY_CELL
                  : BOOKING_HUB_EMPTY_CELL
                const statusClass = PACKAGE_HISTORY_STATUS_CLASS[row.uiStatus]
                const statusLabel = t(
                  `${TK}.${PACKAGE_HISTORY_STATUS_LABEL_KEY[row.uiStatus]}`,
                )
                const packageLabel = formatPackageHistoryPackageLabel(
                  row.planName,
                  t(`${TK}.packageHistoryPackageBrand`),
                )
                return (
                  <tr key={row.orderId || row.referenceId}>
                    <td>
                      <span className="credits-history-date">
                        {purchased?.date ?? BOOKING_HUB_EMPTY_CELL}
                        <small>{purchased?.time ?? BOOKING_HUB_EMPTY_CELL}</small>
                      </span>
                    </td>
                    <td className="package-history-plan-amount">
                      {formatPackageHistoryAmount(row.amount, row.currency)}
                    </td>
                    <td>
                      <span className="credits-history-activity">
                        <strong>{packageLabel}</strong>
                        <small>{t(`${TK}.packageHistoryMonthlySub`)}</small>
                      </span>
                    </td>
                    <td>
                      <span className="credits-product-badge credits-product-badge-voice">
                        {formatTerm(row.periodInMonths || 1)}
                      </span>
                    </td>
                    <td>{validUntil}</td>
                    <td>
                      <span className={`package-history-status ${statusClass}`}>
                        {statusLabel}
                      </span>
                    </td>
                    <td>
                      <span className="package-history-transaction">
                        {row.referenceId || row.orderId || BOOKING_HUB_EMPTY_CELL}
                      </span>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
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

  const numberLocale = getSmsCreditNumberLocale(currentLanguage)
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

function resolvePackageFeatures(
  pkg: SubscriptionPackage | undefined,
  language: string,
): string[] {
  if (!pkg) return []
  const isVi = language.toLowerCase().startsWith('vi')
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

export default function BookingPlansPanel() {
  const { t, currentLanguage } = useTranslation()
  const { showToast } = useNotification()
  const queryClient = useQueryClient()
  const voiceEnabled = useBookingHubVoiceEnabled()
  const { data: myTrialRequest, isLoading: isTrialRequestLoading } = useMyVoiceTrialRequest()
  const { data: profile } = useProfileSettings()
  const [selectedPlan, setSelectedPlan] = useState<PaidServicePlanId | null>(null)
  const [trialOpen, setTrialOpen] = useState(false)
  const [checkoutSelection, setCheckoutSelection] = useState<VoiceAiCheckoutSelection | null>(null)
  const [plansView, setPlansView] = useState<PlansView>(PlansView.Package)

  const {
    data: voicePackages = [],
    isLoading: isPackagesLoading,
    isFetching: isPackagesFetching,
    isError: isPackagesError,
    error: packagesError,
    refetch: refetchPackages,
  } = useSubscriptionPackages({
    enabled: plansView === PlansView.Package,
    packageType: SubscriptionPackageType.VoiceAI,
    // No cache window — each Buy Package visit must hit the network.
    staleTime: 0,
    refetchOnMount: 'always',
  })

  const packagesByPlan = useMemo(
    () => indexVoiceAiPackagesByPlan(voicePackages),
    [voicePackages],
  )

  const voiceAiSubscription = useMemo(() => getVoiceAiSubscription(profile), [profile])
  const currentVoicePlanId = useMemo(() => {
    if (!voiceAiSubscription || !isUserSubscriptionActive(voiceAiSubscription)) return null
    return resolveVoiceAiPlanId({
      packageCode: voiceAiSubscription.packageCode ?? '',
      name: voiceAiSubscription.name,
      plan: voiceAiSubscription.name,
    })
  }, [voiceAiSubscription])
  const voiceRenewLabel = useMemo(
    () => getSubscriptionPlanRenewLabel(voiceAiSubscription, t),
    [voiceAiSubscription, t],
  )

  const hasExistingTrialRequest = myTrialRequest != null
  // Hide Credit Usage when AI Hub only has Plans (no voice tenant).
  const showCreditUsageTab = voiceEnabled
  const showPackageSkeleton =
    (isPackagesLoading || isPackagesFetching) && voicePackages.length === 0
  const hasMappedPackages = Object.keys(packagesByPlan).length > 0

  useEffect(() => {
    if (!showCreditUsageTab && plansView === PlansView.Credits) {
      setPlansView(PlansView.Package)
    }
  }, [showCreditUsageTab, plansView])

  // Leaving Buy Package marks catalog stale/invalid so the next visit always re-calls
  // GET .../packages?packageType=VoiceAI.
  useEffect(() => {
    if (plansView === PlansView.Package) return
    void queryClient.invalidateQueries({
      queryKey: qk.merchantSubscriptionPackages(SubscriptionPackageType.VoiceAI),
    })
  }, [plansView, queryClient])

  const getPlanButtonLabel = (plan: PaidServicePlanId) => {
    if (plan === VoicePlanTier.Pro && hasExistingTrialRequest) {
      return t(`${TK}.trialRequestSubmitted`)
    }
    if (selectedPlan === plan) {
      return t(`${TK}.planSelected`, { plan })
    }
    return t(`${TK}.${PLAN_BUTTON_LABEL_KEY[plan]}`)
  }

  const isPlanButtonPrimary = (plan: PaidServicePlanId) => {
    if (selectedPlan) return selectedPlan === plan
    return plan === VoicePlanTier.Pro
  }

  const handleTrialClick = () => {
    if (hasExistingTrialRequest || isTrialRequestLoading) return
    setTrialOpen(true)
  }

  const openCheckoutForPlan = (plan: PaidServicePlanId) => {
    if (!isPaidServicePlanId(plan)) return
    if (currentVoicePlanId === plan) return
    const pkg = packagesByPlan[plan]
    if (!pkg?.id) {
      showToast(t(`${TK}.planPackageUnavailable`), 'error')
      return
    }
    setCheckoutSelection({
      planId: plan,
      packageId: pkg.id,
      packageCode: pkg.packageCode,
      name: pkg.name || plan,
      price: pkg.price ?? SERVICE_PLAN_MONTHLY_PRICE[plan],
    })
  }

  const handleBuyPlanClick = (plan: PaidServicePlanId) => {
    openCheckoutForPlan(plan)
  }

  const handlePlanClick = (plan: PaidServicePlanId) => {
    if (currentVoicePlanId === plan) return
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
    setSelectedPlan(selection.planId)
    setCheckoutSelection(null)
    void queryClient.invalidateQueries({ queryKey: qk.userProfile() })
    showToast(
      t(`${TK}.planPaymentSuccess`, {
        plan: selection.planId,
        price: selection.price,
        payment: paymentLabel,
      }),
      'success',
    )
  }

  const renderPlanFeatures = (planId: PaidServicePlanId, pkg?: SubscriptionPackage) => {
    const features = resolvePackageFeatures(pkg, currentLanguage)
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
    const price = pkg?.price ?? SERVICE_PLAN_MONTHLY_PRICE[planId]
    const original = pkg?.originalPrice
    return (
      <>
        <div className="service-plan-price">
          {formatPlanPrice(price)}
          <span>{t(`${TK}.perMonth`)}</span>
        </div>
        {original != null && original > price ? (
          <div className="service-plan-cross">{formatPlanPrice(original)}</div>
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

  return (
    <>
      <div className="plans-panel-shell">
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
          <button
            className={`booking-view-button${plansView === PlansView.History ? ' is-active' : ''}`}
            type="button"
            aria-pressed={plansView === PlansView.History}
            onClick={() => setPlansView(PlansView.History)}
          >
            <History aria-hidden="true" />
            {t(`${TK}.packageHistory`)}
          </button>
        </div>

        {plansView === PlansView.Credits && showCreditUsageTab ? (
          <CreditsUsagePanel />
        ) : plansView === PlansView.History ? (
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

            <div className="plans-grid">
              {PAID_SERVICE_PLAN_ORDER.map((planId) => {
                const pkg = packagesByPlan[planId]
                if (!pkg) return null
                const isPro = planId === VoicePlanTier.Pro
                const isCurrent = currentVoicePlanId === planId
                return (
                  <article
                    key={pkg.id || planId}
                    className={[
                      'service-plan-card',
                      isPro ? 'is-recommended' : '',
                      isCurrent || selectedPlan === planId ? 'is-selected' : '',
                      isCurrent ? 'is-current-plan' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    data-plan-card={planId.toLowerCase()}
                  >
                    <div className="plan-rec" aria-hidden={!isPro && !isCurrent}>
                      {isCurrent
                        ? t(`${TK}.currentActivePlan`)
                        : isPro
                          ? t(`${TK}.recommended`)
                          : null}
                    </div>
                    <div className="service-plan-name">{pkg.name || planId}</div>
                    {renderPlanPrice(planId, pkg)}
                    <div className="plan-features">{renderPlanFeatures(planId, pkg)}</div>
                    {isCurrent ? (
                      renderCurrentActivePlanCta()
                    ) : isPro ? (
                      <div className="plan-action-stack">
                        <span className="plan-renew-label is-spacer" aria-hidden="true" />
                        <button
                          className={`plan-select-button ${isPlanButtonPrimary(VoicePlanTier.Pro) ? 'is-primary' : ''}`}
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
                          {selectedPlan === VoicePlanTier.Pro
                            ? t(`${TK}.planSelected`, { plan: VoicePlanTier.Pro })
                            : t(`${TK}.selectPro`)}
                        </button>
                      </div>
                    ) : (
                      <div className="plan-action-stack">
                        <span className="plan-renew-label is-spacer" aria-hidden="true" />
                        <button
                          className={`plan-select-button ${isPlanButtonPrimary(planId) ? 'is-primary' : ''}`}
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

      <BookingTrialModal open={trialOpen} onClose={() => setTrialOpen(false)} />
      {/* Class (not id) — CreditsUsageView already owns `#nx-campaign-root` when mounted. */}
      <div className="nx-campaign-root">
        <PlanPaymentModal
          open={checkoutSelection != null}
          selection={checkoutSelection}
          onClose={() => setCheckoutSelection(null)}
          onSuccess={handlePlanPaymentSuccess}
        />
      </div>
    </>
  )
}
