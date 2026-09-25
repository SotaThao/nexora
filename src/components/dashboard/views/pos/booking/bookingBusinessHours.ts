import type { BusinessHourEntry } from '../../../../types/domain'
import {
  BOOKING_CALENDAR_BUSINESS_BEGINS_HOUR,
  BOOKING_CALENDAR_BUSINESS_ENDS_HOUR,
} from '../../bookingTodayConstants'

/** Sunday-first — matches API `dayOfWeek` and `Date#getDay()`. */
const DAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const

export type BookingCalendarBusinessWindow = {
  /** Inclusive start hour for DayPilot `businessBeginsHour` (0–23). */
  beginsHour: number
  /** Exclusive end hour for DayPilot `businessEndsHour` (1–24). */
  endsHour: number
  isOpen: boolean
  scrollToHour: number
}

function parseTimeToMinutes(value: string): number | null {
  const match = String(value || '')
    .trim()
    .match(/^(\d{1,2}):(\d{2})/)
  if (!match) return null
  const hours = Number(match[1])
  const minutes = Number(match[2])
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null
  return hours * 60 + minutes
}

function dayNameForDateIso(dateIso: string): (typeof DAY_NAMES)[number] {
  const [year, month, day] = dateIso.split('-').map(Number)
  const local = new Date(year, (month || 1) - 1, day || 1)
  return DAY_NAMES[local.getDay()] ?? 'Sunday'
}

/**
 * Map salon Business Hours for `dateIso` onto DayPilot's integer business window.
 * Falls back to the shared 9–19 defaults when hours are missing or still loading.
 */
export function resolveBookingCalendarBusinessWindow(
  hours: ReadonlyArray<BusinessHourEntry> | undefined,
  dateIso: string,
  fallbackBegins = BOOKING_CALENDAR_BUSINESS_BEGINS_HOUR,
  fallbackEnds = BOOKING_CALENDAR_BUSINESS_ENDS_HOUR,
): BookingCalendarBusinessWindow {
  const fallback = {
    beginsHour: fallbackBegins,
    endsHour: fallbackEnds,
    isOpen: true,
    scrollToHour: fallbackBegins,
  }

  if (!dateIso || !hours?.length) return fallback

  const entry = hours.find((row) => row.dayOfWeek === dayNameForDateIso(dateIso))
  if (!entry) return fallback
  if (!entry.isOpen) {
    return { ...fallback, isOpen: false }
  }

  const openMinutes = parseTimeToMinutes(entry.openTime || '')
  const closeMinutes = parseTimeToMinutes(entry.closeTime || '')
  if (openMinutes == null || closeMinutes == null || closeMinutes <= openMinutes) {
    return fallback
  }

  // DayPilot only accepts whole hours. Floor open / ceil close so the grid always
  // covers the full Business Hours window (e.g. 09:30–19:00 → hours 9..19 exclusive).
  const beginsHour = Math.max(0, Math.min(23, Math.floor(openMinutes / 60)))
  const endsHour = Math.max(beginsHour + 1, Math.min(24, Math.ceil(closeMinutes / 60)))

  return {
    beginsHour,
    endsHour,
    isOpen: true,
    scrollToHour: beginsHour,
  }
}
