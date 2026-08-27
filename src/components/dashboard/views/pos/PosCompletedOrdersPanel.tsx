// PosCompletedOrdersPanel — Front Desk "Completed Orders" tab (US-17 follow-up): paginated,
// filterable history of this business's checked-out orders. No date range is applied by
// default (shows every completed order, most recent first) — defaulting to "today" would
// silently hide a name/phone match whose order wasn't completed today, which is confusing
// since name/phone are meant to be independent filters, not scoped to whatever date range
// happens to be selected. The date pickers are opt-in for narrowing the range.
import { useState } from 'react'
import { Eye } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { useTranslation } from '../../../../contexts/LanguageContext'
import { useCompletedOrders } from '../../../../data/hooks/usePosOrders'
import { useOrderDetail } from '../../../../data/hooks/usePosCheckout'
import { qk } from '../../../../data/queryKeys'
import { SkeletonList } from '../../../ui/skeleton'
import { formatPosDateTime } from './posDateTime'
import { formatCustomerPhone } from './customer/customerFormatters'
import { formatBookingHubDateTimeParts } from '../bookingHubFormatters'
import { getPosCheckoutPaymentMethodLabel } from '../../../../constants/posCheckoutPaymentMethod'
import {
  POS_TABLE_HEADER_CELL_CLASS,
  POS_TABLE_HEADER_ROW_CLASS,
  POS_TABLE_STICKY_ACTION_CELL_CLASS,
  POS_TABLE_STICKY_ACTION_HEADER_CLASS,
} from './posTableStyles'

const PAGE_SIZE = 10

export default function PosCompletedOrdersPanel({ businessId }: { businessId: string }) {
  const { t, currentLanguage } = useTranslation()
  const formatDateTime = (iso: string | null | undefined) =>
    formatPosDateTime(iso, currentLanguage)
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
      <div data-testid="completed-order-filters" className="flex flex-wrap items-center gap-2">
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          aria-label={t('components.dashboard.views.pos.PosCompletedOrdersPanel.dateFrom')}
          className="h-8 w-[140px] rounded-lg border border-nexoraBorder bg-white px-2 text-[11px] text-nexoraText outline-none focus:border-nexoraBrand"
        />
        <input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          aria-label={t('components.dashboard.views.pos.PosCompletedOrdersPanel.dateTo')}
          className="h-8 w-[140px] rounded-lg border border-nexoraBorder bg-white px-2 text-[11px] text-nexoraText outline-none focus:border-nexoraBrand"
        />
        <input
          type="text"
          value={customerNameInput}
          onChange={(e) => setCustomerNameInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleApplyFilters()}
          aria-label={t('components.dashboard.views.pos.PosCompletedOrdersPanel.customerName')}
          placeholder={t('components.dashboard.views.pos.PosCompletedOrdersPanel.customerNamePlaceholder')}
          className="h-8 min-w-[160px] flex-1 rounded-lg border border-nexoraBorder bg-white px-2 text-[11px] text-nexoraText outline-none focus:border-nexoraBrand lg:w-[260px] lg:flex-none"
        />
        <input
          type="tel"
          value={customerPhoneInput}
          onChange={(e) => setCustomerPhoneInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleApplyFilters()}
          aria-label={t('components.dashboard.views.pos.PosCompletedOrdersPanel.customerPhone')}
          placeholder={t('components.dashboard.views.pos.PosCompletedOrdersPanel.customerPhonePlaceholder')}
          className="h-8 min-w-[160px] flex-1 rounded-lg border border-nexoraBorder bg-white px-2 text-[11px] text-nexoraText outline-none focus:border-nexoraBrand lg:w-[260px] lg:flex-none"
        />
        <button
          type="button"
          onClick={handleApplyFilters}
          className="h-8 rounded-lg bg-nexoraBrand px-3 text-[11px] font-bold text-white hover:bg-nexoraBrandDark"
        >
          {t('components.dashboard.views.pos.PosCompletedOrdersPanel.applyFiltersButton')}
        </button>
      </div>

      {isLoading ? (
        <div className="py-6">
          <SkeletonList count={4} lines={1} />
        </div>
      ) : items.length === 0 ? (
        <div className="py-8 text-center text-xs text-nexoraMuted">
          {t('components.dashboard.views.pos.PosCompletedOrdersPanel.empty')}
        </div>
      ) : (
        <div
          className={`overflow-hidden rounded-xl border border-nexoraBorder bg-white ${isFetching ? 'opacity-60' : ''}`}
        >
          {/* Bounded height + internal scroll, same principle as Order List/Turn Board —
              a full page of completed orders scrolls in place; the pagination footer
              below stays outside this box, always visible. */}
          <div className="max-h-[560px] overflow-auto">
            <table className="w-full min-w-[1100px] table-auto text-left text-xs">
              <thead className="sticky top-0 z-[1] bg-nexoraCanvas/90">
                <tr className={POS_TABLE_HEADER_ROW_CLASS}>
                  <th className={POS_TABLE_HEADER_CELL_CLASS}>{t('components.dashboard.views.pos.PosCompletedOrdersPanel.columnNumber')}</th>
                  <th className={POS_TABLE_HEADER_CELL_CLASS}>{t('components.dashboard.views.pos.PosCompletedOrdersPanel.columnCustomer')}</th>
                  <th className={POS_TABLE_HEADER_CELL_CLASS}>{t('components.dashboard.views.pos.PosCompletedOrdersPanel.columnPhone')}</th>
                  <th className={POS_TABLE_HEADER_CELL_CLASS}>{t('components.dashboard.views.pos.PosCompletedOrdersPanel.columnCompletedAt')}</th>
                  <th className={POS_TABLE_HEADER_CELL_CLASS}>{t('components.dashboard.views.pos.PosCompletedOrdersPanel.columnTechnician')}</th>
                  <th className={POS_TABLE_HEADER_CELL_CLASS}>{t('components.dashboard.views.pos.PosCompletedOrdersPanel.columnServices')}</th>
                  <th className={POS_TABLE_HEADER_CELL_CLASS}>{t('components.dashboard.views.pos.PosCompletedOrdersPanel.columnPaymentMethod')}</th>
                  <th className={`${POS_TABLE_HEADER_CELL_CLASS} text-right`}>{t('components.dashboard.views.pos.PosCompletedOrdersPanel.columnTotal')}</th>
                  <th className={`${POS_TABLE_HEADER_CELL_CLASS} ${POS_TABLE_STICKY_ACTION_HEADER_CLASS} text-right`}>{t('components.dashboard.views.pos.PosCompletedOrdersPanel.columnActions')}</th>
                </tr>
              </thead>
              <tbody>
                {items.map((order) => {
                  const completed = formatBookingHubDateTimeParts(order.completedAt, currentLanguage)
                  return (
                    <tr key={order.id} className="border-t border-nexoraBorder/70 bg-emerald-50/20 transition-colors hover:bg-emerald-50/45">
                      <td className="px-4 py-3">
                        <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-1 font-mono text-[10px] font-extrabold text-emerald-700">
                          #{order.orderNumber}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-bold text-nexoraText">{order.customerName}</td>
                      <td className="whitespace-nowrap px-4 py-3 tabular-nums text-nexoraMuted">
                        {formatCustomerPhone(order.customerPhone, order.customerPhoneE164) || '—'}
                      </td>
                      <td className="px-4 py-3 align-middle">
                        <div className="grid gap-0.5 whitespace-nowrap">
                          <span className="font-semibold text-nexoraText">{completed?.date ?? '—'}</span>
                          <span className="text-[11px] font-semibold text-nexoraText">{completed?.time ?? '—'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-semibold text-nexoraText">
                        <span className="inline-flex max-w-full rounded-full bg-cyan-100/70 px-2.5 py-1 text-cyan-800">
                          <span className="truncate">{order.technicianNames.length > 0 ? order.technicianNames.join(', ') : '—'}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-nexoraText">
                        <div className="flex flex-wrap gap-1">
                          {order.serviceNames.length > 0
                            ? order.serviceNames.map((service) => (
                              <span key={service} className="rounded-full border border-nexoraBrand/15 bg-white px-2 py-1 text-[11px] font-bold text-nexoraText">
                                {service}
                              </span>
                            ))
                            : '—'}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-sky-50 px-2.5 py-1 text-[10px] font-extrabold text-sky-700">
                          {getPosCheckoutPaymentMethodLabel(order.paymentMethodType, t)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-bold tabular-nums text-nexoraText">
                        <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-1 text-emerald-700">
                          ${order.total.toFixed(2)}
                        </span>
                      </td>
                      <td className={`${POS_TABLE_STICKY_ACTION_CELL_CLASS} px-4 py-3 text-right`}>
                        <button
                          type="button"
                          onClick={() => setViewDetailTargetId(order.id)}
                          className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-violet-200 bg-violet-50 px-2.5 text-[10px] font-extrabold text-violet-700 transition-colors hover:border-violet-300 hover:bg-violet-100"
                        >
                          <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                          {t('components.dashboard.views.pos.PosCompletedOrdersPanel.viewDetailAction')}
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between border-t border-emerald-100 bg-emerald-50/30 px-4 py-3">
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

      {viewDetailTargetId ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="nexora-modal-card w-full max-w-2xl">
            <h3 className="shrink-0 text-sm font-bold text-nexoraText">
              {t('components.dashboard.views.pos.PosCompletedOrdersPanel.viewDetailModalTitle')}
            </h3>
            <div className="mt-3 flex-1 space-y-4 overflow-y-auto">
              {viewDetail.isLoading || !viewDetail.data ? (
                <SkeletonList count={2} lines={2} />
              ) : (
                <>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <p className="text-[10px] font-extrabold uppercase text-nexoraMuted">
                        {t('components.dashboard.views.pos.PosCompletedOrdersPanel.viewDetailCustomer')}
                      </p>
                      <p className="text-xs text-nexoraText">{viewDetail.data.customerName}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-extrabold uppercase text-nexoraMuted">
                        {t('components.dashboard.views.pos.PosCompletedOrdersPanel.viewDetailPhone')}
                      </p>
                      <p className="text-xs text-nexoraText">
                        {formatCustomerPhone(viewDetail.data.customerPhone, viewDetail.data.customerPhoneE164)
                          || t('components.dashboard.views.pos.PosCompletedOrdersPanel.viewDetailNotProvided')}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-extrabold uppercase text-nexoraMuted">
                        {t('components.dashboard.views.pos.PosCompletedOrdersPanel.viewDetailEmail')}
                      </p>
                      <p className="text-xs text-nexoraText">
                        {viewDetail.data.customerEmail || t('components.dashboard.views.pos.PosCompletedOrdersPanel.viewDetailNotProvided')}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-extrabold uppercase text-nexoraMuted">
                        {t('components.dashboard.views.pos.PosCompletedOrdersPanel.viewDetailOrderNumber')}
                      </p>
                      <p className="text-xs text-nexoraText">#{viewDetail.data.orderNumber}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-extrabold uppercase text-nexoraMuted">
                        {t('components.dashboard.views.pos.PosCompletedOrdersPanel.viewDetailCompletedAt')}
                      </p>
                      <p className="text-xs font-semibold text-nexoraText">{formatDateTime(viewDetail.data.completedAt)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-extrabold uppercase text-nexoraMuted">
                        {t('components.dashboard.views.pos.PosCompletedOrdersPanel.viewDetailStatus')}
                      </p>
                      <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-extrabold text-emerald-700">
                        {viewDetail.data.status}
                      </span>
                    </div>
                    <div>
                      <p className="text-[10px] font-extrabold uppercase text-nexoraMuted">
                        {t('components.dashboard.views.pos.PosCompletedOrdersPanel.viewDetailPaymentMethod')}
                      </p>
                      <p className="text-xs text-nexoraText">
                        {getPosCheckoutPaymentMethodLabel(
                          viewDetail.data.paymentMethodType,
                          t,
                          t('components.dashboard.views.pos.PosCompletedOrdersPanel.viewDetailNotProvided'),
                        )}
                      </p>
                    </div>
                  </div>

                  {viewDetail.data.serviceLines.length > 0 ? (
                    <div>
                      <h4 className="mb-2 text-[10px] font-black uppercase tracking-wider text-nexoraMuted">
                        {t('components.dashboard.views.pos.PosCompletedOrdersPanel.viewDetailServicesTitle')}
                      </h4>
                      <div className="space-y-2">
                        {viewDetail.data.serviceLines.map((line) => (
                          <div key={line.id} className="rounded-xl border border-nexoraBorder bg-white p-2.5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-nexoraBrand/40 hover:shadow-md">
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-xs font-bold text-nexoraText">{line.serviceName}</p>
                              <p className="shrink-0 text-xs font-bold tabular-nums text-nexoraText">
                                {line.discountAmount > 0 ? (
                                  <>
                                    <span className="mr-1 font-normal text-nexoraMuted line-through">
                                      ${line.lineTotal.toFixed(2)}
                                    </span>
                                    ${line.lineTotalAfterDiscount.toFixed(2)}
                                  </>
                                ) : (
                                  `$${line.lineTotal.toFixed(2)}`
                                )}
                              </p>
                            </div>
                            <p className="text-[11px] font-semibold text-nexoraText">
                              {line.technicianName || t('components.dashboard.views.pos.PosCompletedOrdersPanel.viewDetailUnassigned')}
                            </p>
                            {/* Who absorbed the discount stays visible here, where a pay dispute is
                                actually settled — it is deliberately never on the customer receipt. */}
                            {line.discountAmount > 0 ? (
                              <p className="mt-1 text-[11px] text-amber-700">
                                {t('components.dashboard.views.pos.PosCompletedOrdersPanel.viewDetailLineDiscount', {
                                  amount: line.discountAmount.toFixed(2),
                                  bearer: t(
                                    `components.dashboard.views.pos.PosOrderWorkspace.discountBearer${line.discountBearer}`,
                                  ),
                                })}
                                {line.discountNote ? ` — ${line.discountNote}` : ''}
                              </p>
                            ) : null}
                            {line.note ? (
                              <p className="mt-1 rounded bg-nexoraCanvas p-1.5 text-[11px] italic text-nexoraMuted">{line.note}</p>
                            ) : null}
                            {/* Indented under the service: an add-on was performed by this same
                                technician and counts toward their pay on it. */}
                            {line.addOns?.length ? (
                              <div className="mt-1.5 space-y-1 border-l-2 border-nexoraBorder pl-2.5">
                                {line.addOns.map((addOn) => (
                                  <div key={addOn.id} className="flex items-start justify-between gap-2">
                                    <p className="min-w-0 text-[11px] font-bold text-nexoraText">
                                      + {addOn.addOnName}
                                    </p>
                                    <p className="shrink-0 text-[11px] font-bold tabular-nums text-nexoraText">
                                      {addOn.discountAmount > 0 ? (
                                        <>
                                          <span className="mr-1 font-normal text-nexoraMuted line-through">
                                            ${addOn.lineTotal.toFixed(2)}
                                          </span>
                                          ${addOn.lineTotalAfterDiscount.toFixed(2)}
                                        </>
                                      ) : (
                                        `$${addOn.lineTotal.toFixed(2)}`
                                      )}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {viewDetail.data.productLines.length > 0 ? (
                    <div>
                      <h4 className="mb-2 text-[10px] font-black uppercase tracking-wider text-nexoraMuted">
                        {t('components.dashboard.views.pos.PosCompletedOrdersPanel.viewDetailProductsTitle')}
                      </h4>
                      <div className="space-y-2">
                        {viewDetail.data.productLines.map((line) => (
                          <div key={line.id} className="rounded-xl border border-nexoraBorder bg-white p-2.5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-nexoraBrand/40 hover:shadow-md">
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-xs font-bold text-nexoraText">{line.productName}</p>
                              <p className="shrink-0 text-xs font-bold tabular-nums text-nexoraText">
                                ${line.lineTotal.toFixed(2)}
                              </p>
                            </div>
                            <p className="text-[11px] text-nexoraMuted">
                              {t('components.dashboard.views.pos.PosCompletedOrdersPanel.viewDetailQty', { quantity: line.quantity })} · ${line.unitPrice.toFixed(2)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  <div className="space-y-1 rounded-lg bg-nexoraCanvas p-3 text-xs">
                    <div className="flex justify-between text-nexoraMuted">
                      <span>{t('components.dashboard.views.pos.PosCompletedOrdersPanel.viewDetailServicesSubtotal')}</span>
                      <span className="tabular-nums">${viewDetail.data.servicesSubtotal.toFixed(2)}</span>
                    </div>
                    {viewDetail.data.productsSubtotal > 0 ? (
                      <div className="flex justify-between text-nexoraMuted">
                        <span>{t('components.dashboard.views.pos.PosCompletedOrdersPanel.viewDetailProductsSubtotal')}</span>
                        <span className="tabular-nums">${viewDetail.data.productsSubtotal.toFixed(2)}</span>
                      </div>
                    ) : null}
                    {viewDetail.data.discountAmount > 0 ? (
                      <div className="flex justify-between text-nexoraMuted">
                        <span>{t('components.dashboard.views.pos.PosCompletedOrdersPanel.viewDetailDiscount')}</span>
                        <span className="tabular-nums">-${viewDetail.data.discountAmount.toFixed(2)}</span>
                      </div>
                    ) : null}
                    <div className="flex justify-between text-nexoraMuted">
                      <span>{t('components.dashboard.views.pos.PosCompletedOrdersPanel.viewDetailSalesTax')}</span>
                      <span className="tabular-nums">${viewDetail.data.salesTaxAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-nexoraMuted">
                      <span>{t('components.dashboard.views.pos.PosCompletedOrdersPanel.viewDetailTip')}</span>
                      <span className="tabular-nums">${viewDetail.data.tipAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between border-t border-nexoraBorder pt-1 font-black text-nexoraText">
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
                className="h-10 flex-1 rounded-lg border border-nexoraBorder text-xs font-bold text-nexoraText hover:border-nexoraBrand"
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
