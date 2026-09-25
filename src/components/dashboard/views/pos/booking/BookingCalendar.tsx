// POS Front Desk's booking calendar deliberately reuses AI Hub's resource calendar so the
// receptionist sees the same time grid and technician columns as the booking team.
import { useMemo, useState, type ReactNode } from 'react'
import { ArrowRight, ArrowUpRight, Check, MoreHorizontal, X } from 'lucide-react'
import { useTranslation } from '../../../../../contexts/LanguageContext'
import { useBusinessHours } from '../../../../../data/hooks/useMerchantSetup'
import type { BookingListItemApiDto, TimeClockRosterRowApiDto } from '../../../../../types/repositories'
import BookingTeamCalendar from '../../BookingTeamCalendar'
import { formatTurnCredit } from '../TurnGridView'
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
  summarizeBookingCalendarStatuses,
  type BookingCalendarOverviewDay,
  type BookingCalendarRange,
} from './bookingCalendarView'
import BookingOverviewCalendar from './BookingOverviewCalendar'
import AnyoneAppointmentsQueue from './AnyoneAppointmentsQueue'
import { resolveBookingCalendarBusinessWindow } from './bookingBusinessHours'
import { formatPosClockTime } from '../posDateTime'
import type { BusinessHourEntry } from '../../../../../types/domain'

function staffInitials(displayName: string): string {
  return displayName
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

const DAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const

function businessHourEntryForDate(
  hours: ReadonlyArray<BusinessHourEntry> | undefined,
  dateIso: string,
): BusinessHourEntry | undefined {
  if (!hours?.length || !dateIso) return undefined
  const [year, month, day] = dateIso.split('-').map(Number)
  const local = new Date(year, (month || 1) - 1, day || 1)
  const dayName = DAY_NAMES[local.getDay()]
  return hours.find((row) => row.dayOfWeek === dayName)
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
    + `<span class="pos-booking-staff-name">${displayName} · ${formatTurnCredit(row.weightedTurnsToday)}T</span>`
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

function weekdayLabel(dateIso: string, locale: string): string {
  const [year, month, day] = dateIso.split('-').map(Number)
  return new Intl.DateTimeFormat(locale.toLowerCase().startsWith('vi') ? 'vi-VN' : 'en-US', {
    weekday: 'long',
  }).format(new Date(year, month - 1, day, 12))
}

export default function BookingCalendar({
  businessId,
  bookings,
  mode,
  anchorDate,
  range,
  overviewDays,
  comparePeriodTotal,
  compareReady,
  loading,
  error,
  onRetry,
  onModeChange,
  onAnchorDateChange,
  rosterRows,
  onNewBooking,
  onViewDetail,
}: {
  businessId: string
  bookings: BookingListItemApiDto[]
  mode: PosBookingCalendarViewMode
  anchorDate: string
  range: BookingCalendarRange
  overviewDays: BookingCalendarOverviewDay[]
  comparePeriodTotal: number
  /** False while the prior-period query is loading or failed — hides misleading trend copy. */
  compareReady: boolean
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
  const { data: businessHours } = useBusinessHours()

  const businessWindow = useMemo(
    () => resolveBookingCalendarBusinessWindow(businessHours, anchorDate),
    [businessHours, anchorDate],
  )

  const calendarHoursSubtitle = useMemo(() => {
    if (!businessWindow.isOpen) {
      return t(p + 'calendarClosedDay')
    }
    const entry = businessHourEntryForDate(businessHours, anchorDate)
    if (entry?.openTime && entry?.closeTime) {
      const open = formatPosClockTime(entry.openTime.slice(0, 5), currentLanguage)
      const close = formatPosClockTime(entry.closeTime.slice(0, 5), currentLanguage)
      return t(p + 'calendarSubtitleHours', { hours: `${open} – ${close}` })
    }
    return t(p + 'calendarSubtitle')
  }, [anchorDate, businessHours, businessWindow.isOpen, currentLanguage, p, t])

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
      const label = `${displayName} · ${formatTurnCredit(row.weightedTurnsToday)}T`
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
      bookings.flatMap((booking) => {
        const baseSource = {
          bookingId: booking.bookingId,
          name: booking.customerName,
          date: bookingDateKey(booking.scheduledAt, booking.source),
          statusLabel: t(p + statusLabelKey(booking.status)),
          statusGroup: getBookingCalendarStatusGroup(booking.status),
          startAtUtc: booking.scheduledAt,
          startAtWallClock: bookingCalendarWallClock(booking.scheduledAt, booking.source),
          // Prefer summed service durations from the list API; fall back to 60 min only when missing.
          durationMinutes: booking.totalDurationMinutes && booking.totalDurationMinutes > 0
            ? booking.totalDurationMinutes
            : null,
          endAtUtc: null,
        }
        const lines = booking.serviceLines ?? []
        if (lines.length === 0) {
          return [{
            ...baseSource,
            id: booking.bookingId,
            tech: booking.technicianNames[0] ?? '',
            services: booking.serviceNames,
          }]
        }

        const servicesByTech = new Map<string, string[]>()
        for (const line of lines) {
          const tech = line.technicianName?.trim() ?? ''
          const services = servicesByTech.get(tech) ?? []
          if (line.serviceName) services.push(line.serviceName)
          servicesByTech.set(tech, services)
        }
        return Array.from(servicesByTech, ([tech, services]) => ({
          ...baseSource,
          id: `${booking.bookingId}:${tech || BOOKING_CALENDAR_UNASSIGNED_TECH}`,
          tech,
          services,
        }))
      }),
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
  const statusSummary = useMemo(() => summarizeBookingCalendarStatuses(bookings), [bookings])
  const compareTrend = useMemo(() => {
    if (!compareReady) return null

    const current = statusSummary.total
    const previous = comparePeriodTotal
    if (previous === 0 && current === 0) return null

    const reference = mode === PosBookingCalendarViewMode.Day
      ? t(p + 'metricCompareLastWeekday', { weekday: weekdayLabel(anchorDate, currentLanguage) })
      : mode === PosBookingCalendarViewMode.Week
        ? t(p + 'metricCompareLastWeek')
        : mode === PosBookingCalendarViewMode.Month
          ? t(p + 'metricCompareLastMonth')
          : t(p + 'metricComparePreviousPeriod')

    if (previous === 0) {
      return current > 0
        ? { tone: 'up' as const, text: t(p + 'metricCompareNew', { reference }) }
        : null
    }
    if (current === previous) {
      return { tone: 'same' as const, text: t(p + 'metricCompareSame', { reference }) }
    }
    const percent = Math.round((Math.abs(current - previous) / previous) * 100)
    const busier = current > previous
    return {
      tone: busier ? 'up' as const : 'down' as const,
      text: t(p + (busier ? 'metricCompareBusier' : 'metricCompareQuieter'), { percent, reference }),
    }
  }, [anchorDate, comparePeriodTotal, compareReady, currentLanguage, mode, p, statusSummary.total, t])

  const summaryTiles: ReadonlyArray<{
    key: string
    label: string
    value: number
    trend: { tone: 'up' | 'down' | 'same'; text: string } | null
    highlighted?: boolean
    icon: ReactNode
    iconWrapClass: string
  }> = [
    {
      key: 'total',
      // Neutral label — toolbar already shows the selected period; "today/this week" is wrong when navigating history.
      label: t(p + 'metricTotal'),
      value: statusSummary.total,
      trend: compareTrend,
      highlighted: true,
      icon: <ArrowUpRight className="h-4 w-4" strokeWidth={2.5} aria-hidden />,
      iconWrapClass: 'bg-sky-100 text-sky-600',
    },
    {
      key: 'completed',
      label: t(p + 'metricCompleted'),
      value: statusSummary.completed,
      trend: null,
      icon: <Check className="h-4 w-4" strokeWidth={2.5} aria-hidden />,
      iconWrapClass: 'bg-emerald-100 text-emerald-600',
    },
    {
      key: 'upcoming',
      label: t(p + 'metricUpcoming'),
      value: statusSummary.upcoming,
      trend: null,
      icon: <ArrowRight className="h-4 w-4" strokeWidth={2.5} aria-hidden />,
      iconWrapClass: 'bg-sky-100 text-sky-600',
    },
    {
      key: 'pending',
      label: t(p + 'metricPending'),
      value: statusSummary.pending,
      trend: null,
      icon: <MoreHorizontal className="h-4 w-4" strokeWidth={2.5} aria-hidden />,
      iconWrapClass: 'bg-amber-100 text-amber-600',
    },
    {
      key: 'cancelled',
      label: t(p + 'metricCancelled'),
      value: statusSummary.cancelled,
      trend: null,
      icon: <X className="h-4 w-4" strokeWidth={2.5} aria-hidden />,
      iconWrapClass: 'bg-rose-100 text-rose-600',
    },
  ]

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
      <div
        className="mb-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5"
        role="region"
        aria-label={t(p + 'metricSummaryLabel')}
      >
        {summaryTiles.map((tile) => (
          <div
            key={tile.key}
            className={`relative rounded-2xl border bg-white px-4 py-3.5 shadow-sm ${
              tile.highlighted
                ? 'border-sky-400 ring-1 ring-sky-400/30'
                : 'border-slate-200/80'
            }`}
          >
            <span
              className={`absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full ${tile.iconWrapClass}`}
            >
              {tile.icon}
            </span>
            <p className="pr-10 text-3xl font-bold tabular-nums leading-none tracking-tight text-slate-900">
              {tile.value}
            </p>
            <p className="mt-2 text-sm font-medium text-slate-500">{tile.label}</p>
            {tile.trend ? (
              <p
                className={`mt-1.5 text-xs font-semibold leading-snug ${
                  tile.trend.tone === 'up'
                    ? 'text-emerald-600'
                    : tile.trend.tone === 'down'
                      ? 'text-rose-500'
                      : 'text-slate-400'
                }`}
              >
                {tile.trend.text}
              </p>
            ) : null}
          </div>
        ))}
      </div>
      <AnyoneAppointmentsQueue businessId={businessId} dateFrom={range.dateFrom} dateTo={range.dateTo} />
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
            [BookingCalendarStatusGroup.Cancelled, 'calendarLegendCancelled'],
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
            {businessWindow.isOpen ? (
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
                subtitle={calendarHoursSubtitle}
                todayLabel={t(p + 'calendarToday')}
                prevAriaLabel={t(p + 'calendarPrevDay')}
                nextAriaLabel={t(p + 'calendarNextDay')}
                unassignedLabel={t(p + 'unassigned')}
                hideBuiltInHeader
                showHalfHourLabels
                businessBeginsHour={businessWindow.beginsHour}
                businessEndsHour={businessWindow.endsHour}
                scrollToHour={businessWindow.scrollToHour}
              />
            ) : (
              <div className="pos-booking-overview-state" role="status">
                <span>{t(p + 'calendarClosedDay')}</span>
              </div>
            )}
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
