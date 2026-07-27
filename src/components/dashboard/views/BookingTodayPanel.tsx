import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from '../../../contexts/LanguageContext'
import { useNotification } from '../../../contexts/NotificationContext'
import { getErrorI18nKey } from '../../../data/errorCodes'
import {
  useMerchantVoiceBookings,
  useMerchantVoiceBookingStatistics,
  useMerchantVoiceStaff,
  useSendMerchantVoiceBookingConfirmationSms,
  useUpdateMerchantVoiceBookingStatus,
} from '../../../data/hooks/useMerchantVoiceBookings'
import {
  BOOKING_UI_SEARCH_FIELD_TO_API,
  BOOKING_UI_SOURCE_I18N_KEY,
  BookingUiSearchField,
  BookingUiSource,
  BookingUiStatus,
  MERCHANT_VOICE_BOOKINGS_POLL_INTERVAL_MS,
  mapLeadSourceToUiSource,
  mapLeadStatusToUiStatus,
  mapUiSourceToSourceClass,
  MerchantVoiceErrorCode,
  MerchantVoiceLeadStatus,
  MerchantVoiceStaffStatus,
  type MerchantVoiceBookingDto,
} from '../../../data/repositories/merchantVoice'
import { getApiErrorCode } from '../../../types/domain'
import { parseApiDateTime } from '../utils'
import {
  BroadcastIcon,
  CalendarEventIcon,
  CalendarKpiIcon,
  CheckKpiIcon,
  CheckLgIcon,
  ClockIcon,
  EyeIcon,
  GridIcon,
  JournalIcon,
  PersonWorkspaceIcon,
  PlusIcon,
  SendIcon,
  SpinnerIcon,
  StarsIcon,
  StopwatchIcon,
  TableIcon,
  XLgIcon,
  XKpiIcon,
} from './BookingHubIcons'
import BookingCreateAppointmentModal from './BookingCreateAppointmentModal'
import type { BookingCreateCreatedSlot, BookingCreatePrefill } from './bookingCreateConstants'
import {
  BOOKING_CREATE_LOCAL_ID_PREFIX,
  BOOKING_CREATE_OPTIMISTIC_TTL_MS,
  BOOKING_CREATE_STAFF_PAGE_SIZE,
  BOOKING_CREATE_TK,
} from './bookingCreateConstants'
import { useBookingHubVoiceEnabled } from './BookingHubVoiceContext'
import Pagination from '../../ui/Pagination'
import { usePagination } from '../../../hooks/usePagination'
import { useMediaQuery } from '../../../hooks/useMediaQuery'
import { BOOKING_HUB_PAGE_SIZE } from '../../../constants/pagination'
import {
  BookingKpiSkeleton,
  BookingTodayListSkeleton,
} from './BookingHubSkeletons'
import BookingKpiCard from './BookingKpiCard'
import BookingFilterPopover from './BookingFilterPopover'
import BookingTeamCalendar, { type BookingCalendarSlotSelect } from './BookingTeamCalendar'
import type { BookingCalendarSource } from './bookingCalendarUtils'
import {
  BOOKING_CALENDAR_CELL_DURATION_MINUTES,
  BOOKING_STATUS_FILTER_ORDER,
  BOOKING_STATUS_META,
  BookingTodayViewMode,
} from './bookingTodayConstants'
import { toUtcBookingSlot } from '../../../data/repositories/publicVoiceBooking'
import {
  BOOKING_HUB_EMPTY_CELL,
  BOOKING_HUB_PAGINATION_CLASSNAME,
  BOOKING_HUB_STATUS_FILTER_ALL,
  BOOKING_KPI_ACCENTS,
  countPageItemsByStatus,
  filterByAppointmentDate,
  filterPageItemsByStatus,
  formatCallDurationSeconds,
  formatVoicePhoneDisplay,
  localDateIsoToUtcRange,
  toLocalDateIso,
} from './bookingHubFormatters'

const TK = 'components.dashboard.views.BookingHubView'

const SOURCE_KEY_MAP = BOOKING_UI_SOURCE_I18N_KEY

const STATUS_FILTER_ORDER = BOOKING_STATUS_FILTER_ORDER

type BookingStatus = BookingUiStatus
type BookingSource = BookingUiSource
type SearchField = BookingUiSearchField
type StatusFilter = BookingUiStatus | typeof BOOKING_HUB_STATUS_FILTER_ALL
type ViewMode = BookingTodayViewMode

interface BookingItem {
  id: string
  name: string
  phone: string | null
  email: string | null
  contactDisplay: string | null
  services: string[]
  tech: string
  date: string
  /** Appointment start (requestedStartAtUtc → local). */
  timeMain: string
  timeDate: string
  /** Appointment end (requestedEndAtUtc → local); empty cell when absent. */
  endTimeMain: string
  /** Voice call start (callStartedAt → local); `_` when absent. */
  callStartMain: string
  callStartDate: string
  /** Call duration label `mm:ss`; `_` when BE has no call duration. */
  durationLabel: string
  startAtUtc: string | null
  endAtUtc: string | null
  source: BookingSource
  sourceClass: string
  request?: boolean
  status: BookingStatus
  confirmationSmsSentAt: string | null
  note: string
}

const EMPTY_CELL = BOOKING_HUB_EMPTY_CELL

function buildPendingCalendarBooking(
  slot: BookingCreateCreatedSlot,
  statusLabelText: string,
): BookingCalendarSource {
  const utc = toUtcBookingSlot(slot.date, slot.time)
  const startAtUtc = utc.date && utc.startTime ? `${utc.date}T${utc.startTime}Z` : null
  let endAtUtc: string | null = null
  if (startAtUtc) {
    const start = parseApiDateTime(startAtUtc)
    if (start) {
      const durationMinutes = Math.max(BOOKING_CALENDAR_CELL_DURATION_MINUTES, slot.durationMinutes)
      endAtUtc = new Date(start.getTime() + durationMinutes * 60_000).toISOString()
    }
  }
  return {
    id: `${BOOKING_CREATE_LOCAL_ID_PREFIX}${slot.date}T${slot.time}`,
    name: slot.customerName || EMPTY_CELL,
    tech: slot.staffName?.trim() || EMPTY_CELL,
    date: slot.date,
    services: slot.serviceNames.length > 0 ? slot.serviceNames : [EMPTY_CELL],
    statusLabel: statusLabelText,
    startAtUtc,
    endAtUtc,
  }
}

function mapSource(source: MerchantVoiceBookingDto['source']): BookingSource {
  return mapLeadSourceToUiSource(source)
}

function sourceClass(source: BookingSource) {
  return mapUiSourceToSourceClass(source)
}

function mapStatus(status: MerchantVoiceBookingDto['status']): BookingStatus {
  return mapLeadStatusToUiStatus(status)
}

function resolveCustomerContactDisplay(
  phone: string | null | undefined,
  email: string | null | undefined,
): string | null {
  const phoneDisplay = formatVoicePhoneDisplay(phone, null)
  if (phoneDisplay) return phoneDisplay

  const trimmedEmail = email?.trim()
  return trimmedEmail || null
}

function formatServiceLabel(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return trimmed
  return trimmed
    .split(/\s+/)
    .map((word) => word.charAt(0).toLocaleUpperCase() + word.slice(1).toLocaleLowerCase())
    .join(' ')
}

function serviceList(service: string | null | undefined) {
  if (!service?.trim()) return [EMPTY_CELL]
  const items = service
    .split(/[,/]/)
    .map((item) => formatServiceLabel(item.trim()))
    .filter(Boolean)
  return items.length > 0 ? items : [EMPTY_CELL]
}

function formatTimeBlock(
  startAt: string | null,
  fallback: string | null,
  todayLabel: string,
  language: string = 'en',
  {
    emptyMain = EMPTY_CELL,
    emptyDate = EMPTY_CELL,
    useTodayPrefix = true,
  }: {
    emptyMain?: string
    emptyDate?: string
    useTodayPrefix?: boolean
  } = {},
) {
  if (!startAt) {
    return {
      timeMain: fallback?.trim() || emptyMain,
      timeDate: fallback?.trim() ? '' : emptyDate,
      // No Appointment start from BE → no appointment day (do not invent "today").
      dateIso: '',
    }
  }

  // BE returns UTC (often without trailing Z). Parse as UTC, then format in end-user TZ.
  const start = parseApiDateTime(startAt)
  if (!start) {
    return {
      timeMain: fallback?.trim() || startAt || emptyMain,
      timeDate: fallback?.trim() || emptyDate,
      dateIso: '',
    }
  }

  const dateLocale = language === 'vi' ? 'vi-VN' : 'en-US'
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone
  const dateIso = toLocalDateIso(start)
  const todayIso = toLocalDateIso(new Date())
  // Keep en-US + 12h intentionally — matches booking hub hours elsewhere.
  const timeFormatter = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone,
  })
  const dateFormatter = new Intl.DateTimeFormat(dateLocale, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone,
  })

  const startTime = timeFormatter.format(start)
  const dateText = dateFormatter.format(start)

  return {
    timeMain:
      useTodayPrefix && dateIso === todayIso
        ? `${todayLabel} · ${startTime}`
        : startTime,
    timeDate: dateText,
    dateIso,
  }
}

function resolveBookingStatus(item: MerchantVoiceBookingDto, statusOverride?: BookingStatus): BookingStatus {
  if (statusOverride) return statusOverride
  const mapped = mapStatus(item.status)
  if (item.confirmationSmsSentAt && mapped === BookingUiStatus.New) return BookingUiStatus.SmsSent
  return mapped
}

function toBookingItem(
  item: MerchantVoiceBookingDto,
  statusOverride: BookingStatus | undefined,
  todayLabel: string,
  language: string = 'en',
): BookingItem {
  const source = mapSource(item.source)
  const time = formatTimeBlock(
    item.requestedStartAtUtc,
    item.preferredTime,
    todayLabel,
    language,
  )
  const callStart = formatTimeBlock(
    item.callStartedAt,
    null,
    todayLabel,
    language,
    { useTodayPrefix: false },
  )
  const status = resolveBookingStatus(item, statusOverride)
  const phone = formatVoicePhoneDisplay(item.customerPhone, null)
  const email = item.customerEmail?.trim() || null
  const endTime = formatTimeBlock(
    item.requestedEndAtUtc,
    null,
    todayLabel,
    language,
    { useTodayPrefix: false, emptyMain: EMPTY_CELL, emptyDate: '' },
  )
  return {
    id: item.id,
    name: item.customerName?.trim() || EMPTY_CELL,
    phone,
    email,
    contactDisplay: resolveCustomerContactDisplay(item.customerPhone, item.customerEmail),
    services: serviceList(item.service),
    tech: item.assignedStaffName?.trim() || EMPTY_CELL,
    date: time.dateIso,
    timeMain: time.timeMain,
    timeDate: time.timeDate,
    endTimeMain: endTime.timeMain,
    callStartMain: callStart.timeMain,
    callStartDate: callStart.timeDate,
    durationLabel: item.callDurationSeconds != null
      ? formatCallDurationSeconds(item.callDurationSeconds)
      : EMPTY_CELL,
    startAtUtc: item.requestedStartAtUtc,
    endAtUtc: item.requestedEndAtUtc,
    source,
    sourceClass: sourceClass(source),
    request: status === BookingUiStatus.New,
    status,
    confirmationSmsSentAt: item.confirmationSmsSentAt,
    note: item.notes?.trim() || EMPTY_CELL,
  }
}

function rowClassForStatus(status: BookingStatus) {
  return BOOKING_STATUS_META[status].rowClass
}

function statusBadgeClass(status: BookingStatus) {
  return BOOKING_STATUS_META[status].badgeClass
}

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

function formatBookingCardContact(phone: string | null, email: string | null) {
  // HTML: always "phone · email" (missing → empty cell).
  return `${phone || EMPTY_CELL} · ${email || EMPTY_CELL}`
}

function formatBookingCardCallStart(main: string, date: string) {
  if ((!main || main === EMPTY_CELL) && (!date || date === EMPTY_CELL)) return EMPTY_CELL
  if (!main || main === EMPTY_CELL) return date
  if (!date || date === EMPTY_CELL || main.includes(date)) return main
  return `${main} · ${date}`
}

/** HTML card Appointment: single line `time · date` (start only). */
function formatBookingCardAppointmentText(main: string, date: string) {
  return formatBookingCardCallStart(main, date)
}

/** Table appointment cell: optional end range + date stacked above time. */
function formatBookingCardAppointment(main: string, date: string, endMain: string) {
  const start = main === EMPTY_CELL ? EMPTY_CELL : main
  const range = start !== EMPTY_CELL && endMain !== EMPTY_CELL && endMain !== start
    ? `${start} – ${endMain}`
    : start
  if (date && date !== EMPTY_CELL && range !== EMPTY_CELL && !range.includes(date)) {
    return { main: range, date }
  }
  return { main: range, date: '' }
}

function BookingAppointmentCard({
  booking,
  statusLabel,
  pending,
  onAction,
  t,
}: {
  booking: BookingItem
  statusLabel: (status: BookingStatus) => string
  pending: boolean
  onAction: (id: string, action: 'send-sms' | 'done' | 'noshow' | 'detail') => void
  t: (key: string) => string
}) {
  return (
    <article className="booking-appointment-card">
      <div className="booking-card-top">
        <div>
          <div className="booking-card-name">{booking.name}</div>
          <div className="booking-card-contact">
            {formatBookingCardContact(booking.phone, booking.email)}
          </div>
        </div>
        <span className={`badge booking-status ${statusBadgeClass(booking.status)}`}>
          {statusLabel(booking.status)}
        </span>
      </div>

      <div className="booking-service-list">
        {booking.services.map((service) => (
          <span className="booking-service-chip" key={service}>{service}</span>
        ))}
      </div>

      <div className="booking-card-info-list">
        <div className="booking-card-info-row">
          <span className="booking-card-label">{t(`${TK}.today.colTime`)}</span>
          <span className="booking-card-value">
            {formatBookingCardCallStart(booking.callStartMain, booking.callStartDate)}
          </span>
        </div>
        <div className="booking-card-info-row">
          <span className="booking-card-label">{t(`${TK}.today.colTech`)}</span>
          <span className="booking-card-value">{booking.tech}</span>
        </div>
        <div className="booking-card-info-row">
          <span className="booking-card-label">{t(`${TK}.today.colAppointment`)}</span>
          <span className="booking-card-value">
            {formatBookingCardAppointmentText(booking.timeMain, booking.timeDate)}
          </span>
        </div>
        <div className="booking-card-info-row">
          <span className="booking-card-label">{t(`${TK}.today.colDuration`)}</span>
          <span className="booking-card-value">{booking.durationLabel}</span>
        </div>
        <div className="booking-card-info-row">
          <span className="booking-card-label">{t(`${TK}.today.detailSource`)}</span>
          <span className="booking-card-value booking-source-list">
            <span className={`badge ${booking.sourceClass}`}>
              {t(`${TK}.${SOURCE_KEY_MAP[booking.source]}`)}
            </span>
            {booking.request ? (
              <span className="badge badge-warning">{t(`${TK}.booking.request`)}</span>
            ) : null}
          </span>
        </div>
      </div>

      <div className="booking-card-actions">
        <BookingActions
          booking={booking}
          onAction={pending ? () => undefined : onAction}
          isPending={pending}
          t={t}
        />
      </div>
    </article>
  )
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M8 2v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M16 2v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <rect width="18" height="18" x="3" y="4" rx="2" stroke="currentColor" strokeWidth="2" />
      <path d="M3 10h18" stroke="currentColor" strokeWidth="2" />
    </svg>
  )
}

function BookingActions({
  booking,
  onAction,
  isPending,
  t,
}: {
  booking: BookingItem
  onAction: (id: string, action: 'send-sms' | 'done' | 'noshow' | 'detail') => void
  isPending: boolean
  t: (key: string) => string
}) {
  const viewLabel = t(`${TK}.today.view`)
  const doneLabel = t(`${TK}.today.done`)
  const noShowLabel = t(`${TK}.today.noShow`)
  const sendSmsLabel = t(`${TK}.today.sendSms`)

  const viewBtn = (
    <button
      className="booking-mini-button booking-action-button"
      type="button"
      disabled={isPending}
      onClick={() => onAction(booking.id, 'detail')}
    >
      {isPending ? <SpinnerIcon className="booking-inline-spinner" /> : <EyeIcon />}
      <span>{viewLabel}</span>
    </button>
  )

  if (booking.status === BookingUiStatus.Done || booking.status === BookingUiStatus.NoShow) {
    return <div className="booking-actions">{viewBtn}</div>
  }

  const canSendSms = booking.confirmationSmsSentAt == null && booking.status === BookingUiStatus.New

  if (!canSendSms) {
    return (
      <div className="booking-actions">
        <button
          className="booking-mini-button booking-action-button primary booking-done-action"
          type="button"
          disabled={isPending}
          onClick={() => onAction(booking.id, 'done')}
        >
          {isPending ? <SpinnerIcon className="booking-inline-spinner" /> : <CheckLgIcon />}
          <span>{doneLabel}</span>
        </button>
        <button
          className="booking-mini-button booking-action-button booking-noshow-action"
          type="button"
          disabled={isPending}
          onClick={() => onAction(booking.id, 'noshow')}
        >
          {isPending ? <SpinnerIcon className="booking-inline-spinner" /> : <XLgIcon />}
          <span>{noShowLabel}</span>
        </button>
        {viewBtn}
      </div>
    )
  }

  return (
    <div className="booking-actions">
      <button
        className="booking-mini-button booking-action-button primary booking-sms-action"
        type="button"
        disabled={isPending}
        onClick={() => onAction(booking.id, 'send-sms')}
      >
        {isPending ? <SpinnerIcon className="booking-inline-spinner" /> : <SendIcon />}
        <span>{sendSmsLabel}</span>
      </button>
      <button
        className="booking-mini-button booking-action-button booking-noshow-action"
        type="button"
        disabled={isPending}
        onClick={() => onAction(booking.id, 'noshow')}
      >
        {isPending ? <SpinnerIcon className="booking-inline-spinner" /> : <XLgIcon />}
        <span>{noShowLabel}</span>
      </button>
      {viewBtn}
    </div>
  )
}

function BookingTableMobileList({
  bookings,
  statusLabel,
  pendingStatusUpdates,
  onAction,
  t,
}: {
  bookings: BookingItem[]
  statusLabel: (status: BookingStatus) => string
  pendingStatusUpdates: Record<string, boolean>
  onAction: (id: string, action: 'send-sms' | 'done' | 'noshow' | 'detail') => void
  t: (key: string) => string
}) {
  return (
    <div className="booking-table-mobile-list">
      {bookings.map((booking) => (
        <article
          className={`booking-table-mobile-row ${rowClassForStatus(booking.status)}`}
          key={booking.id}
        >
          <div className="booking-table-mobile-fields">
            <div className="booking-table-mobile-field">
              <span className="booking-table-mobile-label">{t(`${TK}.today.colCustomer`)}</span>
              <div className="booking-table-mobile-value">
                <div className="booking-customer-name">
                  {booking.name}{' '}
                  <span className={`badge ${booking.sourceClass}`}>
                    {t(`${TK}.${SOURCE_KEY_MAP[booking.source]}`)}
                  </span>
                  {booking.request ? (
                    <span className="badge badge-warning">{t(`${TK}.booking.request`)}</span>
                  ) : null}
                </div>
                <div className="booking-customer-meta">
                  {formatBookingCardContact(booking.phone, booking.email)}
                </div>
              </div>
            </div>

            <div className="booking-table-mobile-field">
              <span className="booking-table-mobile-label">{t(`${TK}.today.colStatus`)}</span>
              <div className="booking-table-mobile-value">
                <span className={`badge booking-status ${statusBadgeClass(booking.status)}`}>
                  {statusLabel(booking.status)}
                </span>
              </div>
            </div>

            <div className="booking-table-mobile-field">
              <span className="booking-table-mobile-label">{t(`${TK}.today.colService`)}</span>
              <div className="booking-table-mobile-value">
                <span className="booking-service-list">
                  {booking.services.map((service) => (
                    <span className="booking-service-chip" key={service}>{service}</span>
                  ))}
                </span>
              </div>
            </div>

            <div className="booking-table-mobile-field">
              <span className="booking-table-mobile-label">{t(`${TK}.today.colTech`)}</span>
              <div className="booking-table-mobile-value booking-tech-name">{booking.tech}</div>
            </div>

            <div className="booking-table-mobile-field">
              <span className="booking-table-mobile-label">{t(`${TK}.today.colAppointment`)}</span>
              <div className="booking-table-mobile-value">
                {formatBookingCardAppointmentText(booking.timeMain, booking.timeDate)}
              </div>
            </div>

            <div className="booking-table-mobile-field booking-table-mobile-field-actions">
              <span className="booking-table-mobile-label">{t(`${TK}.today.colAction`)}</span>
              <div className="booking-table-mobile-value booking-table-mobile-actions">
                <BookingActions
                  booking={booking}
                  onAction={pendingStatusUpdates[booking.id] ? () => undefined : onAction}
                  isPending={Boolean(pendingStatusUpdates[booking.id])}
                  t={t}
                />
              </div>
            </div>
          </div>
        </article>
      ))}
    </div>
  )
}

/** Below this content-pane width, stacked rows beat a cramped 6-col table. */
const COMPACT_TABLE_PANEL_MAX = 720

export default function BookingTodayPanel() {
  const { t, currentLanguage } = useTranslation()
  const { showToast } = useNotification()
  const voiceEnabled = useBookingHubVoiceEnabled()
  const listPanelRef = useRef<HTMLElement>(null)
  const [panelWidth, setPanelWidth] = useState<number | null>(null)
  // Viewport fallback only until ResizeObserver measures the real content pane
  // (sidebar can leave a narrow panel on a wide desktop viewport).
  const narrowViewportFallback = useMediaQuery('(max-width: 767px)')
  const useCompactTableList = panelWidth != null
    ? panelWidth < COMPACT_TABLE_PANEL_MAX
    : narrowViewportFallback
  const [viewMode, setViewMode] = useState<ViewMode>(BookingTodayViewMode.Table)
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const todayIso = toLocalDateIso(new Date())
  const [calendarDate, setCalendarDate] = useState(todayIso)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(BOOKING_HUB_STATUS_FILTER_ALL)
  const [searchField, setSearchField] = useState<SearchField>(BookingUiSearchField.Name)
  const [searchKeyword, setSearchKeyword] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [debouncedFilters, setDebouncedFilters] = useState({
    searchField: BookingUiSearchField.Name as SearchField,
    searchKeyword: '',
    dateFrom: '',
    dateTo: '',
  })
  const [statusOverrides, setStatusOverrides] = useState<Record<string, BookingStatus>>({})
  const [pendingStatusUpdates, setPendingStatusUpdates] = useState<Record<string, boolean>>({})
  const [detailBooking, setDetailBooking] = useState<BookingItem | null>(null)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [createPrefill, setCreatePrefill] = useState<BookingCreatePrefill | null>(null)
  const [pendingCalendarBooking, setPendingCalendarBooking] = useState<BookingCalendarSource | null>(null)
  const { pageNumber, pageSize, setPage, reset: resetPage } = usePagination({
    pageSize: BOOKING_HUB_PAGE_SIZE,
  })

  const apiSearchField = BOOKING_UI_SEARCH_FIELD_TO_API[debouncedFilters.searchField]

  const apiKeyword = debouncedFilters.searchKeyword.trim() || undefined

  const dateFromApi = debouncedFilters.dateFrom
    ? localDateIsoToUtcRange(debouncedFilters.dateFrom, 'start')
    : undefined
  const dateToApi = debouncedFilters.dateTo
    ? localDateIsoToUtcRange(debouncedFilters.dateTo, 'end')
    : undefined

  const hasActiveFilters = useMemo(() => (
    statusFilter !== BOOKING_HUB_STATUS_FILTER_ALL
    || debouncedFilters.searchField !== BookingUiSearchField.Name
    || Boolean(debouncedFilters.searchKeyword.trim())
    || Boolean(debouncedFilters.dateFrom)
    || Boolean(debouncedFilters.dateTo)
  ), [statusFilter, debouncedFilters])

  const keywordPlaceholder = searchField === BookingUiSearchField.Phone
    ? t(`${TK}.today.keywordPlaceholderPhone`)
    : searchField === BookingUiSearchField.Email
      ? t(`${TK}.today.keywordPlaceholderEmail`)
      : searchField === BookingUiSearchField.Service
        ? t(`${TK}.today.keywordPlaceholderService`)
        : t(`${TK}.today.keywordPlaceholderName`)

  const { data: statistics, isLoading: isStatisticsLoading } = useMerchantVoiceBookingStatistics({
    enabled: voiceEnabled,
    refetchInterval: voiceEnabled ? MERCHANT_VOICE_BOOKINGS_POLL_INTERVAL_MS : false,
  })
  const { data: bookingResponse, isLoading: isBookingsLoading } = useMerchantVoiceBookings({
    pageNumber,
    pageSize,
    searchBy: apiSearchField,
    keyword: apiKeyword,
    dateFrom: dateFromApi,
    dateTo: dateToApi,
  }, { enabled: voiceEnabled, refetchInterval: voiceEnabled ? MERCHANT_VOICE_BOOKINGS_POLL_INTERVAL_MS : false })
  const { data: calendarStaffResponse } = useMerchantVoiceStaff(
    {
      pageNumber: 1,
      pageSize: BOOKING_CREATE_STAFF_PAGE_SIZE,
      status: MerchantVoiceStaffStatus.Active,
    },
    { enabled: voiceEnabled && viewMode === BookingTodayViewMode.Calendar },
  )
  const calendarStaffNames = useMemo(
    () => (calendarStaffResponse?.items ?? [])
      .map((item) => item.fullName?.trim())
      .filter((name): name is string => Boolean(name)),
    [calendarStaffResponse?.items],
  )
  const updateBookingStatusMutation = useUpdateMerchantVoiceBookingStatus()
  const sendConfirmationSmsMutation = useSendMerchantVoiceBookingConfirmationSms()

  // Initial load only — background poll uses isFetching and must not flash skeletons
  const isListLoading = isBookingsLoading

  const mappedBookings = useMemo(() => (
    (bookingResponse?.items ?? []).map((item) =>
      toBookingItem(
        item,
        statusOverrides[item.id],
        t(`${TK}.today.todayLabel`),
        currentLanguage,
      ),
    )
  ), [bookingResponse?.items, statusOverrides, t, currentLanguage])

  const statusCounts = useMemo(
    () => countPageItemsByStatus(mappedBookings, STATUS_FILTER_ORDER),
    [mappedBookings],
  )

  const filteredBookings = useMemo(
    () => filterPageItemsByStatus(mappedBookings, statusFilter),
    [mappedBookings, statusFilter],
  )

  // When date filters are set, keep Card/Table/Calendar on Appointment local dates only.
  const appointmentBookings = useMemo(
    () => filterByAppointmentDate(
      filteredBookings,
      debouncedFilters.dateFrom,
      debouncedFilters.dateTo,
    ),
    [filteredBookings, debouncedFilters.dateFrom, debouncedFilters.dateTo],
  )

  const stats = useMemo(() => ({
    todayCount: statistics?.allBookings ?? 0,
    done: statistics?.doneBookings ?? 0,
    noShow: statistics?.noShowBookings ?? 0,
  }), [statistics])

  // Stay on the current page: chip filter only narrows this page’s rows (no BE Status).
  const handleStatusFilterChange = (next: StatusFilter) => {
    if (next === statusFilter) return
    setStatusFilter(next)
  }

  const openCreateModal = (prefill: BookingCreatePrefill | null = null) => {
    setCreatePrefill(prefill)
    setIsCreateOpen(true)
  }

  const handleCalendarSlotSelect = (slot: BookingCalendarSlotSelect) => {
    openCreateModal({
      date: slot.date,
      time: slot.time,
      staffName: slot.staffName,
    })
  }

  const handleAppointmentCreated = (slot: BookingCreateCreatedSlot) => {
    setViewMode(BookingTodayViewMode.Calendar)
    setCalendarDate(slot.date)
    resetPage()
    setStatusFilter(BOOKING_HUB_STATUS_FILTER_ALL)
    setPendingCalendarBooking(
      buildPendingCalendarBooking(
        slot,
        t(`${TK}.today.${BOOKING_STATUS_META[slot.status].labelKey}`),
      ),
    )
  }

  // Drop optimistic calendar block once the refetch includes the same local slot.
  useEffect(() => {
    if (!pendingCalendarBooking) return undefined
    const pendingStart = pendingCalendarBooking.startAtUtc
    const matched = appointmentBookings.some((booking) => {
      if (booking.date !== pendingCalendarBooking.date) return false
      if (pendingStart && booking.startAtUtc) {
        const a = parseApiDateTime(pendingStart)?.getTime()
        const b = parseApiDateTime(booking.startAtUtc)?.getTime()
        if (a != null && b != null && Math.abs(a - b) < 60_000) return true
      }
      return (
        booking.name === pendingCalendarBooking.name
        && booking.tech === pendingCalendarBooking.tech
      )
    })
    if (matched) {
      setPendingCalendarBooking(null)
      return undefined
    }
    const timer = window.setTimeout(() => setPendingCalendarBooking(null), BOOKING_CREATE_OPTIMISTIC_TTL_MS)
    return () => window.clearTimeout(timer)
  }, [appointmentBookings, pendingCalendarBooking])

  const handleAction = async (id: string, action: 'send-sms' | 'done' | 'noshow' | 'detail') => {
    const booking = appointmentBookings.find((item) => item.id === id)
    if (!booking) return

    if (action === 'detail') {
      setDetailBooking(booking)
      return
    }

    const previousStatus = statusOverrides[id] ?? booking.status

    const getNextStatus = (currentStatus: BookingStatus): BookingStatus | null => {
      if (action === 'send-sms' && booking.confirmationSmsSentAt == null && currentStatus === BookingUiStatus.New) {
        return BookingUiStatus.SmsSent
      }
      if (action === 'done' && currentStatus === BookingUiStatus.SmsSent) return BookingUiStatus.Done
      if (action === 'noshow' && (currentStatus === BookingUiStatus.New || currentStatus === BookingUiStatus.SmsSent)) {
        return BookingUiStatus.NoShow
      }
      return null
    }

    const nextStatus = getNextStatus(previousStatus)
    if (!nextStatus) return

    setStatusOverrides((prev) => {
      const currentStatus = prev[id] ?? appointmentBookings.find((item) => item.id === id)?.status
      if (!currentStatus) return prev

      const computedNext = getNextStatus(currentStatus)
      if (computedNext) return { ...prev, [id]: computedNext }
      return prev
    })

    if (action === 'send-sms') {
      setPendingStatusUpdates((prev) => ({ ...prev, [id]: true }))
      try {
        await sendConfirmationSmsMutation.mutateAsync({ id })
        showToast(t(`${TK}.today.sendSmsSuccess`), 'success')
      } catch (error) {
        const errorCode = getApiErrorCode(error)
        showToast(t(getErrorI18nKey(errorCode)), 'error')
        if (errorCode === MerchantVoiceErrorCode.ConfirmationSmsAlreadySent) {
          setStatusOverrides((prev) => ({ ...prev, [id]: BookingUiStatus.SmsSent }))
        } else {
          setStatusOverrides((prev) => ({ ...prev, [id]: previousStatus }))
        }
      } finally {
        setPendingStatusUpdates((prev) => ({ ...prev, [id]: false }))
      }
    }

    if (action === 'done' || action === 'noshow') {
      const apiStatus = action === 'done' ? MerchantVoiceLeadStatus.Done : MerchantVoiceLeadStatus.NoShow
      setPendingStatusUpdates((prev) => ({ ...prev, [id]: true }))
      try {
        await updateBookingStatusMutation.mutateAsync({ id, status: apiStatus })
        showToast(
          t(action === 'done' ? `${TK}.today.doneSuccess` : `${TK}.today.noShowSuccess`),
          'success',
        )
      } catch (error) {
        showToast(t(getErrorI18nKey(getApiErrorCode(error))), 'error')
        setStatusOverrides((prev) => ({ ...prev, [id]: previousStatus }))
      } finally {
        setPendingStatusUpdates((prev) => ({ ...prev, [id]: false }))
      }
    }

    if (detailBooking?.id === id) {
      setDetailBooking((prev) => {
        if (!prev || prev.id !== id) return prev
        if (action === 'send-sms') return { ...prev, status: BookingUiStatus.SmsSent }
        if (action === 'done') return { ...prev, status: BookingUiStatus.Done }
        if (action === 'noshow') return { ...prev, status: BookingUiStatus.NoShow }
        return prev
      })
    }
  }

  const clearFilters = () => {
    setStatusFilter(BOOKING_HUB_STATUS_FILTER_ALL)
    setSearchField(BookingUiSearchField.Name)
    setSearchKeyword('')
    setDateFrom('')
    setDateTo('')
    resetPage()
  }

  const handleSearchFieldChange = (nextField: SearchField) => {
    setSearchField(nextField)
  }

  const statusLabel = (status: BookingStatus) =>
    t(`${TK}.today.${BOOKING_STATUS_META[status].labelKey}`)

  const calendarBookings = useMemo(() => {
    const mapped = appointmentBookings.map((booking) => ({
      id: booking.id,
      name: booking.name,
      tech: booking.tech,
      date: booking.date,
      services: booking.services,
      statusLabel: t(`${TK}.today.${BOOKING_STATUS_META[booking.status].labelKey}`),
      startAtUtc: booking.startAtUtc,
      endAtUtc: booking.endAtUtc,
    }))
    if (
      pendingCalendarBooking
      && pendingCalendarBooking.date === calendarDate
      && !mapped.some((booking) => booking.id === pendingCalendarBooking.id)
    ) {
      return [...mapped, pendingCalendarBooking]
    }
    return mapped
  }, [appointmentBookings, calendarDate, pendingCalendarBooking, t])

  useEffect(() => {
    if (!detailBooking) {
      document.body.style.overflow = ''
      return undefined
    }
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [detailBooking])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const nextFilters = {
        searchField,
        searchKeyword,
        dateFrom,
        dateTo,
      }

      let filtersChanged = false
      setDebouncedFilters((prev) => {
        filtersChanged = prev.searchField !== nextFilters.searchField
          || prev.searchKeyword !== nextFilters.searchKeyword
          || prev.dateFrom !== nextFilters.dateFrom
          || prev.dateTo !== nextFilters.dateTo
        return nextFilters
      })

      if (filtersChanged) {
        resetPage()
      }
    }, 350)

    return () => window.clearTimeout(timer)
  }, [searchField, searchKeyword, dateFrom, dateTo, resetPage])

  useEffect(() => {
    const el = listPanelRef.current
    if (!el || typeof ResizeObserver === 'undefined') {
      return undefined
    }

    const updateWidth = (width: number) => {
      setPanelWidth((prev) => (prev === width ? prev : width))
    }

    updateWidth(el.getBoundingClientRect().width)

    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width
      if (typeof width === 'number') {
        updateWidth(width)
      }
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div className="booking-sub-panel is-active" aria-busy={isStatisticsLoading || isListLoading}>
      {isStatisticsLoading ? (
        <BookingKpiSkeleton />
      ) : (
      <div className="overview-kpis">
        <BookingKpiCard
          accentStyle={BOOKING_KPI_ACCENTS.electric}
          icon={<CalendarKpiIcon />}
          badge={t(`${TK}.today.badgeNew`)}
          badgeClass="booking-status-new"
          label={t(`${TK}.kpi.todayBookings`)}
          value={stats.todayCount}
          trend={t(`${TK}.today.kpiTodayTrend`)}
        />
        <BookingKpiCard
          accentStyle={BOOKING_KPI_ACCENTS.success}
          icon={<CheckKpiIcon />}
          badge={t(`${TK}.today.badgeSmsActive`)}
          badgeClass="booking-status-done"
          label={t(`${TK}.kpi.completed`)}
          value={stats.done}
          trend={t(`${TK}.today.kpiDoneTrend`)}
        />
        <BookingKpiCard
          accentStyle={BOOKING_KPI_ACCENTS.red}
          icon={<XKpiIcon />}
          badge={t(`${TK}.today.badgeNoShow`)}
          badgeClass="booking-status-noshow"
          label={t(`${TK}.today.kpiNoReview`)}
          value={stats.noShow}
          trend={t(`${TK}.today.kpiNoShowTrend`)}
        />
      </div>
      )}

      <div className="booking-grid">
        <article className="overview-card overview-card-pad" ref={listPanelRef}>
          <div className="booking-daybar">
            <div className="booking-date">
              <span className="booking-action-icon"><CalendarIcon /></span>
              <span>{t(`${TK}.today.overviewTitle`)}</span>
            </div>
            <div className="booking-daybar-actions">
              <button
                className="booking-primary-button booking-overview-add-button"
                type="button"
                onClick={() => openCreateModal(null)}
              >
                <PlusIcon />
                {t(`${BOOKING_CREATE_TK}.newButton`)}
              </button>
              <div className="booking-view-switch" role="group" aria-label={t(`${TK}.today.viewMode`)}>
                <button
                  className={`booking-view-button ${viewMode === BookingTodayViewMode.Table ? 'is-active' : ''}`}
                  type="button"
                  aria-pressed={viewMode === BookingTodayViewMode.Table}
                  onClick={() => setViewMode(BookingTodayViewMode.Table)}
                >
                  <TableIcon />
                  <span>{t(`${TK}.today.tableView`)}</span>
                </button>
                <button
                  className={`booking-view-button ${viewMode === BookingTodayViewMode.Card ? 'is-active' : ''}`}
                  type="button"
                  aria-pressed={viewMode === BookingTodayViewMode.Card}
                  onClick={() => setViewMode(BookingTodayViewMode.Card)}
                >
                  <GridIcon />
                  <span>{t(`${TK}.today.cardView`)}</span>
                </button>
                <button
                  className={`booking-view-button ${viewMode === BookingTodayViewMode.Calendar ? 'is-active' : ''}`}
                  type="button"
                  aria-pressed={viewMode === BookingTodayViewMode.Calendar}
                  onClick={() => setViewMode(BookingTodayViewMode.Calendar)}
                >
                  <CalendarEventIcon />
                  <span>{t(`${TK}.today.calendarView`)}</span>
                </button>
              </div>
              <BookingFilterPopover
                title={t(`${TK}.today.filterPopoverTitle`)}
                toggleLabel={t(`${TK}.today.filterToggle`)}
                isOpen={isFilterOpen}
                onOpenChange={setIsFilterOpen}
              >
                <div className="booking-controls booking-controls-filter" aria-label={t(`${TK}.today.filters`)}>
                  <label className="booking-control-field">
                    <span className="booking-control-label">{t(`${TK}.today.searchBy`)}</span>
                    <select
                      className="booking-select"
                      value={searchField}
                      onChange={(event) => handleSearchFieldChange(event.target.value as SearchField)}
                    >
                      <option value={BookingUiSearchField.Name}>{t(`${TK}.today.searchName`)}</option>
                      <option value={BookingUiSearchField.Phone}>{t(`${TK}.today.searchPhone`)}</option>
                      <option value={BookingUiSearchField.Email}>{t(`${TK}.today.searchEmail`)}</option>
                      <option value={BookingUiSearchField.Service}>{t(`${TK}.today.searchService`)}</option>
                    </select>
                  </label>
                  <label className="booking-control-field">
                    <span className="booking-control-label">{t(`${TK}.today.keyword`)}</span>
                    <span className={`booking-keyword-shell${searchKeyword ? ' has-value' : ''}`}>
                      <input
                        className="booking-input booking-input-keyword"
                        type="search"
                        placeholder={keywordPlaceholder}
                        value={searchKeyword}
                        onChange={(event) => setSearchKeyword(event.target.value)}
                      />
                      {searchKeyword ? (
                        <button
                          className="booking-keyword-clear"
                          type="button"
                          aria-label={t(`${TK}.today.clear`)}
                          title={t(`${TK}.today.clear`)}
                          onClick={() => setSearchKeyword('')}
                        >
                          <XLgIcon />
                        </button>
                      ) : null}
                    </span>
                  </label>
                  <label className="booking-control-field">
                    <span className="booking-control-label">{t(`${TK}.today.dateFrom`)}</span>
                    <span className={`booking-date-input-shell ${dateFrom ? 'has-value' : 'is-empty'}`}>
                      <input
                        className={`booking-input booking-input-date ${dateFrom ? 'has-value' : 'is-empty'}`}
                        type="date"
                        value={dateFrom}
                        aria-label={t(`${TK}.today.dateFrom`)}
                        onChange={(event) => setDateFrom(event.target.value)}
                      />
                      {!dateFrom ? (
                        <span className="booking-date-placeholder" aria-hidden="true">
                          {t(`${TK}.today.dateFromPlaceholder`)}
                        </span>
                      ) : null}
                    </span>
                  </label>
                  <label className="booking-control-field">
                    <span className="booking-control-label">{t(`${TK}.today.dateTo`)}</span>
                    <span className={`booking-date-input-shell ${dateTo ? 'has-value' : 'is-empty'}`}>
                      <input
                        className={`booking-input booking-input-date ${dateTo ? 'has-value' : 'is-empty'}`}
                        type="date"
                        value={dateTo}
                        aria-label={t(`${TK}.today.dateTo`)}
                        onChange={(event) => setDateTo(event.target.value)}
                      />
                      {!dateTo ? (
                        <span className="booking-date-placeholder" aria-hidden="true">
                          {t(`${TK}.today.dateToPlaceholder`)}
                        </span>
                      ) : null}
                    </span>
                  </label>
                  <button className="booking-mini-button booking-clear-button" type="button" onClick={clearFilters}>
                    {t(`${TK}.today.clear`)}
                  </button>
                </div>
              </BookingFilterPopover>
            </div>
          </div>

          <div
            className="booking-status-chips"
            role="group"
            aria-label={t(`${TK}.today.statusFilterAria`)}
          >
            <button
              className={`booking-status-chip ${statusFilter === BOOKING_HUB_STATUS_FILTER_ALL ? 'is-active' : ''}`}
              type="button"
              aria-pressed={statusFilter === BOOKING_HUB_STATUS_FILTER_ALL}
              onClick={() => handleStatusFilterChange(BOOKING_HUB_STATUS_FILTER_ALL)}
            >
              <span>{t(`${TK}.today.filterAll`)}</span>
              <span className="booking-status-chip-count">{statusCounts[BOOKING_HUB_STATUS_FILTER_ALL]}</span>
            </button>
            {STATUS_FILTER_ORDER.map((id) => (
              <button
                key={id}
                className={`booking-status-chip ${statusFilter === id ? 'is-active' : ''}`}
                type="button"
                aria-pressed={statusFilter === id}
                onClick={() => handleStatusFilterChange(id)}
              >
                <span>{t(`${TK}.today.${BOOKING_STATUS_META[id].labelKey}`)}</span>
                <span className="booking-status-chip-count">{statusCounts[id]}</span>
              </button>
            ))}
          </div>

          {isListLoading ? (
            <BookingTodayListSkeleton viewMode={viewMode === BookingTodayViewMode.Calendar ? BookingTodayViewMode.Table : viewMode} isMobileUI={useCompactTableList} />
          ) : viewMode === BookingTodayViewMode.Calendar ? (
            <BookingTeamCalendar
              bookings={calendarBookings}
              staffNames={calendarStaffNames}
              calendarDate={calendarDate}
              onCalendarDateChange={setCalendarDate}
              onEventClick={(bookingId) => handleAction(bookingId, 'detail')}
              onSlotSelect={handleCalendarSlotSelect}
              todayIso={todayIso}
              locale={currentLanguage === 'vi' ? 'vi-VN' : 'en-US'}
              title={t(`${TK}.today.calendarTitle`)}
              subtitle={t(`${TK}.today.calendarSubtitle`)}
              todayLabel={t(`${TK}.today.todayLabel`)}
              prevAriaLabel={t(`${TK}.today.calendarPrev`)}
              nextAriaLabel={t(`${TK}.today.calendarNext`)}
              unassignedLabel={t(`${TK}.today.calendarUnassigned`)}
            />
          ) : viewMode === BookingTodayViewMode.Table && useCompactTableList ? (
            <BookingTableMobileList
              bookings={appointmentBookings}
              statusLabel={statusLabel}
              pendingStatusUpdates={pendingStatusUpdates}
              onAction={handleAction}
              t={t}
            />
          ) : viewMode === BookingTodayViewMode.Table ? (
            <div className="booking-table-wrap">
              <div className="booking-table-scroller">
              <table className="booking-table" data-booking-table>
                <colgroup>
                  <col className="booking-col-customer" />
                  <col className="booking-col-service" />
                  <col className="booking-col-tech" />
                  <col className="booking-col-time" />
                  <col className="booking-col-status" />
                  <col className="booking-col-action" />
                </colgroup>
                <thead>
                  <tr>
                    <th scope="col">{t(`${TK}.today.colCustomer`)}</th>
                    <th scope="col">{t(`${TK}.today.colService`)}</th>
                    <th scope="col">{t(`${TK}.today.colTech`)}</th>
                    <th scope="col">{t(`${TK}.today.colAppointment`)}</th>
                    <th scope="col">{t(`${TK}.today.colStatus`)}</th>
                    <th scope="col">{t(`${TK}.today.colAction`)}</th>
                  </tr>
                </thead>
                <tbody>
                  {appointmentBookings.map((booking) => {
                    const appointment = formatBookingCardAppointment(
                      booking.timeMain,
                      booking.timeDate,
                      booking.endTimeMain,
                    )
                    return (
                    <tr
                      key={booking.id}
                      className={`booking-table-row ${rowClassForStatus(booking.status)}`}
                    >
                      <td>
                        <div className="booking-customer">
                          <div className="booking-customer-name">
                            {booking.name}{' '}
                            <span className={`badge ${booking.sourceClass}`}>
                              {t(`${TK}.${SOURCE_KEY_MAP[booking.source]}`)}
                            </span>
                            {booking.request ? (
                              <span className="badge badge-warning">{t(`${TK}.booking.request`)}</span>
                            ) : null}
                          </div>
                          <div className="booking-customer-meta">
                            {formatBookingCardContact(booking.phone, booking.email)}
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="booking-service">
                          <div className="booking-service-list">
                            {booking.services.map((service) => (
                              <span className="booking-service-chip" key={service}>{service}</span>
                            ))}
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="booking-tech">
                          <span className="booking-tech-name">{booking.tech}</span>
                        </div>
                      </td>
                      <td>
                        <div className="booking-time-block booking-appointment-block">
                          <div className="booking-time-main">{appointment.main}</div>
                          {appointment.date ? (
                            <div className="booking-time-date">{appointment.date}</div>
                          ) : null}
                        </div>
                      </td>
                      <td className="booking-status-cell">
                        <span className={`badge booking-status ${statusBadgeClass(booking.status)}`}>
                          {statusLabel(booking.status)}
                        </span>
                      </td>
                      <td>
                        <BookingActions
                          booking={booking}
                          onAction={pendingStatusUpdates[booking.id] ? () => undefined : handleAction}
                          isPending={Boolean(pendingStatusUpdates[booking.id])}
                          t={t}
                        />
                      </td>
                    </tr>
                    )
                  })}
                </tbody>
              </table>
              </div>
            </div>
          ) : (
            <div className="booking-card-panel">
              <div className="booking-card-list">
                {appointmentBookings.map((booking) => (
                  <BookingAppointmentCard
                    key={booking.id}
                    booking={booking}
                    statusLabel={statusLabel}
                    pending={Boolean(pendingStatusUpdates[booking.id])}
                    onAction={pendingStatusUpdates[booking.id] ? () => undefined : handleAction}
                    t={t}
                  />
                ))}
              </div>
            </div>
          )}

          {!isListLoading && viewMode !== BookingTodayViewMode.Calendar && (bookingResponse?.totalCount ?? 0) > 0 ? (
            <Pagination
              pageNumber={pageNumber}
              pageSize={pageSize}
              totalPages={bookingResponse?.totalPages ?? 1}
              totalCount={bookingResponse?.totalCount ?? 0}
              hasNextPage={bookingResponse?.hasNextPage}
              hasPreviousPage={bookingResponse?.hasPreviousPage}
              onPageChange={setPage}
              isLoading={isBookingsLoading}
              className={BOOKING_HUB_PAGINATION_CLASSNAME}
            />
          ) : null}

          {!isListLoading && viewMode !== BookingTodayViewMode.Calendar && appointmentBookings.length === 0 ? (
            <div className="booking-list-empty">
              <div className="booking-list-empty-icon" aria-hidden="true">
                <JournalIcon />
              </div>
              <div className="booking-list-empty-title">
                {hasActiveFilters
                  ? t(`${TK}.today.emptyFilteredTitle`)
                  : t(`${TK}.today.emptyTitle`)}
              </div>
              <p className="booking-list-empty-description">
                {hasActiveFilters
                  ? t(`${TK}.today.emptyFilteredDescription`)
                  : t(`${TK}.today.emptyDescription`)}
              </p>
              {hasActiveFilters ? (
                <button className="booking-secondary-button" type="button" onClick={clearFilters}>
                  {t(`${TK}.today.emptyClearFilters`)}
                </button>
              ) : null}
            </div>
          ) : null}

        </article>
      </div>

      <BookingCreateAppointmentModal
        open={isCreateOpen}
        prefill={createPrefill}
        locale={currentLanguage === 'vi' ? 'vi-VN' : 'en-US'}
        onClose={() => {
          setIsCreateOpen(false)
          setCreatePrefill(null)
        }}
        onCreated={handleAppointmentCreated}
      />

      {detailBooking ? (
        <div
          className="booking-detail-modal"
          role="presentation"
          onClick={() => setDetailBooking(null)}
        >
          <div
            className="booking-detail-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="booking-detail-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="booking-detail-head">
              <div>
                <div className="booking-detail-title" id="booking-detail-title">
                  {t(`${TK}.today.detailTitle`)}
                </div>
                <div className="booking-detail-sub">{t(`${TK}.today.detailSub`)}</div>
              </div>
              <button
                className="booking-detail-close"
                type="button"
                aria-label={t(`${TK}.today.closeDetail`)}
                title={t(`${TK}.today.closeDetail`)}
                onClick={() => setDetailBooking(null)}
              >
                <XLgIcon />
              </button>
            </div>
            <div className="booking-detail-body">
              <div className="booking-detail-hero">
                <div className="booking-detail-avatar">{getInitials(detailBooking.name)}</div>
                <div>
                  <div className="booking-detail-name">{detailBooking.name}</div>
                  <div className="booking-detail-hero-sub">
                    <span>{formatBookingCardContact(detailBooking.phone, detailBooking.email)}</span>
                  </div>
                </div>
                <div className={`booking-detail-status-pill booking-status ${statusBadgeClass(detailBooking.status)}`}>
                  {statusLabel(detailBooking.status)}
                </div>
              </div>

              <div className="booking-detail-section">
                <div className="booking-detail-section-title">
                  <StarsIcon />
                  <span>{t(`${TK}.today.detailServices`)}</span>
                </div>
                <div className="booking-detail-service-chips">
                  {detailBooking.services.map((service) => (
                    <span className="booking-service-chip" key={service}>{service}</span>
                  ))}
                </div>
              </div>

              <div className="booking-detail-info-grid">
                <div className="booking-detail-info-item">
                  <span className="booking-detail-info-icon"><ClockIcon /></span>
                  <div>
                    <div className="booking-detail-label">{t(`${TK}.today.colCallStart`)}</div>
                    <div className="booking-detail-value">
                      {formatBookingCardCallStart(
                        detailBooking.callStartMain,
                        detailBooking.callStartDate,
                      )}
                    </div>
                  </div>
                </div>
                <div className="booking-detail-info-item">
                  <span className="booking-detail-info-icon"><PersonWorkspaceIcon /></span>
                  <div>
                    <div className="booking-detail-label">{t(`${TK}.today.colTech`)}</div>
                    <div className="booking-detail-value">{detailBooking.tech}</div>
                  </div>
                </div>
                <div className="booking-detail-info-item">
                  <span className="booking-detail-info-icon"><ClockIcon /></span>
                  <div>
                    <div className="booking-detail-label">{t(`${TK}.today.colAppointment`)}</div>
                    <div className="booking-detail-value">
                      {formatBookingCardAppointmentText(
                        detailBooking.timeMain,
                        detailBooking.timeDate,
                      )}
                    </div>
                  </div>
                </div>
                <div className="booking-detail-info-item">
                  <span className="booking-detail-info-icon"><StopwatchIcon /></span>
                  <div>
                    <div className="booking-detail-label">{t(`${TK}.today.colDuration`)}</div>
                    <div className="booking-detail-value">{detailBooking.durationLabel}</div>
                  </div>
                </div>
                <div className="booking-detail-info-item">
                  <span className="booking-detail-info-icon"><BroadcastIcon /></span>
                  <div>
                    <div className="booking-detail-label">{t(`${TK}.today.detailSource`)}</div>
                    <div className="booking-detail-value booking-source-list">
                      <span className={`badge ${detailBooking.sourceClass}`}>
                        {t(`${TK}.${SOURCE_KEY_MAP[detailBooking.source]}`)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="booking-detail-note-card">
                <div className="booking-detail-section-title">
                  <JournalIcon />
                  <span>{t(`${TK}.today.detailNote`)}</span>
                </div>
                <div className="booking-detail-note">{detailBooking.note}</div>
              </div>
            </div>
            <div className="booking-detail-actions">
              <button className="booking-secondary-button" type="button" onClick={() => setDetailBooking(null)}>
                {t(`${TK}.today.closeDetail`)}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
