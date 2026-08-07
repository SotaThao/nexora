// PosCompletedOrdersPanel — Front Desk "Completed Orders" tab (US-17 follow-up): paginated,
// filterable history of this business's checked-out orders. No date range is applied by
// default (shows every completed order, most recent first) — defaulting to "today" would
// silently hide a name/phone match whose order wasn't completed today, which is confusing
// since name/phone are meant to be independent filters, not scoped to whatever date range
// happens to be selected. The date pickers are opt-in for narrowing the range.
import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useTranslation } from '../../../../contexts/LanguageContext'
import { useCompletedOrders } from '../../../../data/hooks/usePosOrders'
import { useOrderDetail } from '../../../../data/hooks/usePosCheckout'
import { qk } from '../../../../data/queryKeys'
import { SkeletonList } from '../../../ui/skeleton'
import { formatPosDateTime } from './posDateTime'

const PAGE_SIZE = 10

export default function PosCompletedOrdersPanel({ businessId }: { businessId: string }) {
  const { t, currentLanguage } = useTranslation()
  const formatDateTime = (iso: string | null | undefined) =>
    formatPosDateTime(iso, currentLanguage, { withYear: false })
  const queryClient = useQueryClient()
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
  const [viewDetailTargetId, setViewDetailTargetId] = useState<string | null>(null)

  const { data, isLoading, isFetching } = useCompletedOrders(businessId, {
    pageNumber,
    pageSize: PAGE_SIZE,
    dateFrom: appliedFilters.dateFrom || undefined,
    dateTo: appliedFilters.dateTo || undefined,
    customerName: appliedFilters.customerName || undefined,
    customerPhone: appliedFilters.customerPhone || undefined,
  })

  const items = data?.items ?? []

  const viewDetail = useOrderDetail(businessId, viewDetailTargetId ?? undefined)

  const handleApplyFilters = () => {
    setAppliedFilters({
      dateFrom,
      dateTo,
      customerName: customerNameInput.trim(),
      customerPhone: customerPhoneInput.trim(),
    })
    setPageNumber(1)
    // Re-applying the exact same filter values (e.g. retrying a search) produces the same
    // query key, which TanStack Query would otherwise silently serve from cache instead of
    // refetching — invalidate so "Lọc" always hits the API with the latest data.
    queryClient.invalidateQueries({ queryKey: qk.merchantPosCompletedOrders(businessId) })
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 rounded-xl border border-posFdBorder bg-posFdSurface p-4 sm:grid-cols-2 lg:grid-cols-5">
        <div>
          <label className="mb-1 block text-[10px] font-extrabold uppercase text-posFdMuted">
            {t('components.dashboard.views.pos.PosCompletedOrdersPanel.dateFrom')}
          </label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="h-9 w-full rounded-lg border border-posFdBorder bg-white px-2.5 text-xs text-posFdText outline-none focus:border-posFdAccent"
          />
        </div>
        <div>
          <label className="mb-1 block text-[10px] font-extrabold uppercase text-posFdMuted">
            {t('components.dashboard.views.pos.PosCompletedOrdersPanel.dateTo')}
          </label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="h-9 w-full rounded-lg border border-posFdBorder bg-white px-2.5 text-xs text-posFdText outline-none focus:border-posFdAccent"
          />
        </div>
        <div>
          <label className="mb-1 block text-[10px] font-extrabold uppercase text-posFdMuted">
            {t('components.dashboard.views.pos.PosCompletedOrdersPanel.customerName')}
          </label>
          <input
            type="text"
            value={customerNameInput}
            onChange={(e) => setCustomerNameInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleApplyFilters()}
            placeholder={t('components.dashboard.views.pos.PosCompletedOrdersPanel.customerNamePlaceholder')}
            className="h-9 w-full rounded-lg border border-posFdBorder bg-white px-2.5 text-xs text-posFdText outline-none focus:border-posFdAccent"
          />
        </div>
        <div>
          <label className="mb-1 block text-[10px] font-extrabold uppercase text-posFdMuted">
            {t('components.dashboard.views.pos.PosCompletedOrdersPanel.customerPhone')}
          </label>
          <input
            type="tel"
            value={customerPhoneInput}
            onChange={(e) => setCustomerPhoneInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleApplyFilters()}
            placeholder={t('components.dashboard.views.pos.PosCompletedOrdersPanel.customerPhonePlaceholder')}
            className="h-9 w-full rounded-lg border border-posFdBorder bg-white px-2.5 text-xs text-posFdText outline-none focus:border-posFdAccent"
          />
        </div>
        <div className="flex items-end">
          <button
            type="button"
            onClick={handleApplyFilters}
            className="h-9 w-full rounded-lg bg-posFdAccent text-xs font-bold text-white hover:bg-posFdAccentDark"
          >
            {t('components.dashboard.views.pos.PosCompletedOrdersPanel.applyFiltersButton')}
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="rounded-xl border border-posFdBorder bg-posFdSurface p-6">
          <SkeletonList count={4} lines={1} />
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-posFdBorder bg-posFdSurface p-6 text-center text-xs text-posFdMuted">
          {t('components.dashboard.views.pos.PosCompletedOrdersPanel.empty')}
        </div>
      ) : (
        <div
          className={`rounded-xl border border-posFdBorder bg-posFdSurface p-4 ${isFetching ? 'opacity-60' : ''}`}
        >
          {/* Bounded height + internal scroll, same principle as Order List/Turn Board —
              a full page of completed orders scrolls in place; the pagination footer
              below stays outside this box, always visible. */}
          <div className="max-h-[560px] overflow-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-[10px] font-black uppercase tracking-wide text-posFdMuted">
                  <th className="pb-2 pr-3">{t('components.dashboard.views.pos.PosCompletedOrdersPanel.columnOrder')}</th>
                  <th className="pb-2 pr-3">{t('components.dashboard.views.pos.PosCompletedOrdersPanel.columnGuest')}</th>
                  <th className="pb-2 pr-3">{t('components.dashboard.views.pos.PosCompletedOrdersPanel.columnPhone')}</th>
                  <th className="pb-2 pr-3">{t('components.dashboard.views.pos.PosCompletedOrdersPanel.columnCompletedAt')}</th>
                  <th className="pb-2 pr-3">{t('components.dashboard.views.pos.PosCompletedOrdersPanel.columnTechnician')}</th>
                  <th className="pb-2 pr-3">{t('components.dashboard.views.pos.PosCompletedOrdersPanel.columnServices')}</th>
                  <th className="pb-2 pr-3">{t('components.dashboard.views.pos.PosCompletedOrdersPanel.columnPaymentMethod')}</th>
                  <th className="pb-2 pr-3 text-right">{t('components.dashboard.views.pos.PosCompletedOrdersPanel.columnTotal')}</th>
                  <th className="pb-2 text-right">{t('components.dashboard.views.pos.PosCompletedOrdersPanel.columnActions')}</th>
                </tr>
              </thead>
              <tbody>
                {items.map((order) => (
                  <tr key={order.id} className="border-t border-posFdBorder">
                    <td className="py-2 pr-3 font-mono font-bold text-posFdMuted">#{order.orderNumber}</td>
                    <td className="py-2 pr-3 font-bold text-posFdText">{order.customerName}</td>
                    <td className="py-2 pr-3 text-posFdMuted">{order.customerPhone || '—'}</td>
                    <td className="py-2 pr-3 text-posFdMuted">{formatDateTime(order.completedAt)}</td>
                    <td className="py-2 pr-3 text-posFdMuted">
                      {order.technicianNames.length > 0 ? order.technicianNames.join(', ') : '—'}
                    </td>
                    <td className="py-2 pr-3 text-posFdMuted">
                      {order.serviceNames.length > 0 ? order.serviceNames.join(', ') : '—'}
                    </td>
                    <td className="py-2 pr-3 text-posFdMuted">{order.paymentMethodType || '—'}</td>
                    <td className="py-2 pr-3 text-right font-bold tabular-nums text-posFdText">${order.total.toFixed(2)}</td>
                    <td className="py-2 text-right">
                      <button
                        type="button"
                        onClick={() => setViewDetailTargetId(order.id)}
                        className="rounded-lg border border-posFdBorder px-2.5 py-1 text-[11px] font-bold text-posFdText hover:border-posFdAccent"
                      >
                        {t('components.dashboard.views.pos.PosCompletedOrdersPanel.viewDetailAction')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-3 flex items-center justify-between">
            <span className="text-[11px] text-posFdMuted">
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
                className="rounded-lg border border-posFdBorder px-3 py-1.5 text-[11px] font-bold text-posFdText hover:border-posFdAccent disabled:opacity-40"
              >
                {t('components.dashboard.views.pos.PosCompletedOrdersPanel.previousPage')}
              </button>
              <button
                type="button"
                onClick={() => setPageNumber((p) => p + 1)}
                disabled={!data?.hasNextPage}
                className="rounded-lg border border-posFdBorder px-3 py-1.5 text-[11px] font-bold text-posFdText hover:border-posFdAccent disabled:opacity-40"
              >
                {t('components.dashboard.views.pos.PosCompletedOrdersPanel.nextPage')}
              </button>
            </div>
          </div>
        </div>
      )}

      {viewDetailTargetId ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="nexora-modal-card w-full max-w-2xl">
            <h3 className="shrink-0 text-sm font-bold text-posFdText">
              {t('components.dashboard.views.pos.PosCompletedOrdersPanel.viewDetailModalTitle')}
            </h3>
            <div className="mt-3 flex-1 space-y-4 overflow-y-auto">
              {viewDetail.isLoading || !viewDetail.data ? (
                <SkeletonList count={2} lines={2} />
              ) : (
                <>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <p className="text-[10px] font-extrabold uppercase text-posFdMuted">
                        {t('components.dashboard.views.pos.PosCompletedOrdersPanel.viewDetailCustomer')}
                      </p>
                      <p className="text-xs text-posFdText">{viewDetail.data.customerName}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-extrabold uppercase text-posFdMuted">
                        {t('components.dashboard.views.pos.PosCompletedOrdersPanel.viewDetailPhone')}
                      </p>
                      <p className="text-xs text-posFdText">
                        {viewDetail.data.customerPhone || t('components.dashboard.views.pos.PosCompletedOrdersPanel.viewDetailNotProvided')}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-extrabold uppercase text-posFdMuted">
                        {t('components.dashboard.views.pos.PosCompletedOrdersPanel.viewDetailEmail')}
                      </p>
                      <p className="text-xs text-posFdText">
                        {viewDetail.data.customerEmail || t('components.dashboard.views.pos.PosCompletedOrdersPanel.viewDetailNotProvided')}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-extrabold uppercase text-posFdMuted">
                        {t('components.dashboard.views.pos.PosCompletedOrdersPanel.viewDetailOrderNumber')}
                      </p>
                      <p className="text-xs text-posFdText">#{viewDetail.data.orderNumber}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-extrabold uppercase text-posFdMuted">
                        {t('components.dashboard.views.pos.PosCompletedOrdersPanel.viewDetailCompletedAt')}
                      </p>
                      <p className="text-xs text-posFdText">{formatDateTime(viewDetail.data.completedAt)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-extrabold uppercase text-posFdMuted">
                        {t('components.dashboard.views.pos.PosCompletedOrdersPanel.viewDetailStatus')}
                      </p>
                      <p className="text-xs text-posFdText">{viewDetail.data.status}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-extrabold uppercase text-posFdMuted">
                        {t('components.dashboard.views.pos.PosCompletedOrdersPanel.viewDetailPaymentMethod')}
                      </p>
                      <p className="text-xs text-posFdText">
                        {viewDetail.data.paymentMethodType || t('components.dashboard.views.pos.PosCompletedOrdersPanel.viewDetailNotProvided')}
                      </p>
                    </div>
                  </div>

                  {viewDetail.data.serviceLines.length > 0 ? (
                    <div>
                      <h4 className="mb-2 text-[10px] font-black uppercase tracking-wider text-posFdMuted">
                        {t('components.dashboard.views.pos.PosCompletedOrdersPanel.viewDetailServicesTitle')}
                      </h4>
                      <div className="space-y-2">
                        {viewDetail.data.serviceLines.map((line) => (
                          <div key={line.id} className="rounded-lg border border-posFdBorder p-2.5">
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-xs font-bold text-posFdText">{line.serviceName}</p>
                              <p className="shrink-0 text-xs font-bold tabular-nums text-posFdText">
                                ${line.lineTotal.toFixed(2)}
                              </p>
                            </div>
                            <p className="text-[11px] text-posFdMuted">
                              {line.technicianName || t('components.dashboard.views.pos.PosCompletedOrdersPanel.viewDetailUnassigned')}
                            </p>
                            {line.note ? (
                              <p className="mt-1 rounded bg-posFdCanvas p-1.5 text-[11px] italic text-posFdMuted">{line.note}</p>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {viewDetail.data.productLines.length > 0 ? (
                    <div>
                      <h4 className="mb-2 text-[10px] font-black uppercase tracking-wider text-posFdMuted">
                        {t('components.dashboard.views.pos.PosCompletedOrdersPanel.viewDetailProductsTitle')}
                      </h4>
                      <div className="space-y-2">
                        {viewDetail.data.productLines.map((line) => (
                          <div key={line.id} className="rounded-lg border border-posFdBorder p-2.5">
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-xs font-bold text-posFdText">{line.productName}</p>
                              <p className="shrink-0 text-xs font-bold tabular-nums text-posFdText">
                                ${line.lineTotal.toFixed(2)}
                              </p>
                            </div>
                            <p className="text-[11px] text-posFdMuted">
                              {t('components.dashboard.views.pos.PosCompletedOrdersPanel.viewDetailQty', { quantity: line.quantity })} · ${line.unitPrice.toFixed(2)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  <div className="space-y-1 rounded-lg bg-posFdCanvas p-3 text-xs">
                    <div className="flex justify-between text-posFdMuted">
                      <span>{t('components.dashboard.views.pos.PosCompletedOrdersPanel.viewDetailServicesSubtotal')}</span>
                      <span className="tabular-nums">${viewDetail.data.servicesSubtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-posFdMuted">
                      <span>{t('components.dashboard.views.pos.PosCompletedOrdersPanel.viewDetailProductsSubtotal')}</span>
                      <span className="tabular-nums">${viewDetail.data.productsSubtotal.toFixed(2)}</span>
                    </div>
                    {viewDetail.data.discountAmount > 0 ? (
                      <div className="flex justify-between text-posFdMuted">
                        <span>{t('components.dashboard.views.pos.PosCompletedOrdersPanel.viewDetailDiscount')}</span>
                        <span className="tabular-nums">-${viewDetail.data.discountAmount.toFixed(2)}</span>
                      </div>
                    ) : null}
                    <div className="flex justify-between text-posFdMuted">
                      <span>{t('components.dashboard.views.pos.PosCompletedOrdersPanel.viewDetailSalesTax')}</span>
                      <span className="tabular-nums">${viewDetail.data.salesTaxAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-posFdMuted">
                      <span>{t('components.dashboard.views.pos.PosCompletedOrdersPanel.viewDetailTip')}</span>
                      <span className="tabular-nums">${viewDetail.data.tipAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between border-t border-posFdBorder pt-1 font-black text-posFdText">
                      <span className="uppercase">{t('components.dashboard.views.pos.PosCompletedOrdersPanel.viewDetailTotal')}</span>
                      <span className="tabular-nums">${viewDetail.data.total.toFixed(2)}</span>
                    </div>
                  </div>
                </>
              )}
            </div>
            <div className="mt-4 flex shrink-0 gap-2">
              <button
                type="button"
                onClick={() => setViewDetailTargetId(null)}
                className="h-10 flex-1 rounded-lg border border-posFdBorder text-xs font-bold text-posFdText hover:border-posFdAccent"
              >
                {t('components.dashboard.views.pos.PosCompletedOrdersPanel.viewDetailClose')}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
