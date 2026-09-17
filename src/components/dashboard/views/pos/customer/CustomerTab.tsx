// CustomerTab — Front Desk "Customer" tab (US-043): read-only, paginated view of this
// business's shared Customer records, with a Name/Phone search and a Created-At sort toggle.
// No date-range/status filter beyond that — this is a lookup surface, not a report.
import { useEffect, useState } from 'react'
import { useTranslation } from '../../../../../contexts/LanguageContext'
import { usePagination } from '../../../../../hooks/usePagination'
import { usePosCustomerList } from '../../../../../data/hooks/usePosCustomers'
import { useMerchantVoiceTenantStatus } from '../../../../../data/hooks/useMerchantVoiceBookings'
import { useSessionRole } from '../../../../../auth/useSessionRole'
import { SkeletonList } from '../../../../ui/skeleton'
import Pagination from '../../../../ui/Pagination'
import CustomerTable from './CustomerTable'
import CustomerDetailModal from './CustomerDetailModal'

const CUSTOMER_LIST_PAGE_SIZE = 10
const CUSTOMER_SEARCH_DEBOUNCE_MS = 300

export default function CustomerTab({ businessId }: { businessId: string }) {
  const { t } = useTranslation()
  const p = 'components.dashboard.views.pos.CustomerTab.'

  const { isOwner } = useSessionRole()
  const { data: tenantStatus } = useMerchantVoiceTenantStatus({ enabled: isOwner })
  const canEditCustomer = isOwner && tenantStatus?.hasVoiceTenant

  const [searchInput, setSearchInput] = useState('')
  const [appliedSearch, setAppliedSearch] = useState('')
  const [sortDescending, setSortDescending] = useState(true)
  const [customerModal, setCustomerModal] = useState<{ id: string; initialEditing: boolean } | null>(null)
  const { pageNumber, pageSize, setPage, reset: resetPage } = usePagination({ pageSize: CUSTOMER_LIST_PAGE_SIZE })

  // Debounced server-side search, same pattern as BookingCustomersPanel — resets to page 1
  // only when the trimmed term actually changes (avoids a stray reset while still typing the
  // same effective term, e.g. leading/trailing spaces).
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setAppliedSearch((prev) => {
        const next = searchInput.trim()
        if (prev === next) return prev
        resetPage()
        return next
      })
    }, CUSTOMER_SEARCH_DEBOUNCE_MS)
    return () => window.clearTimeout(timer)
  }, [searchInput, resetPage])

  const { data, isLoading, isFetching } = usePosCustomerList(businessId, {
    pageNumber,
    pageSize,
    searchTerm: appliedSearch || undefined,
    sortDescending,
  })
  const customers = data?.items ?? []

  const handleSortChange = (next: boolean) => {
    if (next === sortDescending) return
    setSortDescending(next)
    resetPage()
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="w-full sm:max-w-xs">
          <label className="mb-1 block text-[10px] font-extrabold uppercase text-nexoraMuted">
            {t(p + 'searchLabel')}
          </label>
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder={t(p + 'searchPlaceholder')}
            className="h-9 w-full rounded-lg border border-nexoraBorder bg-white px-2.5 text-xs text-nexoraText outline-none focus:border-nexoraBrand"
          />
        </div>
        <div className="w-full sm:w-48">
          <label className="mb-1 block text-[10px] font-extrabold uppercase text-nexoraMuted">
            {t(p + 'sortLabel')}
          </label>
          <select
            value={sortDescending ? 'desc' : 'asc'}
            onChange={(e) => handleSortChange(e.target.value === 'desc')}
            className="h-9 w-full rounded-lg border border-nexoraBorder bg-white px-2.5 text-xs text-nexoraText outline-none focus:border-nexoraBrand"
          >
            <option value="desc">{t(p + 'sortNewest')}</option>
            <option value="asc">{t(p + 'sortOldest')}</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="py-6">
          <SkeletonList count={4} lines={1} />
        </div>
      ) : customers.length === 0 ? (
        <div className="py-8 text-center text-xs text-nexoraMuted">
          {appliedSearch ? t(p + 'emptySearch', { term: appliedSearch }) : t(p + 'empty')}
        </div>
      ) : (
        <div className={`overflow-hidden rounded-xl border border-nexoraBorder bg-white ${isFetching ? 'opacity-60' : ''}`}>
          <CustomerTable
            customers={customers}
            onView={(id) => setCustomerModal({ id, initialEditing: false })}
            onEdit={canEditCustomer ? (id) => setCustomerModal({ id, initialEditing: true }) : undefined}
          />

          {data && data.totalPages > 1 ? (
            <Pagination
              variant="simple"
              pageNumber={data.pageNumber}
              pageSize={pageSize}
              totalPages={data.totalPages}
              totalCount={data.totalCount}
              hasNextPage={data.hasNextPage}
              hasPreviousPage={data.hasPreviousPage}
              onPageChange={setPage}
              className="mt-3"
            />
          ) : null}
        </div>
      )}

      {customerModal ? (
        <CustomerDetailModal
          businessId={businessId}
          customerId={customerModal.id}
          initialEditing={customerModal.initialEditing}
          onClose={() => setCustomerModal(null)}
        />
      ) : null}
    </div>
  )
}
