import { useMemo } from 'react'
import { useTranslation } from '../../../../../contexts/LanguageContext'
import Tooltip from '../../../../ui/Tooltip'

// US-13 Step 1 period picker. `PeriodType` on the wire has no "Day" member (BE:
// Week|Month|Quarter|Year) — "Day" is a FE-only concept for Per Transaction entry,
// represented as `periodType: null`. Week/Quarter/Month ranges are FE-only display
// logic (BE stores only TransactionDate/PeriodEndDate, no week-number field), computed
// with plain UTC-based Date math to avoid local-timezone drift on date-only values.
export type PeriodMode = 'Day' | 'Week' | 'Month' | 'Quarter' | 'Year'

export interface PeriodRange {
  transactionDate: string
  periodEndDate: string | null
}

function pad2(n: number) {
  return String(n).padStart(2, '0')
}

function fmt(y: number, m: number, d: number) {
  return `${y}-${pad2(m)}-${pad2(d)}`
}

function utcDate(y: number, m: number, d: number) {
  return new Date(Date.UTC(y, m - 1, d))
}

function toFmt(date: Date) {
  return fmt(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate())
}

function mondayOf(date: Date): Date {
  const day = date.getUTCDay()
  const diff = (day === 0 ? -6 : 1) - day
  const result = new Date(date)
  result.setUTCDate(result.getUTCDate() + diff)
  return result
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setUTCDate(result.getUTCDate() + days)
  return result
}

function lastDayOfMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate()
}

interface WeekOption {
  index: number
  start: string
  end: string
}

function buildWeekOptions(taxYear: number): WeekOption[] {
  const jan1 = utcDate(taxYear, 1, 1)
  const dec31 = utcDate(taxYear, 12, 31)
  const weeks: WeekOption[] = []
  let monday = mondayOf(jan1)
  let index = 1
  while (monday.getTime() <= dec31.getTime()) {
    const sunday = addDays(monday, 6)
    weeks.push({ index, start: toFmt(monday), end: toFmt(sunday) })
    monday = addDays(monday, 7)
    index += 1
  }
  return weeks
}

const QUARTER_RANGES: Record<number, [number, number, number, number]> = {
  1: [1, 1, 3, 31],
  2: [4, 1, 6, 30],
  3: [7, 1, 9, 30],
  4: [10, 1, 12, 31],
}

function quarterRange(taxYear: number, quarter: number): PeriodRange {
  const [sm, sd, em, ed] = QUARTER_RANGES[quarter]
  return { transactionDate: fmt(taxYear, sm, sd), periodEndDate: fmt(taxYear, em, ed) }
}

function currentQuarterOf(month1to12: number): number {
  return Math.ceil(month1to12 / 3)
}

function todayUtc(): Date {
  const now = new Date()
  return utcDate(now.getFullYear(), now.getMonth() + 1, now.getDate())
}

function shortDate(iso: string, locale: string) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Intl.DateTimeFormat(locale, { day: '2-digit', month: '2-digit' }).format(utcDate(y, m, d))
}

export function defaultRangeForMode(mode: PeriodMode, taxYear: number): PeriodRange {
  const today = todayUtc()
  const isCurrentYear = today.getUTCFullYear() === taxYear

  if (mode === 'Day') {
    return { transactionDate: isCurrentYear ? toFmt(today) : fmt(taxYear, 1, 1), periodEndDate: null }
  }
  if (mode === 'Week') {
    const weeks = buildWeekOptions(taxYear)
    const currentWeek = isCurrentYear ? weeks.find((w) => w.start <= toFmt(today) && toFmt(today) <= w.end) : undefined
    const chosen = currentWeek ?? weeks[0]
    return { transactionDate: chosen.start, periodEndDate: chosen.end }
  }
  if (mode === 'Month') {
    const month = isCurrentYear ? today.getUTCMonth() + 1 : 1
    return { transactionDate: fmt(taxYear, month, 1), periodEndDate: fmt(taxYear, month, lastDayOfMonth(taxYear, month)) }
  }
  if (mode === 'Quarter') {
    const quarter = isCurrentYear ? currentQuarterOf(today.getUTCMonth() + 1) : 1
    return quarterRange(taxYear, quarter)
  }
  return { transactionDate: fmt(taxYear, 1, 1), periodEndDate: fmt(taxYear, 12, 31) }
}

export default function PeriodPicker({
  taxYear,
  periodMode,
  onPeriodModeChange,
  transactionDate,
  periodEndDate,
  onRangeChange,
}: {
  taxYear: number
  periodMode: PeriodMode
  onPeriodModeChange: (mode: PeriodMode) => void
  transactionDate: string
  periodEndDate: string | null
  onRangeChange: (range: PeriodRange) => void
}) {
  const { t, currentLanguage } = useTranslation()
  const locale = currentLanguage === 'vi' ? 'vi-VN' : 'en-US'

  const weekOptions = useMemo(() => buildWeekOptions(taxYear), [taxYear])
  const monthOptions = useMemo(
    () => Array.from({ length: 12 }, (_, i) => i + 1).map((month) => ({
      month,
      label: new Intl.DateTimeFormat(locale, { month: 'long' }).format(utcDate(taxYear, month, 1)),
    })),
    [taxYear, locale],
  )

  const handleModeChange = (mode: PeriodMode) => {
    onPeriodModeChange(mode)
    onRangeChange(defaultRangeForMode(mode, taxYear))
  }

  const currentWeekIndex = weekOptions.find((w) => w.start === transactionDate)?.index ?? weekOptions[0]?.index
  const currentMonth = transactionDate ? Number(transactionDate.slice(5, 7)) : 1
  const currentQuarter = periodEndDate
    ? Object.entries(QUARTER_RANGES).find(([, [, , em]]) => em === Number(periodEndDate.slice(5, 7)))?.[0]
    : undefined

  return (
    <div className="space-y-3">
      <div>
        <label className="text-xs font-bold text-nexoraMuted">
          <span className="inline-flex items-center gap-1">
            {t('taxiq.selfReportedIncome.form.periodTypeLabel')}
            <Tooltip content={t('taxiq.selfReportedIncome.form.periodTypeTooltip')} />
          </span>
        </label>
        <select
          value={periodMode}
          onChange={(e) => handleModeChange(e.target.value as PeriodMode)}
          className="mt-1 w-full rounded-lg border border-nexoraBorder px-3 py-2 text-sm"
        >
          <option value="Day">{t('taxiq.selfReportedIncome.periodType.day')}</option>
          <option value="Week">{t('taxiq.selfReportedIncome.periodType.week')}</option>
          <option value="Month">{t('taxiq.selfReportedIncome.periodType.month')}</option>
          <option value="Quarter">{t('taxiq.selfReportedIncome.periodType.quarter')}</option>
          <option value="Year">{t('taxiq.selfReportedIncome.periodType.year')}</option>
        </select>
      </div>

      {periodMode === 'Day' && (
        <div>
          <label className="text-xs font-bold text-nexoraMuted">{t('taxiq.selfReportedIncome.form.dateLabel')}</label>
          <input
            type="date"
            value={transactionDate}
            onChange={(e) => onRangeChange({ transactionDate: e.target.value, periodEndDate: null })}
            className="mt-1 w-full rounded-lg border border-nexoraBorder px-3 py-2 text-sm"
          />
        </div>
      )}

      {periodMode === 'Week' && (
        <div>
          <label className="text-xs font-bold text-nexoraMuted">{t('taxiq.selfReportedIncome.form.periodLabel')}</label>
          <select
            value={currentWeekIndex ?? ''}
            onChange={(e) => {
              const week = weekOptions.find((w) => w.index === Number(e.target.value))
              if (week) onRangeChange({ transactionDate: week.start, periodEndDate: week.end })
            }}
            className="mt-1 w-full rounded-lg border border-nexoraBorder px-3 py-2 text-sm"
          >
            {weekOptions.map((w) => (
              <option key={w.index} value={w.index}>
                {t('taxiq.selfReportedIncome.periodPicker.weekLabel', {
                  index: w.index,
                  start: shortDate(w.start, locale),
                  end: shortDate(w.end, locale),
                })}
              </option>
            ))}
          </select>
        </div>
      )}

      {periodMode === 'Month' && (
        <div>
          <label className="text-xs font-bold text-nexoraMuted">{t('taxiq.selfReportedIncome.form.periodLabel')}</label>
          <select
            value={currentMonth}
            onChange={(e) => {
              const month = Number(e.target.value)
              onRangeChange({
                transactionDate: fmt(taxYear, month, 1),
                periodEndDate: fmt(taxYear, month, lastDayOfMonth(taxYear, month)),
              })
            }}
            className="mt-1 w-full rounded-lg border border-nexoraBorder px-3 py-2 text-sm"
          >
            {monthOptions.map((m) => (
              <option key={m.month} value={m.month}>{m.label}</option>
            ))}
          </select>
        </div>
      )}

      {periodMode === 'Quarter' && (
        <div>
          <label className="text-xs font-bold text-nexoraMuted">{t('taxiq.selfReportedIncome.form.periodLabel')}</label>
          <select
            value={currentQuarter ?? '1'}
            onChange={(e) => onRangeChange(quarterRange(taxYear, Number(e.target.value)))}
            className="mt-1 w-full rounded-lg border border-nexoraBorder px-3 py-2 text-sm"
          >
            {[1, 2, 3, 4].map((q) => (
              <option key={q} value={q}>
                {t('taxiq.selfReportedIncome.periodPicker.quarterLabel', { quarter: q })}
              </option>
            ))}
          </select>
        </div>
      )}

      {periodMode === 'Year' && (
        <p className="rounded-lg bg-nexoraCanvas px-3 py-2 text-xs font-semibold text-nexoraMuted">
          {t('taxiq.selfReportedIncome.periodPicker.yearRangeLabel', { taxYear })}
        </p>
      )}
    </div>
  )
}
