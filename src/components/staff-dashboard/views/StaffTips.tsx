// StaffTips — tip activity list from GET /api/v1/staff/tips.
import { useState } from 'react'
import { Sparkles } from 'lucide-react'
import { useTranslation } from '../../../contexts/LanguageContext'
import { useStaffTips } from '../../../data/hooks/useStaffSelf'
import { PAYOUT_UI_LABELS, payoutTypeToUiKey } from '../../../data/paymentMethodTypes'
import type { StaffTipItem } from '../../../types/domain'
import { SkeletonLayout } from '../../ui/skeleton'
import { STAFF_TIPS_SKELETON } from '../skeletons/staffDashboardSkeletons'

const panel = 'rounded-2xl border border-nexoraBorder bg-nexoraSurface p-4 shadow-sm'
const PAGE_SIZE = 20

const STATUS_STYLE: Record<string, string> = {
  Initiated: 'bg-amber-50 text-amber-700',
  Confirmed: 'bg-nexoraBrandSoft/60 text-nexoraBrand',
  Completed: 'bg-emerald-50 text-emerald-600',
  Skipped: 'bg-slate-100 text-slate-500',
}

function formatTipAmount(amount: number) {
  return `$${Number(amount || 0).toFixed(2)}`
}

function formatTipDate(iso: string | null | undefined) {
  if (!iso) return ''
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function paymentMethodLabel(method: string | null | undefined) {
  if (!method) return '—'
  const uiKey = payoutTypeToUiKey(method)
  return PAYOUT_UI_LABELS[uiKey] || method
}

function tipDisplayAmount(tip: StaffTipItem) {
  return tip.totalAmount > 0 ? tip.totalAmount : tip.amount
}

function tipMetaLine(tip: StaffTipItem) {
  return [paymentMethodLabel(tip.paymentMethod), tip.businessName, tip.touchPointName]
    .filter(Boolean)
    .join(' · ')
}

export default function StaffTips() {
  const { t } = useTranslation()
  const [pageNumber, setPageNumber] = useState(1)
  const {
    data: tipsPage = null,
    isPending,
    isFetching,
  } = useStaffTips({ pageNumber, pageSize: PAGE_SIZE })

  const statusLabel = (tip: StaffTipItem) => {
    if (tip.statusLabel?.trim()) return tip.statusLabel.trim()
    const key = String(tip.status || '').toLowerCase()
    return t(`staff_dashboard.tips.status.${key}`) || tip.status
  }

  if (isPending && !tipsPage) {
    return <SkeletonLayout blocks={STAFF_TIPS_SKELETON} />
  }

  const tips = tipsPage?.items ?? []
  const totalPages = tipsPage?.totalPages ?? 0
  const canGoPrev = tipsPage?.hasPreviousPage ?? pageNumber > 1
  const canGoNext = tipsPage?.hasNextPage ?? (totalPages > 0 && pageNumber < totalPages)

  return (
    <div className="space-y-4">
      <section className={panel}>
        <div className="mb-3 flex items-center justify-between gap-2">
          <h3 className="text-base font-extrabold text-nexoraText">{t('staff_dashboard.tips.activity')}</h3>
          {tipsPage?.totalCount != null && tipsPage.totalCount > 0 ? (
            <span className="text-[10px] font-bold uppercase tracking-wider text-nexoraSubtle">
              {t('staff_dashboard.tips.total_count', { count: tipsPage.totalCount })}
            </span>
          ) : null}
        </div>

        {isFetching && !isPending ? (
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-nexoraSubtle">
            {t('common.loading')}
          </p>
        ) : null}

        {tips.length === 0 ? (
          <p className="py-4 text-center text-xs text-nexoraSubtle">{t('staff_dashboard.tips.empty')}</p>
        ) : (
          <div className="divide-y divide-nexoraBorder">
            {tips.map((tip) => (
              <div key={tip.id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-bold text-nexoraText">
                      {formatTipAmount(tipDisplayAmount(tip))}
                    </span>
                    {tip.isMultiStaff ? (
                      <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-violet-600">
                        {t('staff_dashboard.tips.multi_staff')}
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-0.5 truncate text-xs text-nexoraMuted">{tipMetaLine(tip)}</div>
                  {tip.createdAt ? (
                    <div className="mt-0.5 text-[10px] font-semibold text-nexoraSubtle">
                      {formatTipDate(tip.createdAt)}
                    </div>
                  ) : null}
                </div>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-black ${
                    STATUS_STYLE[tip.status] || 'bg-nexoraCanvas text-nexoraMuted'
                  }`}
                >
                  {statusLabel(tip)}
                </span>
              </div>
            ))}
          </div>
        )}

        {totalPages > 1 ? (
          <div className="mt-3 flex items-center justify-between gap-3 border-t border-nexoraBorder pt-3">
            <button
              type="button"
              disabled={!canGoPrev || isFetching}
              onClick={() => setPageNumber((page) => Math.max(1, page - 1))}
              className="rounded-lg border border-nexoraBorder px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-nexoraMuted transition hover:bg-nexoraCanvas disabled:cursor-not-allowed disabled:opacity-50"
            >
              {t('common.back')}
            </button>
            <span className="text-[10px] font-semibold text-nexoraSubtle">
              {t('staff_dashboard.tips.page_of', { page: pageNumber, total: totalPages })}
            </span>
            <button
              type="button"
              disabled={!canGoNext || isFetching}
              onClick={() => setPageNumber((page) => page + 1)}
              className="rounded-lg border border-nexoraBorder px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-nexoraMuted transition hover:bg-nexoraCanvas disabled:cursor-not-allowed disabled:opacity-50"
            >
              {t('common.next')}
            </button>
          </div>
        ) : null}
      </section>

      <section className={panel}>
        <h3 className="mb-2 flex items-center gap-2 text-base font-extrabold text-nexoraText">
          <Sparkles className="h-4 w-4 text-nexoraBrand" />
          {t('staff_dashboard.tips.ai_insight')}
        </h3>
        <p className="text-sm leading-relaxed text-nexoraMuted">{t('staff_dashboard.tips.ai_insight_body')}</p>
      </section>
    </div>
  )
}
