import React, { useEffect, useMemo, useRef, useState } from 'react'
import CountryCodeSelect, {
  formatNationalNumber,
  getNationalPhonePlaceholder,
  isValidPhoneE164,
  normalizePhoneE164,
  normalizePhoneSearchTerm,
  parsePhone,
  PhoneDialCode,
} from '../../CountryCodeSelect'
import { BOOKING_HUB_EMPTY_CELL, BOOKING_HUB_PAGINATION_CLASSNAME, formatBookingHubDateTime, formatVoicePhoneDisplay, openNativeDateTimePicker } from './bookingHubFormatters'
import { applyAiHubProgressiveValidation } from './bookingHubDialogValidation'
import BookingKeywordSearchField from './BookingKeywordSearchField'
import BookingFilterPopover from './BookingFilterPopover'
import { useTranslation } from '../../../contexts/LanguageContext'
import { useNotification } from '../../../contexts/NotificationContext'
import { getErrorI18nKey } from '../../../data/errorCodes'
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
  MerchantVoiceCustomerStatus,
  MerchantVoiceCustomerType,
  normalizeMerchantVoiceCustomerStatus,
  type MerchantVoiceCustomerDto,
} from '../../../data/repositories/merchantVoice'
import { getApiErrorCode } from '../../../types/domain'
import { isValidEmail } from '../../../utils/validation'
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
  UserPlusIcon,
  XLgIcon,
} from './BookingHubIcons'
import { useBookingHubVoiceEnabled } from './BookingHubVoiceContext'
import Pagination from '../../ui/Pagination'

const TK = 'components.dashboard.views.BookingHubView.customers'
const TK_HUB = 'components.dashboard.views.BookingHubView'

enum CustomerModalMode {
  Create = 'create',
  Edit = 'edit',
}

interface CustomerDraft {
  id: string | null
  name: string
  phone: string
  email: string
  address: string
  dateOfBirth: string
  type: MerchantVoiceCustomerType
  status: MerchantVoiceCustomerStatus
}

interface CustomerFormErrors {
  name?: string
  phone?: string
  email?: string
  dateOfBirth?: string
  address?: string
  [key: string]: string | undefined
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

/** PUT/POST customer type — VoiceCustomerType (not VoiceCustomerGroup). */
const CUSTOMER_TYPE_OPTIONS: MerchantVoiceCustomerType[] = [
  MerchantVoiceCustomerType.Individual,
  MerchantVoiceCustomerType.Business,
  MerchantVoiceCustomerType.Vip,
  MerchantVoiceCustomerType.Guest,
  MerchantVoiceCustomerType.Partner,
  MerchantVoiceCustomerType.Internal,
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

function emptyDraft(defaultDialCode: string): CustomerDraft {
  return {
    id: null,
    name: '',
    phone: defaultDialCode,
    email: '',
    address: '',
    dateOfBirth: '',
    type: MerchantVoiceCustomerType.Individual,
    status: MerchantVoiceCustomerStatus.Active,
  }
}

function toDraft(customer: MerchantVoiceCustomerDto): CustomerDraft {
  return {
    id: customer.id,
    name: customer.name ?? '',
    phone: customer.phoneNumber ?? '',
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
  const defaultDialCode = PhoneDialCode.US

  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [segmentFilter, setSegmentFilter] = useState<CustomerUiSegment | 'all'>('all')
  const [modalMode, setModalMode] = useState<CustomerModalMode | null>(null)
  const [draft, setDraft] = useState<CustomerDraft | null>(null)
  const [formErrors, setFormErrors] = useState<CustomerFormErrors>({})
  const [isSaving, setIsSaving] = useState(false)
  const custModalRef = useRef<HTMLDivElement>(null)
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
  const dobBounds = useMemo(() => getDobBounds(), [])
  const phoneParsed = useMemo(
    () => parsePhone(draft?.phone || defaultDialCode),
    [draft?.phone, defaultDialCode],
  )
  const isCreateMode = modalMode === CustomerModalMode.Create

  const segmentCounts = useMemo(() => ({
    all: summary?.all ?? 0,
    [CustomerUiSegment.New]: summary?.new ?? 0,
    [CustomerUiSegment.Day15]: summary?.days15 ?? 0,
    [CustomerUiSegment.Day30]: summary?.days30 ?? 0,
    [CustomerUiSegment.Day60]: summary?.days60 ?? 0,
    [CustomerUiSegment.Vip]: summary?.vip ?? 0,
  }), [summary])

  const openCreateModal = () => {
    setModalMode(CustomerModalMode.Create)
    setDraft(emptyDraft(defaultDialCode))
    setFormErrors({})
  }

  const openEditModal = (customer: MerchantVoiceCustomerDto) => {
    setModalMode(CustomerModalMode.Edit)
    setDraft(toDraft(customer))
    setFormErrors({})
  }

  const closeModal = () => {
    setModalMode(null)
    setDraft(null)
    setFormErrors({})
  }

  useEffect(() => {
    if (!modalMode) return undefined
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isSaving) {
        closeModal()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [modalMode, isSaving])

  const saveModal = async () => {
    if (!draft || !modalMode) return

    const trimmedEmail = draft.email.trim()
    const trimmedName = draft.name.trim()
    const trimmedAddress = draft.address.trim()
    const nextErrors: CustomerFormErrors = {}
    const dialCode = phoneParsed.countryCode

    if (!trimmedName) {
      nextErrors.name = t(`${TK}.invalidNameRequired`)
    } else if (trimmedName.length > NAME_MAX_LENGTH) {
      nextErrors.name = t(`${TK}.invalidNameMaxLength`)
    }

    let phoneForApi = ''
    const hasPhoneInput = Boolean(phoneParsed.nationalNumber.trim())
    if (!hasPhoneInput) {
      nextErrors.phone = t(`${TK}.invalidPhoneRequired`)
    } else {
      phoneForApi = normalizePhoneE164(draft.phone, dialCode)
      if (!isValidPhoneE164(phoneForApi, dialCode)) {
        nextErrors.phone = t(`${TK}.invalidPhone`)
      }
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

    if (
      applyAiHubProgressiveValidation({
        allErrors: nextErrors,
        root: custModalRef.current,
        setErrors: setFormErrors,
        showToast,
        fieldLabels: {
          name: t(`${TK}.fieldName`),
          phone: t(`${TK}.fieldPhone`),
          email: t(`${TK}.fieldEmail`),
          dateOfBirth: t(`${TK}.fieldBirthday`),
          address: t(`${TK}.fieldAddress`),
        },
        hubTk: TK_HUB,
        t,
      })
    ) {
      return
    }

    setIsSaving(true)
    try {
      const customerBody = {
        phoneNumber: phoneForApi,
        name: trimmedName || null,
        email: trimmedEmail || null,
        address: trimmedAddress || null,
        dateOfBirth: draft.dateOfBirth.trim() || null,
        type: draft.type,
        status: draft.status,
      }
      if (isCreateMode) {
        // POST /api/v1/merchant/nexora-voice/customers — CreateMerchantVoiceCustomerCommand
        await createCustomerMutation.mutateAsync(customerBody)
        showToast(t(`${TK}.createSuccess`), 'success')
      } else if (draft.id) {
        // PUT /api/v1/merchant/nexora-voice/customers/{id} — UpdateMerchantVoiceCustomerCommand
        await updateCustomerMutation.mutateAsync({
          id: draft.id,
          body: customerBody,
        })
        showToast(t(`${TK}.saveSuccess`), 'success')
      }
      closeModal()
    } catch (error) {
      showToast(
        t(getErrorI18nKey(getApiErrorCode(error)))
          || t(isCreateMode ? `${TK}.createError` : `${TK}.saveError`),
        'error',
      )
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
                            {(formatVoicePhoneDisplay(customer.phoneNumber, BOOKING_HUB_EMPTY_CELL) ?? BOOKING_HUB_EMPTY_CELL)}
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

      {modalMode && draft ? (
        <div
          className="cust-modal-overlay"
          role="presentation"
        >
          <div
            ref={custModalRef}
            className="cust-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="cust-modal-title"
          >
            <div className="cust-modal-head">
              <h3 id="cust-modal-title">
                {isCreateMode ? t(`${TK}.createModalTitle`) : t(`${TK}.modalTitle`)}
              </h3>
              <button
                className="cust-modal-close"
                type="button"
                aria-label={t(`${TK}.close`)}
                onClick={closeModal}
                disabled={isSaving}
              >
                <XLgIcon />
              </button>
            </div>

            <div className="cust-modal-body">
              <label className="cust-field cust-field-full" data-ai-hub-field="name">
                <span className="cust-field-label">{t(`${TK}.fieldName`)}</span>
                <input
                  className={`booking-input ${formErrors.name ? 'has-error' : ''}`}
                  type="text"
                  value={draft.name}
                  placeholder={t(`${TK}.fieldNamePlaceholder`)}
                  autoComplete="name"
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

              <label className="cust-field" data-ai-hub-field="phone">
                <span className="cust-field-label">{t(`${TK}.fieldPhone`)}</span>
                <span className="phone-input-shell">
                  <CountryCodeSelect
                    value={phoneParsed.countryCode}
                    embedded
                    disabled={isSaving}
                    onChange={(nextCode) => {
                      const formatted = formatNationalNumber(phoneParsed.nationalNumber, nextCode)
                      setDraft({ ...draft, phone: `${nextCode} ${formatted}`.trim() })
                      if (formErrors.phone) setFormErrors((prev) => ({ ...prev, phone: undefined }))
                    }}
                  />
                  <input
                    className={`booking-input phone-mask-input ${formErrors.phone ? 'has-error' : ''}`}
                    type="tel"
                    value={formatNationalNumber(phoneParsed.nationalNumber, phoneParsed.countryCode)}
                    placeholder={getNationalPhonePlaceholder(phoneParsed.countryCode)}
                    inputMode="numeric"
                    autoComplete="tel-national"
                    disabled={isSaving}
                    aria-invalid={Boolean(formErrors.phone)}
                    onChange={(event) => {
                      const formatted = formatNationalNumber(event.target.value, phoneParsed.countryCode)
                      setDraft({ ...draft, phone: `${phoneParsed.countryCode} ${formatted}`.trim() })
                      if (formErrors.phone) setFormErrors((prev) => ({ ...prev, phone: undefined }))
                    }}
                  />
                </span>
                {formErrors.phone ? (
                  <span className="cust-field-error" aria-live="polite">{formErrors.phone}</span>
                ) : null}
              </label>

              <label className="cust-field" data-ai-hub-field="email">
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

              <label className="cust-field cust-field-full cust-field-birthday" data-ai-hub-field="dateOfBirth">
                <span className="cust-field-label">{t(`${TK}.fieldBirthday`)}</span>
                <span className="cust-date-shell">
                  <input
                    className={`booking-input cust-date-input ${formErrors.dateOfBirth ? 'has-error' : ''}`}
                    type="date"
                    value={draft.dateOfBirth}
                    min={dobBounds.min}
                    max={dobBounds.max}
                    aria-invalid={Boolean(formErrors.dateOfBirth)}
                    onClick={(event) => openNativeDateTimePicker(event.currentTarget)}
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
                </span>
                {formErrors.dateOfBirth ? (
                  <span className="cust-field-error" aria-live="polite">{formErrors.dateOfBirth}</span>
                ) : null}
              </label>

              <label className="cust-field cust-field-full" data-ai-hub-field="address">
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
                  {CUSTOMER_TYPE_OPTIONS.map((type) => (
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
              <button className="booking-mini-button" type="button" onClick={closeModal} disabled={isSaving}>
                {t(`${TK}.cancel`)}
              </button>
              <button className="booking-mini-button primary" type="button" onClick={saveModal} disabled={isSaving}>
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
