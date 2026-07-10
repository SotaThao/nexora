// StaffHome — personal staff home (mobile-first "Pro" layout):
// greeting, KPI cards, quick actions, pending tip confirmations, linked
// businesses. All data is real (empty states when missing).
import { useOutletContext } from 'react-router-dom'
import {
  QrCode,
  Star,
  Clock3,
  CalendarDays,
  CreditCard,
  ChevronRight,
  CheckCircle2,
  Wallet,
  Gift,
  Sparkles,
  CalendarCheck,
} from 'lucide-react'
import { useTranslation } from '../../../contexts/LanguageContext'
import { useStaffAccount } from '../../../contexts/StaffAccountContext'
import { useConfirmStaffTipsReceipt } from '../../../data/hooks/useStaffSelf'
import { useStaffHomeData } from '../hooks/useStaffHomeData'
import { SkeletonLayout } from '../../ui/skeleton'
import Tooltip from '../../ui/Tooltip'
import { STAFF_HOME_SKELETON } from '../skeletons/staffDashboardSkeletons'
import ActiveBannersCarousel from '../../dashboard/overview/ActiveBannersCarousel'
import {
  getStaffBusinessLinkStatusPresentation,
  resolveStaffBusinessLinkStatusLabel,
} from '../../../utils/staffBusinessLinkStatus'

function formatTipAmount(amount) {
  return `$${Number(amount || 0).toFixed(amount % 1 === 0 ? 0 : 2)}`
}

function renderStars(rating) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${i <= Math.round(rating) ? 'fill-amber-400 text-amber-400' : 'text-amber-200'}`}
        />
      ))}
    </div>
  )
}

/* ─── KPI Card (compact Staff Account mockup style) ───────────────────────── */
function KpiCard({ icon, iconBg, label, value, trend = null, trendColor = 'text-nexoraSuccess', onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-lg border border-[#EEE9FF] bg-white p-2.5 text-left shadow-[0_8px_18px_rgba(70,72,212,0.08)] transition-all duration-200 focus:outline-none active:scale-[0.98]"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.5">
          <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-white ${iconBg}`}>{icon}</span>
          <p className="truncate text-[9px] font-semibold uppercase text-nexoraSubtle">{label}</p>
        </div>
        <ChevronRight className="h-3.5 w-3.5 shrink-0 text-nexoraSubtle" />
      </div>
      <div className="mt-1 flex items-baseline justify-between gap-2">
        <p className="text-base font-semibold leading-none text-nexoraText">{value}</p>
        {trend ? (
          typeof trend === 'string'
            ? <p className={`truncate text-[11px] font-semibold ${trendColor}`}>{trend}</p>
            : <div className="shrink-0">{trend}</div>
        ) : null}
      </div>
    </button>
  )
}

/* ─── Quick Action ───────────────────────────────────────────────────────── */
function QuickAction({ icon, label, onClick, bg, iconColor }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`grid h-14 content-center justify-items-center gap-1 rounded-lg border px-1 text-center transition active:scale-95 ${bg}`}
    >
      <span className={iconColor}>{icon}</span>
      <span className="text-[10px] font-semibold leading-none text-nexoraText">{label}</span>
    </button>
  )
}

function SectionHeader({ title, action = null, onAction = null }: any) {
  return (
    <div className="mb-1.5 flex items-center justify-between">
      <h2 className="text-sm font-semibold text-nexoraText">{title}</h2>
      {action ? (
        <button
          type="button"
          onClick={onAction}
          className="inline-flex h-7 min-w-[56px] items-center justify-center rounded-md px-2 text-[11px] font-semibold text-nexoraBrandDark"
        >
          {action}
        </button>
      ) : null}
    </div>
  )
}

export default function StaffHome() {
  const { t } = useTranslation()
  const { onNavigate } = useOutletContext<any>() || {}
  const { account } = useStaffAccount()
  const confirmTipsMutation = useConfirmStaffTipsReceipt()
  const { kpis, isHomeLoading, isPendingTipsFetching, pendingTips, linkedBusinesses } = useStaffHomeData()
  const activeLinkedBusinesses = (linkedBusinesses || []).filter(
    (biz) => resolveStaffBusinessLinkStatusLabel(biz).toLowerCase() === 'active',
  )

  const isConfirming = confirmTipsMutation.isPending

  const firstName = account?.fullName?.split(' ')[0] || account?.nickname || 'Staff'

  const pendingAmount = (pendingTips || []).reduce((s, tip) => s + Number(tip.amount || 0), 0)

  const go = (screen, params?: Record<string, string>) => onNavigate?.(screen, params)

  if (isHomeLoading || kpis.isLoading) {
    return <SkeletonLayout blocks={STAFF_HOME_SKELETON} />
  }

  return (
    <div className="-m-4 space-y-3 bg-[linear-gradient(180deg,#FFFFFF_0%,#FFFFFF_34%,#F8F7FF_68%,#F1EFFF_100%)] p-4 text-nexoraText sm:-m-6 sm:p-6">
      {/* ── Staff Header ─────────────────────────────────────────────────── */}
      <section className="px-0.5">
        <div className="flex items-start gap-3">
          <div className="min-w-0 space-y-1">
            <div className="flex items-center gap-1.5">
              <span className="inline-flex rounded-full bg-[#EEE9FF] px-2 py-0.5 text-[9px] font-semibold uppercase leading-none text-nexoraBrandDark">
                Staff
              </span>
              <span className="truncate text-[10px] font-semibold text-nexoraSubtle">
                {firstName}
              </span>
            </div>
            <h1 className="text-[15px] font-semibold leading-tight tracking-tight text-nexoraText">
              Dashboard
            </h1>
          </div>
        </div>
      </section>

      {/* ── Needs Confirmation Hero ──────────────────────────────────────── */}
      {pendingTips.length > 0 && (
        <section className="rounded-lg border border-[#DDD8FF] bg-[#F4F2FF] p-2.5 shadow-[0_10px_22px_rgba(70,72,212,0.10)]">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="inline-flex rounded-full bg-nexoraWarning/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-nexoraWarning">
                {t('staff_dashboard.home.needs_confirmation')}
              </p>
              <div className="mt-1 flex items-baseline gap-1.5">
                <h2 className="text-sm font-semibold text-nexoraText">
                  {t('staff_dashboard.home.pending_amount', { amount: formatTipAmount(pendingAmount) })}
                </h2>
                <p className="text-[10px] font-semibold text-nexoraMuted">
                  {t('staff_dashboard.home.tips_count', { count: kpis.pendingCount })}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => go('tips')}
              className="inline-flex h-7 min-w-[78px] items-center justify-center rounded-lg bg-nexoraBrand px-2.5 text-[10px] font-semibold text-white"
            >
              {t('staff_dashboard.home.view_all')}
            </button>
          </div>
        </section>
      )}

      {/* ── KPI 2×2 ──────────────────────────────────────────────────────── */}
      <section className="space-y-2">
      <div className="grid grid-cols-2 gap-1.5">
        <KpiCard
          icon={<Wallet className="h-3.5 w-3.5" />}
          iconBg="bg-nexoraBrand"
          label={t('staff_dashboard.home.today_tips')}
          value={formatTipAmount(kpis.todayTips)}
          trend={kpis.todayCount > 0 ? t('staff_dashboard.home.tips_plus', { count: kpis.todayCount }) : t('staff_dashboard.home.tips_count', { count: 0 })}
          trendColor="text-nexoraSuccess"
          onClick={() => go('tips')}
        />
        <KpiCard
          icon={<CalendarDays className="h-3.5 w-3.5" />}
          iconBg="bg-nexoraBrand"
          label={t('staff_dashboard.home.this_month')}
          value={formatTipAmount(kpis.monthTips)}
          trend={t('staff_dashboard.home.track_payout')}
          trendColor="text-nexoraBrandDark"
          onClick={() => go('earnings')}
        />
        <KpiCard
          icon={<Clock3 className="h-3.5 w-3.5" />}
          iconBg="bg-nexoraWarning"
          label={t('staff_dashboard.home.pending')}
          value={formatTipAmount(pendingAmount)}
          trend={kpis.pendingCount > 0 ? t('staff_dashboard.home.awaiting_confirm', { count: kpis.pendingCount }) : t('staff_dashboard.home.no_pending')}
          trendColor={kpis.pendingCount > 0 ? 'text-nexoraWarning' : 'text-nexoraSuccess'}
          onClick={() => go('tips')}
        />
        <KpiCard
          icon={<Star className="h-3.5 w-3.5 fill-white" />}
          iconBg="bg-amber-400"
          label={t('staff_dashboard.home.rating')}
          value={kpis.rating > 0 ? Number(kpis.rating).toFixed(1) : '—'}
          trend={kpis.rating > 0 ? 'Excellent' : t('staff_dashboard.home.no_reviews')}
          trendColor="text-nexoraBrandDark"
          onClick={() => go('reviews')}
        />
      </div>
      </section>

      {/* ── Quick Actions ────────────────────────────────────────────────── */}
      <section className="space-y-1.5 px-0.5">
        <SectionHeader title={t('staff_dashboard.home.quick_actions')} action={t('staff_dashboard.home.manage')} onAction={() => go('qr')} />
        <div className="grid grid-cols-4 gap-2">
          <QuickAction icon={<QrCode className="h-4 w-4" />} label={t('staff_dashboard.home.quick_qr')} bg="border-[#DDD8FF] bg-[#F4F2FF]" iconColor="text-nexoraBrandDark" onClick={() => go('qr')} />
          <QuickAction icon={<Star className="h-4 w-4" />} label={t('staff_dashboard.home.quick_reviews')} bg="border-orange-200 bg-orange-50" iconColor="text-orange-500" onClick={() => go('reviews')} />
          <QuickAction icon={<CreditCard className="h-4 w-4" />} label={t('staff_dashboard.home.quick_payments')} bg="border-indigo-200 bg-indigo-50" iconColor="text-indigo-600" onClick={() => go('qr', { tab: 'payment' })} />
          <QuickAction icon={<Gift className="h-4 w-4" />} label={t('staff_dashboard.home.quick_refer')} bg="border-rose-200 bg-rose-50" iconColor="text-rose-500" onClick={() => go('qr', { tab: 'personal' })} />
        </div>
      </section>

      {/* ── Pending Confirmations ────────────────────────────────────────── */}
      <section className="rounded-lg border border-[#EEE9FF] bg-white px-3 pb-3 pt-2 shadow-[0_8px_18px_rgba(70,72,212,0.08)]">
        <div className="mb-1.5 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <h2 className="text-sm font-semibold text-nexoraText">{t('staff_dashboard.home.pending_confirmations')}</h2>
            <Tooltip
              content={t('staff_dashboard.home.confirm_all_tooltip')}
              ariaLabel={t('staff_dashboard.home.confirm_all_tooltip')}
            />
          </div>
          {isPendingTipsFetching && pendingTips.length > 0 ? (
            <span className="text-[11px] font-bold uppercase tracking-wider text-nexoraSubtle">{t('common.loading')}</span>
          ) : null}
        </div>
        {pendingTips.length === 0 ? (
          <p className="py-3 text-center text-[12px] font-medium text-nexoraSubtle">{t('staff_dashboard.home.no_pending')}</p>
        ) : (
          <>
            <div className="space-y-1">
              {pendingTips.map((tip) => (
                <div key={tip.id} className="grid min-h-[38px] grid-cols-[24px_minmax(0,1fr)_auto_auto] items-center gap-2 rounded-xl border border-nexoraBorder bg-white px-2 py-1 shadow-sm">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-emerald-50 text-emerald-600 shadow-sm">
                    <Wallet className="h-3.5 w-3.5" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold">{tip.paymentMethod || t('staff_dashboard.home.anonymous_customer')}</p>
                    <p className="truncate text-[10px] font-medium text-nexoraMuted">
                      {t('staff_dashboard.home.via_method', { method: tip.paymentMethod })} · {tip.touchpoint}
                    </p>
                  </div>
                  <span className="text-[12px] font-semibold text-nexoraSuccess">{formatTipAmount(tip.amount)}</span>
                  <button
                    type="button"
                    disabled={isConfirming}
                    onClick={() => confirmTipsMutation.mutate({ tipIds: [tip.id] })}
                    className="inline-flex h-6 min-w-[58px] items-center justify-center rounded-full border border-[#EEE9FF] bg-white px-2 text-[10px] font-semibold text-nexoraBrandDark disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {t('staff_dashboard.home.confirm')}
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              disabled={isConfirming}
              onClick={() => confirmTipsMutation.mutate({ tipIds: pendingTips.map((tip) => tip.id) })}
              className="mt-2 flex h-8 w-full items-center justify-center gap-1.5 rounded-lg bg-nexoraBrand text-[10px] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              {t('staff_dashboard.home.confirm_all')}
            </button>
          </>
        )}
      </section>

      {/* ── Linked Businesses ────────────────────────────────────────────── */}
      <section className="grid grid-cols-2 gap-2">
        <div className="rounded-lg border border-[#EEE9FF] bg-white p-2.5 shadow-[0_8px_18px_rgba(70,72,212,0.08)]">
          <h2 className="mb-2 text-[12px] font-semibold">{t('staff_dashboard.home.recent_activity')}</h2>
          <div className="space-y-1.5">
            <div className="grid grid-cols-[24px_minmax(0,1fr)_auto] items-center gap-1.5">
              <span className="grid h-6 w-6 place-items-center rounded-lg bg-nexoraBrand/10 text-nexoraBrandDark"><Sparkles className="h-3.5 w-3.5" /></span>
              <div className="min-w-0">
                <p className="truncate text-[9px] font-semibold">{t('staff_dashboard.home.tip_received')}</p>
                <p className="truncate text-[8px] font-medium text-nexoraMuted">{t('staff_dashboard.home.today')}</p>
              </div>
              <span className="text-[9px] font-semibold text-nexoraSuccess">{formatTipAmount(kpis.todayTips)}</span>
            </div>
            <div className="grid grid-cols-[24px_minmax(0,1fr)_auto] items-center gap-1.5">
              <span className="grid h-6 w-6 place-items-center rounded-lg bg-nexoraSuccess/10 text-nexoraSuccess"><CalendarCheck className="h-3.5 w-3.5" /></span>
              <div className="min-w-0">
                <p className="truncate text-[9px] font-semibold">{t('staff_dashboard.home.monthly_tips')}</p>
                <p className="truncate text-[8px] font-medium text-nexoraMuted">{t('staff_dashboard.home.this_month')}</p>
              </div>
              <span className="text-[9px] font-semibold text-nexoraSuccess">{formatTipAmount(kpis.monthTips)}</span>
            </div>
            <div className="grid grid-cols-[24px_minmax(0,1fr)_auto] items-center gap-1.5">
              <span className="grid h-6 w-6 place-items-center rounded-lg bg-nexoraWarning/10 text-nexoraWarning"><Star className="h-3.5 w-3.5" /></span>
              <div className="min-w-0">
                <p className="truncate text-[9px] font-semibold">Rating</p>
                <p className="truncate text-[8px] font-medium text-nexoraMuted">{t('staff_dashboard.home.latest_score')}</p>
              </div>
              <span className="text-[9px] font-semibold text-nexoraWarning">{kpis.rating > 0 ? Number(kpis.rating).toFixed(1) : '—'}</span>
            </div>
          </div>
          <button type="button" onClick={() => go('tips')} className="mt-2 inline-flex h-6 w-full items-center justify-center rounded-lg text-[10px] font-semibold text-nexoraBrandDark">
            {t('staff_dashboard.home.view_all_activity')}
          </button>
        </div>

        <div className="rounded-lg border border-[#EEE9FF] bg-white p-2.5 shadow-[0_8px_18px_rgba(70,72,212,0.08)]">
          <h2 className="mb-2 text-[12px] font-semibold">{t('staff_dashboard.home.my_salons')}</h2>
          {activeLinkedBusinesses.length === 0 ? (
            <p className="py-3 text-center text-[10px] font-medium text-nexoraSubtle">{t('staff_dashboard.qr.no_linked_businesses')}</p>
          ) : (
          <div className="space-y-1.5">
            {activeLinkedBusinesses.slice(0, 3).map((biz, index) => {
              const statusLabel = resolveStaffBusinessLinkStatusLabel(biz)
              const statusPresentation = getStaffBusinessLinkStatusPresentation(statusLabel)
              return (
              <div key={biz.businessStaffLinkId} className="grid grid-cols-[24px_minmax(0,1fr)_auto] items-center gap-1.5">
                <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-[8px] font-semibold ${
                  index === 0 ? 'bg-nexoraBrand text-white' : 'bg-nexoraBrand/10 text-nexoraBrandDark'
                }`}>
                  {(biz.businessName || '?').slice(0, 2).toUpperCase()}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-[9px] font-semibold uppercase text-nexoraText">{biz.businessName}</p>
                  <p className="truncate text-[8px] font-medium text-nexoraMuted">{biz.displayName}</p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-1.5 py-0.5 text-[8px] font-semibold ${statusPresentation.className}`}
                >
                  {statusPresentation.translationKey
                    ? t(statusPresentation.translationKey)
                    : statusLabel}
                </span>
              </div>
            )})}
          </div>
          )}
          <button type="button" onClick={() => go('salons')} className="mt-2 inline-flex h-6 w-full items-center justify-center rounded-lg text-[10px] font-semibold text-nexoraBrandDark">
            {t('staff_dashboard.home.view_all_salons')}
          </button>
        </div>
      </section>

      {/* ── Promo Banner ─────────────────────────────────────────────────── */}
      <ActiveBannersCarousel fallbackAlt="VLINKPAY promo" />

      {/* ── Invite Banner ────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden rounded-[22px] border border-transparent bg-[linear-gradient(100deg,#3F44D7_0%,#5B48F0_52%,#8A35FF_100%)] px-3 py-3.5 text-white shadow-[0_14px_28px_rgba(70,72,212,0.22)]">
        <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10" />
        <div className="relative flex items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[12px] bg-white/10 text-white ring-1 ring-white/25">
            <Gift className="h-[18px] w-[18px] text-white" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-[14px] font-black leading-tight text-white">{t('staff_dashboard.home.refer_title')}</h2>
            <p className="mt-0.5 text-[12px] font-semibold leading-tight text-white/70">{t('staff_dashboard.home.refer_subtitle')}</p>
          </div>
          <button
            type="button"
            onClick={() => go('qr', { tab: 'personal' })}
            className="inline-flex h-9 min-w-[57px] shrink-0 items-center justify-center rounded-full bg-white px-4 text-[12px] font-black text-nexoraBrandDark shadow-sm transition active:scale-95"
          >
            {t('staff_dashboard.home.invite_now')}
          </button>
        </div>
      </section>

    </div>
  )
}
