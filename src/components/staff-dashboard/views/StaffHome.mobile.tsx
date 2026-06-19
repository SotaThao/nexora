// StaffHome — personal staff home (mobile-first "Pro" layout):
// greeting, KPI cards, quick actions, pending tip confirmations, linked
// businesses, referral banner. All data is real (empty states when missing).
import { useOutletContext } from 'react-router-dom'
import {
  QrCode,
  Star,
  Clock,
  DollarSign,
  Calendar,
  Gift,
  CreditCard,
  MessageSquare,
  CheckCircle2,
  Wallet,
} from 'lucide-react'
import { useTranslation } from '../../../contexts/LanguageContext'
import { useStaffAccount } from '../../../contexts/StaffAccountContext'
import { useConfirmStaffTipsReceipt } from '../../../data/hooks/useStaffSelf'
import { useStaffHomeData } from '../hooks/useStaffHomeData'
import MobileKpiCard, { MOBILE_KPI_GRID_CLASS } from '../../ui/MobileKpiCard'
import { SkeletonLayout } from '../../ui/skeleton'
import { STAFF_HOME_SKELETON } from '../skeletons/staffDashboardSkeletons'

function formatTipAmount(amount) {
  return `$${Number(amount || 0).toFixed(amount % 1 === 0 ? 0 : 2)}`
}

function renderStars(rating) {
  const filled = Math.round(Number(rating) || 0)
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${i <= filled ? 'fill-[#fbbf24] text-[#fbbf24]' : 'text-[#fde68a]'}`}
        />
      ))}
    </div>
  )
}

export default function StaffHome() {
  const { t } = useTranslation()
  const { onNavigate } = useOutletContext<any>() || {}
  const { account } = useStaffAccount()
  const confirmTipsMutation = useConfirmStaffTipsReceipt()
  const { kpis, isHomeLoading, isPendingTipsFetching, pendingTips, linkedBusinesses } = useStaffHomeData()

  const isConfirming = confirmTipsMutation.isPending

  if (isHomeLoading || kpis.isLoading) {
    return <SkeletonLayout blocks={STAFF_HOME_SKELETON} />
  }

  const firstName = account?.fullName?.split(' ')[0] || account?.nickname || 'there'
  const greeting = (() => {
    const hour = new Date().getHours()
    if (hour < 12) return t('staff_dashboard.home.greeting_morning', { name: firstName })
    if (hour < 17) return t('staff_dashboard.home.greeting_afternoon', { name: firstName })
    return t('staff_dashboard.home.greeting_evening', { name: firstName })
  })()

  const pendingAmount = (pendingTips || []).reduce((s, tip) => s + Number(tip.amount || 0), 0)

  const go = (screen) => onNavigate?.(screen)

  return (
    <div className="space-y-5 pb-4">
      {/* ── Greeting ─────────────────────────────────────────────────────── */}
      <div className="pt-1">
        <h1 className="text-2xl font-black tracking-tight text-nexoraText">{greeting}</h1>
        <p className="mt-1 text-sm text-nexoraMuted">{t('staff_dashboard.home.performance_subtitle')}</p>
      </div>

      {/* ── KPI 2×2 ──────────────────────────────────────────────────────── */}
      <div className={MOBILE_KPI_GRID_CLASS}>
        <MobileKpiCard
          theme="green"
          icon={<DollarSign className="h-[18px] w-[18px]" strokeWidth={2.5} />}
          label={t('staff_dashboard.home.today_tips')}
          value={formatTipAmount(kpis.todayTips)}
          trend={kpis.todayCount > 0 ? t('staff_dashboard.home.tips_plus', { count: kpis.todayCount }) : t('staff_dashboard.home.tips_count', { count: 0 })}
          onClick={() => go('tips')}
        />
        <MobileKpiCard
          theme="purple"
          icon={<Calendar className="h-[18px] w-[18px]" strokeWidth={2.5} />}
          label={t('staff_dashboard.home.this_month')}
          value={formatTipAmount(kpis.monthTips)}
          trend={kpis.monthCount > 0 ? t('staff_dashboard.home.tips_plus', { count: kpis.monthCount }) : t('staff_dashboard.home.tips_count', { count: 0 })}
          onClick={() => go('tips')}
        />
        <MobileKpiCard
          theme="amber"
          icon={<Clock className="h-[18px] w-[18px]" strokeWidth={2.5} />}
          label={t('staff_dashboard.home.pending')}
          value={formatTipAmount(pendingAmount)}
          trend={kpis.pendingCount > 0 ? t('staff_dashboard.home.awaiting_confirm', { count: kpis.pendingCount }) : t('staff_dashboard.home.all_clear')}
          trendColor={kpis.pendingCount > 0 ? 'text-amber-600' : 'text-emerald-600'}
          onClick={() => go('tips')}
        />
        <MobileKpiCard
          theme="blue"
          icon={<Star className="h-[18px] w-[18px] fill-white text-white" strokeWidth={2.5} />}
          label={t('staff_dashboard.home.rating')}
          value={kpis.rating > 0 ? Number(kpis.rating).toFixed(1) : '—'}
          trend={kpis.rating > 0 ? renderStars(kpis.rating) : null}
          onClick={() => go('reviews')}
        />
      </div>

      {/* ── Pending Confirmations ────────────────────────────────────────── */}
      <div className="rounded-3xl border border-nexoraBorder bg-white p-5 shadow-nexora-card">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-[17px] font-black tracking-tight text-nexoraText">{t('staff_dashboard.home.pending_confirmations')}</h2>
          {isPendingTipsFetching && pendingTips.length > 0 ? (
            <span className="text-[11px] font-bold uppercase tracking-wider text-nexoraSubtle">{t('common.loading')}</span>
          ) : null}
        </div>
        {pendingTips.length === 0 ? (
          <p className="py-4 text-center text-[13px] text-nexoraSubtle">{t('staff_dashboard.home.no_pending')}</p>
        ) : (
          <>
            <div className="divide-y divide-nexoraBorder">
              {pendingTips.map((tip) => (
                <div key={tip.id} className="flex items-center gap-3 py-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                    <Wallet className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[15px] font-black text-nexoraBrand">{formatTipAmount(tip.amount)}</p>
                    <p className="truncate text-[12px] text-nexoraMuted">
                      {t('staff_dashboard.home.via_method', { method: tip.paymentMethod })} · {tip.touchpoint}
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={isConfirming}
                    onClick={() => confirmTipsMutation.mutate([tip.id])}
                    className="h-9 shrink-0 rounded-full border border-nexoraBorder bg-white px-4 text-[13px] font-bold text-nexoraBrand transition hover:border-nexoraBrand disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {t('staff_dashboard.home.confirm')}
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              disabled={isConfirming}
              onClick={() => confirmTipsMutation.mutate(pendingTips.map((tip) => tip.id))}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-400 py-3 text-sm font-extrabold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <CheckCircle2 className="h-4 w-4" />
              {t('staff_dashboard.home.confirm_all')}
            </button>
          </>
        )}
      </div>

      {/* ── Linked Businesses ────────────────────────────────────────────── */}
      <div className="rounded-3xl border border-nexoraBorder bg-white p-5 shadow-nexora-card">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-[17px] font-black tracking-tight text-nexoraText">{t('staff_dashboard.home.linked_businesses')}</h2>
        </div>
        {(linkedBusinesses || []).length === 0 ? (
          <p className="py-4 text-center text-[13px] text-nexoraSubtle">{t('staff_dashboard.home.no_pending')}</p>
        ) : (
          <div className="divide-y divide-nexoraBorder">
            {linkedBusinesses.map((biz) => (
              <div key={biz.businessStaffLinkId} className="flex items-center gap-3 py-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-nexoraSidebar to-nexoraBrand text-sm font-black text-white">
                  {(biz.businessName || '?').slice(0, 2).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-bold text-nexoraText">{biz.businessName}</p>
                  <p className="truncate text-[12px] text-nexoraMuted">
                    {t('staff_dashboard.home.display_name')}: {biz.displayName}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-3 py-1.5 text-[12px] font-black ${
                    biz.status === 'Active' ? 'bg-emerald-50 text-emerald-600' : 'bg-nexoraCanvas text-nexoraMuted'
                  }`}
                >
                  {biz.status === 'Active' ? t('staff_dashboard.status.active') : t('staff_dashboard.status.inactive')}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Referral Banner ──────────────────────────────────────────────── */}
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
            onClick={() => go('profile')}
            className="h-10 shrink-0 rounded-full bg-white px-4 text-[13px] font-black text-nexoraBrand shadow-md transition active:scale-95"
          >
            {t('staff_dashboard.home.invite_now')}
          </button>
        </div>
      </div>
    </div>
  )
}
