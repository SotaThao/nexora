// CustomerDetailModal — Front Desk "Customer" tab, View detail (US-043). Fully read-only: no
// check-in/cancel/reschedule affordance, no clickable history row, no link into Order
// Workspace — this is a lookup surface only. History is ONE merged list of orders + bookings
// (PosBooking is a TPT subtype of PosOrder on the backend, so it's genuinely one data set),
// sorted most-recent-first, with a Booking/Walk-in badge to tell them apart.
import { useTranslation } from '../../../../../contexts/LanguageContext'
import { usePagination } from '../../../../../hooks/usePagination'
import { usePosCustomerDetail, usePosCustomerOrderHistory } from '../../../../../data/hooks/usePosCustomers'
import { SkeletonList } from '../../../../ui/skeleton'
import Pagination from '../../../../ui/Pagination'
import { formatPosDateTime } from '../posDateTime'
import { statusLabelKey } from '../booking/bookingFormatters'
import { formatCustomerPhone, formatDateOnly } from './customerFormatters'

const CUSTOMER_ORDER_HISTORY_PAGE_SIZE = 10

const CUSTOMER_STATUS_LABEL_KEYS: Record<string, string> = {
  Active: 'customerStatus.Active',
  InActive: 'customerStatus.InActive',
}
const CUSTOMER_TYPE_LABEL_KEYS: Record<string, string> = {
  Individual: 'customerType.Individual',
  Business: 'customerType.Business',
  Vip: 'customerType.Vip',
  Guest: 'customerType.Guest',
  Partner: 'customerType.Partner',
  Internal: 'customerType.Internal',
}
const CUSTOMER_SOURCE_LABEL_KEYS: Record<string, string> = {
  Call: 'customerSource.Call',
  Qr: 'customerSource.Qr',
  Web: 'customerSource.Web',
  Sms: 'customerSource.Sms',
  Receipt: 'customerSource.Receipt',
  Manual: 'customerSource.Manual',
  PosCheckIn: 'customerSource.PosCheckIn',
}

export default function CustomerDetailModal({
  businessId,
  customerId,
  onClose,
}: {
  businessId: string
  customerId: string
  onClose: () => void
}) {
  const { t, currentLanguage } = useTranslation()
  const p = 'components.dashboard.views.pos.CustomerTab.'
  const formatDateTime = (iso: string | null | undefined) => formatPosDateTime(iso, currentLanguage)

  const { data: customer, isLoading: isDetailLoading } = usePosCustomerDetail(businessId, customerId)
  const { pageNumber, pageSize, setPage } = usePagination({ pageSize: CUSTOMER_ORDER_HISTORY_PAGE_SIZE })
  const {
    data: historyPage,
    isLoading: isHistoryLoading,
    isFetching: isHistoryFetching,
  } = usePosCustomerOrderHistory(businessId, customerId, { pageNumber, pageSize })
  const historyItems = historyPage?.items ?? []

  const notProvided = t(p + 'viewDetailNotProvided')

  // Layout is fixed regardless of which fields are empty — an empty Address/DOB/Type is
  // itself useful signal for front desk (e.g. "no email on file yet"), not noise to hide.
  const detailFields: { label: string; value: string }[] = customer
    ? [
        { label: t(p + 'viewDetailName'), value: customer.name || notProvided },
        { label: t(p + 'viewDetailPhone'), value: formatCustomerPhone(customer.phone, customer.phoneE164) },
        { label: t(p + 'viewDetailEmail'), value: customer.email || notProvided },
        { label: t(p + 'viewDetailAddress'), value: customer.address || notProvided },
        {
          label: t(p + 'viewDetailDateOfBirth'),
          value: customer.dateOfBirth ? formatDateOnly(customer.dateOfBirth) : notProvided,
        },
        { label: t(p + 'viewDetailType'), value: t(p + (CUSTOMER_TYPE_LABEL_KEYS[customer.type] ?? 'customerType.Individual')) },
        {
          label: t(p + 'viewDetailStatus'),
          value: t(p + (CUSTOMER_STATUS_LABEL_KEYS[customer.status] ?? 'customerStatus.Active')),
        },
        {
          label: t(p + 'viewDetailSource'),
          value: t(p + (CUSTOMER_SOURCE_LABEL_KEYS[customer.source] ?? 'customerSource.Manual')),
        },
        { label: t(p + 'viewDetailTotalVisit'), value: String(customer.totalVisit) },
        { label: t(p + 'viewDetailLastVisit'), value: formatDateTime(customer.lastVisit) },
        { label: t(p + 'viewDetailCreatedAt'), value: formatDateTime(customer.createdAt) },
      ]
    : []

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="nexora-modal-card w-full max-w-3xl">
        <h3 className="shrink-0 text-sm font-bold text-nexoraText">{t(p + 'viewDetailModalTitle')}</h3>

        <div className="mt-3 flex-1 space-y-4 overflow-y-auto">
          {isDetailLoading || !customer ? (
            <SkeletonList count={2} lines={2} />
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {detailFields.map((field) => (
                <div key={field.label}>
                  <p className="text-[10px] font-extrabold uppercase text-nexoraMuted">{field.label}</p>
                  <p className="text-xs text-nexoraText">{field.value}</p>
                </div>
              ))}
            </div>
          )}

          <div>
            <h4 className="mb-2 text-[10px] font-black uppercase tracking-wider text-nexoraMuted">
              {t(p + 'viewDetailHistoryTitle')}
            </h4>

            {isHistoryLoading ? (
              <SkeletonList count={3} lines={2} />
            ) : historyItems.length === 0 ? (
              <div className="rounded-lg border border-nexoraBorder bg-nexoraCanvas p-4 text-center text-xs text-nexoraMuted">
                {t(p + 'viewDetailHistoryEmpty')}
              </div>
            ) : (
              <div className={`space-y-2 ${isHistoryFetching ? 'opacity-60' : ''}`}>
                {historyItems.map((item) => (
                  <div key={item.id} className="rounded-lg border border-nexoraBorder p-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-[11px] font-bold text-nexoraMuted">#{item.orderNumber}</span>
                        <span className="rounded-full bg-nexoraCanvas px-2 py-0.5 text-[10px] font-bold uppercase text-nexoraMuted">
                          {t(p + (item.isBooking ? 'historyBadgeBooking' : 'historyBadgeWalkin'))}
                        </span>
                        <span className="rounded-full bg-nexoraLavender/20 px-2 py-0.5 text-[10px] font-bold uppercase text-nexoraBrandDark">
                          {t(`components.dashboard.views.pos.BookingTab.${statusLabelKey(item.status)}`)}
                        </span>
                      </div>
                      <span className="shrink-0 text-[11px] font-bold tabular-nums text-nexoraText">
                        ${item.total.toFixed(2)}
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] text-nexoraMuted">{formatDateTime(item.occurredAt)}</p>
                    {item.serviceNames.length > 0 ? (
                      <p className="mt-1 truncate text-xs text-nexoraText">{item.serviceNames.join(', ')}</p>
                    ) : null}
                    <p className="text-[11px] text-nexoraMuted">
                      {item.technicianNames.length > 0 ? item.technicianNames.join(', ') : t(p + 'viewDetailUnassigned')}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {historyPage && historyPage.totalPages > 1 ? (
              <Pagination
                variant="simple"
                pageNumber={historyPage.pageNumber}
                pageSize={pageSize}
                totalPages={historyPage.totalPages}
                totalCount={historyPage.totalCount}
                hasNextPage={historyPage.hasNextPage}
                hasPreviousPage={historyPage.hasPreviousPage}
                onPageChange={setPage}
                className="mt-3"
              />
            ) : null}
          </div>
        </div>

        <div className="mt-4 flex shrink-0 gap-2">
          <button
            type="button"
            onClick={onClose}
            className="h-10 flex-1 rounded-lg border border-nexoraBorder text-xs font-bold text-nexoraText hover:border-nexoraBrand"
          >
            {t(p + 'viewDetailClose')}
          </button>
        </div>
      </div>
    </div>
  )
}
