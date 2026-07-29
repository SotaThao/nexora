import { Eye, FileImage, Loader2 } from 'lucide-react'
import type { TFunction } from '../../../types/contexts'
import type { PayoutRecord } from '../../../types/domain'
import { formatCurrency, DateTimeCell } from '../../dashboard/utils'
import {
  formatPayoutPeriodRange,
  getPayoutTypeI18nKeys,
  staffInitials,
} from '../../../utils/payoutDisplay'
import Tooltip from '../../ui/Tooltip'
import PayoutCard from './PayoutCard'
import PayoutMethodBadge from './PayoutMethodBadge'
import PayoutStatusBadge from './PayoutStatusBadge'

export default function PayoutList({
  payouts,
  isPending,
  currentLanguage,
  t,
  onSelectPayout,
}: {
  payouts: PayoutRecord[]
  isPending?: boolean
  currentLanguage: string
  t: TFunction
  onSelectPayout: (payoutId: string) => void
}) {
  if (isPending) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-nexoraBrand" />
      </div>
    )
  }

  if (!payouts.length) {
    return (
      <div className="px-4 py-16 text-center text-sm text-mutedGrey">
        {t('dashboard.tips.payouts_manager.empty')}
      </div>
    )
  }

  return (
    <>
      <div className="space-y-3 sm:hidden">
        {payouts.map((row) => (
          <PayoutCard
            key={row.id}
            payout={row}
            currentLanguage={currentLanguage}
            t={t}
            onSelectPayout={onSelectPayout}
          />
        ))}
      </div>

      <div className="hidden overflow-x-auto sm:block">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-wider text-mutedGrey">
            <tr>
              <th className="px-4 py-3">
                <span className="inline-flex items-center gap-1">
                  {t('dashboard.tips.payouts_manager.col_code')}
                  <Tooltip
                    content={t('dashboard.tips.payouts_manager.col_code_tooltip')}
                    ariaLabel={t('dashboard.tips.payouts_manager.col_code_tooltip')}
                    align="start"
                    placement="bottom"
                    className="normal-case tracking-normal"
                  />
                </span>
              </th>
              <th className="px-4 py-3">{t('dashboard.tips.payouts_manager.col_date')}</th>
              <th className="px-4 py-3">{t('dashboard.tips.payouts_manager.col_staff')}</th>
              <th className="px-4 py-3">{t('dashboard.tips.payouts_manager.col_amount')}</th>
              <th className="hidden px-4 py-3 lg:table-cell">{t('dashboard.tips.payouts_manager.col_method')}</th>
              <th className="hidden px-4 py-3 xl:table-cell">{t('dashboard.tips.payouts_manager.col_types')}</th>
              <th className="hidden px-4 py-3 lg:table-cell">{t('dashboard.tips.payouts_manager.col_period')}</th>
              <th className="hidden px-4 py-3 xl:table-cell">{t('dashboard.tips.payouts_manager.col_evidence')}</th>
              <th className="px-4 py-3">{t('dashboard.tips.payouts_manager.col_status')}</th>
              <th className="px-4 py-3">{t('dashboard.tips.payouts_manager.col_actions')}</th>
            </tr>
          </thead>
          <tbody>
            {payouts.map((row) => (
              <tr key={row.id} className="border-t border-nexoraBorder/70 hover:bg-slate-50/80">
                <td className="px-4 py-3 font-mono text-xs font-bold text-nexoraBrand">{row.payoutCode}</td>
                <td className="px-4 py-3 text-xs text-mutedGrey">
                  <DateTimeCell value={row.createdAt} locale={currentLanguage} />
                </td>
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
                <td className="px-4 py-3 text-sm font-black text-inkBlue">{formatCurrency(row.amount)}</td>
                <td className="hidden px-4 py-3 lg:table-cell">
                  <PayoutMethodBadge method={row.payoutMethodTypeName?.trim() || row.payoutMethodType} />
                </td>
                <td className="hidden px-4 py-3 xl:table-cell">
                  <div className="flex flex-wrap gap-1">
                    {getPayoutTypeI18nKeys(row.payoutTypes).map((key) => (
                      <span
                        key={key}
                        className="rounded-md border border-nexoraBorder bg-slate-50 px-1.5 py-0.5 text-[10px] font-bold"
                      >
                        {t(key)}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="hidden px-4 py-3 text-xs text-mutedGrey lg:table-cell">
                  {formatPayoutPeriodRange(row.periodStart, row.periodEnd, currentLanguage)}
                </td>
                <td className="hidden px-4 py-3 xl:table-cell">
                  {row.evidenceCount > 0 ? (
                    <button
                      type="button"
                      onClick={() => onSelectPayout(row.id)}
                      className="inline-flex items-center gap-1 text-xs font-bold text-nexoraBrand"
                    >
                      <FileImage className="h-3.5 w-3.5" />
                      {t('dashboard.tips.payouts_manager.evidence_count', { count: row.evidenceCount })}
                    </button>
                  ) : (
                    <span className="text-xs text-mutedGrey">—</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <PayoutStatusBadge status={row.status} />
                </td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => onSelectPayout(row.id)}
                    title={t('common.view_detail')}
                    aria-label={t('common.view_detail')}
                    className="inline-flex h-9 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-nexoraBorder bg-white px-3 text-xs font-bold text-inkBlue transition hover:border-nexoraBrand/40 hover:bg-nexoraBrand/5"
                  >
                    <Eye className="h-4 w-4 shrink-0" />
                    <span>{t('common.view_detail')}</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
