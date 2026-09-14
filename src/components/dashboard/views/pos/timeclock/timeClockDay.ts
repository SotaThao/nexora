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

export function getLocalDayWindow(reference: Date = new Date(), timeZone?: string): LocalDayWindow {
  if (timeZone) {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone, year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
    })
    const partsOf = (date: Date) => {
      const parts = formatter.formatToParts(date)
      const value = (type: string) => Number(parts.find(part => part.type === type)?.value)
      return [value('year'), value('month'), value('day'), value('hour'), value('minute'), value('second')]
    }
    const [year, month, day] = partsOf(reference)
    const midnight = (localDay: number) => {
      const target = Date.UTC(year, month - 1, localDay)
      let utc = target
      // Resolve each midnight separately because a salon day may contain 23 or 25 hours.
      for (let attempt = 0; attempt < 3; attempt++) {
        const [y, m, d, h, min, sec] = partsOf(new Date(utc))
        const adjustment = target - Date.UTC(y, m - 1, d, h, min, sec)
        utc += adjustment
        if (adjustment === 0) break
      }
      return new Date(utc).toISOString()
    }
    return {
      fromUtc: midnight(day), toUtc: midnight(day + 1),
      dayKey: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
    }
  }
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
