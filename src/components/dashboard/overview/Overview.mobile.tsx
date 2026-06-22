import { useMemo, useCallback, useState } from 'react'
import {
  QrCode,
  Star,
  Clock,
  DollarSign,
  Users,
  Gift,
  FileBarChart,
  UserPlus,
  ChevronRight,
  PiggyBank,
  Eye,
  Download,
} from 'lucide-react'
import { useTranslation } from '../../../contexts/LanguageContext'
import { useNotification } from '../../../contexts/NotificationContext'
import { useDownloadTouchpointQr } from '../../../data/hooks/useMerchantTouchpoints'
import { downloadQrCode } from '../../../utils/qrUtils'
import { buildQrImageUrl, toLocalCustomerTouchUrl } from '../../../utils/staffTipUrl'

import SetupGuideBanner from './SetupGuideBanner'

function twoInitials(name) {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return String(name || '').slice(0, 2).toUpperCase() || '?'
}

/* Avatar — same rule as desktop StaffView: photo if available, else initials
   in an indigo circle (2 characters). */
function StaffAvatar({ avatar, nickname, fullName }) {
  if (avatar) {
    return (
      <img
        src={avatar}
        alt=""
        className="h-11 w-11 shrink-0 rounded-full border border-nexoraBorder object-cover"
      />
    )
  }
  return (
    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-sm font-extrabold text-indigo-600">
      {twoInitials(nickname || fullName)}
    </span>
  )
}

function fmtMoney(value) {
  const n = Number(value || 0)
  if (n >= 1000) return `$${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k`
  return `$${n.toFixed(0)}`
}

function clampPct(n) {
  return Math.max(0, Math.min(100, n))
}

/* ─── KPI Card (mockup style: icon + label + chevron, big value, trend) ───── */
function KpiCard({ icon, iconBg, label, value, trend, trendColor = 'text-nexoraSuccess', onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-3xl border border-nexoraBorder bg-white p-4 text-left shadow-nexora-card transition-all duration-200 hover:shadow-premium hover:-translate-y-0.5 focus:outline-none active:scale-[0.98]"
    >
      <div className="flex items-center justify-between">
        <span className={`flex h-11 w-11 items-center justify-center rounded-2xl text-white ${iconBg}`}>
          {icon}
        </span>
        <ChevronRight className="h-4 w-4 text-nexoraSubtle" />
      </div>
      <p className="mt-3 text-[11px] font-black uppercase tracking-wider text-nexoraSubtle">{label}</p>
      <p className="mt-0.5 text-2xl font-black tracking-tight text-nexoraText">{value}</p>
      {trend && <p className={`mt-0.5 text-[13px] font-bold ${trendColor}`}>{trend}</p>}
    </button>
  )
}

/* ─── Quick Action ───────────────────────────────────────────────────────── */
function QuickAction({ icon, label, onClick }) {
  return (
    <button type="button" onClick={onClick} className="flex flex-col items-center gap-2 focus:outline-none group">
      <span className="flex h-[60px] w-[60px] items-center justify-center rounded-[22px] border border-nexoraBorder bg-gradient-to-b from-white to-nexoraSurfaceMuted text-nexoraBrand shadow-nexora-soft transition-all duration-200 group-hover:scale-105 group-active:scale-95">
        {icon}
      </span>
      <span className="text-[12px] font-bold text-nexoraText">{label}</span>
    </button>
  )
}

/* ─── Panel wrapper ──────────────────────────────────────────────────────── */
function Panel({ title, action, onAction, children }) {
  return (
    <div className="rounded-3xl border border-nexoraBorder bg-white p-5 shadow-nexora-card">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-[17px] font-black tracking-tight text-nexoraText">{title}</h2>
        {action && (
          <button type="button" onClick={onAction} className="text-[13px] font-bold text-nexoraBrand hover:text-nexoraBrandDark transition">
            {action}
          </button>
        )}
      </div>
      {children}
    </div>
  )
}

const STATUS_STYLES = {
  active: 'bg-emerald-50 text-emerald-600',
  pending: 'bg-amber-50 text-amber-600',
  inactive: 'bg-rose-50 text-rose-600',
}

function StatusPill({ kind, label }) {
  return (
    <span className={`whitespace-nowrap rounded-full px-3 py-1.5 text-[12px] font-black ${STATUS_STYLES[kind] || STATUS_STYLES.inactive}`}>
      {label}
    </span>
  )
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
  onApproveClick,
  pendingStaff = [],
  staff = [],
  metricsMonth = null,
  metricsYear = null,
  isTouchpointsLoading = false,
}: any) {
  const { t } = useTranslation()
  const { showToast } = useNotification()
  const downloadTouchpointQrMutation = useDownloadTouchpointQr()
  const [isMasterQrDownloading, setIsMasterQrDownloading] = useState(false)
  const k = (key: string, vars?: Record<string, string | number>) =>
    t(`dashboard.owner_home.${key}`, vars)

  const masterTouchpoint =
    (touchpoints || []).find((tp) => tp.type === 'FrontDesk') || (touchpoints || [])[0] || null

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

  const masterQrTarget = useMemo(
    () => ({
      id: masterTouchpoint?.id || null,
      name: 'Master Welcome QR',
      subtitle: 'Store Main Portal',
      slug: masterTouchpoint?.slug || 'general',
      url: masterTouchpoint?.url || null,
      qrImageUrl: masterTouchpoint?.qrImageUrl || null,
      isActive: true,
    }),
    [masterTouchpoint],
  )

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

  const firstName = profile?.fullName?.split(' ')[0] || profile?.email?.split('@')[0] || 'Owner'
  const greeting = (() => {
    const hour = new Date().getHours()
    if (hour < 12) return t('staff_dashboard.home.greeting_morning', { name: firstName })
    if (hour < 17) return t('staff_dashboard.home.greeting_afternoon', { name: firstName })
    return t('staff_dashboard.home.greeting_evening', { name: firstName })
  })()

  // ── Derived metrics from overview API (month & year) ────────────────────
  const FEE_RATE = 0.03
  const monthTips = metricsMonth?.totalTips ?? 0
  const monthTxCount = metricsMonth?.totalTransactions ?? 0
  const yearTips = metricsYear?.totalTips ?? 0
  const moneySavedMonth = monthTips * FEE_RATE
  const moneySavedYear = yearTips * FEE_RATE

  const activeStaff = (staff || []).filter((m) => m.status === 'Active' || m.active === true)
  const pendingCount = (pendingStaff || []).length
  const rating = Number(metrics.averageRating || 0)
  const totalReviews = Number(metrics.totalReviews || 0)

  // Pending confirmations list (real pending staff/invites)
  const displayPending = (pendingStaff || []).slice(0, 3).map((item, i) => ({
    id: item.id ?? i,
    name: item.fullName || item.invitedEmail || item.invitedPhone || k('staff_member'),
    via: item.itemType === 'link' ? k('via_link_request') : k('via_invite'),
    sub: item.position || k('technician'),
    avatar: item.avatar,
    nickname: item.nickname,
    fullName: item.fullName,
    rawItem: item,
  }))

  // Staff status list (real staff)
  const staffStatus = (staff || []).slice(0, 4).map((m) => {
    const status = String(m.status || '').toLowerCase()
    const kind = status === 'active' ? 'active' : status.includes('pending') ? 'pending' : 'inactive'
    return {
      id: m.id,
      name: m.fullName || m.nickname || k('staff_member'),
      sub: m.position || (kind === 'pending' ? k('status_pending') : kind === 'active' ? k('status_active') : k('status_inactive')),
      kind,
      label: kind === 'active' ? k('status_active') : kind === 'pending' ? k('status_pending') : k('status_inactive'),
      avatar: m.avatar,
      nickname: m.nickname,
      fullName: m.fullName,
    }
  })

  const activeTouchpoints = (touchpoints || []).slice(0, 3)

  return (
    <div className="space-y-5 pb-8">
      {!hasSetup && (
        <div className="mb-1">
          <SetupGuideBanner onStartSetup={onStartSetup} />
        </div>
      )}

      {/* ── Greeting ─────────────────────────────────────────────────────── */}
      <div className="pt-1">
        <h1 className="text-2xl font-black tracking-tight text-nexoraText">{greeting}</h1>
      </div>

      {/* ── Hero: Money Saved ────────────────────────────────────────────── */}
      <section className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-nexoraSidebar via-nexoraViolet to-nexoraBrand p-6 text-white shadow-premium">
        <div className="absolute -right-12 -top-10 h-40 w-40 rounded-full bg-nexoraElectric/25 blur-sm" />
        <div className="relative">
          <p className="text-[11px] font-black uppercase tracking-wider text-white/80">{k('money_saved_title')}</p>
          <h2 className="mt-1 text-[40px] font-black leading-none tracking-tight">{fmtMoney(moneySavedMonth)}</h2>
          <p className="mt-2 text-[13px] text-white/80">{k('money_saved_subtitle')}</p>
          <div className="mt-4 flex gap-2.5">
            <button
              type="button"
              onClick={() => onNavigateMenu?.('reports')}
              className="rounded-2xl bg-white px-4 py-3 text-sm font-black text-nexoraBrand active:scale-95 transition"
            >
              {k('view_savings')}
            </button>
            <button
              type="button"
              onClick={() => onNavigateMenu?.('reports')}
              className="rounded-2xl border border-white/20 bg-white/15 px-4 py-3 text-sm font-black text-white active:scale-95 transition"
            >
              {k('export_report')}
            </button>
          </div>
        </div>
      </section>

      {/* ── KPI 2×2 ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3">
        <KpiCard
          icon={<DollarSign className="h-5 w-5" />}
          iconBg="bg-gradient-to-br from-emerald-400 to-emerald-500"
          label={k('kpi_direct_tips')}
          value={fmtMoney(monthTips)}
          trend={monthTxCount > 0 ? k('tips_count', { count: monthTxCount }) : k('no_tips_yet')}
          trendColor="text-nexoraSuccess"
          onClick={() => setActiveKpi?.('tips')}
        />
        <KpiCard
          icon={<Users className="h-5 w-5" />}
          iconBg="bg-gradient-to-br from-nexoraBrand to-nexoraViolet"
          label={k('kpi_active_staff')}
          value={String((staff || []).length)}
          trend={k('staff_active', { count: activeStaff.length })}
          trendColor="text-nexoraBrand"
          onClick={() => onNavigateMenu?.('staff')}
        />
        <KpiCard
          icon={<Clock className="h-5 w-5" />}
          iconBg="bg-gradient-to-br from-amber-400 to-amber-500"
          label={k('kpi_pending')}
          value={String(pendingCount)}
          trend={pendingCount > 0 ? k('need_action') : k('all_clear')}
          trendColor={pendingCount > 0 ? 'text-nexoraWarning' : 'text-nexoraSuccess'}
          onClick={() => onNavigateMenu?.('staff')}
        />
        <KpiCard
          icon={<Star className="h-5 w-5 fill-white" />}
          iconBg="bg-gradient-to-br from-blue-400 to-indigo-500"
          label={k('kpi_reviews')}
          value={rating > 0 ? rating.toFixed(1) : '—'}
          trend={totalReviews > 0 ? k('reviews_total', { count: totalReviews }) : k('no_reviews_yet')}
          trendColor="text-nexoraBrand"
          onClick={() => onOpenReviews?.()}
        />
      </div>

      {/* ── Master Store QR ──────────────────────────────────────────────── */}
      <Panel
        title={t('dashboard.master_gateway.qr_title')}
        action={masterTouchpoint ? t('dashboard.master_gateway.btn_open') : undefined}
        onAction={masterTouchpoint ? () => previewQr?.(masterQrTarget) : undefined}
      >
        {isTouchpointsLoading ? (
          <div className="flex items-center gap-4 py-2">
            <div className="h-24 w-24 shrink-0 animate-pulse rounded-2xl bg-nexoraSurfaceMuted" />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="h-3 w-3/4 animate-pulse rounded bg-nexoraSurfaceMuted" />
              <div className="h-3 w-full animate-pulse rounded bg-nexoraSurfaceMuted" />
            </div>
          </div>
        ) : !masterTouchpoint ? (
          <div className="py-2 text-center">
            <p className="text-[13px] text-nexoraMuted">{t('components.dashboard.overview.Overview.gateway_empty_desc')}</p>
            <button
              type="button"
              onClick={() => onNavigateMenu?.('touchpoints')}
              className="mt-3 rounded-full border border-nexoraBorder px-4 py-2 text-[13px] font-bold text-nexoraBrand"
            >
              {t('components.dashboard.overview.Overview.gateway_empty_action')}
            </button>
          </div>
        ) : (
          <div className="flex items-start gap-4">
            <button
              type="button"
              onClick={() => previewQr?.(masterQrTarget)}
              className="group relative flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl border border-nexoraBorder bg-white p-2 shadow-inner"
            >
              <img
                src={masterQrPreviewUrl}
                alt={t('dashboard.master_gateway.qr_title')}
                className="h-full w-full object-contain transition group-active:scale-95"
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 rounded-2xl bg-nexoraBrand/80 text-white opacity-0 transition group-hover:opacity-100">
                <Eye className="h-4 w-4" />
                <span className="text-[9px] font-black uppercase tracking-wider">
                  {t('components.dashboard.views.StaffView.preview')}
                </span>
              </div>
            </button>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-bold text-nexoraText">{t('dashboard.master_gateway.qr_desc')}</p>
              <p className="mt-1 text-[12px] leading-relaxed text-nexoraMuted">{t('dashboard.master_gateway.qr_body')}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => previewQr?.(masterQrTarget)}
                  className="inline-flex h-9 items-center gap-1.5 rounded-full border border-nexoraBorder bg-white px-3 text-[12px] font-bold text-nexoraText"
                >
                  <Eye className="h-3.5 w-3.5" />
                  {t('dashboard.master_gateway.btn_open')}
                </button>
                <button
                  type="button"
                  onClick={() => void handleDownloadMasterQr()}
                  disabled={isMasterQrDownloading || downloadTouchpointQrMutation.isPending}
                  className="inline-flex h-9 items-center gap-1.5 rounded-full bg-nexoraBrand px-3 text-[12px] font-bold text-white disabled:opacity-60"
                >
                  <Download className="h-3.5 w-3.5" />
                  {t('dashboard.master_gateway.btn_download')}
                </button>
              </div>
            </div>
          </div>
        )}
      </Panel>

      {/* ── Quick Actions ────────────────────────────────────────────────── */}
      <Panel title={k('quick_actions')} action={k('manage')} onAction={() => onNavigateMenu?.('touchpoints')}>
        <div className="grid grid-cols-4 gap-2">
          <QuickAction
            icon={<QrCode className="h-6 w-6" />}
            label={k('quick_add_qr')}
            onClick={() => previewQr?.(masterQrTarget)}
          />
          <QuickAction icon={<UserPlus className="h-6 w-6" />} label={k('quick_add_staff')} onClick={() => onNavigateMenu?.('staff')} />
          <QuickAction icon={<DollarSign className="h-6 w-6" />} label={k('quick_tips')} onClick={() => onNavigateMenu?.('tips')} />
          <QuickAction icon={<FileBarChart className="h-6 w-6" />} label={k('quick_reports')} onClick={() => onNavigateMenu?.('reports')} />
        </div>
      </Panel>

      {/* ── Pending Confirmations ────────────────────────────────────────── */}
      <Panel title={t('staff_dashboard.home.pending_confirmations')} action={t('staff_dashboard.home.view_all')} onAction={() => onNavigateMenu?.('staff')}>
        {displayPending.length === 0 ? (
          <p className="py-4 text-center text-[13px] text-nexoraSubtle">{t('staff_dashboard.home.no_pending')}</p>
        ) : (
          <div className="divide-y divide-nexoraBorder">
            {displayPending.map((item) => (
              <div key={item.id} className="flex items-center gap-3 py-3">
                <StaffAvatar avatar={item.avatar} nickname={item.nickname} fullName={item.fullName} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-bold text-nexoraText">{item.name}</p>
                  <p className="text-[13px] text-nexoraMuted">{item.via}</p>
                </div>
                <button
                  type="button"
                  onClick={() => onApproveClick?.(item.rawItem)}
                  className="h-9 shrink-0 rounded-full border border-nexoraBorder bg-white px-4 text-[13px] font-bold text-nexoraBrand transition hover:border-nexoraBrand"
                >
                  {t('staff_dashboard.home.confirm')}
                </button>
              </div>
            ))}
          </div>
        )}
      </Panel>

      {/* ── Staff Status ─────────────────────────────────────────────────── */}
      <Panel title={k('staff_status_title')} action={k('manage')} onAction={() => onNavigateMenu?.('staff')}>
        {staffStatus.length === 0 ? (
          <p className="py-4 text-center text-[13px] text-nexoraSubtle">{k('no_staff')}</p>
        ) : (
          <div className="divide-y divide-nexoraBorder">
            {staffStatus.map((m) => (
              <div key={m.id} className="flex items-center gap-3 py-3">
                <StaffAvatar avatar={m.avatar} nickname={m.nickname} fullName={m.fullName} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-bold text-nexoraText">{m.name}</p>
                  <p className="truncate text-[13px] text-nexoraMuted">{m.sub}</p>
                </div>
                <StatusPill kind={m.kind} label={m.label} />
              </div>
            ))}
          </div>
        )}
      </Panel>

      {/* ── QR Performance ───────────────────────────────────────────────── */}
      <Panel title={k('qr_performance_title')} action={k('view')} onAction={() => onNavigateMenu?.('touchpoints')}>
        {activeTouchpoints.length === 0 ? (
          <p className="py-4 text-center text-[13px] text-nexoraSubtle">{k('no_qr')}</p>
        ) : (
          <div className="divide-y divide-nexoraBorder">
            {activeTouchpoints.map((tp) => (
              <div key={tp.id || tp.slug} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="truncate text-[15px] font-bold text-nexoraText">{tp.name || tp.slug}</p>
                  <p className="truncate text-[13px] text-nexoraMuted">{tp.type || k('touchpoint')}</p>
                </div>
                <StatusPill kind="active" label={t('common.active')} />
              </div>
            ))}
          </div>
        )}
      </Panel>

      {/* ── Savings Summary ──────────────────────────────────────────────── */}
      <Panel title={k('savings_summary_title')} action={k('details')} onAction={() => onNavigateMenu?.('reports')}>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-nexoraBorder bg-nexoraSurfaceMuted p-4">
            <div className="flex items-center gap-2">
              <PiggyBank className="h-4 w-4 text-nexoraBrand" />
              <small className="text-[11px] font-black uppercase tracking-wider text-nexoraSubtle">{k('this_month')}</small>
            </div>
            <h3 className="mt-1.5 text-2xl font-black tracking-tight text-nexoraText">{fmtMoney(moneySavedMonth)}</h3>
            <p className="text-[12px] text-nexoraMuted">{k('fee_basis', { tips: fmtMoney(monthTips) })}</p>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-nexoraBorder">
              <span
                className="block h-full rounded-full bg-gradient-to-r from-nexoraBrand to-nexoraElectric"
                style={{ width: `${clampPct(yearTips > 0 ? (monthTips / yearTips) * 100 : 0)}%` }}
              />
            </div>
          </div>
          <div className="rounded-2xl border border-nexoraBorder bg-nexoraSurfaceMuted p-4">
            <div className="flex items-center gap-2">
              <PiggyBank className="h-4 w-4 text-nexoraBrand" />
              <small className="text-[11px] font-black uppercase tracking-wider text-nexoraSubtle">{k('this_year')}</small>
            </div>
            <h3 className="mt-1.5 text-2xl font-black tracking-tight text-nexoraText">{fmtMoney(moneySavedYear)}</h3>
            <p className="text-[12px] text-nexoraMuted">{k('estimated_saved')}</p>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-nexoraBorder">
              <span
                className="block h-full rounded-full bg-gradient-to-r from-nexoraBrand to-nexoraElectric"
                style={{ width: `${clampPct(((new Date().getMonth() + 1) / 12) * 100)}%` }}
              />
            </div>
          </div>
        </div>
      </Panel>

      {/* ── Invite Banner ────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-[22px] bg-gradient-to-r from-nexoraBrand via-nexoraElectricMid to-nexoraViolet p-5 shadow-nexora-soft">
        <div className="absolute -top-6 -right-6 h-24 w-24 rounded-full bg-white/10" />
        <div className="relative flex items-center gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
            <Gift className="h-6 w-6 text-white" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-black text-white">{t('staff_dashboard.home.refer_title')}</p>
            <p className="mt-0.5 text-[12px] text-white/80">{t('staff_dashboard.home.refer_subtitle')}</p>
          </div>
          <button
            type="button"
            onClick={() => onNavigateMenu?.('support')}
            className="h-10 shrink-0 rounded-full bg-white px-4 text-[13px] font-black text-nexoraBrand shadow-md transition active:scale-95"
          >
            {t('staff_dashboard.home.invite_now')}
          </button>
        </div>
      </div>
    </div>
  )
}

export default Overview
