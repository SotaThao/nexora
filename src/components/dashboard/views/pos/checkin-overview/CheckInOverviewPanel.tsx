import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { useTranslation } from '../../../../../contexts/LanguageContext'
import { usePagination } from '../../../../../hooks/usePagination'
import { useCheckInOverview } from '../../../../../data/hooks/usePosOrders'
import { SkeletonList } from '../../../../ui/skeleton'
import Pagination from '../../../../ui/Pagination'
import { PosOrderStatus } from '../../../../../constants/posOrderStatus'
import { statusLabelKey } from '../booking/bookingFormatters'
import { formatCheckInPhone } from './checkInPhoneFormat'
import { formatPosTime } from '../posDateTime'
import { CustomerSource, GUEST_SOURCE_LABEL_KEYS } from '../../../../../constants/customerSource'
import { CHECKIN_STATUS_TEXT_COLORS } from './checkInStatusColors'
import CheckInDetailModal from './CheckInDetailModal'

const CHECKIN_OVERVIEW_PAGE_SIZE = 10
const CHECKIN_SEARCH_DEBOUNCE_MS = 300

const STATUS_FILTERS = [
  'All',
  PosOrderStatus.Waiting,
  PosOrderStatus.InService,
  PosOrderStatus.Completed,
  PosOrderStatus.Cancelled,
] as const

export default function CheckInOverviewPanel({
  businessId,
  onBack,
}: {
  businessId: string
  onBack: () => void
}) {
  const { t, currentLanguage } = useTranslation()
  const p = 'components.dashboard.views.pos.checkinOverview.CheckInOverviewPanel.'

  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_FILTERS)[number]>('All')
  const [searchInput, setSearchInput] = useState('')
  const [appliedSearch, setAppliedSearch] = useState('')
  const [viewOrderId, setViewOrderId] = useState<string | null>(null)
  const { pageNumber, pageSize, setPage, reset: resetPage } = usePagination({ pageSize: CHECKIN_OVERVIEW_PAGE_SIZE })

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setAppliedSearch((prev) => {
        const next = searchInput.trim()
        if (prev === next) return prev
        resetPage()
        return next
      })
    }, CHECKIN_SEARCH_DEBOUNCE_MS)
    return () => window.clearTimeout(timer)
  }, [searchInput, resetPage])

  const { data, isLoading, isFetching, isError } = useCheckInOverview(businessId, {
    pageNumber,
    pageSize,
    status: statusFilter === 'All' ? undefined : statusFilter,
    searchTerm: appliedSearch || undefined,
  })

  const summary = data?.summary
  const guestSources = data?.guestSources ?? []
  const items = data?.items?.items ?? []

  // Multiple CustomerSource values (e.g. PosCheckIn + PosSelfCheckIn) share the same
  // display label — merge their counts so the panel shows one row per label, not per enum value.
  const guestSourceRows = useMemo(() => {
    const countsByLabelKey = new Map<string, number>()
    for (const g of guestSources) {
      const labelKey = GUEST_SOURCE_LABEL_KEYS[g.source as CustomerSource] ?? 'sourceWalkIn'
      countsByLabelKey.set(labelKey, (countsByLabelKey.get(labelKey) ?? 0) + g.count)
    }
    return Array.from(countsByLabelKey, ([labelKey, count]) => ({ labelKey, count }))
  }, [guestSources])

  const maxGuestSourceCount = Math.max(1, ...guestSourceRows.map((g) => g.count))

  const handleStatusChange = (next: (typeof STATUS_FILTERS)[number]) => {
    if (next === statusFilter) return
    setStatusFilter(next)
    resetPage()
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex shrink-0 items-center gap-1.5 rounded-lg border border-nexoraBorder bg-white px-3 py-1.5 text-xs font-bold text-nexoraText transition hover:border-nexoraBrand/40"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          {t(p + 'backToTickets')}
        </button>
        <div>
          <h2 className="text-lg font-bold text-nexoraText sm:text-xl">{t(p + 'title')}</h2>
          <p className="text-xs text-nexoraMuted">{t(p + 'subtitle')}</p>
        </div>
      </div>

      {isLoading ? (
        <div className="py-6">
          <SkeletonList count={4} lines={1} />
        </div>
      ) : isError ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-center text-xs font-bold text-rose-700">
          {t(p + 'loadError')}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: t(p + 'cardTotalCheckIns'), value: summary?.totalCheckIns ?? 0 },
              { label: t(p + 'cardNewGuests'), value: summary?.newGuests ?? 0 },
              { label: t(p + 'cardReturningGuests'), value: summary?.returningGuests ?? 0 },
              { label: t(p + 'cardAverageWait'), value: t(p + 'minutesValue', { count: summary?.averageWaitMinutes ?? 0 }) },
            ].map((card) => (
              <div key={card.label} className="rounded-xl border border-nexoraBorder bg-white p-3">
                <p className="text-xs font-medium text-nexoraMuted">{card.label}</p>
                <p className="mt-1 text-xl font-black text-nexoraText">{card.value}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            <div className="rounded-xl border border-nexoraBorder bg-white p-3">
              <p className="text-lg font-bold text-nexoraText sm:text-xl">{t(p + 'guestSourcesTitle')}</p>
              {guestSourceRows.length === 0 ? (
                <p className="mt-2 text-xs text-nexoraMuted">{t(p + 'guestSourcesEmpty')}</p>
              ) : (
                <div className="mt-2 space-y-1.5">
                  {guestSourceRows.map((g) => (
                    <div key={g.labelKey} className="flex items-center gap-2 text-xs">
                      <span className="w-20 shrink-0 truncate text-nexoraMuted">{t(p + g.labelKey)}</span>
                      <div className="h-2 flex-1 rounded-full bg-nexoraCanvas">
                        <div
                          className="h-2 rounded-full bg-emerald-800"
                          style={{ width: `${(g.count / maxGuestSourceCount) * 100}%` }}
                        />
                      </div>
                      <span className="w-6 shrink-0 text-right font-bold text-nexoraText">{g.count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="rounded-xl border border-nexoraBorder bg-white p-3">
              <p className="text-lg font-bold text-nexoraText sm:text-xl">{t(p + 'guestOrderSummaryTitle')}</p>
              <p className="mt-2 text-xs text-nexoraMuted">{t(p + 'guestOrderSummaryBody')}</p>
            </div>
          </div>

          <div className="rounded-xl border border-nexoraBorder bg-white p-4">
            <div className="-mx-4 -mt-4 flex items-center gap-2 rounded-t-xl bg-gray-50 px-4 py-3">
              <h3 className="text-lg font-bold text-nexoraText sm:text-xl">{t(p + 'allCheckInsTitle')}</h3>
              <span className="text-xs font-bold text-nexoraMuted">{data?.items?.totalCount ?? 0}</span>
            </div>

            <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
              <select
                value={statusFilter}
                onChange={(e) => handleStatusChange(e.target.value as (typeof STATUS_FILTERS)[number])}
                aria-label={t(p + 'statusFilterLabel')}
                className="h-9 shrink-0 rounded-lg border border-nexoraBorder bg-white px-2.5 text-xs text-nexoraText outline-none focus:border-nexoraBrand"
              >
                {STATUS_FILTERS.map((filter) => (
                  <option key={filter} value={filter}>
                    {filter === 'All' ? t(p + 'filterAll') : t(p + statusLabelKey(filter))}
                  </option>
                ))}
              </select>
              <div className="flex-1">
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder={t(p + 'searchPlaceholder')}
                  aria-label={t(p + 'searchPlaceholder')}
                  className="h-9 w-full rounded-lg border border-nexoraBorder bg-white px-2.5 text-xs text-nexoraText outline-none focus:border-nexoraBrand"
                />
              </div>
            </div>

            {items.length === 0 ? (
            <div className="py-8 text-center text-xs text-nexoraMuted">
              {appliedSearch || statusFilter !== 'All' ? t(p + 'noMatch') : t(p + 'empty')}
            </div>
          ) : (
            <div className={`mt-3 overflow-x-auto ${isFetching ? 'opacity-60' : ''}`}>
              <table className="w-full min-w-[720px] text-left text-xs">
                <thead>
                  <tr className="border-b border-nexoraBorder bg-gray-50 text-[10px] font-extrabold uppercase tracking-wide text-nexoraMuted">
                    <th className="px-3 py-2">{t(p + 'columnNumber')}</th>
                    <th className="px-3 py-2">{t(p + 'columnTime')}</th>
                    <th className="px-3 py-2">{t(p + 'columnCustomer')}</th>
                    <th className="px-3 py-2">{t(p + 'columnType')}</th>
                    <th className="px-3 py-2">{t(p + 'columnSource')}</th>
                    <th className="px-3 py-2">{t(p + 'columnService')}</th>
                    <th className="px-3 py-2">{t(p + 'columnTechnician')}</th>
                    <th className="px-3 py-2">{t(p + 'columnStatus')}</th>
                    <th className="px-3 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id} className="border-b border-nexoraBorder/60 last:border-0">
                      <td className="px-3 py-2 font-bold text-nexoraText">#{item.orderNumber}</td>
                      <td className="whitespace-nowrap px-3 py-2 text-nexoraMuted">{formatPosTime(item.checkedInAt, currentLanguage).toUpperCase()}</td>
                      <td className="px-3 py-2">
                        <span className="font-bold text-nexoraText">{item.customerName}</span>
                        <span className="ml-1 text-nexoraMuted">
                          {item.customerPhone ? formatCheckInPhone(item.customerPhone) ?? item.customerPhone : ''}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <span
                          className={`inline-flex h-6 w-fit items-center whitespace-nowrap rounded-full px-2 text-[10px] font-bold uppercase leading-none ${
                            item.isNewGuest ? 'bg-emerald-50 text-emerald-800' : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {item.isNewGuest ? t(p + 'typeNewGuest') : t(p + 'typeReturning')}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-nexoraMuted">
                        {item.isNewGuest
                          ? t(p + (GUEST_SOURCE_LABEL_KEYS[item.source as CustomerSource] ?? 'sourceWalkIn'))
                          : t(p + 'sourceOriginalProfile')}
                      </td>
                      <td className="px-3 py-2 text-nexoraMuted">{item.serviceNames.join(', ') || '—'}</td>
                      <td className="px-3 py-2 text-nexoraMuted">{item.technicianNames.join(', ') || '—'}</td>
                      <td className={`px-3 py-2 font-bold uppercase ${CHECKIN_STATUS_TEXT_COLORS[item.status] ?? 'text-nexoraText'}`}>
                        {t(p + statusLabelKey(item.status))}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <button
                          type="button"
                          onClick={() => setViewOrderId(item.id)}
                          className="rounded-lg border border-emerald-300 bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-800"
                        >
                          {t(p + 'viewDetail')}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {data && data.items.totalPages > 1 ? (
                <Pagination
                  variant="simple"
                  pageNumber={data.items.pageNumber}
                  pageSize={pageSize}
                  totalPages={data.items.totalPages}
                  totalCount={data.items.totalCount}
                  hasNextPage={data.items.hasNextPage}
                  hasPreviousPage={data.items.hasPreviousPage}
                  onPageChange={setPage}
                  className="m-3"
                />
              ) : null}
            </div>
          )}
          </div>
        </>
      )}

      {viewOrderId ? (
        <CheckInDetailModal businessId={businessId} orderId={viewOrderId} onClose={() => setViewOrderId(null)} />
      ) : null}
    </div>
  )
}
