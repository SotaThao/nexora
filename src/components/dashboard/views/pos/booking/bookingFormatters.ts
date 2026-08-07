// Shared formatting helpers for the Booking tab views (Ticket 9).
//
// scheduledAt has split semantics depending on who created the booking (see
// feedback_frontend_datetime_timezone_naive and PosBookingSource):
// - Staff/Public (POS's own NewBookingForm/reschedule): naive wall-clock — the picked local
//   numbers tagged with a fake UTC offset, no real conversion. Read back via UTC getters.
// - Voice (mirrored from a NexoraVoice VoiceLead via VoiceLeadConfirmedConsumer): genuine UTC —
//   AI Hub actually converts the picked local time to a real UTC instant. Must convert back to
//   the viewer's local timezone to match what AI Hub itself displays for the same appointment.
import { PosOrderStatus } from '../../../../../constants/posOrderStatus'
import { PosBookingSource } from '../../../../../constants/posBookingSource'

const MONTH_NAMES_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

function pad(value: number): string {
  return String(value).padStart(2, '0')
}

interface BookingWallClockParts {
  year: number
  month: number // 1-12
  day: number
  hours: number
  minutes: number
}

/** Resolves scheduledAt to the wall-clock numbers the appointment was actually booked for. */
export function resolveBookingWallClockParts(iso: string, source?: string): BookingWallClockParts {
  const date = new Date(iso)
  if (source === PosBookingSource.Voice) {
    return {
      year: date.getFullYear(),
      month: date.getMonth() + 1,
      day: date.getDate(),
      hours: date.getHours(),
      minutes: date.getMinutes(),
    }
  }
  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
    hours: date.getUTCHours(),
    minutes: date.getUTCMinutes(),
  }
}

export function formatBookingWallClock(iso: string, source?: string): string {
  const { year, month, day, hours, minutes } = resolveBookingWallClockParts(iso, source)
  const period = hours >= 12 ? 'PM' : 'AM'
  const hours12 = hours % 12 === 0 ? 12 : hours % 12
  return `${MONTH_NAMES_SHORT[month - 1]} ${day}, ${year} ${hours12}:${pad(minutes)} ${period}`
}

export function bookingDateKey(iso: string, source?: string): string {
  const { year, month, day } = resolveBookingWallClockParts(iso, source)
  return `${year}-${pad(month)}-${pad(day)}`
}

export function statusLabelKey(status: string): string {
  switch (status) {
    case PosOrderStatus.Pending: return 'statusPending'
    case PosOrderStatus.Confirmed: return 'statusConfirmed'
    case PosOrderStatus.Cancelled: return 'statusCancelled'
    case PosOrderStatus.Waiting: return 'statusWaiting'
    case PosOrderStatus.InService: return 'statusInService'
    case PosOrderStatus.Completed: return 'statusCompleted'
    default: return 'statusConfirmed'
  }
}
