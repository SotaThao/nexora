import { Clock3, FileClock, Loader2, PlusCircle, X } from 'lucide-react'
import type { UnpaidTipDebtRecord } from '../../../types/domain'
import { formatCurrency, formatTransactionDateTime } from '../../dashboard/utils'
import { staffInitials } from '../../../utils/payoutDisplay'

export default function UnpaidTipDebtsPanel({
  isOpen,
  onClose,
  debts,
  isLoading,
  currentLanguage,
  t,
  onCreatePayout,
  onViewHistory,
}: {
  isOpen: boolean
  onClose: () => void
  debts: UnpaidTipDebtRecord[]
  isLoading?: boolean
  currentLanguage: string
  t: (key: string, params?: Record<string, unknown>) => string
  onCreatePayout: (staffProfileId: string) => void
  onViewHistory: (staff: UnpaidTipDebtRecord) => void
}) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="max-h-[92dvh] w-full max-w-5xl overflow-y-auto rounded-t-2xl border border-nexoraBorder bg-white shadow-2xl sm:rounded-2xl">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-nexoraBorder px-5 py-4">
          <div>
            <h3 className="text-base font-black text-inkBlue">
              {t('dashboard.tips.payouts_manager.unpaid_section_title')}
            </h3>
            <p className="mt-1 text-xs text-mutedGrey">
              {t('dashboard.tips.payouts_manager.unpaid_section_sub', { count: debts.length })}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-nexoraBorder p-2 text-mutedGrey hover:bg-slate-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-nexoraBrand" />
          </div>
        ) : debts.length === 0 ? (
          <div className="px-4 py-10 text-center text-sm text-mutedGrey">
            {t('dashboard.tips.payouts_manager.unpaid_empty')}
          </div>
        ) : (
          <>
            <div className="divide-y divide-nexoraBorder/60 md:hidden">
              {debts.map((row) => (
                <article key={row.payoutDebtId} className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2.5">
                      {row.staffPhotoUrl ? (
                        <img src={row.staffPhotoUrl} alt="" className="h-9 w-9 shrink-0 rounded-full object-cover" />
                      ) : (
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-nexoraBrand text-[11px] font-black text-white">
                          {staffInitials(row.staffDisplayName)}
                        </span>
                      )}
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-inkBlue">{row.staffDisplayName}</p>
                        <p className="text-[10px] text-mutedGrey">{row.staffCode}</p>
                      </div>
                    </div>
                    <p className="text-base font-black text-inkBlue">{formatCurrency(row.balance)}</p>
                  </div>
                  <p className="flex items-center gap-1 text-[11px] text-mutedGrey">
                    <Clock3 className="h-3.5 w-3.5" />
                    {formatTransactionDateTime(row.lastUpdatedAt, currentLanguage)}
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => onViewHistory(row)}
                      className="inline-flex h-9 items-center justify-center gap-1 rounded-lg border border-nexoraBorder bg-white px-2 text-xs font-bold text-inkBlue"
                    >
                      <FileClock className="h-3.5 w-3.5" />
                      {t('dashboard.tips.payouts_manager.unpaid_view_history')}
                    </button>
                    <button
                      type="button"
                      onClick={() => onCreatePayout(row.staffProfileId)}
                      className="inline-flex h-9 items-center justify-center gap-1 rounded-lg bg-nexoraBrand px-2 text-xs font-bold text-white"
                    >
                      <PlusCircle className="h-3.5 w-3.5" />
                      {t('dashboard.tips.payouts_manager.unpaid_create_payout')}
                    </button>
                  </div>
                </article>
              ))}
            </div>

            <div className="hidden overflow-x-auto p-4 md:block">
              <table className="min-w-[760px] w-full text-left text-sm">
                <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-wider text-mutedGrey">
                  <tr>
                    <th className="px-4 py-3">{t('dashboard.tips.payouts_manager.col_staff')}</th>
                    <th className="px-4 py-3">{t('dashboard.tips.payouts_manager.unpaid_col_balance')}</th>
                    <th className="px-4 py-3">{t('dashboard.tips.payouts_manager.unpaid_col_updated')}</th>
                    <th className="px-4 py-3">{t('dashboard.tips.payouts_manager.col_actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {debts.map((row) => (
                    <tr key={row.payoutDebtId} className="border-t border-nexoraBorder/70 hover:bg-slate-50/80">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {row.staffPhotoUrl ? (
                            <img src={row.staffPhotoUrl} alt="" className="h-7 w-7 rounded-full object-cover" />
                          ) : (
                            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-nexoraBrand text-[10px] font-black text-white">
                              {staffInitials(row.staffDisplayName)}
                            </span>
                          )}
                          <div>
                            <p className="text-sm font-bold text-inkBlue">{row.staffDisplayName}</p>
                            <p className="text-[10px] text-mutedGrey">{row.staffCode}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm font-black text-inkBlue">
                        {formatCurrency(row.balance)}
                      </td>
                      <td className="px-4 py-3 text-xs text-mutedGrey">
                        {formatTransactionDateTime(row.lastUpdatedAt, currentLanguage)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => onViewHistory(row)}
                            className="inline-flex h-8 items-center gap-1 rounded-lg border border-nexoraBorder px-2.5 text-[11px] font-bold text-inkBlue"
                          >
                            <FileClock className="h-3.5 w-3.5" />
                            {t('dashboard.tips.payouts_manager.unpaid_view_history')}
                          </button>
                          <button
                            type="button"
                            onClick={() => onCreatePayout(row.staffProfileId)}
                            className="inline-flex h-8 items-center gap-1 rounded-lg bg-nexoraBrand px-2.5 text-[11px] font-bold text-white"
                          >
                            <PlusCircle className="h-3.5 w-3.5" />
                            {t('dashboard.tips.payouts_manager.unpaid_create_payout')}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
