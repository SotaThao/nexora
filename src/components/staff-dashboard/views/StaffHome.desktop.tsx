// StaffHome — KPI overview, pending tip confirmations, linked businesses.
import { CheckCircle2 } from 'lucide-react'
import { useTranslation } from '../../../contexts/LanguageContext'
import { useConfirmStaffTipsReceipt } from '../../../data/hooks/useStaffSelf'
import { useStaffHomeData } from '../hooks/useStaffHomeData'
import { SkeletonLayout } from '../../ui/skeleton'
import { STAFF_HOME_SKELETON } from '../skeletons/staffDashboardSkeletons'

const panel = 'rounded-2xl border border-nexoraBorder bg-nexoraSurface p-4 shadow-sm'

function KpiCard({ label, value, sub = '', subClass = 'text-nexoraMuted' }) {
  return (
    <div className={panel}>
      <div className="text-[10px] font-black uppercase tracking-wider text-nexoraSubtle">{label}</div>
      <div className="mt-1.5 text-2xl font-extrabold text-nexoraText">{value}</div>
      {sub ? <div className={`mt-0.5 text-xs font-bold ${subClass}`}>{sub}</div> : null}
    </div>
  )
}

function formatTipAmount(amount) {
  return `$${Number(amount || 0).toFixed(2)}`
}

export default function StaffHome() {
  const { t } = useTranslation()
  const confirmTipsMutation = useConfirmStaffTipsReceipt()
  const { kpis, isHomeLoading, isPendingTipsFetching, pendingTips, linkedBusinesses } =
    useStaffHomeData()

  const isConfirming = confirmTipsMutation.isPending

  if (isHomeLoading || kpis.isLoading) {
    return <SkeletonLayout blocks={STAFF_HOME_SKELETON} />
  }

  return (
    <div className="space-y-4">
      {/* KPI cards */}
      <section className="grid grid-cols-2 gap-3">
        <KpiCard
          label={t('staff_dashboard.home.today_tips')}
          value={formatTipAmount(kpis.todayTips)}
          sub={t('staff_dashboard.home.tips_count', { count: kpis.todayCount })}
          subClass="text-emerald-600"
        />
        <KpiCard
          label={t('staff_dashboard.home.this_month')}
          value={formatTipAmount(kpis.monthTips)}
          sub=""
        />
        <KpiCard
          label={t('staff_dashboard.home.pending')}
          value={kpis.pendingCount}
          sub={t('staff_dashboard.home.need_confirm')}
          subClass="text-amber-600"
        />
        <KpiCard
          label={t('staff_dashboard.home.rating')}
          value={kpis.rating || '—'}
          sub={'★★★★★'}
          subClass="text-amber-500 tracking-widest"
        />
      </section>

      {/* Pending confirmations */}
      <section className={panel}>
        <h3 className="mb-3 text-base font-extrabold text-nexoraText">{t('staff_dashboard.home.pending_confirmations')}</h3>
        {isPendingTipsFetching && pendingTips.length > 0 ? (
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-nexoraSubtle">
            {t('common.loading')}
          </p>
        ) : null}
        {pendingTips.length === 0 ? (
          <p className="py-4 text-center text-xs text-nexoraSubtle">{t('staff_dashboard.home.no_pending')}</p>
        ) : (
          <>
            <div className="divide-y divide-nexoraBorder">
              {pendingTips.map((tip) => (
                <div key={tip.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-nexoraText">
                      {formatTipAmount(tip.amount)} · {tip.paymentMethod}
                    </div>
                    <div className="truncate text-xs text-nexoraMuted">{tip.touchpoint}</div>
                  </div>
                  <button
                    type="button"
                    disabled={isConfirming}
                    onClick={() => confirmTipsMutation.mutate([tip.id])}
                    className="shrink-0 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-black text-amber-700 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
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
      </section>

      {/* Linked businesses */}
      <section className={panel}>
        <h3 className="mb-3 text-base font-extrabold text-nexoraText">{t('staff_dashboard.home.linked_businesses')}</h3>
        <div className="divide-y divide-nexoraBorder">
          {linkedBusinesses.map((biz) => (
            <div key={biz.businessStaffLinkId} className="flex items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <div className="truncate text-sm font-bold text-nexoraText">{biz.businessName}</div>
                <div className="truncate text-xs text-nexoraMuted">
                  {t('staff_dashboard.home.display_name')}: {biz.displayName}
                </div>
              </div>
              <span
                className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-black ${
                  biz.status === 'Active' ? 'bg-emerald-50 text-emerald-600' : 'bg-nexoraCanvas text-nexoraMuted'
                }`}
              >
                {biz.status === 'Active' ? t('staff_dashboard.status.active') : t('staff_dashboard.status.inactive')}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
