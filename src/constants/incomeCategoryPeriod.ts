/**
 * Income/Payout Categories (issue #584) — period filter for the "Income by category" panel.
 * Verified against the backend's `IncomeByCategoryPeriodType` enum (string-serialized) and
 * `GetIncomeByCategoryStatsQuery` (`period` + optional `year`/`month`/`week`, not a single opaque
 * `periodValue` — corrected after reading the backend source directly).
 */
export const IncomeCategoryPeriod = {
  AllTime: 'AllTime',
  Week: 'Week',
  Month: 'Month',
  Year: 'Year',
} as const

export type IncomeCategoryPeriodValue = (typeof IncomeCategoryPeriod)[keyof typeof IncomeCategoryPeriod]

export interface PeriodValueOption {
  /** Stable key for the picker; not sent to the API directly. */
  key: string
  label: string
  year?: number
  month?: number
  /** ISO-8601 week number, matching the backend's `ISOWeek` handling. */
  week?: number
}

function isoWeekOf(date: Date): { year: number; week: number } {
  // ISO-8601 week: Thursday of this week determines the week-year.
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
  return { year: d.getUTCFullYear(), week }
}

/**
 * Builds the last 12 selectable values for a given period (no BE "available periods" endpoint
 * exists), most recent first. Returns `[]` for `AllTime`.
 */
export function buildPeriodValueOptions(
  period: IncomeCategoryPeriodValue,
  currentLanguage: string,
  now: Date = new Date(),
): PeriodValueOption[] {
  const monthNames = currentLanguage === 'vi'
    ? ['Th 1', 'Th 2', 'Th 3', 'Th 4', 'Th 5', 'Th 6', 'Th 7', 'Th 8', 'Th 9', 'Th 10', 'Th 11', 'Th 12']
    : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

  if (period === IncomeCategoryPeriod.Week) {
    const options: PeriodValueOption[] = []
    for (let i = 0; i < 12; i++) {
      const d = new Date(now)
      d.setDate(d.getDate() - 7 * i)
      const { year, week } = isoWeekOf(d)
      options.push({ key: `${year}-W${week}`, year, week, label: `${currentLanguage === 'vi' ? 'Tuần' : 'Week'} ${week}, ${year}` })
    }
    return options
  }

  if (period === IncomeCategoryPeriod.Month) {
    const options: PeriodValueOption[] = []
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      options.push({
        key: `${d.getFullYear()}-${d.getMonth() + 1}`,
        year: d.getFullYear(),
        month: d.getMonth() + 1,
        label: `${monthNames[d.getMonth()]} ${d.getFullYear()}`,
      })
    }
    return options
  }

  if (period === IncomeCategoryPeriod.Year) {
    const options: PeriodValueOption[] = []
    for (let i = 0; i < 5; i++) {
      const year = now.getFullYear() - i
      options.push({ key: String(year), year, label: String(year) })
    }
    return options
  }

  return []
}
