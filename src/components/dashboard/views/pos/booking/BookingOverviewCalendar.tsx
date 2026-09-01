import type { KeyboardEvent } from 'react'
import { useTranslation } from '../../../../../contexts/LanguageContext'
import {
  POS_BOOKING_CALENDAR_STATUS_COLORS,
} from '../../bookingTodayConstants'
import { formatBookingWallClockTime } from './bookingFormatters'
import {
  getBookingCalendarStatusGroup,
  PosBookingCalendarViewMode,
  type BookingCalendarOverviewDay,
} from './bookingCalendarView'

type BookingOverviewCalendarProps = {
  mode: Exclude<PosBookingCalendarViewMode, PosBookingCalendarViewMode.Day>
  anchorDate: string
  days: BookingCalendarOverviewDay[]
  locale: string
  loading: boolean
  error: boolean
  onRetry: () => void
  onDayClick: (date: string) => void
  onBookingClick: (bookingId: string) => void
}

function weekdayLabels(locale: string): string[] {
  const formatter = new Intl.DateTimeFormat(
    locale.toLowerCase().startsWith('vi') ? 'vi-VN' : 'en-US',
    { weekday: 'short' },
  )
  const sunday = new Date(2026, 0, 4, 12)
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(sunday)
    date.setDate(date.getDate() + index)
    return formatter.format(date)
  })
}

function formatOverviewDate(dateIso: string, locale: string): string {
  const [year, month, day] = dateIso.split('-').map(Number)
  return new Intl.DateTimeFormat(
    locale.toLowerCase().startsWith('vi') ? 'vi-VN' : 'en-US',
    { month: 'short', day: 'numeric' },
  ).format(new Date(year, month - 1, day, 12))
}

export default function BookingOverviewCalendar({
  mode,
  anchorDate,
  days,
  locale,
  loading,
  error,
  onRetry,
  onDayClick,
  onBookingClick,
}: BookingOverviewCalendarProps) {
  const { t } = useTranslation()
  const p = 'components.dashboard.views.pos.BookingTab.'
  const monthMode = mode === PosBookingCalendarViewMode.Month
  const anchorMonth = anchorDate.slice(0, 7)

  if (error) {
    return (
      <div className="pos-booking-overview-state" role="alert">
        <span>{t(p + 'calendarOverviewLoadError')}</span>
        <button type="button" onClick={onRetry}>{t(p + 'retry')}</button>
      </div>
    )
  }

  const handleDayKeyDown = (event: KeyboardEvent<HTMLDivElement>, date: string) => {
    if (event.key !== 'Enter' && event.key !== ' ') return
    event.preventDefault()
    onDayClick(date)
  }

  return (
    <div className={`pos-booking-overview-scroll${monthMode ? ' is-month' : ''}`}>
      <div className="pos-booking-overview-calendar" aria-busy={loading}>
        <div className="pos-booking-overview-weekdays" role="row">
          {weekdayLabels(locale).map((label) => (
            <div key={label} className="pos-booking-overview-weekday" role="columnheader">
              {label}
            </div>
          ))}
        </div>
        <div className="pos-booking-overview-days">
          {loading
            ? Array.from({ length: 7 }, (_, index) => (
              <div key={index} className="pos-booking-overview-day is-loading" aria-hidden="true" />
            ))
            : days.map((day) => {
              const adjacentMonth = monthMode && !day.date.startsWith(anchorMonth)
              return (
                <div
                  key={day.date}
                  data-testid={`booking-overview-day-${day.date}`}
                  className={`pos-booking-overview-day${adjacentMonth ? ' is-adjacent-month' : ''}`}
                  role="button"
                  tabIndex={0}
                  aria-label={`${formatOverviewDate(day.date, locale)}, ${t(p + 'calendarOverviewBookings', { count: day.totalBookings })}`}
                  onClick={() => onDayClick(day.date)}
                  onKeyDown={(event) => handleDayKeyDown(event, day.date)}
                >
                  <div className="pos-booking-overview-day-head">
                    <span className="pos-booking-overview-date">
                      {formatOverviewDate(day.date, locale)}
                    </span>
                    <strong>{day.totalBookings}</strong>
                  </div>
                  <div className="pos-booking-overview-total">
                    {t(p + 'calendarOverviewBookings', { count: day.totalBookings })}
                  </div>
                  {!monthMode ? (
                    <div className="pos-booking-overview-previews">
                      {day.appointments.map((booking) => {
                        const statusGroup = getBookingCalendarStatusGroup(booking.status)
                        return (
                          <button
                            key={booking.bookingId}
                            type="button"
                            className="pos-booking-overview-preview"
                            onClick={(event) => {
                              event.stopPropagation()
                              onBookingClick(booking.bookingId)
                            }}
                          >
                            <span
                              className="pos-booking-overview-status-dot"
                              style={{ backgroundColor: POS_BOOKING_CALENDAR_STATUS_COLORS[statusGroup].border }}
                            />
                            <span>{formatBookingWallClockTime(booking.scheduledAt, booking.source)}</span>
                            <strong>{booking.customerName}</strong>
                          </button>
                        )
                      })}
                      {day.remainingAppointmentCount > 0 ? (
                        <span className="pos-booking-overview-more">
                          {t(p + 'calendarOverviewMore', { count: day.remainingAppointmentCount })}
                        </span>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              )
            })}
        </div>
      </div>
    </div>
  )
}
