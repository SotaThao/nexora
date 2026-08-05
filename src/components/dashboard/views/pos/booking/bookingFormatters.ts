// Shared formatting helpers for the Booking tab views (Ticket 9). Read via UTC getters — this
// feature has no genuine per-business timezone concept anywhere (see
// feedback_frontend_datetime_timezone_naive memory).
import { PosOrderStatus } from '../../../../../constants/posOrderStatus'

const MONTH_NAMES_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

function pad(value: number): string {
  return String(value).padStart(2, '0')
}

export function formatBookingWallClock(iso: string): string {
  const date = new Date(iso)
  const hours24 = date.getUTCHours()
  const period = hours24 >= 12 ? 'PM' : 'AM'
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12
  return `${MONTH_NAMES_SHORT[date.getUTCMonth()]} ${date.getUTCDate()}, ${date.getUTCFullYear()} ${hours12}:${pad(date.getUTCMinutes())} ${period}`
}

export function bookingDateKey(iso: string): string {
  const date = new Date(iso)
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`
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
