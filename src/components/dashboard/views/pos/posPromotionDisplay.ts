/**
 * Shared rendering of a promotion's schedule and rate — used by the checkout card and by the
 * Owner's Promotions list, so the two never describe the same offer differently.
 */
import { PosServiceDiscountType } from '../../../../constants/posDiscount'
import { formatPosClockTime } from './posDateTime'

const WEEK_ORDER = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const

export type PosWeekDay = (typeof WEEK_ORDER)[number]

export const POS_WEEK_DAYS: readonly PosWeekDay[] = WEEK_ORDER

/**
 * "Mon–Fri" for a run of consecutive days, "Mon, Wed, Sat" otherwise. Sorted into week order first
 * because the list may arrive in whatever order it was picked in.
 */
export function formatPromotionDays(days: string[], shortDayLabel: (day: string) => string): string {
  const ordered = WEEK_ORDER.filter((day) => days.includes(day))
  if (ordered.length === 0) return ''
  if (ordered.length === 1) return shortDayLabel(ordered[0])

  const indexes = ordered.map((day) => WEEK_ORDER.indexOf(day))
  const isConsecutive = indexes.every((value, i) => i === 0 || value === indexes[i - 1] + 1)

  return isConsecutive && ordered.length > 2
    ? `${shortDayLabel(ordered[0])}–${shortDayLabel(ordered[ordered.length - 1])}`
    : ordered.map(shortDayLabel).join(', ')
}

/**
 * Studio list format matching the reward-promotions HTML prototype:
 * "Tue · Wed · Thu / 10:00 AM–2:00 PM"
 */
export function formatPromotionStudioSchedule(
  days: string[],
  startTime: string,
  endTime: string,
  language: string,
  shortDayLabel: (day: string) => string,
): string {
  const ordered = WEEK_ORDER.filter((day) => days.includes(day))
  const dayPart = ordered.length ? ordered.map(shortDayLabel).join(' · ') : '—'
  const timePart =
    startTime && endTime ? formatPromotionWindow(startTime, endTime, language) : '—'
  return `${dayPart} / ${timePart}`
}

/** "10:00 AM–2:00 PM" — always 12-hour with uppercase English meridiem. */
export function formatPromotionWindow(startTime: string, endTime: string, language: string): string {
  return `${formatPromotionClockTime(startTime, language)}–${formatPromotionClockTime(endTime, language)}`
}

function formatPromotionClockTime(hhmm: string, language: string): string {
  // Shared POS clock uses lowercase "am"/"pm"; posters/schedules use uppercase AM/PM.
  return formatPosClockTime(hhmm, language).replace(/\b(am|pm)\b/g, (match) => match.toUpperCase())
}

/**
 * Decimal money string without scientific notation.
 * `Number#toFixed` returns "1e+24" for |n| ≥ 1e21 — bad for the banner preview.
 */
function formatPromotionMoneyAmount(value: number): string {
  if (!Number.isFinite(value)) return '0.00'
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    useGrouping: true,
  }).format(value)
}

/** Percent figure without scientific notation (e.g. never "1.23e+60"). */
function formatPromotionPercentAmount(value: number): string {
  if (!Number.isFinite(value)) return '0'
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 2,
    useGrouping: false,
  }).format(value)
}

/** "15% off" / "$10 off" — the figure the counter and the customer both talk about. */
export function formatPromotionRate(discountType: string, discountValue: number): string {
  return discountType === PosServiceDiscountType.Percent
    ? `${formatPromotionPercentAmount(discountValue)}%`
    : `$${formatPromotionMoneyAmount(discountValue)}`
}

/** HTML prototype art card: "15% off" / "$5.00 off". */
export function formatPromotionArtSaving(discountType: string, discountValue: number): string {
  if (discountType === PosServiceDiscountType.Percent) {
    return `${formatPromotionPercentAmount(discountValue)}% off`
  }
  return `$${formatPromotionMoneyAmount(discountValue)} off`
}

/** Minutes since midnight from API `HH:mm` / `HH:mm:ss`. Invalid → null. */
function clockToMinutes(hhmm: string | null | undefined): number | null {
  if (!hhmm) return null
  const match = /^(\d{1,2}):(\d{2})(?::\d{2})?$/.exec(hhmm.trim())
  if (!match) return null
  const hours = Number(match[1])
  const minutes = Number(match[2])
  if (!Number.isFinite(hours) || !Number.isFinite(minutes) || hours > 23 || minutes > 59) {
    return null
  }
  return hours * 60 + minutes
}

/**
 * Whether an enabled promotion's day/time window covers `now` (device-local clock).
 * Empty `daysOfWeek` means every day. Missing/invalid times mean the whole day.
 * Overnight windows (end ≤ start, e.g. 22:00–02:00) stay on the starting day's listing
 * after midnight until `end`.
 */
export function isPromotionInScheduleNow(
  promotion: {
    daysOfWeek?: string[] | null
    startTime?: string | null
    endTime?: string | null
  },
  now: Date = new Date(),
): boolean {
  const start = clockToMinutes(promotion.startTime)
  const end = clockToMinutes(promotion.endTime)
  const current = now.getHours() * 60 + now.getMinutes()
  const isOvernight = start != null && end != null && end <= start

  const days = promotion.daysOfWeek ?? []
  if (days.length > 0) {
    const today = WEEK_ORDER[now.getDay()]
    const yesterday = WEEK_ORDER[(now.getDay() + 6) % 7]
    const onListedDay = days.includes(today)
    // 01:00 Tuesday still belongs to Monday's 22:00–02:00 offer.
    const onOvernightCarry =
      Boolean(isOvernight && end != null && current < end && days.includes(yesterday))
    if (!onListedDay && !onOvernightCarry) return false
  }

  if (start == null || end == null) return true
  if (isOvernight) return current >= start || current < end
  return current >= start && current < end
}
