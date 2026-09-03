// POS Front Desk's booking calendar deliberately reuses AI Hub's resource calendar so the
// receptionist sees the same time grid and technician columns as the booking team.
import { useMemo, useState } from 'react'
import { useTranslation } from '../../../../../contexts/LanguageContext'
import type { BookingListItemApiDto, TimeClockRosterRowApiDto } from '../../../../../types/repositories'
import BookingTeamCalendar from '../../BookingTeamCalendar'
import type { BookingCalendarSlotSelect } from '../../BookingTeamCalendar'
import {
  escapeBookingCalendarHtml,
  formatBookingCalendarNavLabel,
  type BookingCalendarColumn,
  type BookingCalendarSource,
} from '../../bookingCalendarUtils'
import {
  BOOKING_CALENDAR_UNASSIGNED_TECH,
  BookingCalendarStatusGroup,
  POS_BOOKING_CALENDAR_STATUS_COLORS,
} from '../../bookingTodayConstants'
import '../../booking-hub.css'
import { formatLocalDateIso } from '../../../../../utils/localDate'
import { bookingCalendarWallClock, bookingDateKey, statusLabelKey } from './bookingFormatters'
import {
  getBookingCalendarStatusGroup,
  PosBookingCalendarStaffScope,
  PosBookingCalendarViewMode,
  shiftBookingCalendarAnchor,
  type BookingCalendarOverviewDay,
  type BookingCalendarRange,
} from './bookingCalendarView'
import BookingOverviewCalendar from './BookingOverviewCalendar'

function staffInitials(displayName: string): string {
  return displayName
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

function staffColumnHtml(row: TimeClockRosterRowApiDto, workingTodayLabel: string): string {
  const displayName = escapeBookingCalendarHtml(row.displayName.trim())
  const avatar = row.photoUrl
    ? `<img class="pos-booking-staff-avatar" src="${escapeBookingCalendarHtml(row.photoUrl)}" alt="" />`
    : `<span class="pos-booking-staff-initials">${escapeBookingCalendarHtml(staffInitials(row.displayName))}</span>`
  const working = row.isClockedIn
    ? (
      `<span class="pos-booking-staff-working">`
      + `<span class="pos-booking-staff-working-dot"></span>`
      + `${escapeBookingCalendarHtml(workingTodayLabel)}`
      + `</span>`
    )
    : ''

  return (
    `<div class="pos-booking-staff-header">`
    + avatar
    + `<span class="pos-booking-staff-copy">`
    + `<span class="pos-booking-staff-name">${displayName} · ${Math.max(0, row.turnsToday ?? 0)}</span>`
    + working
    + `</span>`
    + `</div>`
  )
}

function calendarRangeLabel(
  mode: PosBookingCalendarViewMode,
  anchorDate: string,
  range: BookingCalendarRange,
  locale: string,
): string {
  if (mode === PosBookingCalendarViewMode.Day) {
    return formatBookingCalendarNavLabel(anchorDate, locale)
  }
  if (mode === PosBookingCalendarViewMode.Month) {
    const [year, month] = anchorDate.split('-').map(Number)
    return new Intl.DateTimeFormat(locale.toLowerCase().startsWith('vi') ? 'vi-VN' : 'en-US', {
      month: 'long',
      year: 'numeric',
    }).format(new Date(year, month - 1, 1, 12))
  }
  return `${formatBookingCalendarNavLabel(range.dateFrom, locale)} – ${formatBookingCalendarNavLabel(range.dateTo, locale)}`
}

export default function BookingCalendar({
  bookings,
  mode,
  anchorDate,
  range,
  overviewDays,
  loading,
  error,
  onRetry,
  onModeChange,
  onAnchorDateChange,
  rosterRows,
  onNewBooking,
  onViewDetail,
}: {
  bookings: BookingListItemApiDto[]
  mode: PosBookingCalendarViewMode
  anchorDate: string
  range: BookingCalendarRange
  overviewDays: BookingCalendarOverviewDay[]
  loading: boolean
  error: boolean
  onRetry: () => void
  onModeChange: (mode: PosBookingCalendarViewMode) => void
  onAnchorDateChange: (nextDate: string) => void
  rosterRows: TimeClockRosterRowApiDto[]
  onNewBooking: (slot?: BookingCalendarSlotSelect) => void
  onViewDetail: (bookingId: string) => void
}) {
  const { t, currentLanguage } = useTranslation()
  const p = 'components.dashboard.views.pos.BookingTab.'
  const [staffScope, setStaffScope] = useState(PosBookingCalendarStaffScope.WorkingToday)

  const visibleRosterRows = useMemo(
    () => staffScope === PosBookingCalendarStaffScope.WorkingToday
      ? rosterRows.filter((row) => row.isClockedIn)
      : rosterRows,
    [rosterRows, staffScope],
  )

  const columns = useMemo<BookingCalendarColumn[]>(() => {
    const seen = new Set<string>()
    const staffColumns = visibleRosterRows.flatMap((row) => {
      const displayName = row.displayName.trim()
      if (!displayName || seen.has(displayName)) return []
      seen.add(displayName)
      const label = `${displayName} · ${Math.max(0, row.turnsToday ?? 0)}`
      return [{
        id: displayName,
        name: label,
        toolTip: row.isClockedIn ? `${label} · ${t(p + 'calendarWorkingToday')}` : label,
        html: staffColumnHtml(row, t(p + 'calendarWorkingToday')),
      }]
    })
    return [
      ...staffColumns,
      {
        id: BOOKING_CALENDAR_UNASSIGNED_TECH,
        name: t(p + 'unassigned'),
        toolTip: t(p + 'unassigned'),
      },
    ]
  }, [p, t, visibleRosterRows])

  const staffIdsByName = useMemo(
    () => Object.fromEntries(
      visibleRosterRows.map((row) => [
        row.displayName.trim().toLocaleLowerCase(),
        row.posStaffProfileId,
      ]),
    ),
    [visibleRosterRows],
  )

  const calendarBookings = useMemo<BookingCalendarSource[]>(
    () =>
      bookings.map((booking) => ({
        id: booking.bookingId,
        name: booking.customerName,
        // A booking can carry several service-line technicians. The calendar represents the
        // appointment in its primary technician column; the event itself still lists all services.
        tech: booking.technicianNames[0] ?? '',
        date: bookingDateKey(booking.scheduledAt, booking.source),
        services: booking.serviceNames,
        statusLabel: t(p + statusLabelKey(booking.status)),
        statusGroup: getBookingCalendarStatusGroup(booking.status),
        startAtUtc: booking.scheduledAt,
        startAtWallClock: bookingCalendarWallClock(booking.scheduledAt, booking.source),
        // The list DTO has no end time, so the shared calendar's standard 60-minute fallback
        // applies until the booking endpoint exposes service duration.
        endAtUtc: null,
      })),
    [bookings, p, t],
  )

  const modeOptions = [
    [PosBookingCalendarViewMode.Day, 'calendarModeDay'],
    [PosBookingCalendarViewMode.Week, 'calendarModeWeek'],
    [PosBookingCalendarViewMode.TwoWeeks, 'calendarModeTwoWeeks'],
    [PosBookingCalendarViewMode.ThreeWeeks, 'calendarModeThreeWeeks'],
    [PosBookingCalendarViewMode.Month, 'calendarModeMonth'],
  ] as const

  const rangeLabel = calendarRangeLabel(mode, anchorDate, range, currentLanguage)

  return (
    <div className="booking-hub-view pos-booking-calendar">
      <div className="pos-booking-calendar-toolbar">
        <div className="pos-booking-calendar-navigation">
          <button
            type="button"
            aria-label={t(p + 'calendarPrevious')}
            onClick={() => onAnchorDateChange(shiftBookingCalendarAnchor(anchorDate, mode, -1))}
          >
            ‹
          </button>
          <button
            type="button"
            onClick={() => onAnchorDateChange(formatLocalDateIso(new Date()))}
          >
            {t(p + 'calendarToday')}
          </button>
          <button
            type="button"
            aria-label={t(p + 'calendarNext')}
            onClick={() => onAnchorDateChange(shiftBookingCalendarAnchor(anchorDate, mode, 1))}
          >
            ›
          </button>
          <strong className="pos-booking-calendar-range-label">{rangeLabel}</strong>
        </div>
        <div className="pos-booking-calendar-modes" aria-label={t(p + 'calendarViewModeLabel')}>
          {modeOptions.map(([optionMode, labelKey]) => (
            <button
              key={optionMode}
              type="button"
              aria-pressed={mode === optionMode}
              onClick={() => onModeChange(optionMode)}
            >
              {t(p + labelKey)}
            </button>
          ))}
        </div>
      </div>
      <div className="pos-booking-calendar-controls">
        {mode === PosBookingCalendarViewMode.Day ? (
          <select
            value={staffScope}
            onChange={(event) => setStaffScope(event.target.value as PosBookingCalendarStaffScope)}
            aria-label={t(p + 'calendarStaffScopeLabel')}
            className="pos-booking-calendar-staff-scope"
          >
            <option value={PosBookingCalendarStaffScope.WorkingToday}>
              {t(p + 'calendarWorkingToday')}
            </option>
            <option value={PosBookingCalendarStaffScope.AllTechnicians}>
              {t(p + 'calendarAllTechnicians')}
            </option>
          </select>
        ) : <span />}
        <div className="pos-booking-calendar-legend" aria-label={t(p + 'calendarStatusLegend')}>
          {([
            [BookingCalendarStatusGroup.Completed, 'calendarLegendCompleted'],
            [BookingCalendarStatusGroup.Upcoming, 'calendarLegendUpcoming'],
            [BookingCalendarStatusGroup.Pending, 'calendarLegendPending'],
          ] as const).map(([statusGroup, labelKey]) => (
            <span key={statusGroup} className="pos-booking-calendar-legend-item">
              <span
                className="pos-booking-calendar-legend-dot"
                style={{ backgroundColor: POS_BOOKING_CALENDAR_STATUS_COLORS[statusGroup].border }}
              />
              {t(p + labelKey)}
            </span>
          ))}
        </div>
      </div>
      {mode === PosBookingCalendarViewMode.Day ? (
        error ? (
          <div className="pos-booking-overview-state" role="alert">
            <span>{t(p + 'calendarOverviewLoadError')}</span>
            <button type="button" onClick={onRetry}>{t(p + 'retry')}</button>
          </div>
        ) : (
          <div aria-busy={loading}>
            <BookingTeamCalendar
              bookings={calendarBookings}
              columnsOverride={columns}
              staffIdsByName={staffIdsByName}
              calendarDate={anchorDate}
              onCalendarDateChange={onAnchorDateChange}
              onEventClick={onViewDetail}
              onSlotSelect={onNewBooking}
              todayIso={formatLocalDateIso(new Date())}
              locale={currentLanguage}
              title={t(p + 'calendarTitle')}
              subtitle={t(p + 'calendarSubtitle')}
              todayLabel={t(p + 'calendarToday')}
              prevAriaLabel={t(p + 'calendarPrevDay')}
              nextAriaLabel={t(p + 'calendarNextDay')}
              unassignedLabel={t(p + 'unassigned')}
              hideBuiltInHeader
              showHalfHourLabels
            />
          </div>
        )
      ) : (
        <BookingOverviewCalendar
          mode={mode}
          anchorDate={anchorDate}
          days={overviewDays}
          locale={currentLanguage}
          loading={loading}
          error={error}
          onRetry={onRetry}
          onDayClick={(date) => {
            onAnchorDateChange(date)
            onModeChange(PosBookingCalendarViewMode.Day)
          }}
          onBookingClick={onViewDetail}
        />
      )}
    </div>
  )
}
