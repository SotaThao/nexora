// BookingCalendar — Ticket 9, month view for the Booking tab. Uses the DayPilot Month
// component (same @daypilot/daypilot-lite-react library NexoraVoice's Booking Hub uses for its
// own calendar) instead of a hand-rolled grid, for consistency across the codebase. Clicking a
// day header or an event reveals that day's bookings as an agenda list below, reusing the same
// actions as the other two views (Table/Cards).
import { useMemo } from 'react'
import { DayPilotMonth } from '@daypilot/daypilot-lite-react'
import type { DayPilot } from '@daypilot/daypilot-lite-react'
import { useTranslation } from '../../../../../contexts/LanguageContext'
import type { BookingListItemApiDto } from '../../../../../types/repositories'
import { bookingDateKey, formatBookingWallClock, statusLabelKey } from './bookingFormatters'
import { BOOKING_CALENDAR_COLORS } from '../../../views/bookingTodayConstants'

function pad(value: number): string {
  return String(value).padStart(2, '0')
}

const STATUS_COLOR_INDEX: Record<string, number> = {
  Confirmed: 0,
  Waiting: 1,
  InService: 1,
  Completed: 2,
  Pending: 3,
  Cancelled: 4,
}

function colorForStatus(status: string) {
  const index = STATUS_COLOR_INDEX[status] ?? 0
  return BOOKING_CALENDAR_COLORS[index % BOOKING_CALENDAR_COLORS.length]
}

// DayPilot needs a naive "yyyy-MM-ddTHH:mm:ss" string. This feature has no genuine per-business
// timezone concept anywhere (see feedback_frontend_datetime_timezone_naive) — read via UTC
// getters so the rendered wall-clock matches every other view in this tab.
function toDayPilotWallClock(iso: string): string {
  const d = new Date(iso)
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}T${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:00`
}

export default function BookingCalendar({
  bookings,
  monthDate,
  onMonthChange,
  selectedDayKey,
  onSelectDay,
  onCheckIn,
  onCancel,
  onReschedule,
  checkingInId,
}: {
  bookings: BookingListItemApiDto[]
  monthDate: Date
  onMonthChange: (next: Date) => void
  selectedDayKey: string | null
  onSelectDay: (dayKey: string) => void
  onCheckIn: (bookingId: string) => void
  onCancel: (bookingId: string) => void
  onReschedule: (bookingId: string) => void
  checkingInId: string | null
}) {
  const { t } = useTranslation()
  const p = 'components.dashboard.views.pos.BookingTab.'

  const year = monthDate.getUTCFullYear()
  const month = monthDate.getUTCMonth()
  const monthStartIso = `${year}-${pad(month + 1)}-01`
  const monthLabel = new Date(Date.UTC(year, month, 1)).toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  })

  const events = useMemo(
    () =>
      bookings.map((booking) => {
        const color = colorForStatus(booking.status)
        const start = toDayPilotWallClock(booking.scheduledAt)
        return {
          id: booking.bookingId,
          text: booking.customerName,
          start,
          end: start,
          backColor: color.bg,
          borderColor: color.border,
          barColor: color.border,
          fontColor: color.text,
          toolTip: `${booking.customerName} · ${formatBookingWallClock(booking.scheduledAt)}`,
        }
      }),
    [bookings],
  )

  const selectedBookings = selectedDayKey
    ? bookings.filter((b) => bookingDateKey(b.scheduledAt) === selectedDayKey)
    : []

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button
          type="button"
          aria-label={t(p + 'calendarPrevMonth')}
          onClick={() => onMonthChange(new Date(Date.UTC(year, month - 1, 1)))}
          className="h-8 w-8 rounded-lg border border-nexoraBorder text-nexoraText hover:border-nexoraBrand"
        >
          ‹
        </button>
        <p className="text-sm font-bold text-nexoraText">{monthLabel}</p>
        <button
          type="button"
          aria-label={t(p + 'calendarNextMonth')}
          onClick={() => onMonthChange(new Date(Date.UTC(year, month + 1, 1)))}
          className="h-8 w-8 rounded-lg border border-nexoraBorder text-nexoraText hover:border-nexoraBrand"
        >
          ›
        </button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-nexoraBorder">
        <DayPilotMonth
          startDate={monthStartIso}
          events={events}
          cellHeight={84}
          eventHeight={20}
          weekStarts="Auto"
          onCellHeaderClick={(args: DayPilot.MonthCellHeaderClickArgs) => {
            onSelectDay(args.start.toStringSortable().slice(0, 10))
          }}
          onEventClick={(args: DayPilot.MonthEventClickArgs) => {
            onSelectDay(args.e.start().toStringSortable().slice(0, 10))
          }}
          onBeforeCellRender={(args: DayPilot.MonthBeforeCellRenderArgs) => {
            const key = args.cell.start.toStringSortable().slice(0, 10)
            if (key === selectedDayKey) {
              args.cell.properties.backColor = '#eef2ff'
            }
          }}
        />
      </div>

      {selectedDayKey ? (
        <div className="space-y-2 border-t border-nexoraBorder pt-3">
          {selectedBookings.length === 0 ? (
            <p className="text-center text-xs text-nexoraMuted">{t(p + 'emptyState')}</p>
          ) : (
            selectedBookings.map((booking) => {
              const canAct = booking.status === 'Pending' || booking.status === 'Confirmed'
              return (
                <div key={booking.bookingId} className="rounded-lg border border-nexoraBorder p-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs font-bold text-nexoraText">{booking.customerName}</p>
                    <span className="rounded-full bg-nexoraCanvas px-2 py-0.5 text-[10px] font-bold text-nexoraText">
                      {t(p + statusLabelKey(booking.status))}
                    </span>
                  </div>
                  <p className="text-[11px] text-nexoraMuted">{formatBookingWallClock(booking.scheduledAt)}</p>
                  <p className="text-[11px] text-nexoraMuted">{booking.serviceNames.join(', ')}</p>
                  {canAct ? (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => onCheckIn(booking.bookingId)}
                        disabled={checkingInId === booking.bookingId}
                        className="rounded-lg bg-nexoraBrand px-2 py-1 text-[11px] font-bold text-white hover:bg-nexoraBrandDark disabled:opacity-60"
                      >
                        {t(p + 'checkInAction')}
                      </button>
                      <button
                        type="button"
                        onClick={() => onReschedule(booking.bookingId)}
                        className="rounded-lg border border-nexoraBorder px-2 py-1 text-[11px] font-bold text-nexoraText hover:border-nexoraBrand"
                      >
                        {t(p + 'rescheduleAction')}
                      </button>
                      <button
                        type="button"
                        onClick={() => onCancel(booking.bookingId)}
                        className="rounded-lg border border-nexoraBorder px-2 py-1 text-[11px] font-bold text-nexoraText hover:border-rose-500 hover:text-rose-500"
                      >
                        {t(p + 'cancelAction')}
                      </button>
                    </div>
                  ) : null}
                </div>
              )
            })
          )}
        </div>
      ) : null}
    </div>
  )
}
