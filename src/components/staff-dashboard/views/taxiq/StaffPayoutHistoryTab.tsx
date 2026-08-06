import { useEffect, useState } from 'react'
import { useTranslation } from '../../../../contexts/LanguageContext'
import { useTaxiqStaffPayoutsHistory } from '../../../../data/hooks/useTaxiqStaffPayouts'
import { STAFF_PAYOUT_HISTORY_STATUSES, type StaffPayoutHistoryStatus } from '../../../../data/repositories/taxiqStaffPayouts'
import { usePagination } from '../../../../hooks/usePagination'
import { formatCurrency } from '../../../dashboard/utils'
import { formatPayoutPeriodRange } from '../../../../utils/payoutDisplay'
import { SkeletonList } from '../../../ui/skeleton'
import Pagination from '../../../ui/Pagination'
import PayoutStatusBadge from '../../../dashboard/views/taxiq/shared/PayoutStatusBadge'

export default function StaffPayoutHistoryTab() {
  const { t, currentLanguage } = useTranslation()
  const [statusFilter, setStatusFilter] = useState<StaffPayoutHistoryStatus | 'all'>('all')
  const { pageNumber, pageSize, setPage, reset } = usePagination()

  useEffect(() => {
    reset()
  }, [statusFilter, reset])

  const listQuery = useTaxiqStaffPayoutsHistory({
    status: statusFilter !== 'all' ? statusFilter : undefined,
    pageNumber,
    pageSize,
  })
  const page = listQuery.data
  const items = page?.items ?? []

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as StaffPayoutHistoryStatus | 'all')}
          className="rounded-lg border border-nexoraBorder px-3 py-2 text-xs font-semibold"
        >
          <option value="all">{t('taxiq.staffPayoutConfirmation.history.filters.allStatuses')}</option>
          {STAFF_PAYOUT_HISTORY_STATUSES.map((status) => (
            <option key={status} value={status}>{t(`taxiq.payoutCenter.status.${status}`)}</option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto rounded-xl border border-nexoraBorder bg-white">
        <table className="w-full min-w-[860px] text-left text-xs">
          <thead className="bg-nexoraCanvas text-[10px] font-extrabold uppercase text-nexoraMuted">
            <tr>
              <th className="px-4 py-3">{t('taxiq.staffPayoutConfirmation.columns.payPeriod')}</th>
              <th className="px-4 py-3">{t('taxiq.staffPayoutConfirmation.columns.period')}</th>
              <th className="px-4 py-3">{t('taxiq.staffPayoutConfirmation.columns.servicePayout')}</th>
              <th className="px-4 py-3">{t('taxiq.staffPayoutConfirmation.columns.tip')}</th>
              <th className="px-4 py-3">{t('taxiq.staffPayoutConfirmation.columns.bonus')}</th>
              <th className="px-4 py-3">{t('taxiq.staffPayoutConfirmation.columns.reimbursement')}</th>
              <th className="px-4 py-3">{t('taxiq.staffPayoutConfirmation.columns.paymentMethod')}</th>
              <th className="px-4 py-3">{t('taxiq.staffPayoutConfirmation.history.columns.status')}</th>
            </tr>
          </thead>
          <tbody>
            {listQuery.isPending ? (
              <tr>
                <td colSpan={8} className="p-4">
                  <SkeletonList count={4} lines={1} />
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center font-medium text-nexoraMuted">
                  {t('taxiq.staffPayoutConfirmation.history.emptyState')}
                </td>
              </tr>
            ) : (
              items.map((payout) => (
                <tr key={payout.id} className="border-t border-nexoraRule">
                  <td className="px-4 py-3 font-bold text-nexoraText">{payout.payPeriod}</td>
                  <td className="px-4 py-3 text-nexoraMuted">
                    {formatPayoutPeriodRange(payout.periodStart, payout.periodEnd, currentLanguage)}
                  </td>
                  <td className="px-4 py-3 text-nexoraText">{formatCurrency(payout.servicePayout)}</td>
                  <td className="px-4 py-3 text-nexoraText">{formatCurrency(payout.totalTip)}</td>
                  <td className="px-4 py-3 text-nexoraText">{formatCurrency(payout.bonus)}</td>
                  <td className="px-4 py-3 text-nexoraText">{formatCurrency(payout.reimbursement)}</td>
                  <td className="px-4 py-3 text-nexoraMuted">{payout.paymentMethod}</td>
                  <td className="px-4 py-3">
                    <PayoutStatusBadge status={payout.status} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {page && page.totalCount > 0 && (
        <Pagination
          variant="simple"
          pageNumber={page.pageNumber}
          pageSize={pageSize}
          totalPages={page.totalPages}
          totalCount={page.totalCount}
          hasNextPage={page.hasNextPage}
          hasPreviousPage={page.hasPreviousPage}
          onPageChange={setPage}
          isLoading={listQuery.isFetching}
        />
      )}
    </div>
  )
}
