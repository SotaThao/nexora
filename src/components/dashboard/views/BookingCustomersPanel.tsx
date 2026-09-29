import React, { useEffect, useMemo, useState } from 'react'
import { normalizePhoneSearchTerm } from '../../CountryCodeSelect'
import BookingCustomerModal from './BookingCustomerModal'
import { BOOKING_HUB_EMPTY_CELL, BOOKING_HUB_PAGINATION_CLASSNAME, formatBookingHubDateTime, formatVoicePhoneDisplay } from './bookingHubFormatters'
import BookingKeywordSearchField from './BookingKeywordSearchField'
import BookingFilterPopover from './BookingFilterPopover'
import { useTranslation } from '../../../contexts/LanguageContext'
import {
  useCreateMerchantVoiceCustomer,
  useMerchantVoiceCustomerSummary,
  useMerchantVoiceCustomers,
  useUpdateMerchantVoiceCustomer,
} from '../../../data/hooks/useMerchantVoiceBookings'
import {
  CustomerUiSegment,
  isCustomerStatusActive,
  mapCustomerGroupToUiSegment,
  mapUiSegmentToApiGroup,
  type MerchantVoiceCustomerDto,
} from '../../../data/repositories/merchantVoice'
import { usePagination } from '../../../hooks/usePagination'
import { BOOKING_HUB_PAGE_SIZE } from '../../../constants/pagination'
import {
  CalendarEventIcon,
  ClockHistoryIcon,
  FireIcon,
  GemIcon,
  ImportTrayIcon,
  PencilIcon,
  PeopleTabIcon,
  PhoneIncomingIcon,
  QrCodeIcon,
  ReceiptIcon,
  SpinnerIcon,
  StarsIcon,
  UserPlusIcon,
} from './BookingHubIcons'
import { useBookingHubVoiceEnabled } from './BookingHubVoiceContext'
import Pagination from '../../ui/Pagination'

const TK = 'components.dashboard.views.BookingHubView.customers'
const SEGMENT_META: Record<CustomerUiSegment, { icon: React.ReactNode; color: string; labelKey: string }> = {
  [CustomerUiSegment.New]: { icon: <StarsIcon />, color: '#2b59ff', labelKey: 'segments.new' },
  [CustomerUiSegment.Day15]: { icon: <CalendarEventIcon />, color: '#00b873', labelKey: 'segments.day15' },
  [CustomerUiSegment.Day30]: { icon: <ClockHistoryIcon />, color: '#7c3aed', labelKey: 'segments.day30' },
  [CustomerUiSegment.Day60]: { icon: <FireIcon />, color: '#f59e0b', labelKey: 'segments.day60' },
  [CustomerUiSegment.Vip]: { icon: <GemIcon />, color: '#db2777', labelKey: 'segments.vip' },
}

const SEGMENT_ORDER: CustomerUiSegment[] = [
  CustomerUiSegment.New,
  CustomerUiSegment.Day15,
  CustomerUiSegment.Day30,
  CustomerUiSegment.Day60,
  CustomerUiSegment.Vip,
]

const SOURCE_DISPLAY_RULES: ReadonlyArray<{
  keywords: readonly string[]
  icon: React.ReactNode
  labelKey: string
}> = [
  { keywords: ['qr'], icon: <QrCodeIcon />, labelKey: 'qr' },
  { keywords: ['receipt'], icon: <ReceiptIcon />, labelKey: 'receipt' },
  { keywords: ['call', 'voice', 'phone'], icon: <PhoneIncomingIcon />, labelKey: 'call' },
  { keywords: ['web', 'landing'], icon: <ImportTrayIcon />, labelKey: 'web' },
  { keywords: ['api', 'online'], icon: <ImportTrayIcon />, labelKey: 'api' },
  { keywords: ['pos', 'import'], icon: <ImportTrayIcon />, labelKey: 'pos' },
]

function resolveSourceDisplay(
  source: string | null,
  t: (key: string) => string,
): { icon: React.ReactNode | null; label: string } {
  if (!source) return { icon: null, label: t(`${TK}.sources.none`) }

  const lower = source.toLowerCase()
  const rule = SOURCE_DISPLAY_RULES.find(({ keywords }) =>
    keywords.some((keyword) => lower.includes(keyword)),
  )
  if (!rule) return { icon: null, label: source }

  return { icon: rule.icon, label: t(`${TK}.sources.${rule.labelKey}`) }
}

/** BE sends UTC; display in the user's local timezone (Staff Linked-date style). */
function formatLastVisit(value: string | null, language: string): string {
  if (!value) return BOOKING_HUB_EMPTY_CELL
  return formatBookingHubDateTime(value, language)
}

export default function BookingCustomersPanel() {
  const { t, currentLanguage } = useTranslation()
  const voiceEnabled = useBookingHubVoiceEnabled()

  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [segmentFilter, setSegmentFilter] = useState<CustomerUiSegment | 'all'>('all')
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<MerchantVoiceCustomerDto | null>(null)
  const { pageNumber, pageSize, setPage, reset: resetPage } = usePagination({
    pageSize: BOOKING_HUB_PAGE_SIZE,
  })

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch((prev) => {
        if (prev === search) return prev
        resetPage()
        return search
      })
    }, 350)
    return () => window.clearTimeout(timer)
  }, [search, resetPage])

  const apiGroup = segmentFilter === 'all' ? undefined : mapUiSegmentToApiGroup(segmentFilter)
  const searchTerm = normalizePhoneSearchTerm(debouncedSearch) || undefined

  const { data: summary } = useMerchantVoiceCustomerSummary({ enabled: voiceEnabled })
  const {
    data: customersResponse,
    isLoading: isCustomersLoading,
    isFetching: isCustomersFetching,
    isError: isCustomersError,
    refetch: refetchCustomers,
  } = useMerchantVoiceCustomers({ pageNumber, pageSize, group: apiGroup, searchTerm }, { enabled: voiceEnabled })
  const createCustomerMutation = useCreateMerchantVoiceCustomer()
  const updateCustomerMutation = useUpdateMerchantVoiceCustomer()

  const isListLoading = isCustomersLoading || isCustomersFetching
  const customers = customersResponse?.items ?? []
  const segmentCounts = useMemo(() => ({
    all: summary?.all ?? 0,
    [CustomerUiSegment.New]: summary?.new ?? 0,
    [CustomerUiSegment.Day15]: summary?.days15 ?? 0,
    [CustomerUiSegment.Day30]: summary?.days30 ?? 0,
    [CustomerUiSegment.Day60]: summary?.days60 ?? 0,
    [CustomerUiSegment.Vip]: summary?.vip ?? 0,
  }), [summary])

  const openCreateModal = () => {
    setEditingCustomer(null)
    setIsCustomerModalOpen(true)
  }

  const openEditModal = (customer: MerchantVoiceCustomerDto) => {
    setEditingCustomer(customer)
    setIsCustomerModalOpen(true)
  }

  return (
    <div className="booking-sub-panel is-active" aria-busy={isListLoading}>
      <div className="booking-grid">
        <article className="overview-card overview-card-pad">
          <div className="booking-daybar">
            <div className="booking-date">
              <span className="booking-action-icon"><PeopleTabIcon /></span>
              <span>{t(`${TK}.headerTitle`)}</span>
            </div>
            <div className="booking-daybar-actions booking-daybar-actions--toolbar">
              <span className="cust-count">
                {t(`${TK}.countLabel`, { shown: customers.length, total: customersResponse?.totalCount ?? 0 })}
              </span>
              <BookingFilterPopover
                title={t(`${TK}.filterPopoverTitle`)}
                toggleLabel={t(`${TK}.filterToggle`)}
                isOpen={isFilterOpen}
                onOpenChange={setIsFilterOpen}
                compact
              >
                <div className="booking-controls booking-controls-filter" aria-label={t(`${TK}.filtersAria`)}>
                  <label className="booking-control-field" style={{ gridColumn: '1 / -1' }}>
                    <span className="booking-control-label">{t(`${TK}.searchLabel`)}</span>
                    <BookingKeywordSearchField
                      value={search}
                      onChange={setSearch}
                      placeholder={t(`${TK}.searchPlaceholder`)}
                      clearLabel={t(`${TK}.clearSearch`)}
                    />
                  </label>
                </div>
              </BookingFilterPopover>
              <button className="booking-primary-button" type="button" onClick={openCreateModal}>
                <UserPlusIcon />
                <span>{t(`${TK}.createButton`)}</span>
              </button>
            </div>
          </div>

          <div className="booking-status-chips" role="group" aria-label={t(`${TK}.segmentFilterAria`)}>
            <button
              className={`booking-status-chip ${segmentFilter === 'all' ? 'is-active' : ''}`}
              type="button"
              aria-pressed={segmentFilter === 'all'}
              onClick={() => {
                setSegmentFilter('all')
                resetPage()
              }}
            >
              <span>{t(`${TK}.segments.all`)}</span>
              <span className="booking-status-chip-count">{segmentCounts.all}</span>
            </button>
            {SEGMENT_ORDER.map((id) => {
              const meta = SEGMENT_META[id]
              return (
                <button
                  key={id}
                  className={`booking-status-chip ${segmentFilter === id ? 'is-active' : ''}`}
                  type="button"
                  aria-pressed={segmentFilter === id}
                  style={{ '--seg': meta.color } as React.CSSProperties}
                  onClick={() => {
                    setSegmentFilter(id)
                    resetPage()
                  }}
                >
                  <span className="booking-status-chip-icon" style={{ color: meta.color }}>{meta.icon}</span>
                  <span>{t(`${TK}.${meta.labelKey}`)}</span>
                  <span className="booking-status-chip-count">{segmentCounts[id] || 0}</span>
                </button>
              )
            })}
          </div>

          <div className="booking-table-wrap">
            <div className="booking-table-scroller">
              <table className="booking-table cust-table">
                <thead>
                  <tr>
                    <th scope="col">{t(`${TK}.colCustomer`)}</th>
                    <th scope="col">{t(`${TK}.colPhone`)}</th>
                    <th scope="col">{t(`${TK}.colGroup`)}</th>
                    <th scope="col">{t(`${TK}.colSource`)}</th>
                    <th scope="col">{t(`${TK}.colVisits`)}</th>
                    <th scope="col">{t(`${TK}.colLastVisit`)}</th>
                    <th scope="col">{t(`${TK}.colAction`)}</th>
                  </tr>
                </thead>
                <tbody>
                  {isListLoading ? (
                    <tr>
                      <td className="booking-empty-cell" colSpan={7}>
                        <span className="booking-table-loading">
                          <SpinnerIcon className="booking-inline-spinner" />
                          <span>{t(`${TK}.loadingState`)}</span>
                        </span>
                      </td>
                    </tr>
                  ) : isCustomersError ? (
                    <tr>
                      <td className="booking-empty-cell" colSpan={7}>
                        <div>{t(`${TK}.loadError`)}</div>
                        <button className="booking-mini-button" type="button" onClick={() => refetchCustomers()}>
                          {t(`${TK}.retry`)}
                        </button>
                      </td>
                    </tr>
                  ) : customers.length === 0 ? (
                    <tr>
                      <td className="booking-empty-cell" colSpan={7}>{t(`${TK}.emptyState`)}</td>
                    </tr>
                  ) : (
                    customers.map((customer) => {
                      const segmentId = mapCustomerGroupToUiSegment(customer.group)
                      const segment = segmentId ? SEGMENT_META[segmentId] : null
                      const source = resolveSourceDisplay(customer.source, t)
                      const isInactive = !isCustomerStatusActive(customer.status)
                      return (
                        <tr className="booking-table-row" key={customer.id}>
                          <td data-label={t(`${TK}.colCustomer`)}>
                            <div className="booking-customer-name">
                              {customer.name || BOOKING_HUB_EMPTY_CELL}
                              {isInactive ? (
                                <span className="badge badge-soft cust-inactive-tag">{t(`${TK}.inactiveTag`)}</span>
                              ) : null}
                            </div>
                          </td>
                          <td data-label={t(`${TK}.colPhone`)}>
                            <span className="whitespace-nowrap tabular-nums">
                              {(formatVoicePhoneDisplay(customer.phoneNumber, BOOKING_HUB_EMPTY_CELL) ?? BOOKING_HUB_EMPTY_CELL)}
                            </span>
                          </td>
                          <td data-label={t(`${TK}.colGroup`)}>
                            {segment ? (
                              <span className="badge seg-badge" style={{ '--seg': segment.color } as React.CSSProperties}>
                                {segment.icon}
                                <span>{t(`${TK}.${segment.labelKey}`)}</span>
                              </span>
                            ) : BOOKING_HUB_EMPTY_CELL}
                          </td>
                          <td data-label={t(`${TK}.colSource`)}>
                            {customer.source ? (
                              <span className="badge badge-soft">
                                {source.icon}
                                <span>{source.label}</span>
                              </span>
                            ) : BOOKING_HUB_EMPTY_CELL}
                          </td>
                          <td data-label={t(`${TK}.colVisits`)}>{customer.totalVisit ?? BOOKING_HUB_EMPTY_CELL}</td>
                          <td data-label={t(`${TK}.colLastVisit`)}>{formatLastVisit(customer.lastVisit, currentLanguage)}</td>
                          <td data-label={t(`${TK}.colAction`)}>
                            <div className="booking-actions">
                              <button
                                className="booking-mini-button"
                                type="button"
                                title={t(`${TK}.editAction`)}
                                aria-label={t(`${TK}.editAriaLabel`, { name: customer.name || BOOKING_HUB_EMPTY_CELL })}
                                onClick={() => openEditModal(customer)}
                              >
                                <PencilIcon />
                                <span className="booking-mini-label">{t(`${TK}.editAction`)}</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {!isListLoading && (customersResponse?.totalCount ?? 0) > 0 ? (
            <Pagination
              pageNumber={pageNumber}
              pageSize={pageSize}
              totalPages={customersResponse?.totalPages ?? 1}
              totalCount={customersResponse?.totalCount ?? 0}
              hasNextPage={customersResponse?.hasNextPage}
              hasPreviousPage={customersResponse?.hasPreviousPage}
              onPageChange={setPage}
              isLoading={isCustomersFetching}
              className={BOOKING_HUB_PAGINATION_CLASSNAME}
            />
          ) : null}
        </article>
      </div>

      {isCustomerModalOpen ? (
        <BookingCustomerModal
          customer={editingCustomer}
          onClose={() => setIsCustomerModalOpen(false)}
          onSave={(body) => editingCustomer
            ? updateCustomerMutation.mutateAsync({ id: editingCustomer.id, body })
            : createCustomerMutation.mutateAsync(body)}
        />
      ) : null}
    </div>
  )
}
