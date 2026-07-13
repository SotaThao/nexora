import { useMemo, useState } from 'react'
import {
  Star,
  Users,
  Gift,
  ChevronRight,
  ArrowUpRight,
  CircleDollarSign,
  Hourglass,
  ReceiptText,
  TrendingUp,
  UserPlus,
  QrCode,
  BarChart3,
  CreditCard,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from '../../../contexts/LanguageContext'
import { buildMasterQrTarget, resolveMasterTouchpoint } from '../utils'
import { isAwaitingShopConfirmation } from '../utils'
import { isMerchantConfirmablePending } from '../../../utils/merchantStaffPending'
import SetupGuideBanner from './SetupGuideBanner'
import PayoutSetupWarningBanner from './PayoutSetupWarningBanner'
import ActiveBannersCarousel from './ActiveBannersCarousel'
import DirectPaymentQrPreviewModal from '../../settings/DirectPaymentQrPreviewModal'
import { useProfileSettings } from '../../../data/hooks/useProfileSettings'
import { useMerchantPaymentQr } from '../../../data/hooks/useMerchantPayments'
import { buildPublicQrImageUrl } from '../../../data/repositories/publicQr'
import { resolveDirectPaymentPageUrl, resolveMerchantBusinessIdFromProfile } from '../../../utils/merchantBusinessId'
import { buildQrImageUrl, toLocalCustomerTouchUrl } from '../../../utils/staffTipUrl'
import { getWebUrlOrigin } from '../../../utils/webUrlBase'
import QrImage from '../../ui/QrImage'

function fmtMoneyCompact(value) {
  const n = Number(value || 0)
  if (n >= 1000) return `$${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k`
  return `$${n.toFixed(0)}`
}

function fmtMoneySaved(value) {
  const n = Number(value || 0)
  if (n >= 1000) return `$${Math.round(n).toLocaleString()}`
  return `$${n.toFixed(2)}`
}

function fmtNumber(value) {
  const n = Number(value || 0)
  if (n >= 1000) return n.toLocaleString()
  return String(n)
}

function clampPct(n) {
  return Math.max(0, Math.min(100, n))
}

const QUICK_ACTION_ACCENTS = {
  staff: 'border-[#DDD8FF] bg-[#F4F2FF]',
  qr: 'border-emerald-200 bg-emerald-50',
  reports: 'border-orange-200 bg-orange-50',
  reviews: 'border-rose-200 bg-rose-50',
}

const QUICK_ACTION_ICON_COLORS = {
  staff: 'text-nexoraBrandDark',
  qr: 'text-nexoraSuccess',
  reports: 'text-orange-500',
  reviews: 'text-rose-500',
}

/* ─── KPI Card (top row style: icon+label left, arrow top-right, value, trend badge) ── */
function KpiCardTop({ icon, iconBg, label, value, trend, trendColor = 'text-emerald-600', trendBg = 'bg-emerald-50', onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-lg border border-[#EEE9FF] bg-white p-2.5 text-left shadow-[0_8px_18px_rgba(70,72,212,0.08)] transition-all duration-200 focus:outline-none active:scale-[0.98]"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.5">
          <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-white ${iconBg}`}>
            {icon}
          </span>
          <span className="truncate text-[9px] font-semibold uppercase text-nexoraSubtle">{label}</span>
        </div>
        <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-nexoraSuccess" />
      </div>
      <div className="mt-1 flex items-baseline justify-between gap-2">
        <p className="text-base font-semibold leading-none text-nexoraText">{value}</p>
      {trend && (
        <span className={`inline-flex min-w-0 items-center gap-0.5 truncate text-[11px] font-semibold ${trendColor} ${trendBg}`}>
          <TrendingUp className="h-3 w-3 shrink-0" aria-hidden="true" />
          {trend}
        </span>
      )}
      </div>
    </button>
  )
}

/* ─── KPI Card (bottom row style: icon+label left, chevron right, value, sub text) ── */
function KpiCardBottom({ icon, iconBg, label, value, sub, subColor = 'text-nexoraMuted', onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-lg border border-[#EEE9FF] bg-white p-2.5 text-left shadow-[0_8px_18px_rgba(70,72,212,0.08)] transition-all duration-200 focus:outline-none active:scale-[0.98]"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.5">
          <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-white ${iconBg}`}>
            {icon}
          </span>
          <span className="truncate text-[9px] font-semibold uppercase text-nexoraSubtle">{label}</span>
        </div>
        <ChevronRight className="h-3.5 w-3.5 shrink-0 text-nexoraSubtle" />
      </div>
      <div className="mt-1 flex items-baseline justify-between gap-2">
        <p className="text-base font-semibold leading-none text-nexoraText">{value}</p>
        {sub && <p className={`truncate text-[11px] font-semibold ${subColor}`}>{sub}</p>}
      </div>
    </button>
  )
}

/* ─── Quick Action ───────────────────────────────────────────────────────── */
function QuickAction({ icon, label, onClick, accent }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`grid h-14 content-center justify-items-center gap-1 rounded-lg border px-1 text-center transition active:scale-95 ${accent || 'border-[#EEE9FF] bg-white'}`}
    >
      {icon}
      <span className="text-[10px] font-semibold leading-none text-nexoraText">{label}</span>
    </button>
  )
}

/* ─── Panel wrapper ──────────────────────────────────────────────────────── */
function Panel({ title, action, onAction, children }) {
  return (
    <section className="space-y-1.5 px-0.5">
      <div className="mb-1.5 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-nexoraText">{title}</h2>
        {action && (
          <button type="button" onClick={onAction} className="inline-flex h-7 min-w-[56px] items-center justify-center rounded-md px-2 text-[11px] font-semibold text-nexoraBrandDark transition">
            {action}
          </button>
        )}
      </div>
      {children}
    </section>
  )
}

function MerchantQrCard({ icon, title, subtitle, actionLabel, onAction, qrImageSrc, accent = 'border-[#DDD8FF] bg-[#F4F2FF] text-nexoraBrandDark' }) {
  return (
    <button
      type="button"
      onClick={onAction}
      className={`min-h-[106px] rounded-xl border p-2 text-left transition active:scale-[0.98] ${accent}`}
    >
      <div className="flex h-full items-start gap-2">
        <span className="grid h-[52px] w-[52px] shrink-0 place-items-center rounded-lg border-4 border-white bg-white shadow-[0_8px_18px_rgba(70,72,212,0.08)]">
          {qrImageSrc ? (
            <QrImage src={qrImageSrc} alt={title} className="h-full w-full" />
          ) : (
            icon
          )}
        </span>
        <div className="flex min-w-0 flex-1 flex-col">
          <p className="truncate text-[9px] font-semibold uppercase text-current">{title}</p>
          <p className="mt-0.5 line-clamp-2 min-h-[26px] text-[9px] font-medium leading-[13px] text-nexoraMuted">{subtitle}</p>
          <span className="mt-1.5 inline-flex h-7 w-fit items-center justify-center rounded-lg bg-white px-3 text-[10px] font-semibold text-nexoraBrandDark shadow-sm">
            {actionLabel}
          </span>
        </div>
      </div>
    </button>
  )
}

function compactName(value) {
  return String(value || '').trim() || '—'
}

function initialsFor(value) {
  const parts = compactName(value).split(/\s+/).filter(Boolean)
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  return compactName(value).slice(0, 2).toUpperCase()
}

function statusPillClass(status) {
  const normalized = String(status || '').toLowerCase()
  if (normalized.includes('active')) return 'bg-nexoraSuccess/10 text-nexoraSuccess'
  if (normalized.includes('pending')) return 'bg-nexoraWarning/10 text-nexoraWarning'
  return 'bg-nexoraDanger/10 text-nexoraDanger'
}

/* ─── Main Overview (mobile / app-master "Owner Pro" home) ───────────────── */
function Overview({
  metrics = {},
  setActiveKpi,
  transactions = [],
  onOpenReviews,
  businessName,
  previewQr,
  touchpoints = [],
  hasSetup = true,
  onStartSetup,
  profile,
  onNavigateMenu,
  onOpenAddStaff,
  onApproveClick,
  pendingStaff = [],
  staff = [],
  metricsMonth = null,
  metricsYear = null,
  isTouchpointsLoading = false,
}: any) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [isPaymentQrPreviewOpen, setIsPaymentQrPreviewOpen] = useState(false)
  const { data: userProfile } = useProfileSettings()
  const { data: paymentQr } = useMerchantPaymentQr()

  const k = (key: string, vars?: Record<string, string | number>) =>
    t(`dashboard.owner_home.${key}`, vars)

  const masterQrTarget = useMemo(() => buildMasterQrTarget(touchpoints), [touchpoints])
  const masterTouchpoint = useMemo(() => resolveMasterTouchpoint(touchpoints), [touchpoints])
  const masterQrLink = useMemo(() => {
    if (masterTouchpoint?.url) {
      return toLocalCustomerTouchUrl(String(masterTouchpoint.url))
    }

    const businessSlug = (businessName || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    const touchSlug = masterTouchpoint?.slug || 'general'
    return `${getWebUrlOrigin()}/touch/${businessSlug}/${touchSlug}`
  }, [masterTouchpoint, businessName])
  const masterQrPreviewUrl = useMemo(
    () => buildQrImageUrl(masterQrLink, 150, masterTouchpoint?.qrImageUrl),
    [masterQrLink, masterTouchpoint?.qrImageUrl],
  )
  const paymentBusinessId = useMemo(
    () => resolveMerchantBusinessIdFromProfile(userProfile),
    [userProfile],
  )
  const paymentPageUrl = useMemo(
    () =>
      resolveDirectPaymentPageUrl({
        businessId: paymentBusinessId,
        paymentUrlFromApi: paymentQr?.paymentUrl,
      }),
    [paymentBusinessId, paymentQr?.paymentUrl],
  )
  const paymentQrPreviewUrl = useMemo(
    () => (paymentPageUrl ? buildPublicQrImageUrl(paymentPageUrl, 150) : ''),
    [paymentPageUrl],
  )
  const paymentQrModalUrl = useMemo(
    () => (paymentPageUrl ? buildPublicQrImageUrl(paymentPageUrl, 280) : ''),
    [paymentPageUrl],
  )

  // ── Derived metrics from overview API (month & year) ────────────────────
  const FEE_RATE = 0.03
  const monthTips = metricsMonth?.totalTips ?? 0
  const monthTxCount = metricsMonth?.totalTransactions ?? 0
  const yearTips = metricsYear?.totalTips ?? 0
  const moneySavedMonth = monthTips * FEE_RATE
  const moneySavedYear = yearTips * FEE_RATE

  const pendingConfirmCount = useMemo(
    () => (transactions || []).filter(isAwaitingShopConfirmation).length,
    [transactions],
  )

  const activeStaff = (staff || []).filter((m) => m.status === 'Active' || m.active === true)
  const pendingCount = (pendingStaff || []).filter(isMerchantConfirmablePending).length
  const displayPendingStaff = (pendingStaff || []).filter(isMerchantConfirmablePending).slice(0, 2)
  const displayStaffStatus = (staff || []).slice(0, 4)
  const rating = Number(metrics.averageRating || 0)
  const totalReviews = Number(metrics.totalReviews || 0)

  // Month-over-month trend percentages (mock for now — will come from API)
  const tipsTrend = metricsMonth?.tipsDeltaPercent
  const txTrend = metricsMonth?.txDeltaPercent

  return (
    <>
    <div className="-m-4 space-y-3 bg-[linear-gradient(180deg,#FFFFFF_0%,#FFFFFF_34%,#F8F7FF_68%,#F1EFFF_100%)] p-4 pb-4 text-nexoraText sm:-m-6 sm:p-6 sm:pb-6">
      {!hasSetup && (
        <div className="mb-1">
          <SetupGuideBanner onStartSetup={onStartSetup} />
        </div>
      )}

      {hasSetup && (
        <PayoutSetupWarningBanner />
      )}

      <header className="space-y-1 px-0.5">
        <div className="flex items-center gap-1.5">
          <span className="rounded-full bg-[#EEE9FF] px-2 py-0.5 text-[9px] font-semibold uppercase leading-none text-nexoraBrandDark">
            Owner
          </span>
          <span className="truncate text-[10px] font-semibold leading-none text-nexoraSubtle">
            {businessName || 'Merchant'}
          </span>
        </div>
        <h1 className="text-[15px] font-semibold leading-tight tracking-tight text-nexoraText">
          Dashboard
        </h1>
      </header>

      {/* ── Hero: Money Saved card ───────────────────────────────────────── */}
      <section className="rounded-lg border border-[#EEE9FF] bg-[linear-gradient(135deg,#FFFFFF_0%,#F7F8FF_58%,#F0EEFF_100%)] p-3 shadow-[0_10px_22px_rgba(70,72,212,0.10)]">
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-3">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-nexoraSubtle">
            {k('money_saved_title')}
          </span>
          <span className="shrink-0 whitespace-nowrap rounded-full bg-[#EEE9FF] px-1.5 py-1 text-center text-[9px] font-semibold leading-none text-nexoraBrandDark">
            {k('fee_estimate_badge')}
          </span>
          </div>
          <div className="grid grid-cols-[minmax(0,1fr)_154px] items-end gap-3">
            <div className="min-w-0">
              <h2 className="text-2xl font-semibold leading-none text-nexoraText">
                {fmtMoneySaved(moneySavedMonth)}
              </h2>
              <p className="mt-1 text-[11px] font-medium leading-4 text-nexoraMuted">
                {k('money_saved_subtitle')}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => navigate('/dashboard/tips?tab=savings')}
                className="inline-flex h-7 w-full items-center justify-center rounded-full bg-nexoraBrand px-3 text-[10px] font-semibold text-white transition active:scale-95"
              >
                {k('view_btn')}
              </button>
              <button
                type="button"
                onClick={() => navigate('/dashboard/tips?tab=savings')}
                className="inline-flex h-7 w-full items-center justify-center rounded-full border border-[#EEE9FF] bg-white px-3 text-[10px] font-semibold text-nexoraBrandDark shadow-[0_2px_8px_rgba(15,23,42,0.04)] transition active:scale-95"
              >
                {k('export_btn')}
              </button>
            </div>
          </div>
        </div>
      </section>

      {pendingConfirmCount > 0 && (
        <button
          type="button"
          onClick={() => navigate('/dashboard/reports?status=AwaitingShopConfirmation')}
          className="flex w-full items-center gap-3 rounded-2xl border border-violet-100 bg-violet-50 px-4 py-3 text-left active:scale-[0.98] transition cursor-pointer"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-100">
            <Hourglass className="h-4 w-4 text-violet-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-violet-800">
              {t('merchant_dashboard.tips.pending_banner_title', { count: pendingConfirmCount })}
            </p>
            <p className="text-[10px] text-violet-500 mt-0.5 truncate">
              {t('merchant_dashboard.tips.pending_card_hint')}
            </p>
          </div>
          <ChevronRight className="h-4 w-4 shrink-0 text-violet-400" />
        </button>
      )}

      {/* ── KPI 2×2 ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-1.5">
        {/* Row 1: Direct Tips + Transactions (arrow-up-right style) */}
        <KpiCardTop
          icon={<CircleDollarSign className="h-3.5 w-3.5" />}
          iconBg="bg-nexoraBrand"
          label={k('kpi_direct_tips')}
          value={fmtMoneyCompact(monthTips)}
          trend={tipsTrend != null ? `+${Number(tipsTrend).toFixed(1)}%` : null}
          trendColor="text-emerald-600"
          trendBg=""
          onClick={() => setActiveKpi?.('tips')}
        />
        <KpiCardTop
          icon={<ReceiptText className="h-3.5 w-3.5" />}
          iconBg="bg-nexoraBrand"
          label={k('kpi_transactions')}
          value={fmtNumber(monthTxCount)}
          trend={txTrend != null ? `+${Number(txTrend).toFixed(1)}%` : null}
          trendColor="text-emerald-600"
          trendBg=""
          onClick={() => onNavigateMenu?.('reports')}
        />
        {/* Row 2: Active Staff + Review Score (chevron style) */}
        <KpiCardBottom
          icon={<Users className="h-3.5 w-3.5" />}
          iconBg="bg-nexoraBrand"
          label={k('kpi_active_staff')}
          value={String(activeStaff.length)}
          sub={pendingCount > 0 ? k('need_action_count', { count: pendingCount }) : k('staff_active', { count: activeStaff.length })}
          subColor={pendingCount > 0 ? 'text-nexoraBrand font-semibold' : 'text-nexoraBrand'}
          onClick={() => onNavigateMenu?.('staff')}
        />
        <KpiCardBottom
          icon={<Star className="h-3.5 w-3.5 fill-white" />}
          iconBg="bg-amber-400"
          label={k('kpi_review_score')}
          value={rating > 0 ? rating.toFixed(1) : '—'}
          sub={totalReviews > 0 ? k('reviews_count', { count: totalReviews }) : k('no_reviews_yet')}
          subColor="text-nexoraBrand font-semibold"
          onClick={() => onOpenReviews?.()}
        />
      </div>

      {/* ── Quick Actions ────────────────────────────────────────────────── */}
      <Panel title={k('quick_actions')} action={k('manage')} onAction={() => onNavigateMenu?.('touchpoints')}>
        <div className="grid grid-cols-4 gap-2">
          <QuickAction
            icon={<UserPlus className={`h-4 w-4 ${QUICK_ACTION_ICON_COLORS.staff}`} />}
            label={k('quick_staff')}
            accent={QUICK_ACTION_ACCENTS.staff}
            onClick={() => onNavigateMenu?.('staff')}
          />
          <QuickAction
            icon={<CreditCard className={`h-4 w-4 ${QUICK_ACTION_ICON_COLORS.qr}`} />}
            label={k('quick_payouts')}
            accent={QUICK_ACTION_ACCENTS.qr}
            onClick={() => navigate('/dashboard/tips?tab=payouts')}
          />
          <QuickAction
            icon={<BarChart3 className={`h-4 w-4 ${QUICK_ACTION_ICON_COLORS.reports}`} />}
            label={k('quick_reports')}
            accent={QUICK_ACTION_ACCENTS.reports}
            onClick={() => onNavigateMenu?.('reports')}
          />
          <QuickAction
            icon={<Star className={`h-4 w-4 ${QUICK_ACTION_ICON_COLORS.reviews}`} />}
            label={k('quick_reviews')}
            accent={QUICK_ACTION_ACCENTS.reviews}
            onClick={() => onOpenReviews?.()}
          />
        </div>
      </Panel>

      {/* ── Master + Payment QR ──────────────────────────────────────────── */}
      <Panel title={t('dashboard.master_gateway.title')} action={t('staff_dashboard.home.manage')} onAction={() => onNavigateMenu?.('touchpoints')}>
        <div className="grid grid-cols-2 gap-2">
          <MerchantQrCard
            icon={<QrCode className="h-6 w-6 text-nexoraBrandDark" />}
            qrImageSrc={masterQrPreviewUrl}
            title={t('dashboard.master_gateway.qr_title')}
            subtitle={k('master_qr_short')}
            actionLabel={t('components.settings.SettingsTipQrPanel.btn_open')}
            onAction={() => previewQr?.(masterQrTarget)}
          />
          <MerchantQrCard
            icon={<CreditCard className="h-6 w-6 text-nexoraSuccess" />}
            qrImageSrc={paymentQrPreviewUrl}
            title={t('dashboard.master_gateway.payment_title')}
            subtitle={k('payment_qr_short')}
            actionLabel={t('dashboard.master_gateway.btn_open')}
            onAction={() => {
              if (paymentPageUrl) {
                setIsPaymentQrPreviewOpen(true)
                return
              }
              navigate('/dashboard/settings?tab=profile')
            }}
            accent="border-emerald-200 bg-emerald-50 text-nexoraSuccess"
          />
        </div>
      </Panel>

      {/* ── Pending Confirmations + Staff Status ─────────────────────────── */}
      <div className="space-y-2">
        <Panel title={t('staff_dashboard.home.pending_confirmations')} action={t('staff_dashboard.home.view_all')} onAction={() => onNavigateMenu?.('staff')}>
          <div className="rounded-lg border border-[#EEE9FF] bg-white p-2.5 shadow-[0_8px_18px_rgba(70,72,212,0.08)]">
            {displayPendingStaff.length === 0 ? (
              <p className="py-3 text-center text-[10px] font-medium text-nexoraSubtle">{t('staff_dashboard.home.no_pending')}</p>
            ) : (
              <div className="space-y-1.5">
                {displayPendingStaff.map((item) => {
                  const name = compactName(item.nickname || item.fullName || item.name || item.email)
                  return (
                    <div key={item.id || item.staffProfileId || name} className="grid grid-cols-[24px_minmax(0,1fr)_auto] items-center gap-1.5">
                      <span className="grid h-6 w-6 place-items-center rounded-full bg-nexoraBrand/10 text-[8px] font-semibold text-nexoraBrandDark">
                        {initialsFor(name)}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-[9px] font-semibold text-nexoraText">{name}</p>
                        <p className="truncate text-[8px] font-medium text-nexoraMuted">{k('via_link_request')}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => onApproveClick?.(item)}
                        className="inline-flex h-6 min-w-[52px] items-center justify-center rounded-full border border-[#EEE9FF] bg-white px-2 text-[10px] font-semibold text-nexoraBrandDark"
                      >
                        {t('staff_dashboard.home.confirm')}
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </Panel>

        <Panel title={k('staff_status_title')} action={k('manage')} onAction={() => onNavigateMenu?.('staff')}>
          <div className="rounded-lg border border-[#EEE9FF] bg-white p-2.5 shadow-[0_8px_18px_rgba(70,72,212,0.08)]">
            {displayStaffStatus.length === 0 ? (
              <p className="py-3 text-center text-[10px] font-medium text-nexoraSubtle">{k('no_staff')}</p>
            ) : (
              <div className="space-y-1.5">
                {displayStaffStatus.map((member) => {
                  const name = compactName(member.nickname || member.fullName || member.name || member.email)
                  const status = member.status || (member.active ? 'Active' : 'Inactive')
                  return (
                    <div key={member.id || member.staffProfileId || name} className="grid grid-cols-[24px_minmax(0,1fr)_auto] items-center gap-1.5">
                      <span className="grid h-6 w-6 place-items-center rounded-full bg-nexoraBrand/10 text-[8px] font-semibold text-nexoraBrandDark">
                        {initialsFor(name)}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-[9px] font-semibold text-nexoraText">{name}</p>
                        <p className="truncate text-[8px] font-medium text-nexoraMuted">{member.position || k('technician')}</p>
                      </div>
                      <span className={`rounded-full px-1.5 py-0.5 text-[8px] font-semibold ${statusPillClass(status)}`}>
                        {status}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </Panel>
      </div>

      {/* ── Savings Summary ──────────────────────────────────────────────── */}
      <Panel title={k('savings_summary_title')} action={k('details')} onAction={() => navigate('/dashboard/tips?tab=savings')}>
        <div className="grid grid-cols-2 gap-2">
          {/* This Month — mint/teal soft card per mockup */}
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-2.5">
            <small className="text-[9px] font-semibold uppercase text-nexoraSuccess">{k('this_month')}</small>
            <h3 className="mt-1 text-lg font-semibold leading-none text-nexoraText">{fmtMoneySaved(moneySavedMonth)}</h3>
            <p className="mt-0.5 text-[11px] font-medium text-nexoraMuted">{k('fee_basis', { tips: fmtMoneyCompact(monthTips) })}</p>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-nexoraSuccess/10">
              <span
                className="block h-full rounded-full bg-nexoraSuccess"
                style={{ width: `${clampPct(yearTips > 0 ? (monthTips / yearTips) * 100 : 0)}%` }}
              />
            </div>
          </div>
          {/* This Year — purple soft card per mockup */}
          <div className="rounded-xl border border-[#DDD8FF] bg-[#F4F2FF] p-2.5">
            <small className="text-[9px] font-semibold uppercase text-nexoraBrandDark">{k('this_year')}</small>
            <h3 className="mt-1 text-lg font-semibold leading-none text-nexoraText">{fmtMoneySaved(moneySavedYear)}</h3>
            <p className="mt-0.5 text-[11px] font-medium text-nexoraMuted">{k('estimated_saved')}</p>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#EEE9FF]">
              <span
                className="block h-full rounded-full bg-nexoraBrand"
                style={{ width: `${clampPct(((new Date().getMonth() + 1) / 12) * 100)}%` }}
              />
            </div>
          </div>
        </div>
      </Panel>

      {/* ── Active Banners Carousel / Fallback Banner ────────────────────── */}
      <ActiveBannersCarousel fallbackAlt={k('promo_tagline')} />

      {/* ── Invite Banner ────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-[22px] border border-transparent bg-[linear-gradient(100deg,#3F44D7_0%,#5B48F0_52%,#8A35FF_100%)] px-3 py-3.5 text-white shadow-[0_14px_28px_rgba(70,72,212,0.22)]">
        <div className="absolute -top-6 -right-6 h-24 w-24 rounded-full bg-white/10" />
        <div className="relative flex items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[12px] bg-white/10 text-white ring-1 ring-white/25">
            <Gift className="h-[18px] w-[18px] text-white" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[14px] font-black leading-tight text-white">{k('invite_merchant_title')}</p>
            <p className="mt-0.5 text-[12px] font-semibold leading-tight text-white/70">{k('invite_merchant_subtitle')}</p>
          </div>
          <button
            type="button"
            onClick={() => onOpenAddStaff?.()}
            className="inline-flex h-9 min-w-[57px] shrink-0 items-center justify-center rounded-full bg-white px-4 text-[12px] font-black text-nexoraBrandDark shadow-sm transition active:scale-95"
          >
            {k('invite_btn')}
          </button>
        </div>
      </div>
    </div>
    <DirectPaymentQrPreviewModal
      open={isPaymentQrPreviewOpen}
      onClose={() => setIsPaymentQrPreviewOpen(false)}
      title={t('dashboard.master_gateway.payment_title')}
      businessName={businessName}
      previewQrUrl={paymentQrModalUrl}
      paymentPageUrl={paymentPageUrl}
      hideUrlCode
      scanCaption={t('components.settings.SettingsTipQrPanel.scanCaption')}
    />
    </>
  )
}

export default Overview
