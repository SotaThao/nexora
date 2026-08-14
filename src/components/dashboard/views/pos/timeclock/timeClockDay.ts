// The Time Clock board reads "today" in the device's local time (the front desk iPad sits in the
// salon), while the API stores and returns UTC. These helpers convert one local calendar day into
// the UTC window the roster/log endpoints expect.
//
// Note the construction: `new Date(year, month, day)` builds local midnight and `toISOString()`
// converts that instant to UTC — the correct direction. Do not build the window by string-slicing
// an ISO date, which silently shifts the day for anyone west of UTC.

export interface LocalDayWindow {
  fromUtc: string
  toUtc: string
  /** Stable per-day cache key, e.g. "2026-08-11" in local time. */
  dayKey: string
}

export function getLocalDayWindow(reference: Date = new Date()): LocalDayWindow {
  const start = new Date(reference.getFullYear(), reference.getMonth(), reference.getDate())
  const end = new Date(reference.getFullYear(), reference.getMonth(), reference.getDate() + 1)

  const month = String(start.getMonth() + 1).padStart(2, '0')
  const day = String(start.getDate()).padStart(2, '0')

  return {
    fromUtc: start.toISOString(),
    toUtc: end.toISOString(),
    dayKey: `${start.getFullYear()}-${month}-${day}`,
  }
}

/** Whole hours + minutes, e.g. 1.4 -> "1.4h". Kept numeric so it reads the same in both locales. */
export function formatHours(hours: number | null | undefined): string {
  const value = typeof hours === 'number' && Number.isFinite(hours) ? hours : 0
  return `${value.toFixed(1)}h`
}
