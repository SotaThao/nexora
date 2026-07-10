import React, { useEffect, useMemo, useState } from 'react'
import { useTranslation } from '../../../contexts/LanguageContext'
import { useNotification } from '../../../contexts/NotificationContext'
import { getErrorI18nKey } from '../../../data/errorCodes'
import {
  useMerchantVoiceBookings,
  useMerchantVoiceBookingStatistics,
  useSendMerchantVoiceBookingConfirmationSms,
  useUpdateMerchantVoiceBookingStatus,
} from '../../../data/hooks/useMerchantVoiceBookings'
import {
  MerchantVoiceLeadStatus,
  type MerchantVoiceBookingDto,
} from '../../../data/repositories/merchantVoice'
import { getApiErrorCode } from '../../../types/domain'
import {
  BroadcastIcon,
  CalendarKpiIcon,
  CheckKpiIcon,
  CheckLgIcon,
  ClockIcon,
  EyeIcon,
  GridIcon,
  JournalIcon,
  PersonWorkspaceIcon,
  SendIcon,
  SpinnerIcon,
  StarsIcon,
  TableIcon,
  XLgIcon,
  XKpiIcon,
} from './BookingHubIcons'
import {
  BookingKpiSkeleton,
  BookingTodayListSkeleton,
} from './BookingHubSkeletons'

const TK = 'components.dashboard.views.BookingHubView'
const TODAY_ISO = new Date().toISOString().slice(0, 10)

const KPI_ACCENT_ELECTRIC = { '--kpi-accent': 'var(--nexora-electric)' } as React.CSSProperties
const KPI_ACCENT_SUCCESS = { '--kpi-accent': 'var(--nexora-success)' } as React.CSSProperties
const KPI_ACCENT_RED = { '--kpi-accent': '#ef4444' } as React.CSSProperties

const SOURCE_KEY_MAP: Record<string, string> = {
  Voice: 'sources.voice',
  'Landing Page': 'sources.landingPage',
  SMS: 'sources.sms',
  QR: 'sources.qr',
}

type BookingStatus = 'done' | 'sms-sent' | 'new' | 'noshow'
type BookingSource = 'Voice' | 'Landing Page' | 'SMS' | 'QR'
type SearchField = 'all' | 'name' | 'phone' | 'email' | 'service'
type ViewMode = 'table' | 'card'

interface BookingItem {
  id: string
  name: string
  phone: string
  phoneDisplay: string
  email: string
  services: string[]
  tech: string
  date: string
  timeMain: string
  timeDate: string
  source: BookingSource
  sourceClass: string
  request?: boolean
  status: BookingStatus
  confirmationSmsSentAt: string | null
  note: string
}

function mapSource(source: number): BookingSource {
  if (source === 1) return 'Landing Page'
  if (source === 2) return 'SMS'
  if (source === 3) return 'QR'
  return 'Voice'
}

function sourceClass(source: BookingSource) {
  if (source === 'Landing Page') return 'booking-source-lp'
  if (source === 'SMS') return 'booking-source-sms'
  if (source === 'QR') return 'booking-source-qr'
  return 'booking-source-voice'
}

function mapStatus(status: number | string): BookingStatus {
  if (status === 'Done') return 'done'
  if (status === 'Confirmed') return 'sms-sent'
  if (status === 'NoShow') return 'noshow'
  if (status === 'New') return 'new'
  if (status === 1) return 'done'
  if (status === 2) return 'sms-sent'
  if (status === 3) return 'noshow'
  return 'new'
}

function formatPhone(phone: string | null | undefined) {
  const digits = (phone || '').replace(/\D/g, '')
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
  }
  return phone || '—'
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
  if (!service) return ['General Service']
  return service
    .split(/[,/]/)
    .map((item) => formatServiceLabel(item.trim()))
    .filter(Boolean)
}

function formatTimeBlock(startAt: string | null, fallback: string | null) {
  if (!startAt) {
    return {
      timeMain: fallback || 'Pending schedule',
      timeDate: fallback || 'Pending date',
      dateIso: TODAY_ISO,
    }
  }
  const date = new Date(startAt)
  const dateIso = date.toISOString().slice(0, 10)
  const today = new Date().toISOString().slice(0, 10)
  const time = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' }).format(date)
  const dateText = new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).format(date)
  return {
    timeMain: `${dateIso === today ? 'Today' : dateText} ${time}`,
    timeDate: dateText,
    dateIso,
  }
}

function resolveBookingStatus(item: MerchantVoiceBookingDto, statusOverride?: BookingStatus): BookingStatus {
  if (statusOverride) return statusOverride
  const mapped = mapStatus(item.status)
  if (item.confirmationSmsSentAt && mapped === 'new') return 'sms-sent'
  return mapped
}

function toBookingItem(item: MerchantVoiceBookingDto, statusOverride?: BookingStatus): BookingItem {
  const source = mapSource(item.source)
  const time = formatTimeBlock(item.requestedStartAtUtc, item.preferredTime)
  const status = resolveBookingStatus(item, statusOverride)
  return {
    id: item.id,
    name: item.customerName || 'Unknown customer',
    phone: (item.customerPhone || '').replace(/\D/g, ''),
    phoneDisplay: formatPhone(item.customerPhone),
    email: item.assignedStaffEmail || 'N/A',
    services: serviceList(item.service),
    tech: item.assignedStaffName || 'Unassigned',
    date: time.dateIso,
    timeMain: time.timeMain,
    timeDate: time.timeDate,
    source,
    sourceClass: sourceClass(source),
    request: status === 'new',
    status,
    confirmationSmsSentAt: item.confirmationSmsSentAt,
    note: item.notes || 'No internal notes.',
  }
}

function rowClassForStatus(status: BookingStatus) {
  if (status === 'done') return 'is-done'
  if (status === 'sms-sent') return 'is-sms-sent'
  if (status === 'noshow') return 'is-noshow'
  return 'is-new'
}

function statusBadgeClass(status: BookingStatus) {
  if (status === 'done') return 'booking-status-done'
  if (status === 'sms-sent') return 'booking-status-sms'
  if (status === 'noshow') return 'booking-status-noshow'
  return 'booking-status-new'
}

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
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
  const viewBtn = (
    <button
      className="booking-mini-button icon-only"
      type="button"
      aria-label={t(`${TK}.today.view`)}
      title={t(`${TK}.today.view`)}
      disabled={isPending}
      onClick={() => onAction(booking.id, 'detail')}
    >
      {isPending ? <SpinnerIcon className="booking-inline-spinner" /> : <EyeIcon />}
      <span className="sr-only">{t(`${TK}.today.view`)}</span>
    </button>
  )

  if (booking.status === 'done' || booking.status === 'noshow') {
    return <div className="booking-actions">{viewBtn}</div>
  }

  const canSendSms = booking.confirmationSmsSentAt == null && booking.status === 'new'

  if (!canSendSms) {
    return (
      <div className="booking-actions">
        <button
          className="booking-mini-button icon-only primary booking-done-action"
          type="button"
          aria-label={t(`${TK}.today.done`)}
          title={t(`${TK}.today.done`)}
          disabled={isPending}
          onClick={() => onAction(booking.id, 'done')}
        >
          {isPending ? <SpinnerIcon className="booking-inline-spinner" /> : <CheckLgIcon />}
          <span className="sr-only">{t(`${TK}.today.done`)}</span>
        </button>
        <button
          className="booking-mini-button icon-only booking-noshow-action"
          type="button"
          aria-label={t(`${TK}.today.noShow`)}
          title={t(`${TK}.today.noShow`)}
          disabled={isPending}
          onClick={() => onAction(booking.id, 'noshow')}
        >
          {isPending ? <SpinnerIcon className="booking-inline-spinner" /> : <XLgIcon />}
          <span className="sr-only">{t(`${TK}.today.noShow`)}</span>
        </button>
        {viewBtn}
      </div>
    )
  }

  return (
    <div className="booking-actions">
      <button
        className="booking-mini-button icon-only primary booking-sms-action"
        type="button"
        aria-label={t(`${TK}.today.sendSms`)}
        title={t(`${TK}.today.sendSms`)}
        disabled={isPending}
        onClick={() => onAction(booking.id, 'send-sms')}
      >
        {isPending ? <SpinnerIcon className="booking-inline-spinner" /> : <SendIcon />}
        <span className="sr-only">{t(`${TK}.today.sendSms`)}</span>
      </button>
      <button
        className="booking-mini-button icon-only booking-noshow-action"
        type="button"
        aria-label={t(`${TK}.today.noShow`)}
        title={t(`${TK}.today.noShow`)}
        disabled={isPending}
        onClick={() => onAction(booking.id, 'noshow')}
      >
        {isPending ? <SpinnerIcon className="booking-inline-spinner" /> : <XLgIcon />}
        <span className="sr-only">{t(`${TK}.today.noShow`)}</span>
      </button>
      {viewBtn}
    </div>
  )
}

export default function BookingTodayPanel() {
  const { t } = useTranslation()
  const { showToast } = useNotification()
  const [viewMode, setViewMode] = useState<ViewMode>(() => (
    typeof window !== 'undefined' && window.innerWidth < 768 ? 'card' : 'table'
  ))
  const [searchField, setSearchField] = useState<SearchField>('all')
  const [searchKeyword, setSearchKeyword] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [debouncedFilters, setDebouncedFilters] = useState({
    searchField: 'all' as SearchField,
    searchKeyword: '',
    dateFrom: '',
    dateTo: '',
  })
  const [statusOverrides, setStatusOverrides] = useState<Record<string, BookingStatus>>({})
  const [pendingStatusUpdates, setPendingStatusUpdates] = useState<Record<string, boolean>>({})
  const [detailBooking, setDetailBooking] = useState<BookingItem | null>(null)

  const apiSearchField = debouncedFilters.searchField === 'all'
    ? undefined
    : debouncedFilters.searchField === 'name'
      ? 0
      : debouncedFilters.searchField === 'phone'
        ? 1
        : debouncedFilters.searchField === 'email'
          ? 2
          : 3

  const apiKeyword = debouncedFilters.searchKeyword.trim() || undefined

  const dateFromApi = debouncedFilters.dateFrom ? `${debouncedFilters.dateFrom}T00:00:00.000Z` : undefined
  const dateToApi = debouncedFilters.dateTo ? `${debouncedFilters.dateTo}T23:59:59.999Z` : undefined

  const hasActiveFilters = useMemo(() => (
    debouncedFilters.searchField !== 'all'
    || Boolean(debouncedFilters.searchKeyword.trim())
    || Boolean(debouncedFilters.dateFrom)
    || Boolean(debouncedFilters.dateTo)
  ), [debouncedFilters])

  const keywordPlaceholder = searchField === 'name'
    ? t(`${TK}.today.keywordPlaceholderName`)
    : searchField === 'phone'
      ? t(`${TK}.today.keywordPlaceholderPhone`)
      : searchField === 'email'
        ? t(`${TK}.today.keywordPlaceholderEmail`)
        : searchField === 'service'
          ? t(`${TK}.today.keywordPlaceholderService`)
          : t(`${TK}.today.keywordPlaceholderAll`)

  const { data: statistics, isLoading: isStatisticsLoading } = useMerchantVoiceBookingStatistics()
  const { data: bookingResponse, isLoading: isBookingsLoading, isFetching: isBookingsFetching } = useMerchantVoiceBookings({
    pageNumber: 1,
    pageSize: 200,
    searchBy: apiSearchField,
    keyword: apiKeyword,
    dateFrom: dateFromApi,
    dateTo: dateToApi,
  })
  const updateBookingStatusMutation = useUpdateMerchantVoiceBookingStatus()
  const sendConfirmationSmsMutation = useSendMerchantVoiceBookingConfirmationSms()

  const isListLoading = isBookingsLoading || isBookingsFetching

  const filteredBookings = useMemo(() => (
    (bookingResponse?.items ?? []).map((item) => toBookingItem(item, statusOverrides[item.id]))
  ), [bookingResponse?.items, statusOverrides])

  const stats = useMemo(() => {
    const todayCount = statistics?.allBookings ?? filteredBookings.filter((item) => item.date === TODAY_ISO).length
    const done = statistics?.doneBookings ?? filteredBookings.filter((item) => item.status === 'done').length
    const noShow = statistics?.noShowBookings ?? filteredBookings.filter((item) => item.status === 'noshow').length
    return { todayCount, done, noShow }
  }, [filteredBookings, statistics])

  const handleAction = async (id: string, action: 'send-sms' | 'done' | 'noshow' | 'detail') => {
    const booking = filteredBookings.find((item) => item.id === id)
    if (!booking) return

    if (action === 'detail') {
      setDetailBooking(booking)
      return
    }

    const previousStatus = statusOverrides[id] ?? booking.status

    const getNextStatus = (currentStatus: BookingStatus): BookingStatus | null => {
      if (action === 'send-sms' && booking.confirmationSmsSentAt == null && currentStatus === 'new') return 'sms-sent'
      if (action === 'done' && currentStatus === 'sms-sent') return 'done'
      if (action === 'noshow' && (currentStatus === 'new' || currentStatus === 'sms-sent')) return 'noshow'
      return null
    }

    const nextStatus = getNextStatus(previousStatus)
    if (!nextStatus) return

    setStatusOverrides((prev) => {
      const currentStatus = prev[id] ?? filteredBookings.find((item) => item.id === id)?.status
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
        if (errorCode === 'VOICE_LEAD_CONFIRMATION_SMS_ALREADY_SENT') {
          setStatusOverrides((prev) => ({ ...prev, [id]: 'sms-sent' }))
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
        if (action === 'send-sms') return { ...prev, status: 'sms-sent' }
        if (action === 'done') return { ...prev, status: 'done' }
        if (action === 'noshow') return { ...prev, status: 'noshow' }
        return prev
      })
    }
  }

  const clearFilters = () => {
    setSearchField('all')
    setSearchKeyword('')
    setDateFrom('')
    setDateTo('')
  }

  const handleSearchFieldChange = (nextField: SearchField) => {
    setSearchField(nextField)
  }

  const statusLabel = (status: BookingStatus) => {
    if (status === 'done') return t(`${TK}.today.statusDone`)
    if (status === 'sms-sent') return t(`${TK}.today.statusSms`)
    if (status === 'noshow') return t(`${TK}.today.statusNoShow`)
    return t(`${TK}.today.statusNew`)
  }

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
      setDebouncedFilters({
        searchField,
        searchKeyword,
        dateFrom,
        dateTo,
      })
    }, 350)

    return () => window.clearTimeout(timer)
  }, [searchField, searchKeyword, dateFrom, dateTo])

  useEffect(() => {
    if (typeof window === 'undefined') return undefined

    const syncViewModeByViewport = () => {
      if (window.innerWidth < 768) {
        setViewMode('card')
      }
    }

    syncViewModeByViewport()
    window.addEventListener('resize', syncViewModeByViewport)
    return () => window.removeEventListener('resize', syncViewModeByViewport)
  }, [])

  return (
    <div className="booking-sub-panel is-active" aria-busy={isStatisticsLoading || isListLoading}>
      {isStatisticsLoading ? (
        <BookingKpiSkeleton />
      ) : (
      <div className="overview-kpis">
        <article className="overview-card kpi-card" style={KPI_ACCENT_ELECTRIC}>
          <div className="kpi-top">
            <div className="kpi-icon"><CalendarKpiIcon /></div>
            <span className="badge booking-status booking-status-new">{t(`${TK}.today.badgeNew`)}</span>
          </div>
          <div className="kpi-label">{t(`${TK}.kpi.todayBookings`)}</div>
          <div className="kpi-value">{stats.todayCount}</div>
          <div className="kpi-trend">{t(`${TK}.today.kpiTodayTrend`)}</div>
        </article>

        <article className="overview-card kpi-card" style={KPI_ACCENT_SUCCESS}>
          <div className="kpi-top">
            <div className="kpi-icon"><CheckKpiIcon /></div>
            <span className="badge booking-status booking-status-done">{t(`${TK}.today.badgeSmsActive`)}</span>
          </div>
          <div className="kpi-label">{t(`${TK}.kpi.completed`)}</div>
          <div className="kpi-value">{stats.done}</div>
          <div className="kpi-trend">{t(`${TK}.today.kpiDoneTrend`)}</div>
        </article>

        <article className="overview-card kpi-card" style={KPI_ACCENT_RED}>
          <div className="kpi-top">
            <div className="kpi-icon"><XKpiIcon /></div>
            <span className="badge booking-status booking-status-noshow">{t(`${TK}.today.badgeNoShow`)}</span>
          </div>
          <div className="kpi-label">{t(`${TK}.today.kpiNoReview`)}</div>
          <div className="kpi-value">{stats.noShow}</div>
          <div className="kpi-trend">{t(`${TK}.today.kpiNoShowTrend`)}</div>
        </article>
      </div>
      )}

      <div className="booking-grid">
        <article className="overview-card overview-card-pad">
          <div className="booking-daybar">
            <div className="booking-date">
              <span className="booking-action-icon"><CalendarIcon /></span>
              <span>{t(`${TK}.today.overviewTitle`)}</span>
            </div>
            <div className="booking-view-switch" role="group" aria-label={t(`${TK}.today.viewMode`)}>
              <button
                className={`booking-view-button ${viewMode === 'table' ? 'is-active' : ''}`}
                type="button"
                aria-pressed={viewMode === 'table'}
                onClick={() => setViewMode('table')}
              >
                <TableIcon />
                <span>{t(`${TK}.today.tableView`)}</span>
              </button>
              <button
                className={`booking-view-button ${viewMode === 'card' ? 'is-active' : ''}`}
                type="button"
                aria-pressed={viewMode === 'card'}
                onClick={() => setViewMode('card')}
              >
                <GridIcon />
                <span>{t(`${TK}.today.cardView`)}</span>
              </button>
            </div>
          </div>

          <div className="booking-controls" aria-label={t(`${TK}.today.filters`)}>
            <label className="booking-control-field">
              <span className="booking-control-label">{t(`${TK}.today.searchBy`)}</span>
              <select
                className="booking-select"
                value={searchField}
                onChange={(event) => handleSearchFieldChange(event.target.value as SearchField)}
              >
                <option value="all">{t(`${TK}.today.searchAll`)}</option>
                <option value="name">{t(`${TK}.today.searchName`)}</option>
                <option value="phone">{t(`${TK}.today.searchPhone`)}</option>
                <option value="email">{t(`${TK}.today.searchEmail`)}</option>
                <option value="service">{t(`${TK}.today.searchService`)}</option>
              </select>
            </label>
            <label className="booking-control-field">
              <span className="booking-control-label">{t(`${TK}.today.keyword`)}</span>
              <input
                className="booking-input"
                type="search"
                placeholder={keywordPlaceholder}
                value={searchKeyword}
                onChange={(event) => setSearchKeyword(event.target.value)}
              />
            </label>
            <label className="booking-control-field">
              <span className="booking-control-label">{t(`${TK}.today.dateFrom`)}</span>
              <input
                className="booking-input"
                type="date"
                value={dateFrom}
                onChange={(event) => setDateFrom(event.target.value)}
              />
            </label>
            <label className="booking-control-field">
              <span className="booking-control-label">{t(`${TK}.today.dateTo`)}</span>
              <input
                className="booking-input"
                type="date"
                value={dateTo}
                onChange={(event) => setDateTo(event.target.value)}
              />
            </label>
            <button className="booking-mini-button booking-clear-button" type="button" onClick={clearFilters}>
              {t(`${TK}.today.clear`)}
            </button>
          </div>

          {isListLoading ? (
            <BookingTodayListSkeleton viewMode={viewMode} />
          ) : viewMode === 'table' ? (
            <div className="booking-table-wrap">
              <table className="booking-table">
                <thead>
                  <tr>
                    <th scope="col">{t(`${TK}.today.colCustomer`)}</th>
                    <th scope="col">{t(`${TK}.today.colService`)}</th>
                    <th scope="col">{t(`${TK}.today.colTech`)}</th>
                    <th scope="col">{t(`${TK}.today.colTime`)}</th>
                    <th scope="col">{t(`${TK}.today.colStatus`)}</th>
                    <th scope="col">{t(`${TK}.today.colAction`)}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBookings.map((booking) => (
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
                            {booking.phoneDisplay} · {booking.email}
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
                        <div className="booking-time-block">
                          <div className="booking-time-main">{booking.timeMain}</div>
                          <div className="booking-time-date">{booking.timeDate}</div>
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
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="booking-card-panel">
              <div className="booking-card-list">
                {filteredBookings.map((booking) => (
                  <article className="booking-appointment-card" key={booking.id}>
                    <div className="booking-card-top">
                      <div>
                        <div className="booking-card-name">
                          {booking.name}{' '}
                          <span className={`badge ${booking.sourceClass}`}>
                            {t(`${TK}.${SOURCE_KEY_MAP[booking.source]}`)}
                          </span>
                          {booking.request ? (
                            <span className="badge badge-warning">{t(`${TK}.booking.request`)}</span>
                          ) : null}
                        </div>
                        <div className="booking-card-contact">
                          {booking.phoneDisplay} · {booking.email}
                        </div>
                      </div>
                      <span className={`badge booking-status ${statusBadgeClass(booking.status)}`}>
                        {statusLabel(booking.status)}
                      </span>
                    </div>
                    <div className="booking-card-info-list">
                      <div className="booking-card-info-row">
                        <span className="booking-card-label">{t(`${TK}.today.colService`)}</span>
                        <span className="booking-card-value">
                          <span className="booking-service-list">
                            {booking.services.map((service) => (
                              <span className="booking-service-chip" key={service}>{service}</span>
                            ))}
                          </span>
                        </span>
                      </div>
                      <div className="booking-card-info-row">
                        <span className="booking-card-label">{t(`${TK}.today.colTech`)}</span>
                        <span className="booking-card-value">{booking.tech}</span>
                      </div>
                      <div className="booking-card-info-row">
                        <span className="booking-card-label">{t(`${TK}.today.colTime`)}</span>
                        <span className="booking-card-value">{booking.timeMain} · {booking.timeDate}</span>
                      </div>
                    </div>
                    <div className="booking-card-actions">
                      <BookingActions
                        booking={booking}
                        onAction={pendingStatusUpdates[booking.id] ? () => undefined : handleAction}
                        isPending={Boolean(pendingStatusUpdates[booking.id])}
                        t={t}
                      />
                    </div>
                  </article>
                ))}
              </div>
            </div>
          )}

          {!isListLoading && filteredBookings.length === 0 ? (
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
                    <span>{detailBooking.phoneDisplay}</span>
                    <span>{detailBooking.email}</span>
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
                  <span className="booking-detail-info-icon"><PersonWorkspaceIcon /></span>
                  <div>
                    <div className="booking-detail-label">{t(`${TK}.today.colTech`)}</div>
                    <div className="booking-detail-value">{detailBooking.tech}</div>
                  </div>
                </div>
                <div className="booking-detail-info-item">
                  <span className="booking-detail-info-icon"><ClockIcon /></span>
                  <div>
                    <div className="booking-detail-label">{t(`${TK}.today.colTime`)}</div>
                    <div className="booking-detail-value">
                      {detailBooking.timeMain} · {detailBooking.timeDate}
                    </div>
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
