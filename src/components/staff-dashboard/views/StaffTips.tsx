// StaffTips — tip activity list from GET /api/v1/staff/tips.
import { useState } from 'react'
import { Sparkles } from 'lucide-react'
import { useTranslation } from '../../../contexts/LanguageContext'
import { useStaffTips } from '../../../data/hooks/useStaffSelf'
import { PAYOUT_UI_LABELS, payoutTypeToUiKey } from '../../../data/paymentMethodTypes'
import type { StaffTipItem } from '../../../types/domain'
import { SkeletonLayout } from '../../ui/skeleton'
import Pagination from '../../ui/Pagination'
import Tooltip from '../../ui/Tooltip'
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

// Show the amount THIS staff received, not the group total. For a multi-staff tip,
// `amount` is the signed-in staff's share and `totalAmount` is the full split total —
// displaying totalAmount would overstate every member's earnings.
function tipDisplayAmount(tip: StaffTipItem) {
  return tip.amount > 0 ? tip.amount : tip.totalAmount
}

// Staff only needs: which business + how it was paid. Business name first;
// touchpoint is dropped to keep the row clean.
function tipMetaLine(tip: StaffTipItem) {
  return [tip.businessName, paymentMethodLabel(tip.paymentMethod)]
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

  const statusHelp = (tip: StaffTipItem) => {
    const key = String(tip.status || '').toLowerCase()
    return t(`staff_dashboard.tips.status_help.${key}`, { defaultValue: '' })
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
                  <span className="text-sm font-bold text-nexoraText">
                    {formatTipAmount(tipDisplayAmount(tip))}
                  </span>
                  <div className="mt-0.5 truncate text-xs text-nexoraMuted">{tipMetaLine(tip)}</div>
                  {tip.createdAt ? (
                    <div className="mt-0.5 text-[10px] font-semibold text-nexoraSubtle">
                      {formatTipDate(tip.createdAt)}
                    </div>
                  ) : null}
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <span
                    className={`rounded-full px-2.5 py-1 text-[11px] font-black ${
                      STATUS_STYLE[tip.status] || 'bg-nexoraCanvas text-nexoraMuted'
                    }`}
                  >
                    {statusLabel(tip)}
                  </span>
                  <Tooltip
                    content={statusHelp(tip)}
                    ariaLabel={t('staff_dashboard.tips.status_help_aria')}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        <Pagination
          pageNumber={pageNumber}
          pageSize={PAGE_SIZE}
          totalPages={totalPages}
          hasNextPage={canGoNext}
          hasPreviousPage={canGoPrev}
          onPageChange={setPageNumber}
          isLoading={isFetching}
          variant="simple"
          className="mt-3"
        />
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
