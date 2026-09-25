import React, { useCallback, useEffect, useMemo, useRef } from 'react'
import { DayPilotCalendar } from '@daypilot/daypilot-lite-react'
import type { DayPilot } from '@daypilot/daypilot-lite-react'
import {
  BOOKING_CALENDAR_DAYPILOT_OPTIONS,
  BOOKING_CALENDAR_BUSINESS_BEGINS_HOUR,
  BOOKING_CALENDAR_BUSINESS_ENDS_HOUR,
  BOOKING_CALENDAR_CELL_DURATION_MINUTES,
  BOOKING_CALENDAR_CELL_HEIGHT_PX,
  BOOKING_CALENDAR_DEFAULT_SCROLL_HOUR,
  BOOKING_CALENDAR_HEADER_HEIGHT_PX,
  BOOKING_CALENDAR_UNASSIGNED_TECH,
} from './bookingTodayConstants'
import {
  BOOKING_CREATE_CELL_ADD_HTML,
  BOOKING_CREATE_CELL_PAST_CLASS,
  isClientLocalSlotPast,
} from './bookingCreateConstants'
import {
  buildBookingCalendarColumns,
  buildBookingCalendarEvents,
  formatBookingCalendarNavLabel,
  shiftLocalDateIso,
  type BookingCalendarColumn,
  type BookingCalendarSource,
} from './bookingCalendarUtils'
import { pad2 } from './bookingHubFormatters'
import { ChevronLeftIcon, ChevronRightIcon, PlusIcon } from './BookingHubIcons'

export type BookingCalendarSlotSelect = {
  date: string
  time: string
  staffName: string | null
  posStaffProfileId: string | null
}

type BookingTeamCalendarProps = {
  bookings: ReadonlyArray<BookingCalendarSource>
  /** Active staff display names — locks column order so save/refetch does not reshuffle. */
  staffNames?: ReadonlyArray<string>
  /** POS profile ids keyed by normalized display name when the POS roster exposes them. */
  staffIdsByName?: Readonly<Record<string, string>>
  calendarDate: string
  onCalendarDateChange: (dateIso: string) => void
  onEventClick: (bookingId: string) => void
  onSlotSelect?: (slot: BookingCalendarSlotSelect) => void
  onAddClick?: () => void
  addLabel?: string
  todayIso: string
  locale: string
  title: string
  subtitle: string
  todayLabel: string
  prevAriaLabel: string
  nextAriaLabel: string
  unassignedLabel: string
  columnsOverride?: ReadonlyArray<BookingCalendarColumn>
  hideBuiltInHeader?: boolean
  showHalfHourLabels?: boolean
  /** Overrides DayPilot business window (from salon Business Hours when provided). */
  businessBeginsHour?: number
  businessEndsHour?: number
  scrollToHour?: number
}

/** DayPilot cell times are wall-clock in ticks — use sortable string like the HTML mock. */
function dayPilotStartToLocalParts(start: DayPilot.Date): { date: string; time: string } {
  const sortable = String(start?.toStringSortable?.() || '').trim()
  const match = sortable.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})/)
  if (match) {
    return { date: match[1], time: `${match[2]}:${match[3]}` }
  }
  const local = start.toDateLocal()
  return {
    date: `${local.getFullYear()}-${pad2(local.getMonth() + 1)}-${pad2(local.getDate())}`,
    time: `${pad2(local.getHours())}:${pad2(local.getMinutes())}`,
  }
}

export default function BookingTeamCalendar({
  bookings,
  staffNames = [],
  staffIdsByName = {},
  calendarDate,
  onCalendarDateChange,
  onEventClick,
  onSlotSelect,
  onAddClick,
  addLabel,
  todayIso,
  locale,
  title,
  subtitle,
  todayLabel,
  prevAriaLabel,
  nextAriaLabel,
  unassignedLabel,
  columnsOverride,
  hideBuiltInHeader = false,
  showHalfHourLabels = false,
  businessBeginsHour = BOOKING_CALENDAR_BUSINESS_BEGINS_HOUR,
  businessEndsHour = BOOKING_CALENDAR_BUSINESS_ENDS_HOUR,
  scrollToHour = BOOKING_CALENDAR_DEFAULT_SCROLL_HOUR,
}: BookingTeamCalendarProps) {
  const calendarRef = useRef<DayPilot.Calendar | null>(null)

  const columns = useMemo(
    () => columnsOverride
      ? [...columnsOverride]
      : buildBookingCalendarColumns(bookings, unassignedLabel, staffNames),
    [bookings, columnsOverride, unassignedLabel, staffNames],
  )

  const events = useMemo(
    () => buildBookingCalendarEvents(bookings, columns, calendarDate),
    [bookings, columns, calendarDate],
  )

  const dateLabel = formatBookingCalendarNavLabel(calendarDate, locale)

  const handleCalendarControlRef = useCallback((calendar: DayPilot.Calendar) => {
    calendarRef.current = calendar
    calendar.scrollToHour(scrollToHour)
  }, [scrollToHour])

  // Keep the time axis scrolled to salon open when the selected day (or hours) changes.
  useEffect(() => {
    calendarRef.current?.scrollToHour(scrollToHour)
  }, [scrollToHour, calendarDate, businessBeginsHour, businessEndsHour])

  const halfHourCount = Math.max(0, businessEndsHour - businessBeginsHour)
  const cellsPerHour = 60 / BOOKING_CALENDAR_CELL_DURATION_MINUTES
  const hourBlockPx = cellsPerHour * BOOKING_CALENDAR_CELL_HEIGHT_PX

  return (
    <div className="booking-calendar-panel">
      <div className="booking-team-calendar">
        {!hideBuiltInHeader ? (
          <div className="booking-calendar-head">
            <div>
              <div className="booking-calendar-title">{title}</div>
              <div className="booking-calendar-subtitle">{subtitle}</div>
            </div>
            <div className="booking-calendar-head-actions">
              <div className="booking-calendar-nav" aria-label={title}>
                <button
                  className="booking-mini-button"
                  type="button"
                  aria-label={prevAriaLabel}
                  onClick={() => onCalendarDateChange(shiftLocalDateIso(calendarDate, -1))}
                >
                  <ChevronLeftIcon />
                </button>
                <span className="booking-calendar-nav-label">{dateLabel}</span>
                <button
                  className="booking-mini-button"
                  type="button"
                  onClick={() => onCalendarDateChange(todayIso)}
                >
                  {todayLabel}
                </button>
                <button
                  className="booking-mini-button"
                  type="button"
                  aria-label={nextAriaLabel}
                  onClick={() => onCalendarDateChange(shiftLocalDateIso(calendarDate, 1))}
                >
                  <ChevronRightIcon />
                </button>
              </div>
              {onAddClick && addLabel ? (
                <button className="booking-primary-button" type="button" onClick={onAddClick}>
                  <PlusIcon />
                  {addLabel}
                </button>
              ) : null}
            </div>
          </div>
        ) : null}
        <div className="booking-calendar-scroll">
          <div className="booking-team-calendar-host" aria-label={title}>
            {showHalfHourLabels ? (
              <div className="booking-calendar-half-hour-labels" aria-hidden="true">
                {Array.from(
                  { length: halfHourCount },
                  (_, index) => {
                    const top = BOOKING_CALENDAR_HEADER_HEIGHT_PX
                      + index * hourBlockPx
                      + hourBlockPx / 2
                    return (
                      <span
                        key={businessBeginsHour + index}
                        className="booking-calendar-half-hour-label"
                        style={{ top }}
                      >
                        :30
                      </span>
                    )
                  },
                )}
              </div>
            ) : null}
            <DayPilotCalendar
              {...BOOKING_CALENDAR_DAYPILOT_OPTIONS}
              businessBeginsHour={businessBeginsHour}
              businessEndsHour={businessEndsHour}
              timeRangeSelectedHandling={onSlotSelect ? 'Enabled' : 'Disabled'}
              controlRef={handleCalendarControlRef}
              startDate={calendarDate}
              columns={columns}
              events={events}
              onBeforeCellRender={(args) => {
                if (!onSlotSelect) {
                  args.cell.properties.html = ''
                  return
                }
                const { date, time } = dayPilotStartToLocalParts(args.cell.start)
                const past = isClientLocalSlotPast(date, time)
                if (past) {
                  args.cell.properties.html = ''
                  args.cell.properties.cssClass = BOOKING_CREATE_CELL_PAST_CLASS
                  return
                }
                args.cell.properties.html = BOOKING_CREATE_CELL_ADD_HTML
              }}
              onEventClick={(args: { e: { id: () => string | number } }) => {
                onEventClick(String(args.e.id()))
              }}
              onTimeRangeSelected={(args) => {
                const { date, time } = dayPilotStartToLocalParts(args.start)
                calendarRef.current?.clearSelection()
                // Past slots (client-local clock) cannot open create.
                if (isClientLocalSlotPast(date, time)) return
                const resource = String(args.resource ?? '').trim()
                const staffName = (
                  !resource || resource === BOOKING_CALENDAR_UNASSIGNED_TECH
                    ? null
                    : resource
                )
                const posStaffProfileId = staffName
                  ? staffIdsByName[staffName.trim().toLocaleLowerCase()] ?? null
                  : null
                onSlotSelect?.({ date, time, staffName, posStaffProfileId })
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
