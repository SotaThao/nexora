import { formatLocalDateIso, formatTimePart } from '../../../utils/localDate'
import type { TFunction } from '../../../types/contexts'
import {
  STAFF_CALENDAR_I18N,
  STAFF_CALENDAR_MOCK_APPOINTMENTS,
  STAFF_CALENDAR_WEEK_LENGTH,
  type StaffCalendarAppointment,
} from './constants'

const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/
const TIME_PATTERN = /^(\d{1,2}):(\d{2})$/

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

export function appointmentsForDate(
  dateKey: string,
  todayKey: string,
): StaffCalendarAppointment[] {
  return dateKey === todayKey ? STAFF_CALENDAR_MOCK_APPOINTMENTS : []
}

export function totalAppointmentDuration(appointments: StaffCalendarAppointment[]): number {
  return appointments.reduce((sum, item) => sum + item.duration, 0)
}

export function formatCalendarWeekday(date: Date, language: string, weekday: 'short' | 'long') {
  const locale = language.toLowerCase().startsWith('vi') ? 'vi-VN' : 'en-US'
  return date.toLocaleDateString(locale, { weekday })
}

export function formatCalendarTime(time: string, language: string): string {
  const match = TIME_PATTERN.exec(time)
  if (!match) return time
  const hours = Number(match[1])
  const minutes = Number(match[2])
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return time
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
