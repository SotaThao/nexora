// StaffTips — tip activity list from GET /api/v1/staff/tips.
import { useState } from 'react'
import { CheckCircle } from 'lucide-react'
import { useTranslation } from '../../../contexts/LanguageContext'
import { TipStatus } from '../../../constants/tipStatus'
import { useStaffTips } from '../../../data/hooks/useStaffSelf'
import { isReceiptConfirmableTip } from '../../dashboard/utils'
import { PAYOUT_UI_LABELS, payoutTypeToUiKey } from '../../../data/paymentMethodTypes'
import { WalletLogos } from '../../dashboard/constants'
import type { StaffTipItem } from '../../../types/domain'
import { SkeletonLayout, SkeletonList } from '../../ui/skeleton'
import Pagination from '../../ui/Pagination'
import Tooltip from '../../ui/Tooltip'
import TransactionDetailModal from '../../dashboard/modals/TransactionDetailModal'
import { STAFF_TIPS_SKELETON } from '../skeletons/staffDashboardSkeletons'

const panel = 'rounded-2xl border border-nexoraBorder bg-nexoraSurface p-4 shadow-sm'
const PAGE_SIZE = 20

const STATUS_STYLE: Partial<Record<TipStatus, string>> = {
  [TipStatus.Initiated]: 'bg-amber-50 text-amber-600',
  [TipStatus.Confirmed]: 'bg-nexoraBrandSoft/60 text-nexoraBrand',
  [TipStatus.Completed]: 'bg-emerald-50 text-emerald-600',
  [TipStatus.Skipped]: 'bg-slate-100 text-slate-500',
}

// Maps the flat StaffTipItem into the shape TransactionDetailModal expects.
// touchpoint/staff-breakdown fields are intentionally omitted — the staff tips
// endpoint doesn't return them, and the modal already hides sections it has no
// data for (see StaffTips.tsx design notes / TransactionDetailModal isStaffAudience).
function toTransactionDetail(tip: StaffTipItem) {
  return {
    id: tip.id,
    amount: tip.amount > 0 ? tip.amount : tip.totalAmount,
    status: tip.status,
    dateTime: tip.createdAt,
    paymentMethod: paymentMethodLabel(tip.paymentMethod),
    isMultiStaff: tip.isMultiStaff,
    merchantConfirmedAt: tip.merchantConfirmedAt,
    staffConfirmedAt: tip.staffConfirmedAt,
    tipItems: [],
  }
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

// Staff only needs: which business. Payment method is moved up next to amount;
// touchpoint is dropped to keep the row clean.
function tipMetaLine(tip: StaffTipItem) {
  return tip.businessName || ''
}

export default function StaffTips() {
  const { t } = useTranslation()
  const [pageNumber, setPageNumber] = useState(1)
  const [selectedTip, setSelectedTip] = useState<StaffTipItem | null>(null)
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

  // Tooltip text: multi-staff explains the business-confirm step (with business
  // name); single-staff explains the tip status.
  const statusTooltip = (tip: StaffTipItem) => {
    if (tip.isMultiStaff) {
      return t(
        tip.merchantConfirmedAt
          ? 'staff_dashboard.tips.via_business_confirmed_help'
          : 'staff_dashboard.tips.via_business_pending_help',
        { business: tip.businessName || '' },
      )
    }
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

        {isFetching ? (
          <SkeletonList count={5} lines={2} showAction />
        ) : tips.length === 0 ? (
            <p className="py-4 text-center text-xs text-nexoraSubtle">{t('staff_dashboard.tips.empty')}</p>
          ) : (
            <div className="divide-y divide-nexoraBorder">
              {tips.map((tip) => (
              <div
                key={tip.id}
                role="button"
                tabIndex={0}
                onClick={() => setSelectedTip(tip)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') setSelectedTip(tip)
                }}
                className="flex cursor-pointer select-none flex-col gap-2 rounded-lg py-3 transition-colors hover:bg-nexoraCanvas/40"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-sm font-bold text-nexoraText">
                        {formatTipAmount(tipDisplayAmount(tip))}
                      </span>
                      {tip.paymentMethod ? (
                        <span className="flex items-center gap-1 text-[13px] font-medium text-nexoraMuted">
                          ·
                          {WalletLogos[payoutTypeToUiKey(tip.paymentMethod) as keyof typeof WalletLogos] ? (
                            <span className="flex items-center [&>svg]:h-3.5 [&>svg]:w-3.5 [&>img]:h-3.5 [&>img]:w-3.5">
                              {WalletLogos[payoutTypeToUiKey(tip.paymentMethod) as keyof typeof WalletLogos]}
                            </span>
                          ) : null}
                          {paymentMethodLabel(tip.paymentMethod)}
                        </span>
                      ) : null}
                    </div>
                    {tipMetaLine(tip) ? (
                      <div className="mt-0.5 truncate text-xs text-nexoraMuted">{tipMetaLine(tip)}</div>
                    ) : null}
                    {tip.createdAt ? (
                      <div className="mt-0.5 text-[10px] font-semibold text-nexoraSubtle">
                        {formatTipDate(tip.createdAt)}
                      </div>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                    {tip.isMultiStaff ? (
                      <span
                        className={`max-w-[140px] truncate rounded-full px-2.5 py-1 text-[11px] font-black ${
                          tip.merchantConfirmedAt
                            ? 'bg-emerald-50 text-emerald-600'
                            : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        {t(
                          tip.merchantConfirmedAt
                            ? 'staff_dashboard.tips.via_business_confirmed'
                            : 'staff_dashboard.tips.via_business_pending',
                          { business: tip.businessName || '' },
                        )}
                      </span>
                    ) : (
                      <span
                        className={`rounded-full px-2.5 py-1 text-[11px] font-black ${
                          STATUS_STYLE[tip.status as TipStatus] || 'bg-nexoraCanvas text-nexoraMuted'
                        }`}
                      >
                        {statusLabel(tip)}
                      </span>
                    )}
                    <Tooltip
                      align="end"
                      content={statusTooltip(tip)}
                      ariaLabel={t('staff_dashboard.tips.status_help_aria')}
                    />
                  </div>
                </div>

                {isReceiptConfirmableTip(tip, true) ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedTip(tip)
                    }}
                    className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-emerald-50 py-2 text-[11px] font-black uppercase tracking-wider text-emerald-700 transition hover:bg-emerald-100"
                  >
                    <CheckCircle className="h-3.5 w-3.5" />
                    {t('staff_dashboard.home.confirm')}
                  </button>
                ) : null}
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

      {selectedTip ? (
        <TransactionDetailModal
          selectedTx={toTransactionDetail(selectedTip)}
          onClose={() => setSelectedTip(null)}
          businessName={selectedTip.businessName || ''}
          audience="staff"
        />
      ) : null}
    </div>
  )
}
