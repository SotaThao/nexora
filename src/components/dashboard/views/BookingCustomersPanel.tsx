import React, { useEffect, useMemo, useState } from 'react'
import { normalizePhoneSearchTerm } from '../../CountryCodeSelect'
import { formatVoicePhoneDisplay } from './bookingHubFormatters'
import { useTranslation } from '../../../contexts/LanguageContext'
import { useNotification } from '../../../contexts/NotificationContext'
import { getErrorI18nKey } from '../../../data/errorCodes'
import {
  useMerchantVoiceCustomerSummary,
  useMerchantVoiceCustomers,
  useUpdateMerchantVoiceCustomer,
} from '../../../data/hooks/useMerchantVoiceBookings'
import {
  CustomerUiSegment,
  isCustomerStatusActive,
  mapCustomerGroupToUiSegment,
  mapUiSegmentToApiGroup,
  MerchantVoiceCustomerStatus,
  MerchantVoiceCustomerType,
  normalizeMerchantVoiceCustomerStatus,
  type MerchantVoiceCustomerDto,
} from '../../../data/repositories/merchantVoice'
import { getApiErrorCode } from '../../../types/domain'
import { isValidEmail } from '../../../utils/validation'
import { parseApiDateTime } from '../utils'
import { usePagination } from '../../../hooks/usePagination'
import { BOOKING_HUB_PAGE_SIZE } from '../../../constants/pagination'
import {
  CalendarEventIcon,
  CheckLgIcon,
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
  XLgIcon,
} from './BookingHubIcons'
import { useBookingHubVoiceEnabled } from './BookingHubVoiceContext'
import Pagination from '../../ui/Pagination'

const TK = 'components.dashboard.views.BookingHubView.customers'

interface CustomerDraft {
  id: string
  name: string
  email: string
  address: string
  dateOfBirth: string
  type: MerchantVoiceCustomerType
  status: MerchantVoiceCustomerStatus
}

interface CustomerFormErrors {
  email?: string
  dateOfBirth?: string
  name?: string
  address?: string
}

const EMAIL_MAX_LENGTH = 320
const NAME_MAX_LENGTH = 200
const ADDRESS_MAX_LENGTH = 300
/** Reasonable customer age window for the date picker. */
const DOB_MAX_AGE_YEARS = 120

function toLocalDateInputValue(date = new Date()): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getDobBounds(now = new Date()) {
  const max = toLocalDateInputValue(now)
  const minDate = new Date(now.getFullYear() - DOB_MAX_AGE_YEARS, now.getMonth(), now.getDate())
  return {
    min: toLocalDateInputValue(minDate),
    max,
  }
}

/** Empty DOB is allowed; otherwise must be a real calendar date within the age window. */
function isValidDateOfBirth(value: string, bounds = getDobBounds()): boolean {
  const trimmed = value.trim()
  if (!trimmed) return true
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return false

  const [year, month, day] = trimmed.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  if (
    date.getFullYear() !== year
    || date.getMonth() !== month - 1
    || date.getDate() !== day
  ) {
    return false
  }

  return trimmed >= bounds.min && trimmed <= bounds.max
}

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

/** PUT /customers/{id} type — VoiceCustomerType (not VoiceCustomerGroup). */
const CUSTOMER_TYPES: MerchantVoiceCustomerType[] = [
  MerchantVoiceCustomerType.Individual,
  MerchantVoiceCustomerType.Business,
  MerchantVoiceCustomerType.Vip,
  MerchantVoiceCustomerType.Guest,
  MerchantVoiceCustomerType.Partner,
  MerchantVoiceCustomerType.Internal,
]

function resolveSourceDisplay(source: string | null, t: (key: string) => string): { icon: React.ReactNode | null; label: string } {
  if (!source) return { icon: null, label: t(`${TK}.sources.none`) }
  const lower = source.toLowerCase()
  if (lower.includes('qr')) return { icon: <QrCodeIcon />, label: t(`${TK}.sources.qr`) }
  if (lower.includes('receipt')) return { icon: <ReceiptIcon />, label: t(`${TK}.sources.receipt`) }
  if (lower.includes('call') || lower.includes('voice') || lower.includes('phone')) {
    return { icon: <PhoneIncomingIcon />, label: t(`${TK}.sources.call`) }
  }
  if (lower.includes('web') || lower.includes('landing')) return { icon: <ImportTrayIcon />, label: t(`${TK}.sources.web`) }
  if (lower.includes('api') || lower.includes('online')) return { icon: <ImportTrayIcon />, label: t(`${TK}.sources.api`) }
  if (lower.includes('pos') || lower.includes('import')) return { icon: <ImportTrayIcon />, label: t(`${TK}.sources.pos`) }
  return { icon: null, label: source }
}

/** BE sends UTC; display in the user's local timezone as `Jul 09, 2026, 05:21 AM`. */
function formatLastVisit(value: string | null, language: string): string {
  if (!value) return '_'
  const date = parseApiDateTime(value)
  if (!date) return '_'
  const dateLocale = language === 'vi' ? 'vi-VN' : 'en-US'
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone
  return new Intl.DateTimeFormat(dateLocale, {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone,
  }).format(date)
}

function toDraft(customer: MerchantVoiceCustomerDto): CustomerDraft {
  return {
    id: customer.id,
    name: customer.name ?? '',
    email: customer.email ?? '',
    address: customer.address ?? '',
    dateOfBirth: customer.dateOfBirth ? customer.dateOfBirth.slice(0, 10) : '',
    type: customer.type,
    status: normalizeMerchantVoiceCustomerStatus(customer.status),
  }
}

export default function BookingCustomersPanel() {
  const { t, currentLanguage } = useTranslation()
  const { showToast } = useNotification()
  const voiceEnabled = useBookingHubVoiceEnabled()

  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [segmentFilter, setSegmentFilter] = useState<CustomerUiSegment | 'all'>('all')
  const [editingCustomer, setEditingCustomer] = useState<MerchantVoiceCustomerDto | null>(null)
  const [draft, setDraft] = useState<CustomerDraft | null>(null)
  const [formErrors, setFormErrors] = useState<CustomerFormErrors>({})
  const [isSaving, setIsSaving] = useState(false)
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
  const updateCustomerMutation = useUpdateMerchantVoiceCustomer()

  const isListLoading = isCustomersLoading || isCustomersFetching
  const customers = customersResponse?.items ?? []
  const dobBounds = useMemo(() => getDobBounds(), [])

  const segmentCounts = useMemo(() => ({
    all: summary?.all ?? 0,
    [CustomerUiSegment.New]: summary?.new ?? 0,
    [CustomerUiSegment.Day15]: summary?.days15 ?? 0,
    [CustomerUiSegment.Day30]: summary?.days30 ?? 0,
    [CustomerUiSegment.Day60]: summary?.days60 ?? 0,
    [CustomerUiSegment.Vip]: summary?.vip ?? 0,
  }), [summary])

  const openEditModal = (customer: MerchantVoiceCustomerDto) => {
    setEditingCustomer(customer)
    setDraft(toDraft(customer))
    setFormErrors({})
  }

  const closeEditModal = () => {
    setEditingCustomer(null)
    setDraft(null)
    setFormErrors({})
  }

  const saveEditModal = async () => {
    if (!draft) return

    const trimmedEmail = draft.email.trim()
    const trimmedName = draft.name.trim()
    const trimmedAddress = draft.address.trim()
    const nextErrors: CustomerFormErrors = {}

    if (trimmedName.length > NAME_MAX_LENGTH) {
      nextErrors.name = t(`${TK}.invalidNameMaxLength`)
    }

    if (trimmedEmail) {
      if (trimmedEmail.length > EMAIL_MAX_LENGTH) {
        nextErrors.email = t(`${TK}.invalidEmailMaxLength`)
      } else if (!isValidEmail(trimmedEmail)) {
        nextErrors.email = t(`${TK}.invalidEmail`)
      }
    }

    if (trimmedAddress.length > ADDRESS_MAX_LENGTH) {
      nextErrors.address = t(`${TK}.invalidAddressMaxLength`)
    }

    if (draft.dateOfBirth.trim() && !isValidDateOfBirth(draft.dateOfBirth, dobBounds)) {
      nextErrors.dateOfBirth = t(`${TK}.invalidBirthday`)
    }

    setFormErrors(nextErrors)
    if (nextErrors.name || nextErrors.email || nextErrors.address || nextErrors.dateOfBirth) return

    setIsSaving(true)
    try {
      await updateCustomerMutation.mutateAsync({
        id: draft.id,
        body: {
          name: trimmedName || null,
          email: trimmedEmail || null,
          address: trimmedAddress || null,
          dateOfBirth: draft.dateOfBirth || null,
          type: draft.type,
          status: draft.status,
        },
      })
      showToast(t(`${TK}.saveSuccess`), 'success')
      closeEditModal()
    } catch (error) {
      showToast(t(getErrorI18nKey(getApiErrorCode(error))) || t(`${TK}.saveError`), 'error')
    } finally {
      setIsSaving(false)
    }
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
            <span className="cust-count">
              {t(`${TK}.countLabel`, { shown: customers.length, total: customersResponse?.totalCount ?? 0 })}
            </span>
          </div>

          <div className="booking-controls booking-controls-single" aria-label={t(`${TK}.filtersAria`)}>
            <label className="booking-control-field">
              <span className="booking-control-label">{t(`${TK}.searchLabel`)}</span>
              <input
                className="booking-input"
                type="search"
                placeholder={t(`${TK}.searchPlaceholder`)}
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>
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
                          <td>
                            <div className="booking-customer-name">
                              {customer.name || '_'}
                              {isInactive ? (
                                <span className="badge badge-soft cust-inactive-tag">{t(`${TK}.inactiveTag`)}</span>
                              ) : null}
                            </div>
                          </td>
                          <td>{(formatVoicePhoneDisplay(customer.phoneNumber, '_') ?? '_')}</td>
                          <td>
                            {segment ? (
                              <span className="badge seg-badge" style={{ '--seg': segment.color } as React.CSSProperties}>
                                {segment.icon}
                                <span>{t(`${TK}.${segment.labelKey}`)}</span>
                              </span>
                            ) : '_'}
                          </td>
                          <td>
                            {customer.source ? (
                              <span className="badge badge-soft">
                                {source.icon}
                                <span>{source.label}</span>
                              </span>
                            ) : '_'}
                          </td>
                          <td>{customer.totalVisit ?? '_'}</td>
                          <td>{formatLastVisit(customer.lastVisit, currentLanguage)}</td>
                          <td>
                            <div className="booking-actions">
                              <button
                                className="booking-mini-button"
                                type="button"
                                title={t(`${TK}.editAction`)}
                                aria-label={t(`${TK}.editAriaLabel`, { name: customer.name || '_' })}
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
            />
          ) : null}
        </article>
      </div>

      {editingCustomer && draft ? (
        <div className="cust-modal-overlay" role="presentation">
          <div
            className="cust-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="cust-modal-title"
          >
            <div className="cust-modal-head">
              <h3 id="cust-modal-title">{t(`${TK}.modalTitle`)}</h3>
              <button
                className="cust-modal-close"
                type="button"
                aria-label={t(`${TK}.close`)}
                onClick={closeEditModal}
              >
                <XLgIcon />
              </button>
            </div>

            <div className="cust-modal-body">
              <label className="cust-field cust-field-full">
                <span className="cust-field-label">{t(`${TK}.fieldName`)}</span>
                <input
                  className={`booking-input ${formErrors.name ? 'has-error' : ''}`}
                  type="text"
                  value={draft.name}
                  placeholder={t(`${TK}.fieldNamePlaceholder`)}
                  aria-invalid={Boolean(formErrors.name)}
                  onChange={(event) => {
                    setDraft({ ...draft, name: event.target.value })
                    if (formErrors.name) setFormErrors((prev) => ({ ...prev, name: undefined }))
                  }}
                />
                {formErrors.name ? (
                  <span className="cust-field-error" aria-live="polite">{formErrors.name}</span>
                ) : null}
              </label>
              <label className="cust-field">
                <span className="cust-field-label">{t(`${TK}.fieldEmail`)}</span>
                <input
                  className={`booking-input ${formErrors.email ? 'has-error' : ''}`}
                  type="email"
                  value={draft.email}
                  placeholder={t(`${TK}.fieldEmailPlaceholder`)}
                  aria-invalid={Boolean(formErrors.email)}
                  onChange={(event) => {
                    setDraft({ ...draft, email: event.target.value })
                    if (formErrors.email) setFormErrors((prev) => ({ ...prev, email: undefined }))
                  }}
                />
                {formErrors.email ? (
                  <span className="cust-field-error" aria-live="polite">{formErrors.email}</span>
                ) : null}
              </label>
              <label className="cust-field">
                <span className="cust-field-label">{t(`${TK}.fieldBirthday`)}</span>
                <input
                  className={`booking-input ${formErrors.dateOfBirth ? 'has-error' : ''}`}
                  type="date"
                  value={draft.dateOfBirth}
                  min={dobBounds.min}
                  max={dobBounds.max}
                  aria-invalid={Boolean(formErrors.dateOfBirth)}
                  onChange={(event) => {
                    const nextValue = event.target.value
                    setDraft({ ...draft, dateOfBirth: nextValue })
                    setFormErrors((prev) => ({
                      ...prev,
                      dateOfBirth: nextValue && !isValidDateOfBirth(nextValue, dobBounds)
                        ? t(`${TK}.invalidBirthday`)
                        : undefined,
                    }))
                  }}
                />
                {formErrors.dateOfBirth ? (
                  <span className="cust-field-error" aria-live="polite">{formErrors.dateOfBirth}</span>
                ) : null}
              </label>
              <label className="cust-field cust-field-full">
                <span className="cust-field-label">{t(`${TK}.fieldAddress`)}</span>
                <input
                  className={`booking-input ${formErrors.address ? 'has-error' : ''}`}
                  type="text"
                  value={draft.address}
                  placeholder={t(`${TK}.fieldAddressPlaceholder`)}
                  aria-invalid={Boolean(formErrors.address)}
                  onChange={(event) => {
                    setDraft({ ...draft, address: event.target.value })
                    if (formErrors.address) setFormErrors((prev) => ({ ...prev, address: undefined }))
                  }}
                />
                {formErrors.address ? (
                  <span className="cust-field-error" aria-live="polite">{formErrors.address}</span>
                ) : null}
              </label>
              <label className="cust-field cust-field-full">
                <span className="cust-field-label">{t(`${TK}.fieldType`)}</span>
                <select
                  className="booking-input"
                  value={draft.type}
                  onChange={(event) => setDraft({
                    ...draft,
                    type: event.target.value as MerchantVoiceCustomerType,
                  })}
                >
                  {CUSTOMER_TYPES.map((type) => (
                    <option key={type} value={type}>{t(`${TK}.types.${type}`)}</option>
                  ))}
                </select>
              </label>
              <div className="cust-status-row">
                <span>{t(`${TK}.fieldStatus`)}</span>
                <div className="cust-status-toggle">
                  <button
                    className={`toggle-pill ${draft.status === MerchantVoiceCustomerStatus.Active ? 'is-on' : ''}`}
                    type="button"
                    role="switch"
                    aria-checked={draft.status === MerchantVoiceCustomerStatus.Active}
                    aria-label={t(`${TK}.toggleStatusAria`)}
                    onClick={() => setDraft({
                      ...draft,
                      status: draft.status === MerchantVoiceCustomerStatus.Active
                        ? MerchantVoiceCustomerStatus.InActive
                        : MerchantVoiceCustomerStatus.Active,
                    })}
                  />
                  <span>
                    {draft.status === MerchantVoiceCustomerStatus.Active
                      ? t(`${TK}.statusActive`)
                      : t(`${TK}.statusInactive`)}
                  </span>
                </div>
              </div>
            </div>

            <div className="cust-modal-foot">
              <button className="booking-mini-button" type="button" onClick={closeEditModal} disabled={isSaving}>
                {t(`${TK}.cancel`)}
              </button>
              <button className="booking-mini-button primary" type="button" onClick={saveEditModal} disabled={isSaving}>
                {isSaving ? <SpinnerIcon className="booking-inline-spinner" /> : <CheckLgIcon />}
                <span className="booking-mini-label">{t(`${TK}.save`)}</span>
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
