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

/** "10:00 AM–2:00 PM" — always 12-hour, in the salon's own wall clock. */
export function formatPromotionWindow(startTime: string, endTime: string, language: string): string {
  return `${formatPosClockTime(startTime, language)}–${formatPosClockTime(endTime, language)}`
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
