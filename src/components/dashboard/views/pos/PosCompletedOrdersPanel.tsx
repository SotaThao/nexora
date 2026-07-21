// PosCompletedOrdersPanel — Front Desk "Completed Orders" tab (US-17 follow-up): paginated,
// filterable history of this business's checked-out orders. No date range is applied by
// default (shows every completed order, most recent first) — defaulting to "today" would
// silently hide a name/phone match whose order wasn't completed today, which is confusing
// since name/phone are meant to be independent filters, not scoped to whatever date range
// happens to be selected. The date pickers are opt-in for narrowing the range.
import { useState } from 'react'
import { useTranslation } from '../../../../contexts/LanguageContext'
import { useCompletedOrders } from '../../../../data/hooks/usePosOrders'
import { SkeletonList } from '../../../ui/skeleton'

const PAGE_SIZE = 20

function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function PosCompletedOrdersPanel({ businessId }: { businessId: string }) {
  const { t } = useTranslation()
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [customerNameInput, setCustomerNameInput] = useState('')
  const [customerPhoneInput, setCustomerPhoneInput] = useState('')
  const [appliedFilters, setAppliedFilters] = useState({
    dateFrom: '',
    dateTo: '',
    customerName: '',
    customerPhone: '',
  })
  const [pageNumber, setPageNumber] = useState(1)

  const { data, isLoading, isFetching } = useCompletedOrders(businessId, {
    pageNumber,
    pageSize: PAGE_SIZE,
    dateFrom: appliedFilters.dateFrom || undefined,
    dateTo: appliedFilters.dateTo || undefined,
    customerName: appliedFilters.customerName || undefined,
    customerPhone: appliedFilters.customerPhone || undefined,
  })

  const items = data?.items ?? []

  const handleApplyFilters = () => {
    setAppliedFilters({
      dateFrom,
      dateTo,
      customerName: customerNameInput.trim(),
      customerPhone: customerPhoneInput.trim(),
    })
    setPageNumber(1)
  }

  return (
    <div className="space-y-4">
      <div className="nexora-card grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 lg:grid-cols-5">
        <div>
          <label className="mb-1 block text-[10px] font-extrabold uppercase text-nexoraMuted">
            {t('components.dashboard.views.pos.PosCompletedOrdersPanel.dateFrom')}
          </label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="h-9 w-full rounded-lg border border-nexoraBorder bg-white px-2.5 text-xs text-nexoraText outline-none focus:border-nexoraBrand"
          />
        </div>
        <div>
          <label className="mb-1 block text-[10px] font-extrabold uppercase text-nexoraMuted">
            {t('components.dashboard.views.pos.PosCompletedOrdersPanel.dateTo')}
          </label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="h-9 w-full rounded-lg border border-nexoraBorder bg-white px-2.5 text-xs text-nexoraText outline-none focus:border-nexoraBrand"
          />
        </div>
        <div>
          <label className="mb-1 block text-[10px] font-extrabold uppercase text-nexoraMuted">
            {t('components.dashboard.views.pos.PosCompletedOrdersPanel.customerName')}
          </label>
          <input
            type="text"
            value={customerNameInput}
            onChange={(e) => setCustomerNameInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleApplyFilters()}
            placeholder={t('components.dashboard.views.pos.PosCompletedOrdersPanel.customerNamePlaceholder')}
            className="h-9 w-full rounded-lg border border-nexoraBorder bg-white px-2.5 text-xs text-nexoraText outline-none focus:border-nexoraBrand"
          />
        </div>
        <div>
          <label className="mb-1 block text-[10px] font-extrabold uppercase text-nexoraMuted">
            {t('components.dashboard.views.pos.PosCompletedOrdersPanel.customerPhone')}
          </label>
          <input
            type="tel"
            value={customerPhoneInput}
            onChange={(e) => setCustomerPhoneInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleApplyFilters()}
            placeholder={t('components.dashboard.views.pos.PosCompletedOrdersPanel.customerPhonePlaceholder')}
            className="h-9 w-full rounded-lg border border-nexoraBorder bg-white px-2.5 text-xs text-nexoraText outline-none focus:border-nexoraBrand"
          />
        </div>
        <div className="flex items-end">
          <button
            type="button"
            onClick={handleApplyFilters}
            className="h-9 w-full rounded-lg bg-nexoraBrand text-xs font-bold text-white hover:bg-nexoraBrandDark"
          >
            {t('components.dashboard.views.pos.PosCompletedOrdersPanel.applyFiltersButton')}
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="nexora-card p-6">
          <SkeletonList count={4} lines={1} />
        </div>
      ) : items.length === 0 ? (
        <div className="nexora-card p-6 text-center text-xs text-nexoraMuted">
          {t('components.dashboard.views.pos.PosCompletedOrdersPanel.empty')}
        </div>
      ) : (
        <div className={`nexora-card overflow-x-auto p-4 ${isFetching ? 'opacity-60' : ''}`}>
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-[10px] font-black uppercase tracking-wide text-nexoraMuted">
                <th className="pb-2 pr-3">{t('components.dashboard.views.pos.PosCompletedOrdersPanel.columnOrder')}</th>
                <th className="pb-2 pr-3">{t('components.dashboard.views.pos.PosCompletedOrdersPanel.columnGuest')}</th>
                <th className="pb-2 pr-3">{t('components.dashboard.views.pos.PosCompletedOrdersPanel.columnPhone')}</th>
                <th className="pb-2 pr-3">{t('components.dashboard.views.pos.PosCompletedOrdersPanel.columnCompletedAt')}</th>
                <th className="pb-2 pr-3">{t('components.dashboard.views.pos.PosCompletedOrdersPanel.columnTechnician')}</th>
                <th className="pb-2 pr-3">{t('components.dashboard.views.pos.PosCompletedOrdersPanel.columnServices')}</th>
                <th className="pb-2 pr-3">{t('components.dashboard.views.pos.PosCompletedOrdersPanel.columnPaymentMethod')}</th>
                <th className="pb-2 text-right">{t('components.dashboard.views.pos.PosCompletedOrdersPanel.columnTotal')}</th>
              </tr>
            </thead>
            <tbody>
              {items.map((order) => (
                <tr key={order.id} className="border-t border-nexoraBorder">
                  <td className="py-2 pr-3 font-mono font-bold text-nexoraMuted">#{order.orderNumber}</td>
                  <td className="py-2 pr-3 font-bold text-nexoraText">{order.customerName}</td>
                  <td className="py-2 pr-3 text-nexoraMuted">{order.customerPhone || '—'}</td>
                  <td className="py-2 pr-3 text-nexoraMuted">{formatDateTime(order.completedAt)}</td>
                  <td className="py-2 pr-3 text-nexoraMuted">
                    {order.technicianNames.length > 0 ? order.technicianNames.join(', ') : '—'}
                  </td>
                  <td className="py-2 pr-3 text-nexoraMuted">
                    {order.serviceNames.length > 0 ? order.serviceNames.join(', ') : '—'}
                  </td>
                  <td className="py-2 pr-3 text-nexoraMuted">{order.paymentMethodType || '—'}</td>
                  <td className="py-2 text-right font-bold text-nexoraText">${order.total.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-3 flex items-center justify-between">
            <span className="text-[11px] text-nexoraMuted">
              {t('components.dashboard.views.pos.PosCompletedOrdersPanel.pageSummary', {
                page: data?.pageNumber ?? 1,
                totalPages: Math.max(data?.totalPages ?? 1, 1),
                totalCount: data?.totalCount ?? 0,
              })}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
                disabled={!data?.hasPreviousPage}
                className="rounded-lg border border-nexoraBorder px-3 py-1.5 text-[11px] font-bold text-nexoraText hover:border-nexoraBrand disabled:opacity-40"
              >
                {t('components.dashboard.views.pos.PosCompletedOrdersPanel.previousPage')}
              </button>
              <button
                type="button"
                onClick={() => setPageNumber((p) => p + 1)}
                disabled={!data?.hasNextPage}
                className="rounded-lg border border-nexoraBorder px-3 py-1.5 text-[11px] font-bold text-nexoraText hover:border-nexoraBrand disabled:opacity-40"
              >
                {t('components.dashboard.views.pos.PosCompletedOrdersPanel.nextPage')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
