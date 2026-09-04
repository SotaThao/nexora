import { formatLocalDateIso, formatTimePart } from '../../../utils/localDate'
import type { TFunction } from '../../../types/contexts'
import {
  STAFF_CALENDAR_I18N,
  STAFF_CALENDAR_WEEK_LENGTH,
} from './constants'

const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/
/** Wall clock inside an ISO timestamp — read as written, never shifted to the browser zone. */
const ISO_TIME_PATTERN = /T(\d{2}):(\d{2})/

export function parseCalendarDateKey(value: string | null | undefined): Date | null {
  if (!DATE_KEY_PATTERN.test(value || '')) return null
  const date = new Date(`${value}T12:00:00`)
  return Number.isNaN(date.getTime()) ? null : date
}

export function toCalendarDateKey(date: Date): string {
  return formatLocalDateIso(date)
}

export function calendarWeekDays(selectedDateKey: string): { key: string; date: Date }[] {
  const active = parseCalendarDateKey(selectedDateKey)
  if (!active) return []

  const start = new Date(active)
  start.setDate(active.getDate() - active.getDay())

  return Array.from({ length: STAFF_CALENDAR_WEEK_LENGTH }, (_, index) => {
    const day = new Date(start)
    day.setDate(start.getDate() + index)
    return { key: toCalendarDateKey(day), date: day }
  })
}

export function formatCalendarWeekday(date: Date, language: string, weekday: 'short' | 'long') {
  const locale = language.toLowerCase().startsWith('vi') ? 'vi-VN' : 'en-US'
  return date.toLocaleDateString(locale, { weekday })
}

// The API sends the salon's own offset (e.g. 2026-09-04T08:00:00-05:00). Parsing the hours
// out of the string keeps "8:00 AM" as the salon reads it; `new Date(...)` would re-render it
// in the technician's browser zone and shift the whole day.
export function formatCalendarTime(scheduledAt: string, language: string): string {
  const match = ISO_TIME_PATTERN.exec(scheduledAt)
  if (!match) return scheduledAt
  const hours = Number(match[1])
  const minutes = Number(match[2])
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return scheduledAt
  return formatTimePart(
    new Date(2000, 0, 1, hours, minutes),
    language.toLowerCase().startsWith('vi'),
  )
}

export function formatCalendarDuration(minutes: number, t: TFunction): string {
  if (!minutes) return ''
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  if (hours && rest) {
    return t(STAFF_CALENDAR_I18N.durationHoursMinutes, { hours, minutes: rest })
  }
  if (hours) return t(STAFF_CALENDAR_I18N.durationHours, { hours })
  return t(STAFF_CALENDAR_I18N.durationMinutes, { minutes: rest })
}
