import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Calendar, QrCode, Star, Hourglass } from 'lucide-react'
import { useTranslation } from '../../../contexts/LanguageContext'
import { useNotification } from '../../../contexts/NotificationContext'
import { useDownloadTouchpointQr } from '../../../data/hooks/useMerchantTouchpoints'
import { downloadQrCode } from '../../../utils/qrUtils'
import { buildQrImageUrl, toLocalCustomerTouchUrl } from '../../../utils/staffTipUrl'
import { buildMasterQrTarget, formatCurrency, isAwaitingShopConfirmation, resolveMasterTouchpoint } from '../utils'
import Panel from '../../ui/Panel'
import KpiCard from '../../ui/KpiCard'
import { SkeletonKpiCard } from '../../ui/skeleton'
import Skeleton from '../../ui/skeleton/Skeleton'
import TipsOverTimePanel from './TipsOverTimePanel'
import StaffLeaderboardPanel from './StaffLeaderboardPanel'
import SetupGuideBanner from './SetupGuideBanner'
import PayoutSetupWarningBanner from './PayoutSetupWarningBanner'
import OverviewEmptyState from './OverviewEmptyState'
import OverviewSkeleton from './OverviewSkeleton'
import SettingsTipQrPanel from '../../settings/SettingsTipQrPanel'
import MasterWelcomeQrPanel from './MasterWelcomeQrPanel'

function renderStars(rating) {
  const stars = []
  for (let i = 1; i <= 5; i++) {
    const fillPercentage = Math.max(0, Math.min(1, rating - i + 1))
    stars.push(
      <div key={i} className="relative inline-block h-4 w-4 text-gray-200">
        <Star className="absolute top-0 left-0 h-4 w-4 text-amber-400 opacity-30" />
        {fillPercentage > 0 && (
          <div
            className="absolute top-0 left-0 overflow-hidden h-4 text-amber-400"
            style={{ width: `${fillPercentage * 100}%` }}
          >
            <Star className="h-4 w-4 fill-current text-amber-400" />
          </div>
        )}
      </div>
    )
  }
  return <div className="flex gap-0.5">{stars}</div>
}

function formatRatingValue(value) {
  const num = Number(value) || 0
  return num.toFixed(1)
}

function toPercentValue(value) {
  const num = Number(value) || 0
  const percent = num <= 1 ? num * 100 : num
  const rounded = Math.round(percent * 10) / 10
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1)
}

function getResponseRateLabelText(label, t) {
  if (!label) return null
  const map = {
    EXCELLENT: t('dashboard.review_kpi.response_rate_label.excellent'),
    GOOD: t('dashboard.review_kpi.response_rate_label.good'),
    FAIR: t('dashboard.review_kpi.response_rate_label.fair'),
    NEEDS_IMPROVEMENT: t('dashboard.review_kpi.response_rate_label.needs_improvement'),
    POOR: t('dashboard.review_kpi.response_rate_label.poor'),
  }
  return map[label] || label
}

function ReviewMetricCard({ label, value, footer, deltaPercent = null, showComparison = false }) {
  const { t } = useTranslation()
  const hasDelta = deltaPercent != null && !Number.isNaN(deltaPercent)
  const isPositive = hasDelta ? deltaPercent >= 0 : true

  return (
    <Panel className="flex min-h-[140px] flex-col justify-between p-5 transition hover:shadow-premium">
      <div>
        <div className="text-[11px] font-black uppercase tracking-wider text-nexoraSubtle">
          {label}
        </div>
        <div className="mt-2 text-2xl font-black tracking-tight text-nexoraText">
          {value}
        </div>
      </div>
      <div className="mt-4 flex min-h-5 flex-col justify-end gap-1">
        {footer}
        {showComparison ? (
          hasDelta ? (
            <div
              className={`flex items-center gap-1.5 text-xs font-bold ${
                isPositive ? 'text-emerald-600' : 'text-red-600'
              }`}
            >
              <span>
                {isPositive ? '▲' : '▼'} {Math.abs(deltaPercent).toFixed(1)}%
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-nexoraSubtle/80">
                {t('dashboard.kpi.vs_last_week')}
              </span>
            </div>
          ) : (
            <span className="text-[10px] font-semibold uppercase tracking-wider text-nexoraSubtle/80">
              {t('dashboard.kpi.no_comparison')}
            </span>
          )
        ) : null}
      </div>
    </Panel>
  )
}

function Overview({
  metrics,
  kpiDeltas,
  activeKpi,
  setActiveKpi,
  chartRange,
  setChartRange,
  chartStartDate,
  chartEndDate,
  setChartStartDate,
  setChartEndDate,
  transactions,
  selectedStaff,
  setSelectedStaff,
  onOpenTouchpoints,
  onOpenReviews,
  onOpenStaff,
  businessName,
  previewQr,
  touchpoints = [],
  hasKyb = true,
  hasSetup = true,
  onStartSetup,
  isLoading = false,
  isTransactionsLoading = false,
  isTouchpointsLoading = false,
  reviewsPage = null,
  isReviewsPending = false,
}) {
  const { currentLanguage, t } = useTranslation()
  const { showToast } = useNotification()
  const navigate = useNavigate()
  const downloadTouchpointQrMutation = useDownloadTouchpointQr()

  const pendingConfirmCount = useMemo(
    () => (transactions || []).filter(isAwaitingShopConfirmation).length,
    [transactions],
  )
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isMasterQrDownloading, setIsMasterQrDownloading] = useState(false)
  const [copiedPaymentLinkId, setCopiedPaymentLinkId] = useState(null)
  const dropdownRef = useRef(null)

  const reviewsSummary = useMemo(() => {
    const items = reviewsPage?.items ?? []
    const totalCount = reviewsPage?.totalCount ?? items.length
    return { totalCount, items }
  }, [reviewsPage])

  // The "Master Store QR" (general pool tips) must point to a REAL backing
  // touch point — there is no store-level "general" touch page on the API
  // (every customer touch URL needs a touchPointSlug). Prefer a FrontDesk
  // touch point (the lobby/master created at onboarding), else the first one.
  const masterTouchpoint = useMemo(() => resolveMasterTouchpoint(touchpoints), [touchpoints])

  const masterQrLink = useMemo(() => {
    if (masterTouchpoint?.url) {
      return toLocalCustomerTouchUrl(String(masterTouchpoint.url))
    }

    const businessSlug = (businessName || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    const touchSlug = masterTouchpoint?.slug || 'general'
    return `${window.location.origin}/touch/${businessSlug}/${touchSlug}`
  }, [masterTouchpoint, businessName])

  const masterQrPreviewUrl = useMemo(
    () => buildQrImageUrl(masterQrLink, 150, masterTouchpoint?.qrImageUrl),
    [masterQrLink, masterTouchpoint?.qrImageUrl],
  )

  const masterQrTarget = useMemo(() => buildMasterQrTarget(touchpoints), [touchpoints])

  const handleDownloadMasterQr = useCallback(async () => {
    setIsMasterQrDownloading(true)
    try {
      if (masterTouchpoint?.id) {
        await downloadTouchpointQrMutation.mutateAsync({
          id: masterTouchpoint.id,
          format: 'png',
        })
      } else {
        await downloadQrCode(buildQrImageUrl(masterQrLink, 1000), 'master-qr.png')
      }
      showToast(t('components.SettingsView.qrCodeDownloaded'), 'success')
    } catch {
      showToast(t('components.dashboard.overview.Overview.qr_download_failed'), 'error')
    } finally {
      setIsMasterQrDownloading(false)
    }
  }, [
    masterTouchpoint?.id,
    masterQrLink,
    downloadTouchpointQrMutation,
    showToast,
    t,
  ])

  const handleCopyPaymentLink = useCallback((value, id) => {
    if (!value) return
    navigator.clipboard.writeText(value)
    setCopiedPaymentLinkId(id)
    showToast(t('dashboard.master_gateway.copied_qr_link'), 'success')
    window.setTimeout(() => setCopiedPaymentLinkId(null), 2000)
  }, [showToast, t])

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const dateRangeOptions = useMemo(() => {
    const formatDateStr = (str) => {
      const d = new Date(str + 'T00:00:00Z');
      if (isNaN(d.getTime())) return str;
      if (currentLanguage === 'vi') {
        return `${d.getUTCDate()} thg ${d.getUTCMonth() + 1}, ${d.getUTCFullYear()}`;
      }
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
    };

    const subtractDays = (dateStr, days) => {
      const d = new Date(dateStr + 'T00:00:00Z');
      if (isNaN(d.getTime())) return dateStr;
      d.setUTCDate(d.getUTCDate() - days);
      return d.toISOString().split('T')[0];
    };

    let refEndDate = chartEndDate || new Date().toISOString().split('T')[0];
    if (transactions && transactions.length > 0) {
      let maxDate = refEndDate;
      transactions.forEach(tx => {
        if (tx.dateTime) {
          const dateStr = tx.dateTime.split(' ')[0];
          if (dateStr > maxDate && dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
            maxDate = dateStr;
          }
        }
      });
      refEndDate = maxDate;
    }

    return [
      { 
        value: '7 Days', 
        label: `${formatDateStr(subtractDays(refEndDate, 6))} - ${formatDateStr(refEndDate)}` 
      },
      { 
        value: '30 Days', 
        label: `${formatDateStr(subtractDays(refEndDate, 29))} - ${formatDateStr(refEndDate)}` 
      },
      { 
        value: '90 Days', 
        label: `${formatDateStr(subtractDays(refEndDate, 89))} - ${formatDateStr(refEndDate)}` 
      },
      { 
        value: '180 Days', 
        label: `${formatDateStr(subtractDays(refEndDate, 179))} - ${formatDateStr(refEndDate)}` 
      },
      { 
        value: '365 Days', 
        label: `${formatDateStr(subtractDays(refEndDate, 364))} - ${formatDateStr(refEndDate)}` 
      },
      {
        value: 'Custom',
        label: t('components.dashboard.overview.Overview.custom')
      }
    ];
  }, [transactions, chartEndDate, currentLanguage]);

  const selectedLabel = useMemo(() => {
    if (chartRange === 'Custom') {
      const formatDateStr = (str) => {
        const d = new Date(str + 'T00:00:00Z');
        if (isNaN(d.getTime())) return str;
        if (currentLanguage === 'vi') {
          return `${d.getUTCDate()} thg ${d.getUTCMonth() + 1}, ${d.getUTCFullYear()}`;
        }
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
      };
      return `${formatDateStr(chartStartDate)} - ${formatDateStr(chartEndDate)}`;
    }
    const opt = dateRangeOptions.find(o => o.value === chartRange);
    return opt ? opt.label : dateRangeOptions[0].label;
  }, [chartRange, chartStartDate, chartEndDate, dateRangeOptions, currentLanguage]);

  const reviewMetrics = useMemo(() => ({
    googleRating: metrics.googleAvgRating ?? 0,
    googleReviewCount: metrics.googleReviewCount ?? 0,
    yelpRating: metrics.yelpAvgRating ?? 0,
    yelpReviewCount: metrics.yelpReviewCount ?? 0,
    responseRate: metrics.responseRate ?? 0,
    responseRateLabel: metrics.responseRateLabel ?? null,
    returningCustomers: metrics.returningCustomerRate ?? 0,
    returningCustomersDelta: metrics.returningCustomerRateChangeVsLastWeek ?? 0,
  }), [metrics])

  const hasMasterGateway = Boolean(masterTouchpoint)

  if (isLoading) {
    return (
      <div className="space-y-8">
        {!hasSetup && (
          <div className="mb-6">
            <SetupGuideBanner onStartSetup={onStartSetup} />
          </div>
        )}
        <OverviewSkeleton />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {!hasSetup && (
        <div className="mb-6">
          <SetupGuideBanner onStartSetup={onStartSetup} />
        </div>
      )}

      {hasSetup && (
        <PayoutSetupWarningBanner />
      )}

      {pendingConfirmCount > 0 && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-violet-100 bg-violet-50/70 px-4 py-3">
          <div className="flex items-center gap-2.5">
            <Hourglass className="h-4 w-4 shrink-0 text-violet-500" />
            <div>
              <p className="text-xs font-bold text-violet-800">
                {t('merchant_dashboard.tips.pending_banner_title', { count: pendingConfirmCount })}
              </p>
              <p className="text-[10px] text-violet-600 mt-0.5">
                {t('merchant_dashboard.tips.pending_banner_desc')}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate('/dashboard/reports?status=AwaitingShopConfirmation')}
            className="shrink-0 rounded-lg bg-violet-600 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-white hover:bg-violet-700 transition cursor-pointer whitespace-nowrap"
          >
            {t('merchant_dashboard.tips.pending_view_cta')} →
          </button>
        </div>
      )}

      {/* Header Overview Row */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between" ref={dropdownRef}>
        <h1 className="text-xl font-extrabold tracking-tight text-nexoraText uppercase">
          {t('dashboard.overview_title')}
        </h1>
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="inline-flex h-10 items-center justify-between gap-3 rounded-lg border border-nexoraBorder bg-white px-4 py-2 text-xs font-bold text-nexoraText hover:bg-nexoraSurfaceMuted transition cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-nexoraMuted" />
              <span>{selectedLabel}</span>
            </div>
            <span className="text-nexoraMuted">▼</span>
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 mt-1 z-30 w-64 rounded-lg border border-nexoraBorder bg-white py-1 shadow-lg">
              {dateRangeOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    setChartRange(opt.value)
                    setIsDropdownOpen(false)
                  }}
                  className={`flex w-full items-center justify-between px-4 py-2.5 text-left text-xs font-bold transition hover:bg-nexoraSurfaceMuted ${
                    chartRange === opt.value ? 'text-nexoraBrand bg-nexoraCanvas' : 'text-nexoraText'
                  }`}
                >
                  <span>{opt.label}</span>
                    <span className="text-[10px] text-nexoraMuted uppercase tracking-wider">{opt.value === 'Custom' ? t('common.custom') : opt.value}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>



      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {isTransactionsLoading ? (
          Array.from({ length: 4 }, (_, index) => <SkeletonKpiCard key={index} />)
        ) : (
          <>
            <KpiCard
              label={t('dashboard.kpi.total_tips')}
              value={formatCurrency(metrics.totalTips)}
              deltaPercent={kpiDeltas?.totalTips ?? null}
              active={activeKpi === 'tips'}
              onClick={() => setActiveKpi('tips')}
            />
            <KpiCard
              label={t('dashboard.kpi.total_transactions')}
              value={metrics.totalTransactions.toString()}
              deltaPercent={kpiDeltas?.totalTransactions ?? null}
              active={activeKpi === 'transactions'}
              onClick={() => setActiveKpi('transactions')}
            />
            <KpiCard
              label={t('dashboard.kpi.avg_tip')}
              value={formatCurrency(metrics.averageTip)}
              deltaPercent={kpiDeltas?.averageTip ?? null}
              active={activeKpi === 'avg_tip'}
              onClick={() => setActiveKpi('avg_tip')}
            />
            <KpiCard
              label={t('dashboard.kpi.total_reviews')}
              value={reviewsSummary.totalCount.toString()}
              deltaPercent={kpiDeltas?.totalReviews ?? null}
              active={activeKpi === 'reviews'}
              onClick={() => setActiveKpi('reviews')}
            />
          </>
        )}
      </div>

      {/* Panels Grid */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(340px,1fr)]">
        <TipsOverTimePanel
          range={chartRange}
          setRange={setChartRange}
          chartStartDate={chartStartDate}
          chartEndDate={chartEndDate}
          setChartStartDate={setChartStartDate}
          setChartEndDate={setChartEndDate}
        />
        <StaffLeaderboardPanel
          selectedStaff={selectedStaff}
          setSelectedStaff={setSelectedStaff}
          hasKyb={hasKyb}
          chartStartDate={chartStartDate}
          chartEndDate={chartEndDate}
          onOpenStaff={onOpenStaff}
        />
      </div>

      {/* Master Gateways Panel */}
      <Panel className="p-7">
        <h2 className="text-sm font-extrabold text-nexoraText uppercase tracking-wider">
          {t('dashboard.master_gateway.title')}
        </h2>
        <p className="mt-1 text-xs text-nexoraMuted">
          {t('dashboard.master_gateway.subtitle')}
        </p>

        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
          {isTouchpointsLoading ? (
            <>
              <Skeleton height={196} borderRadius={12} />
              <Skeleton height={196} borderRadius={12} />
            </>
          ) : !hasMasterGateway ? (
            <div className="md:col-span-2">
              <OverviewEmptyState
                icon={QrCode}
                title={t('components.dashboard.overview.Overview.gateway_empty_title')}
                description={t('components.dashboard.overview.Overview.gateway_empty_desc')}
                actionLabel={t('components.dashboard.overview.Overview.gateway_empty_action')}
                onAction={onOpenTouchpoints}
              />
            </div>
          ) : (
            <>
          {/* Master QR section */}
          <MasterWelcomeQrPanel
            t={t}
            qrPreviewUrl={masterQrPreviewUrl}
            qrLink={masterQrLink}
            onPreview={() => previewQr(masterQrTarget)}
            onDownload={handleDownloadMasterQr}
            isDownloading={isMasterQrDownloading || downloadTouchpointQrMutation.isPending}
            showToast={showToast}
          />

          {/* Direct Payment QR section */}
          <SettingsTipQrPanel
            variant="gateway"
            hideUrlCode
            businessName={businessName}
            showToast={showToast}
            handleCopy={handleCopyPaymentLink}
            copiedId={copiedPaymentLinkId}
            t={t}
            onConfigurePayoutMethods={() => navigate('/dashboard/settings?tab=payout')}
          />
            </>
          )}
        </div>
      </Panel>

      {/* Review metrics — Google / Yelp / Response / Returning */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <ReviewMetricCard
          label={t('dashboard.review_kpi.google_reviews')}
          value={formatRatingValue(reviewMetrics.googleRating)}
          footer={(
            <>
              {renderStars(reviewMetrics.googleRating)}
              <div className="text-xs text-nexoraMuted">
                {t('dashboard.review_kpi.reviews_count', { count: reviewMetrics.googleReviewCount })}
              </div>
            </>
          )}
        />
        <ReviewMetricCard
          label={t('dashboard.review_kpi.yelp_reviews')}
          value={formatRatingValue(reviewMetrics.yelpRating)}
          footer={(
            <>
              {renderStars(reviewMetrics.yelpRating)}
              <div className="text-xs text-nexoraMuted">
                {t('dashboard.review_kpi.reviews_count', { count: reviewMetrics.yelpReviewCount })}
              </div>
            </>
          )}
        />
        <ReviewMetricCard
          label={t('dashboard.review_kpi.response_rate')}
          value={`${toPercentValue(reviewMetrics.responseRate)}%`}
          footer={reviewMetrics.responseRateLabel ? (
            <div className="text-xs font-bold text-nexoraMuted">
              {getResponseRateLabelText(reviewMetrics.responseRateLabel, t)}
            </div>
          ) : null}
        />
        <ReviewMetricCard
          label={t('dashboard.review_kpi.returning_customers')}
          value={`${toPercentValue(reviewMetrics.returningCustomers)}%`}
          deltaPercent={reviewMetrics.returningCustomersDelta}
          showComparison
        />
      </div>
    </div>
  )
}

export default Overview
