import { PosOrderStatus } from '../../../../../constants/posOrderStatus'
import type { BookingListItemApiDto } from '../../../../../types/repositories'
import { formatLocalDateIso } from '../../../../../utils/localDate'
import { BookingCalendarStatusGroup } from '../../bookingTodayConstants'
import { bookingDateKey, resolveBookingWallClockParts } from './bookingFormatters'

export enum PosBookingCalendarViewMode {
  Day = 'day',
  Week = 'week',
  TwoWeeks = 'twoWeeks',
  ThreeWeeks = 'threeWeeks',
  Month = 'month',
}

export enum PosBookingCalendarStaffScope {
  WorkingToday = 'workingToday',
  AllTechnicians = 'allTechnicians',
}

export type BookingCalendarRange = {
  dateFrom: string
  dateTo: string
}

export type BookingCalendarOverviewDay = {
  date: string
  totalBookings: number
  appointments: BookingListItemApiDto[]
  remainingAppointmentCount: number
}

function parseLocalDateIso(dateIso: string): Date {
  const [year, month, day] = dateIso.split('-').map(Number)
  return new Date(year, month - 1, day, 12)
}

function addLocalDays(date: Date, days: number): Date {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

function startOfSundayWeek(date: Date): Date {
  return addLocalDays(date, -date.getDay())
}

function rangeFromSunday(date: Date, dayCount: number): BookingCalendarRange {
  const dateFrom = startOfSundayWeek(date)
  return {
    dateFrom: formatLocalDateIso(dateFrom),
    dateTo: formatLocalDateIso(addLocalDays(dateFrom, dayCount - 1)),
  }
}

export function getBookingCalendarRange(
  anchorDate: string,
  mode: PosBookingCalendarViewMode,
): BookingCalendarRange {
  const anchor = parseLocalDateIso(anchorDate)

  switch (mode) {
    case PosBookingCalendarViewMode.Day:
      return { dateFrom: anchorDate, dateTo: anchorDate }
    case PosBookingCalendarViewMode.Week:
      return rangeFromSunday(anchor, 7)
    case PosBookingCalendarViewMode.TwoWeeks:
      return rangeFromSunday(anchor, 14)
    case PosBookingCalendarViewMode.ThreeWeeks:
      return rangeFromSunday(anchor, 21)
    case PosBookingCalendarViewMode.Month: {
      const firstOfMonth = new Date(anchor.getFullYear(), anchor.getMonth(), 1, 12)
      const lastOfMonth = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0, 12)
      return {
        dateFrom: formatLocalDateIso(startOfSundayWeek(firstOfMonth)),
        dateTo: formatLocalDateIso(addLocalDays(lastOfMonth, 6 - lastOfMonth.getDay())),
      }
    }
  }
}

export function shiftBookingCalendarAnchor(
  anchorDate: string,
  mode: PosBookingCalendarViewMode,
  direction: -1 | 1,
): string {
  const anchor = parseLocalDateIso(anchorDate)

  if (mode === PosBookingCalendarViewMode.Month) {
    const targetMonthStart = new Date(
      anchor.getFullYear(),
      anchor.getMonth() + direction,
      1,
      12,
    )
    const lastTargetDay = new Date(
      targetMonthStart.getFullYear(),
      targetMonthStart.getMonth() + 1,
      0,
      12,
    ).getDate()
    targetMonthStart.setDate(Math.min(anchor.getDate(), lastTargetDay))
    return formatLocalDateIso(targetMonthStart)
  }

  const dayDelta = {
    [PosBookingCalendarViewMode.Day]: 1,
    [PosBookingCalendarViewMode.Week]: 7,
    [PosBookingCalendarViewMode.TwoWeeks]: 14,
    [PosBookingCalendarViewMode.ThreeWeeks]: 21,
  }[mode]

  return formatLocalDateIso(addLocalDays(anchor, dayDelta * direction))
}

export function getBookingCalendarStatusGroup(status: string): BookingCalendarStatusGroup {
  switch (status) {
    case PosOrderStatus.Pending:
      return BookingCalendarStatusGroup.Pending
    case PosOrderStatus.Completed:
      return BookingCalendarStatusGroup.Completed
    case PosOrderStatus.Cancelled:
      return BookingCalendarStatusGroup.Cancelled
    case PosOrderStatus.Confirmed:
    case PosOrderStatus.Waiting:
    case PosOrderStatus.InService:
    default:
      return BookingCalendarStatusGroup.Upcoming
  }
}

export type BookingCalendarStatusSummary = {
  total: number
  completed: number
  upcoming: number
  pending: number
  cancelled: number
}

/** Appointment Status Summary (#1303) — same buckets as the calendar color legend. */
export function summarizeBookingCalendarStatuses(
  bookings: ReadonlyArray<Pick<BookingListItemApiDto, 'status'>>,
): BookingCalendarStatusSummary {
  const summary: BookingCalendarStatusSummary = {
    total: bookings.length,
    completed: 0,
    upcoming: 0,
    pending: 0,
    cancelled: 0,
  }
  for (const booking of bookings) {
    switch (getBookingCalendarStatusGroup(booking.status)) {
      case BookingCalendarStatusGroup.Completed:
        summary.completed += 1
        break
      case BookingCalendarStatusGroup.Upcoming:
        summary.upcoming += 1
        break
      case BookingCalendarStatusGroup.Pending:
        summary.pending += 1
        break
      case BookingCalendarStatusGroup.Cancelled:
        summary.cancelled += 1
        break
    }
  }
  return summary
}

/**
 * Prior period of equal shape for the "X% busier than …" comparison on the status summary.
 * Day compares to the same weekday last week (e.g. this Saturday vs last Saturday).
 */
export function getBookingCalendarCompareRange(
  anchorDate: string,
  mode: PosBookingCalendarViewMode,
): BookingCalendarRange {
  if (mode === PosBookingCalendarViewMode.Day) {
    return getBookingCalendarRange(formatLocalDateIso(addLocalDays(parseLocalDateIso(anchorDate), -7)), mode)
  }
  return getBookingCalendarRange(shiftBookingCalendarAnchor(anchorDate, mode, -1), mode)
}

function compareBookingWallClock(
  left: BookingListItemApiDto,
  right: BookingListItemApiDto,
): number {
  const leftParts = resolveBookingWallClockParts(left.scheduledAt, left.source)
  const rightParts = resolveBookingWallClockParts(right.scheduledAt, right.source)
  const leftMinutes = leftParts.hours * 60 + leftParts.minutes
  const rightMinutes = rightParts.hours * 60 + rightParts.minutes
  return leftMinutes - rightMinutes || left.bookingId.localeCompare(right.bookingId)
}

export function buildBookingCalendarOverviewDays(
  bookings: ReadonlyArray<BookingListItemApiDto>,
  range: BookingCalendarRange,
  previewLimit: number,
): BookingCalendarOverviewDay[] {
  const activeByDate = new Map<string, BookingListItemApiDto[]>()

  for (const booking of bookings) {
    if (getBookingCalendarStatusGroup(booking.status) === BookingCalendarStatusGroup.Cancelled) {
      continue
    }
    const date = bookingDateKey(booking.scheduledAt, booking.source)
    if (date < range.dateFrom || date > range.dateTo) continue
    const current = activeByDate.get(date) ?? []
    current.push(booking)
    activeByDate.set(date, current)
  }

  const days: BookingCalendarOverviewDay[] = []
  const rangeEnd = parseLocalDateIso(range.dateTo)
  for (
    let cursor = parseLocalDateIso(range.dateFrom);
    cursor <= rangeEnd;
    cursor = addLocalDays(cursor, 1)
  ) {
    const date = formatLocalDateIso(cursor)
    const dayBookings = [...(activeByDate.get(date) ?? [])].sort(compareBookingWallClock)
    const appointments = dayBookings.slice(0, Math.max(0, previewLimit))
    days.push({
      date,
      totalBookings: dayBookings.length,
      appointments,
      remainingAppointmentCount: Math.max(0, dayBookings.length - appointments.length),
    })
  }

  return days
}
