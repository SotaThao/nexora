import { Loader2, X } from 'lucide-react'
import { useTranslation } from '../../../contexts/LanguageContext'
import { useMerchantDebtHistory } from '../../../data/hooks/useMerchantPayouts'
import { PayoutDebtTransactionType } from '../../../data/payoutConstants'
import type { UnpaidTipDebtRecord } from '../../../types/domain'
import { formatCurrency, formatTransactionDateTime } from '../../dashboard/utils'

function getTransactionLabelKey(type: number): string {
  switch (type) {
    case PayoutDebtTransactionType.TipDebt:
      return 'dashboard.tips.payouts_manager.debt_tx_tip_debt'
    case PayoutDebtTransactionType.PayoutSettlement:
      return 'dashboard.tips.payouts_manager.debt_tx_settlement'
    case PayoutDebtTransactionType.PayoutReversal:
      return 'dashboard.tips.payouts_manager.debt_tx_reversal'
    default:
      return 'dashboard.tips.payouts_manager.debt_tx_tip_debt'
  }
}

export default function PayoutDebtHistoryModal({
  staff,
  onClose,
}: {
  staff: UnpaidTipDebtRecord | null
  onClose: () => void
}) {
  const { t, currentLanguage } = useTranslation()
  const isOpen = Boolean(staff)
  const { data, isPending } = useMerchantDebtHistory(
    { staffProfileId: staff?.staffProfileId },
    { enabled: isOpen },
  )

  if (!isOpen) return null

  const rows = data?.items ?? []

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-slate-900/50 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="max-h-[92dvh] w-full max-w-2xl overflow-y-auto rounded-t-2xl border border-nexoraBorder bg-white shadow-2xl sm:rounded-2xl">
        <div className="flex items-start justify-between border-b border-nexoraBorder px-5 py-4">
          <div>
            <h3 className="text-base font-black text-inkBlue">
              {t('dashboard.tips.payouts_manager.debt_history_title')}
            </h3>
            <p className="mt-1 text-xs text-mutedGrey">
              {t('dashboard.tips.payouts_manager.debt_history_sub', {
                staff: staff?.staffDisplayName ?? '',
              })}
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

        {isPending ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-nexoraBrand" />
          </div>
        ) : rows.length === 0 ? (
          <div className="px-5 py-16 text-center text-sm text-mutedGrey">
            {t('dashboard.tips.payouts_manager.debt_history_empty')}
          </div>
        ) : (
          <div className="overflow-x-auto p-4">
            <table className="min-w-[640px] w-full text-left text-sm">
              <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-wider text-mutedGrey">
                <tr>
                  <th className="px-3 py-2.5">{t('dashboard.tips.payouts_manager.debt_col_created')}</th>
                  <th className="px-3 py-2.5">{t('dashboard.tips.payouts_manager.debt_col_type')}</th>
                  <th className="px-3 py-2.5">{t('dashboard.tips.payouts_manager.debt_col_amount')}</th>
                  <th className="px-3 py-2.5">{t('dashboard.tips.payouts_manager.debt_col_note')}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const isIncrease = row.amount > 0
                  return (
                    <tr key={row.id} className="border-t border-nexoraBorder/70">
                      <td className="px-3 py-2.5 text-xs text-mutedGrey">
                        {formatTransactionDateTime(row.createdAt, currentLanguage)}
                      </td>
                      <td className="px-3 py-2.5 text-xs font-semibold text-inkBlue">
                        {t(getTransactionLabelKey(row.transactionType))}
                      </td>
                      <td
                        className={`px-3 py-2.5 text-xs font-black ${isIncrease ? 'text-emerald-700' : 'text-rose-600'}`}
                      >
                        {formatCurrency(row.amount)}
                      </td>
                      <td className="px-3 py-2.5 text-xs text-mutedGrey">
                        {row.description || '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
