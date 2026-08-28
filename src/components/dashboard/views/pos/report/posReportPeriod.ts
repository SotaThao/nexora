/**
 * Period math for Front Desk -> Report. Every date here is a plain `yyyy-MM-dd` string in the
 * salon's own calendar — never a `Date` built from local time and pushed through `toISOString()`,
 * which shifts the day by the browser's UTC offset.
 */
import { PosReportMode } from '../../../../../constants/posReportMode'

export const MAX_DAILY_DATES = 31
export const MAX_WEEKLY_WEEKS = 13

export type IsoDate = string // yyyy-MM-dd
export type IsoWeekKey = string // yyyy-Www
export type MonthKey = string // yyyy-MM

function pad2(value: number): string {
  return String(value).padStart(2, '0')
}

export function toIsoDate(year: number, month: number, day: number): IsoDate {
  return `${year}-${pad2(month)}-${pad2(day)}`
}

/** Today in the browser's own calendar — the closest a client can get to the salon's date. */
export function todayIso(): IsoDate {
  const now = new Date()
  return toIsoDate(now.getFullYear(), now.getMonth() + 1, now.getDate())
}

export function currentMonthKey(): MonthKey {
  const now = new Date()
  return `${now.getFullYear()}-${pad2(now.getMonth() + 1)}`
}

export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate()
}

/** 0 = Monday … 6 = Sunday, matching the ISO week the backend groups by. */
export function mondayFirstWeekday(year: number, month: number, day: number): number {
  const utcDay = new Date(Date.UTC(year, month - 1, day)).getUTCDay()
  return (utcDay + 6) % 7
}

/** ISO-8601: week 01 is the week containing the first Thursday, weeks start on Monday. */
export function isoWeekOf(year: number, month: number, day: number): { year: number; week: number } {
  const date = new Date(Date.UTC(year, month - 1, day))
  const dayOfWeek = (date.getUTCDay() + 6) % 7
  // Step to the Thursday of this week — the year that Thursday falls in owns the week number.
  date.setUTCDate(date.getUTCDate() - dayOfWeek + 3)
  const isoYear = date.getUTCFullYear()
  const firstThursday = new Date(Date.UTC(isoYear, 0, 4))
  const firstThursdayOffset = (firstThursday.getUTCDay() + 6) % 7
  firstThursday.setUTCDate(firstThursday.getUTCDate() - firstThursdayOffset + 3)
  const week = 1 + Math.round((date.getTime() - firstThursday.getTime()) / (7 * 86400000))
  return { year: isoYear, week }
}

export function isoWeeksInYear(year: number): number {
  const dec28 = isoWeekOf(year, 12, 28)
  return dec28.week
}

export function isoWeekKey(year: number, week: number): IsoWeekKey {
  return `${year}-W${pad2(week)}`
}

export function parseIsoWeekKey(key: IsoWeekKey): { year: number; week: number } | null {
  const match = /^(\d{4})-W(\d{2})$/.exec(key)
  if (!match) return null
  const year = Number(match[1])
  const week = Number(match[2])
  if (week < 1 || week > isoWeeksInYear(year)) return null
  return { year, week }
}

/** Monday…Sunday bounds of an ISO week, as `yyyy-MM-dd` strings. */
export function isoWeekBounds(year: number, week: number): { start: IsoDate; end: IsoDate } {
  const jan4 = new Date(Date.UTC(year, 0, 4))
  const jan4Weekday = (jan4.getUTCDay() + 6) % 7
  const week1Monday = new Date(Date.UTC(year, 0, 4 - jan4Weekday))
  const monday = new Date(week1Monday.getTime() + (week - 1) * 7 * 86400000)
  const sunday = new Date(monday.getTime() + 6 * 86400000)
  const asIso = (d: Date) => toIsoDate(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate())
  return { start: asIso(monday), end: asIso(sunday) }
}

export function currentIsoWeekKey(): IsoWeekKey {
  const now = new Date()
  const { year, week } = isoWeekOf(now.getFullYear(), now.getMonth() + 1, now.getDate())
  return isoWeekKey(year, week)
}

export function parseMonthKey(key: MonthKey): { year: number; month: number } | null {
  const match = /^(\d{4})-(\d{2})$/.exec(key)
  if (!match) return null
  const month = Number(match[2])
  if (month < 1 || month > 12) return null
  return { year: Number(match[1]), month }
}

export function formatDayLabel(iso: IsoDate, language: string): string {
  const parsed = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
  if (!parsed) return iso
  const [, year, month, day] = parsed
  return String(language || 'en').toLowerCase().startsWith('vi')
    ? `${day}/${month}/${year}`
    : `${month}/${day}/${year}`
}

/** "25/08 – 31/08" — both months spelled out when the week straddles two of them. */
export function formatWeekRangeLabel(key: IsoWeekKey, language: string): string {
  const parsed = parseIsoWeekKey(key)
  if (!parsed) return key
  const { start, end } = isoWeekBounds(parsed.year, parsed.week)
  const short = (iso: IsoDate) => {
    const [, month, day] = iso.split('-')
    return String(language || 'en').toLowerCase().startsWith('vi')
      ? `${day}/${month}`
      : `${month}/${day}`
  }
  return `${short(start)} – ${short(end)}`
}

export function formatMonthLabel(key: MonthKey, language: string): string {
  const parsed = parseMonthKey(key)
  if (!parsed) return key
  return new Intl.DateTimeFormat(language || 'en', { month: 'long', year: 'numeric' })
    .format(new Date(Date.UTC(parsed.year, parsed.month - 1, 1)))
}

export type PosReportSelection = {
  mode: PosReportMode
  dates: IsoDate[]
  weeks: IsoWeekKey[]
  month: MonthKey
}

export function defaultSelectionFor(mode: PosReportMode): PosReportSelection {
  return {
    mode,
    dates: mode === PosReportMode.Daily ? [todayIso()] : [],
    weeks: mode === PosReportMode.Weekly ? [currentIsoWeekKey()] : [],
    month: mode === PosReportMode.Monthly ? currentMonthKey() : '',
  }
}

/** True when the selection has something the backend can actually report on. */
export function isSelectionComplete(selection: PosReportSelection): boolean {
  if (selection.mode === PosReportMode.Daily) return selection.dates.length > 0
  if (selection.mode === PosReportMode.Weekly) return selection.weeks.length > 0
  return Boolean(selection.month)
}

export function selectionLimitReached(selection: PosReportSelection): boolean {
  if (selection.mode === PosReportMode.Daily) return selection.dates.length >= MAX_DAILY_DATES
  if (selection.mode === PosReportMode.Weekly) return selection.weeks.length >= MAX_WEEKLY_WEEKS
  return true
}
