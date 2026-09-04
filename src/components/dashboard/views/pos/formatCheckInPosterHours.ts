// Compact hours line for the door-QR poster: "Mon-Sun (9 AM - 10 PM)" / "T2-CN (9 AM - 10 PM)".
// Clock stays 12-hour English AM/PM on purpose — that is the sticker convention the print mockup
// uses, including under a Vietnamese "thời gian làm việc" label.
import { MerchantVoiceDayOfWeekApi } from '../../../../data/merchantVoice/domain'
import type { BusinessHourEntry } from '../../../../types/domain'

const WEEK_FROM_MONDAY = [
  MerchantVoiceDayOfWeekApi.Monday,
  MerchantVoiceDayOfWeekApi.Tuesday,
  MerchantVoiceDayOfWeekApi.Wednesday,
  MerchantVoiceDayOfWeekApi.Thursday,
  MerchantVoiceDayOfWeekApi.Friday,
  MerchantVoiceDayOfWeekApi.Saturday,
  MerchantVoiceDayOfWeekApi.Sunday,
] as const

function normalizeClock(value?: string | null): string | null {
  const match = /^(\d{1,2}):(\d{2})/.exec(String(value ?? '').trim())
  if (!match) return null
  const hours = Number(match[1])
  const minutes = Number(match[2])
  if (hours > 23 || minutes > 59) return null
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

export function formatPosterClock12h(hhmm: string): string {
  const [hourStr, minuteStr] = hhmm.split(':')
  const hours = Number(hourStr)
  const minutes = Number(minuteStr)
  const period = hours >= 12 ? 'PM' : 'AM'
  const hour12 = hours % 12 || 12
  return minutes === 0 ? `${hour12} ${period}` : `${hour12}:${minuteStr} ${period}`
}

function compressDayRange(days: string[], shortDay: (dayOfWeek: string) => string): string {
  if (days.length === 0) return ''
  const indexes = days.map((day) => WEEK_FROM_MONDAY.indexOf(day as (typeof WEEK_FROM_MONDAY)[number]))
  const ranges: string[] = []
  let start = 0
  for (let i = 1; i <= days.length; i += 1) {
    const broken = i === days.length || indexes[i] !== indexes[i - 1] + 1
    if (!broken) continue
    const first = days[start]
    const last = days[i - 1]
    ranges.push(first === last ? shortDay(first) : `${shortDay(first)}-${shortDay(last)}`)
    start = i
  }
  return ranges.join(', ')
}

/**
 * Returns null when there is nothing to print (hours not loaded, or every day closed / unusable).
 * The caller supplies already-translated short day labels (Mon / T2, …).
 */
export function formatCheckInPosterHours(
  hours: BusinessHourEntry[] | undefined,
  shortDay: (dayOfWeek: string) => string,
): string | null {
  if (!hours?.length) return null

  const byDay = new Map(hours.map((entry) => [entry.dayOfWeek, entry]))
  const openSlots: { day: string; open: string; close: string }[] = []

  WEEK_FROM_MONDAY.forEach((day) => {
    const entry = byDay.get(day)
    if (!entry?.isOpen) return
    const open = normalizeClock(entry.openTime)
    const close = normalizeClock(entry.closeTime)
    if (!open || !close) return
    openSlots.push({ day, open, close })
  })

  if (openSlots.length === 0) return null

  const windowOf = (slot: { open: string; close: string }) => `${slot.open}|${slot.close}`
  const sameWindow = openSlots.every((slot) => windowOf(slot) === windowOf(openSlots[0]))

  const withClock = (days: string[], open: string, close: string) =>
    `${compressDayRange(days, shortDay)} (${formatPosterClock12h(open)} - ${formatPosterClock12h(close)})`

  if (sameWindow) {
    return withClock(
      openSlots.map((slot) => slot.day),
      openSlots[0].open,
      openSlots[0].close,
    )
  }

  const groups: { days: string[]; open: string; close: string }[] = []
  openSlots.forEach((slot) => {
    const last = groups[groups.length - 1]
    const lastDay = last?.days[last.days.length - 1]
    const lastIndex = lastDay
      ? WEEK_FROM_MONDAY.indexOf(lastDay as (typeof WEEK_FROM_MONDAY)[number])
      : -1
    const thisIndex = WEEK_FROM_MONDAY.indexOf(slot.day as (typeof WEEK_FROM_MONDAY)[number])
    if (last && last.open === slot.open && last.close === slot.close && thisIndex === lastIndex + 1) {
      last.days.push(slot.day)
      return
    }
    groups.push({ days: [slot.day], open: slot.open, close: slot.close })
  })

  return groups.map((group) => withClock(group.days, group.open, group.close)).join(' · ')
}
