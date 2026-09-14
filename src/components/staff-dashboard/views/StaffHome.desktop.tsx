// StaffHome — KPI overview, pending tip confirmations, income by category, linked businesses.
import { CheckCircle2, Star } from 'lucide-react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { useTranslation } from '../../../contexts/LanguageContext'
import { useConfirmStaffTipsReceipt } from '../../../data/hooks/useStaffSelf'
import { useStaffHomeData } from '../hooks/useStaffHomeData'
import { SkeletonLayout } from '../../ui/skeleton'
import Tooltip from '../../ui/Tooltip'
import { STAFF_HOME_SKELETON } from '../skeletons/staffDashboardSkeletons'
import IncomeByCategoryPanel from '../../dashboard/charts/IncomeByCategoryPanel'
import {
  getStaffBusinessLinkStatusPresentation,
  resolveStaffBusinessLinkStatusLabel,
} from '../../../utils/staffBusinessLinkStatus'

const panel = 'rounded-2xl border border-nexoraBorder bg-nexoraSurface p-4 shadow-sm'

function KpiCard({ label, value, sub = null, subClass = 'text-nexoraMuted' }) {
  return (
    <div className={panel}>
      <div className="text-xs font-semibold leading-4 text-nexoraSubtle">{label}</div>
      <div className="mt-1.5 break-words text-lg font-semibold leading-6 tabular-nums text-nexoraText">{value}</div>
      {sub ? <div className={`mt-0.5 text-[11px] font-medium leading-4 ${subClass}`}>{sub}</div> : null}
    </div>
  )
}

function formatTipAmount(amount) {
  return `$${Number(amount || 0).toFixed(2)}`
}

function renderStars(rating) {
  const rounded = Math.round(Number(rating) || 0)
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${i <= rounded ? 'fill-amber-400 text-amber-400' : 'text-amber-200'}`}
        />
      ))}
    </div>
  )
}

export default function StaffHome() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { onNavigate } = useOutletContext<any>() || {}
  const confirmTipsMutation = useConfirmStaffTipsReceipt()
  const { kpis, isHomeLoading, isPendingTipsFetching, pendingTips, linkedBusinesses } =
    useStaffHomeData()
  const activeLinkedBusinesses = linkedBusinesses.filter(
    (biz) => resolveStaffBusinessLinkStatusLabel(biz).toLowerCase() === 'active',
  )

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
          value={formatTipAmount(kpis.pendingAmount)}
          sub={
            kpis.pendingCount > 0
              ? t('staff_dashboard.home.awaiting_confirm', { count: kpis.pendingCount })
              : t('staff_dashboard.home.no_pending')
          }
          subClass={kpis.pendingCount > 0 ? 'text-amber-600' : 'text-emerald-600'}
        />
        <KpiCard
          label={t('staff_dashboard.home.rating')}
          value={kpis.rating > 0 ? Number(kpis.rating).toFixed(1) : '—'}
          sub={kpis.rating > 0 ? renderStars(kpis.rating) : null}
        />
      </section>

      {/* Pending confirmations */}
      {pendingTips.length > 0 && (
        <section className={panel}>
          <div className="mb-3 flex items-center gap-1.5">
            <h3 className="text-nexoraText text-sm font-semibold leading-5">{t('staff_dashboard.home.pending_confirmations')}</h3>
            <Tooltip
              content={t('staff_dashboard.home.confirm_all_tooltip')}
              ariaLabel={t('staff_dashboard.home.confirm_all_tooltip')}
            />
          </div>
          {isPendingTipsFetching ? (
            <p className="mb-2 text-[11px] font-medium leading-4 text-nexoraSubtle">
              {t('common.loading')}
            </p>
          ) : null}
          <div className="divide-y divide-nexoraBorder">
            {pendingTips.map((tip) => (
              <div key={tip.id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <div className="text-xs font-semibold leading-4 text-nexoraText">
                    {formatTipAmount(tip.amount)} · {tip.paymentMethod}
                  </div>
                  <div className="truncate text-[11px] font-medium leading-4 text-nexoraMuted">{tip.touchpoint}</div>
                </div>
                <button
                  type="button"
                  disabled={isConfirming}
                  onClick={() => confirmTipsMutation.mutate({ tipIds: [tip.id] })}
                  className="shrink-0 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
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
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-400 py-3 text-xs font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <CheckCircle2 className="h-4 w-4" />
            {t('staff_dashboard.home.confirm_all')}
          </button>
        </section>
      )}

      {/* Income by category */}
      <IncomeByCategoryPanel scope="staff" onManageCategories={() => navigate('/staff/categories')} />

      {/* Linked businesses */}
      <section className={panel}>
        <h3 className="mb-3 text-nexoraText text-sm font-semibold leading-5">{t('staff_dashboard.home.linked_businesses')}</h3>
        {activeLinkedBusinesses.length === 0 ? (
          <p className="py-4 text-center text-[11px] font-medium leading-4 text-nexoraSubtle">
            {t('staff_dashboard.qr.no_linked_businesses')}
          </p>
        ) : (
          <div className="divide-y divide-nexoraBorder">
            {activeLinkedBusinesses.map((biz) => {
              const statusLabel = resolveStaffBusinessLinkStatusLabel(biz)
              const statusPresentation = getStaffBusinessLinkStatusPresentation(statusLabel)
              return (
              <div key={biz.businessStaffLinkId} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <div className="truncate text-xs font-semibold leading-4 text-nexoraText">{biz.businessName}</div>
                  <div className="truncate text-[11px] font-medium leading-4 text-nexoraMuted">
                    {t('staff_dashboard.home.display_name')}: {biz.displayName}
                  </div>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium leading-4 ${statusPresentation.className}`}
                >
                  {statusPresentation.translationKey
                    ? t(statusPresentation.translationKey)
                    : statusLabel}
                </span>
              </div>
            )})}
          </div>
        )}
      </section>
    </div>
  )
}
