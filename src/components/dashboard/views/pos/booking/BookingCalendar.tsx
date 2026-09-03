// POS Front Desk's booking calendar deliberately reuses AI Hub's resource calendar so the
// receptionist sees the same time grid and technician columns as the booking team.
import { useMemo } from 'react'
import { useTranslation } from '../../../../../contexts/LanguageContext'
import type { BookingListItemApiDto } from '../../../../../types/repositories'
import BookingTeamCalendar from '../../BookingTeamCalendar'
import type { BookingCalendarSlotSelect } from '../../BookingTeamCalendar'
import type { BookingCalendarSource } from '../../bookingCalendarUtils'
import '../../booking-hub.css'
import { formatLocalDateIso } from '../../../../../utils/localDate'
import { bookingCalendarWallClock, bookingDateKey, statusLabelKey } from './bookingFormatters'

export default function BookingCalendar({
  bookings,
  calendarDate,
  onCalendarDateChange,
  staffNames,
  staffIdsByName,
  onNewBooking,
  onViewDetail,
}: {
  bookings: BookingListItemApiDto[]
  calendarDate: string
  onCalendarDateChange: (nextDate: string) => void
  staffNames: string[]
  staffIdsByName: Readonly<Record<string, string>>
  onNewBooking: (slot?: BookingCalendarSlotSelect) => void
  onViewDetail: (bookingId: string) => void
}) {
  const { t, currentLanguage } = useTranslation()
  const p = 'components.dashboard.views.pos.BookingTab.'

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
        startAtUtc: booking.scheduledAt,
        startAtWallClock: bookingCalendarWallClock(booking.scheduledAt, booking.source),
        // The list DTO has no end time, so the shared calendar's standard 60-minute fallback
        // applies until the booking endpoint exposes service duration.
        endAtUtc: null,
      })),
    [bookings, p, t],
  )

  return (
    <div className="booking-hub-view pos-booking-calendar">
      <BookingTeamCalendar
        bookings={calendarBookings}
        staffNames={staffNames}
        staffIdsByName={staffIdsByName}
        calendarDate={calendarDate}
        onCalendarDateChange={onCalendarDateChange}
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
      />
    </div>
  )
}
