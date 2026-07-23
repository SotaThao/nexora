import React, { useCallback, useMemo } from 'react'
import { DayPilotCalendar } from '@daypilot/daypilot-lite-react'
import type { DayPilot } from '@daypilot/daypilot-lite-react'
import {
  BOOKING_CALENDAR_DAYPILOT_OPTIONS,
  BOOKING_CALENDAR_DEFAULT_SCROLL_HOUR,
} from './bookingTodayConstants'
import {
  buildBookingCalendarColumns,
  buildBookingCalendarEvents,
  formatBookingCalendarNavLabel,
  shiftLocalDateIso,
  type BookingCalendarSource,
} from './bookingCalendarUtils'
import { ChevronLeftIcon, ChevronRightIcon } from './BookingHubIcons'

type BookingTeamCalendarProps = {
  bookings: ReadonlyArray<BookingCalendarSource>
  calendarDate: string
  onCalendarDateChange: (dateIso: string) => void
  onEventClick: (bookingId: string) => void
  todayIso: string
  locale: string
  title: string
  subtitle: string
  todayLabel: string
  prevAriaLabel: string
  nextAriaLabel: string
  unassignedLabel: string
}

export default function BookingTeamCalendar({
  bookings,
  calendarDate,
  onCalendarDateChange,
  onEventClick,
  todayIso,
  locale,
  title,
  subtitle,
  todayLabel,
  prevAriaLabel,
  nextAriaLabel,
  unassignedLabel,
}: BookingTeamCalendarProps) {
  const columns = useMemo(
    () => buildBookingCalendarColumns(bookings, unassignedLabel),
    [bookings, unassignedLabel],
  )

  const events = useMemo(
    () => buildBookingCalendarEvents(bookings, columns, calendarDate),
    [bookings, columns, calendarDate],
  )

  const dateLabel = formatBookingCalendarNavLabel(calendarDate, locale)

  const handleCalendarControlRef = useCallback((calendar: DayPilot.Calendar) => {
    calendar.scrollToHour(BOOKING_CALENDAR_DEFAULT_SCROLL_HOUR)
  }, [])

  return (
    <div className="booking-calendar-panel">
      <div className="booking-team-calendar">
        <div className="booking-calendar-head">
          <div>
            <div className="booking-calendar-title">{title}</div>
            <div className="booking-calendar-subtitle">{subtitle}</div>
          </div>
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
        </div>
        <div className="booking-calendar-scroll">
          <div className="booking-team-calendar-host" aria-label={title}>
            <DayPilotCalendar
              {...BOOKING_CALENDAR_DAYPILOT_OPTIONS}
              controlRef={handleCalendarControlRef}
              startDate={calendarDate}
              columns={columns}
              events={events}
              onEventClick={(args: { e: { id: () => string | number } }) => {
                onEventClick(String(args.e.id()))
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
