import {
  QrCode,
  Star,
  Clock,
  DollarSign,
  Calendar,
  CreditCard,
  MessageSquare,
  LifeBuoy,
  ChevronRight
} from 'lucide-react'
import { useTranslation } from '../../../contexts/LanguageContext'

import SetupGuideBanner from './SetupGuideBanner'
import { getWebUrlOrigin } from '../../../utils/webUrlBase'

function renderStars(rating) {
  const stars = []
  for (let i = 1; i <= 5; i++) {
    const fillPercentage = Math.max(0, Math.min(1, rating - i + 1))
    stars.push(
      <div key={i} className="relative inline-block h-4 w-4">
        <Star className="absolute top-0 left-0 h-4 w-4 text-amber-200" />
        {fillPercentage > 0 && (
          <div
            className="absolute top-0 left-0 overflow-hidden h-4"
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

/* ─── Mini Stat Card ─────────────────────────────────────────────────────── */
function StatCard({ icon, iconBg, label, value, sub, subColor = 'text-nexoraTeal', cardBg = 'bg-white', onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 rounded-2xl border border-nexoraBorder ${cardBg} p-4 text-left shadow-nexora-card hover:shadow-premium hover:-translate-y-0.5 transition-all duration-200 focus:outline-none active:scale-[0.98]`}
    >
      {/* Left: icon */}
      <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${iconBg}`}>
        {icon}
      </span>
      {/* Center: content */}
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-wider text-nexoraSubtle">{label}</p>
        <p className="mt-0.5 text-md font-black text-nexoraText tracking-tight">{value}</p>
        {sub && (
          <p className={`text-[10px] font-semibold mt-0.5 whitespace-nowrap ${subColor}`}>{sub}</p>
        )}
      </div>
      {/* Right: chevron centered vertically */}
      <ChevronRight className="h-4 w-4 text-nexoraSubtle shrink-0" />
    </button>
  )
}


/* ─── Review KPI Card ──────────────────────────────────────────────────── */
function ReviewKpiCard({ label, value, footer, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-2xl border border-nexoraBorder bg-white p-4 text-left shadow-nexora-card transition hover:-translate-y-0.5 hover:shadow-premium focus:outline-none active:scale-[0.98]"
    >
      <p className="text-[10px] font-black uppercase tracking-wider text-nexoraSubtle">{label}</p>
      <p className="mt-1 text-2xl font-black text-nexoraText tracking-tight">{value}</p>
      <div className="mt-1">{footer}</div>
    </button>
  )
}

/* ─── Quick Action Button ──────────────────────────────────────────────── */
function QuickAction({ icon, label, onClick, bg, iconColor }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-center gap-2 focus:outline-none group"
    >
      <span
        className={`flex h-12 w-12 items-center justify-center rounded-full shadow-sm transition-all duration-200 group-hover:scale-105 group-active:scale-95 ${bg}`}
      >
        <span className={iconColor}>{icon}</span>
      </span>
      <span className="text-[11px] font-bold   group-hover:text-nexoraText transition-colors">{label}</span>
    </button>
  )
}

/* ─── Pending Confirmation Row ───────────────────────────────────────────── */
function PendingRow({ name, via, amount, time, onConfirm, avatarColor, confirmLabel }) {
  return (
    <div className="flex items-center gap-3 py-3">
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${avatarColor}`}>
        {name.split(' ').map(p => p[0]).join('').slice(0, 2)}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-nexoraText">{name}</p>
        <p className="text-xs text-nexoraMuted">{via}</p>
      </div>
      <div className="text-right mr-2">
        <p className="text-sm font-black text-nexoraBrand">{amount}</p>
        <p className="text-[10px] text-nexoraSubtle">{time}</p>
      </div>
      <button
        type="button"
        onClick={onConfirm}
        className="shrink-0 h-8 px-4 rounded-full text-xs font-bold border transition-all duration-200 focus:outline-none bg-white border-nexoraBorder text-nexoraBrand hover:border-nexoraBrand hover:text-nexoraBrand"
      >
        {confirmLabel}
      </button>
    </div>
  )
}

/* ─── Main Overview Component ────────────────────────────────────────────── */
function Overview({
  metrics,
  activeKpi,
  setActiveKpi,
  transactions,
  selectedStaff,
  setSelectedStaff,
  onOpenTouchpoints,
  onOpenReviews,
  businessName,
  previewQr,
  touchpoints = [],
  hasKyb = true,
  hasSetup = true,
  onStartSetup,
  profile,
  onNavigateMenu,
  onApproveClick,
  pendingStaff = []
}) {
  const { t } = useTranslation()

  // Map pending staff to confirmation list shape
  const displayPending = (pendingStaff || []).slice(0, 3).map((item, i) => {
    const name = item.fullName || item.invitedEmail || item.invitedPhone || 'Staff Member'
    const via = item.itemType === 'link'
      ? t('components.dashboard.views.StaffView.pendingAcceptance') || 'Link Request'
      : t('components.dashboard.views.StaffView.pendingSetup') || 'Pending Setup'

    return {
      id: item.id,
      name,
      via,
      amount: item.position || 'Technician',
      time: item.itemType === 'link' ? 'Link Request' : 'Invite Sent',
      avatarColor: ['bg-nexoraBrand', 'bg-purple-500', 'bg-nexoraElectric'][i % 3],
      rawItem: item
    }
  })
  // The "Master Store QR" (general pool tips) must point to a REAL backing
  // touch point — there is no store-level "general" touch page on the API
  // (every customer touch URL needs a touchPointSlug). Prefer a FrontDesk
  // touch point (the lobby/master created at onboarding), else the first one.
  const masterTouchpoint =
    (touchpoints || []).find((tp) => tp.type === 'FrontDesk') || (touchpoints || [])[0] || null
  let masterTouchUrl = ''
  if (masterTouchpoint?.url) {
    try {
      masterTouchUrl = `${getWebUrlOrigin()}${new URL(masterTouchpoint.url).pathname}`
    } catch {
      masterTouchUrl = masterTouchpoint.url
    }
  }
  const masterQrTarget = {
    name: t('staff_dashboard.home.master_welcome_qr'),
    subtitle: t('staff_dashboard.home.store_main_portal'),
    slug: masterTouchpoint?.slug || 'general',
    url: masterTouchpoint?.url || null,
    isActive: true,
  }





  const firstName = profile?.fullName?.split(' ')[0] || profile?.email?.split('@')[0] || 'User'

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return t('staff_dashboard.home.greeting_morning', { name: firstName })
    if (hour < 17) return t('staff_dashboard.home.greeting_afternoon', { name: firstName })
    return t('staff_dashboard.home.greeting_evening', { name: firstName })
  }

  const greeting = getGreeting()

  // Today's tips from transactions
  const today = new Date().toISOString().split('T')[0]
  const todayTips = (transactions || [])
    .filter(tx => tx.dateTime?.startsWith(today))
    .reduce((sum, tx) => sum + Number(tx.amount || 0), 0)
  const todayTipsCount = (transactions || []).filter(tx => tx.dateTime?.startsWith(today)).length

  // This month's tips
  const monthPrefix = new Date().toISOString().slice(0, 7)
  const monthTips = (transactions || [])
    .filter(tx => tx.dateTime?.startsWith(monthPrefix))
    .reduce((sum, tx) => sum + Number(tx.amount || 0), 0)
  const monthTipsCount = (transactions || []).filter(tx => tx.dateTime?.startsWith(monthPrefix)).length

  // Pending amount
  const pendingAmount = (transactions || [])
    .filter(tx => tx.status === 'pending' || tx.status === 'Pending')
    .reduce((sum, tx) => sum + Number(tx.amount || 0), 0)
  const pendingCount = displayPending.length

  return (
    <div className="space-y-6 pb-8">
      {/* Setup Guide Banner */}
      {!hasSetup && (
        <div className="mb-2">
          <SetupGuideBanner onStartSetup={onStartSetup} />
        </div>
      )}

      {/* ── Greeting ─────────────────────────────────────────────────────── */}
      <div className="pt-1">
        <h1 className="text-1xl font-black text-nexoraText tracking-tight">
          {greeting}
        </h1>
        <p className="mt-1 text-sm text-nexoraMuted">{t('staff_dashboard.home.performance_subtitle')}</p>
      </div>

      {/* ── 2×2 KPI Cards ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          icon={<DollarSign className="h-4 w-4 text-white" />}
          iconBg="bg-emerald-400"
          cardBg="bg-white"
          label={t('staff_dashboard.home.today_tips')}
          value={`$${todayTips.toFixed(0)}`}
          sub={todayTipsCount > 0 ? t('staff_dashboard.home.tips_plus', { count: todayTipsCount }) : 'No tips yet'}
          subColor="text-nexoraSuccess"
          onClick={() => setActiveKpi('tips')}
        />
        <StatCard
          icon={<Calendar className="h-4 w-4 text-white" />}
          iconBg="bg-gradient-to-br from-purple-500 to-violet-600"
          cardBg="bg-purple-50"
          label={t('staff_dashboard.home.this_month')}
          value={`$${monthTips >= 1000 ? (monthTips / 1000).toFixed(1) + 'k' : monthTips.toFixed(0)}`}
          sub={t('staff_dashboard.home.tips_plus', { count: monthTipsCount })}
          subColor="text-nexoraBrand"
          onClick={() => setActiveKpi('tips')}
        />
        <StatCard
          icon={<Clock className="h-3 w-3 text-white" />}
          iconBg="bg-amber-400"
          cardBg="bg-orange-50"
          label={t('staff_dashboard.home.pending')}
          value={`$${pendingAmount.toFixed(0)}`}
          sub={pendingCount > 0 ? t('staff_dashboard.home.awaiting_confirm', { count: pendingCount }) : 'All clear!'}
          subColor={pendingCount > 0 ? 'text-amber-500' : 'text-nexoraSuccess'}
          onClick={() => setActiveKpi('transactions')}
        />
        <StatCard
          icon={<Star className="h-4 w-4 text-white fill-white" />}
          iconBg="bg-gradient-to-br from-blue-400 to-indigo-500"
          cardBg="bg-blue-50"
          label={t('staff_dashboard.home.rating')}
          value={metrics.googleRating || '4.8'}
          sub={renderStars(metrics.googleRating || 4.8)}
          subColor=""
          onClick={() => onOpenReviews?.()}
        />
      </div>

      {/* ── Quick Actions ─────────────────────────────────────────────────── */}
      <div className="w-full">
        <div className="flex items-center justify-between gap-3">
          <QuickAction
            icon={<QrCode className="h-5 w-5" />}
            label={t('staff_dashboard.home.quick_qr')}
            bg="bg-gray-100"
            iconColor="text-gray-600"
            onClick={() => previewQr?.(masterQrTarget)}
          />
          <QuickAction
            icon={<DollarSign className="h-5 w-5" />}
            label={t('staff_dashboard.home.quick_tips')}
            bg="bg-emerald-100"
            iconColor="text-emerald-500"
            onClick={() => onNavigateMenu?.('tips')}
          />
          <QuickAction
            icon={<MessageSquare className="h-5 w-5" />}
            label={t('staff_dashboard.home.quick_reviews')}
            bg="bg-purple-100"
            iconColor="text-purple-500"
            onClick={() => onOpenReviews?.()}
          />
          <QuickAction
            icon={<CreditCard className="h-5 w-5" />}
            label={t('staff_dashboard.home.quick_payments')}
            bg="bg-blue-100"
            iconColor="text-blue-500"
            onClick={() => onNavigateMenu?.('reports')}
          />
          <QuickAction
            icon={<LifeBuoy className="h-5 w-5" />}
            label={t('dashboard.menu.support')}
            bg="bg-pink-100"
            iconColor="text-pink-500"
            onClick={() => onNavigateMenu?.('support')}
          />
        </div>
      </div>

      {/* ── Pending Confirmations ─────────────────────────────────────────── */}
      <div className="rounded-2xl border border-nexoraBorder bg-white shadow-nexora-card overflow-hidden">
        <div className="flex items-center justify-between px-5 pt-5 pb-2">
          <h2 className="text-sm font-black text-nexoraText">{t('staff_dashboard.home.pending_confirmations')}</h2>
          <button
            type="button"
            onClick={() => onNavigateMenu?.('staff')}
            className="text-xs font-bold text-nexoraBrand hover:text-nexoraBrandDark transition"
          >
            {t('staff_dashboard.home.view_all')}
          </button>
        </div>
        <div className="divide-y divide-nexoraBorder px-5">
          {displayPending.length === 0 ? (
            <p className="py-6 text-center text-xs text-nexoraSubtle">{t('staff_dashboard.home.no_pending')}</p>
          ) : (
            displayPending.map(item => (
              <PendingRow
                key={item.id}
                name={item.name}
                via={item.via}
                amount={item.amount}
                time={item.time}
                avatarColor={item.avatarColor}
                confirmLabel={t('staff_dashboard.home.confirm')}
                onConfirm={() => onApproveClick?.(item.rawItem)}
              />
            ))
          )}
        </div>
      </div>

      {/* ── Master Store QR ───────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-nexoraBorder bg-white shadow-nexora-card overflow-hidden">
        <div className="flex items-center justify-between px-5 pt-5 pb-2">
          <h2 className="text-sm font-black text-nexoraText">{t('staff_dashboard.home.master_store_qr_title')}</h2>
          <span className="rounded-full bg-nexoraBrandSoft px-2.5 py-1 text-[10px] font-bold text-nexoraBrand">
            {masterTouchpoint
              ? t('staff_dashboard.home.master_status_active')
              : t('staff_dashboard.home.master_status_setup_required')}
          </span>
        </div>
        <div className="px-5 pb-5">
          <div className="rounded-xl border border-nexoraBorder bg-nexoraSurface p-4">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-nexoraBrand to-nexoraElectric text-white shadow-nexora-soft">
                <QrCode className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-nexoraText">{t('staff_dashboard.home.store_main_portal')}</p>
                <p className="mt-0.5 text-[11px] text-nexoraMuted">
                  {t('staff_dashboard.home.master_store_qr_desc')}
                </p>
                <p className="mt-2 truncate text-[10px] text-nexoraSubtle">
                  {masterTouchUrl || t('staff_dashboard.home.no_master_touchpoint_url')}
                </p>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <button
                type="button"
                onClick={() => previewQr?.(masterQrTarget)}
                className="inline-flex h-8 items-center justify-center rounded-full bg-nexoraBrand px-4 text-xs font-bold text-white transition hover:bg-nexoraBrandDark disabled:cursor-not-allowed disabled:opacity-50"
                disabled={!masterTouchpoint}
              >
                {t('staff_dashboard.home.preview_qr')}
              </button>
              <button
                type="button"
                onClick={() => onNavigateMenu?.('touchpoints')}
                className="inline-flex h-8 items-center justify-center rounded-full border border-nexoraBorder bg-white px-4 text-xs font-bold text-nexoraText transition hover:border-nexoraBrand hover:text-nexoraBrand"
              >
                {t('staff_dashboard.home.manage_touchpoints')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Review KPI Cards ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <ReviewKpiCard
          label={t('dashboard.review_kpi.google_reviews')}
          value={metrics.googleReviews ?? 0}
          footer={
            <>
              {renderStars(metrics.googleRating ?? 0)}
              <p className="mt-1 text-[10px] font-semibold text-nexoraMuted">
                {t('dashboard.review_kpi.reviews_count', { count: metrics.googleReviews ?? 0 })}
              </p>
            </>
          }
          onClick={() => onOpenReviews?.()}
        />
        <ReviewKpiCard
          label={t('dashboard.review_kpi.yelp_reviews')}
          value={metrics.yelpReviews ?? 0}
          footer={
            <>
              {renderStars(metrics.yelpRating ?? 0)}
              <p className="mt-1 text-[10px] font-semibold text-nexoraMuted">
                {t('dashboard.review_kpi.reviews_count', { count: metrics.yelpReviews ?? 0 })}
              </p>
            </>
          }
          onClick={() => onOpenReviews?.()}
        />
        <ReviewKpiCard
          label={t('dashboard.review_kpi.response_rate')}
          value={`${metrics.responseRate ?? 0}%`}
          footer={
            <p className="text-[10px] font-semibold text-emerald-600">
              {t('dashboard.review_kpi.great')}
            </p>
          }
          onClick={() => onOpenReviews?.()}
        />
        <ReviewKpiCard
          label={t('dashboard.review_kpi.returning_customers')}
          value={`${metrics.returningCustomers ?? 0}%`}
          footer={
            <p className="text-[10px] font-semibold text-emerald-600">
              ▲ {metrics.returningCustomersDelta ?? 0}% {t('dashboard.kpi.vs_last_week')}
            </p>
          }
          onClick={() => onOpenReviews?.()}
        />
      </div>

    </div>
  )
}

export default Overview
