import React, { useMemo } from 'react'
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'
import { useTranslation } from '../../../../../contexts/LanguageContext'
import { PosReportMode, POS_REPORT_MODE_OPTIONS } from '../../../../../constants/posReportMode'
import {
  currentMonthKey,
  defaultSelectionFor,
  formatDayLabel,
  formatMonthLabel,
  formatWeekRangeLabel,
  isoWeekBounds,
  isoWeekKey,
  isoWeekOf,
  parseIsoWeekKey,
  todayIso,
  type IsoDate,
  type PosReportSelection,
} from './posReportPeriod'

const TK = 'components.dashboard.views.pos.report.picker'

type Props = {
  selection: PosReportSelection
  businessTimeZone?: string
  onChange: (next: PosReportSelection) => void
}

/**
 * One direct native control per mode. Weekly accepts any date and resolves its Monday-Sunday ISO
 * week, which is easier than scanning a list of W01-W53 values.
 */
export default function PosReportPeriodPicker({ selection, businessTimeZone, onChange }: Props) {
  const { t, currentLanguage: language } = useTranslation()
  const today = todayIso(businessTimeZone)
  const currentMonth = currentMonthKey(businessTimeZone)
  const currentWeek = useMemo(() => weekKeyFromDate(today), [today])

  const selectedValue = selection.mode === PosReportMode.Daily
    ? selection.dates[0] ?? today
    : selection.mode === PosReportMode.Weekly
      ? weekStart(selection.weeks[0] ?? currentWeek, today)
      : selection.month || currentMonth

  const periodLabel = selection.mode === PosReportMode.Daily
    ? formatDayLabel(selectedValue, language)
    : selection.mode === PosReportMode.Weekly
      ? formatWeekRangeLabel(selection.weeks[0] ?? currentWeek, language)
      : formatMonthLabel(selectedValue, language)

  const isAtLatestPeriod = selection.mode === PosReportMode.Daily
    ? selectedValue >= today
    : selection.mode === PosReportMode.Weekly
      ? (selection.weeks[0] ?? currentWeek) >= currentWeek
      : selectedValue >= currentMonth

  const handleModeChange = (mode: PosReportMode) => {
    if (mode !== selection.mode) onChange(defaultSelectionFor(mode, businessTimeZone))
  }

  const handleValueChange = (value: string) => {
    if (!value) return
    if (selection.mode === PosReportMode.Daily) {
      if (value <= today) onChange({ ...selection, dates: [value] })
      return
    }
    if (selection.mode === PosReportMode.Weekly) {
      if (value <= today) onChange({ ...selection, weeks: [weekKeyFromDate(value)] })
      return
    }
    if (value <= currentMonth) onChange({ ...selection, month: value })
  }

  const movePeriod = (direction: -1 | 1) => {
    if (direction > 0 && isAtLatestPeriod) return
    if (selection.mode === PosReportMode.Daily) {
      onChange({ ...selection, dates: [shiftIsoDate(selectedValue, direction)] })
      return
    }
    if (selection.mode === PosReportMode.Weekly) {
      const nextDate = shiftIsoDate(weekStart(selection.weeks[0] ?? currentWeek, today), direction * 7)
      onChange({ ...selection, weeks: [weekKeyFromDate(nextDate)] })
      return
    }
    onChange({ ...selection, month: shiftMonth(selectedValue, direction) })
  }

  const inputType = selection.mode === PosReportMode.Monthly ? 'month' : 'date'
  const inputLabelKey = selection.mode === PosReportMode.Daily
    ? 'selectDate'
    : selection.mode === PosReportMode.Weekly
      ? 'selectWeekDate'
      : 'selectMonth'
  const hintKey = selection.mode === PosReportMode.Daily
    ? 'dailyHint'
    : selection.mode === PosReportMode.Weekly
      ? 'weeklyHint'
      : 'monthlyHint'

  return (
    <div
      className="flex min-w-0 max-w-full flex-col items-start gap-2 pb-1"
      data-testid="report-period-picker"
    >
      <div
        className="flex max-w-full flex-wrap items-start gap-2"
        role="toolbar"
        aria-label={t(`${TK}.controlsLabel`)}
      >
        <div
          className="inline-flex shrink-0 rounded-lg border border-nexoraBorder bg-white p-0.5"
          role="tablist"
          aria-label={t(`${TK}.modeLabel`)}
        >
          {POS_REPORT_MODE_OPTIONS.map((mode) => (
            <button
              key={mode}
              type="button"
              role="tab"
              aria-selected={selection.mode === mode}
              onClick={() => handleModeChange(mode)}
              className={`rounded-md px-2.5 py-1.5 text-[11px] font-bold transition-colors ${
                selection.mode === mode
                  ? 'bg-nexoraBrand text-white'
                  : 'text-nexoraMuted hover:bg-nexoraCanvas'
              }`}
            >
              {t(`${TK}.mode.${mode.toLowerCase()}`)}
            </button>
          ))}
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            onClick={() => movePeriod(-1)}
            aria-label={t(`${TK}.prev`)}
            className="flex h-9 w-8 shrink-0 items-center justify-center rounded-lg border border-nexoraBorder bg-white text-nexoraMuted transition-colors hover:border-nexoraBrand hover:text-nexoraBrand"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </button>

          <label
            className="relative flex h-9 w-[150px] flex-none items-center rounded-lg border border-nexoraBorder bg-white px-2 focus-within:border-nexoraBrand focus-within:ring-2 focus-within:ring-violet-100"
            title={periodLabel}
          >
            <span className="sr-only">
              {t(`${TK}.${inputLabelKey}`)}
            </span>
            <span className="pointer-events-none absolute left-2 text-nexoraBrand" aria-hidden="true">
              <CalendarDays className="h-4 w-4" />
            </span>
            <input
              key={selection.mode}
              type={inputType}
              value={selectedValue}
              max={selection.mode === PosReportMode.Monthly ? currentMonth : today}
              onChange={(event) => handleValueChange(event.target.value)}
              aria-label={t(`${TK}.${inputLabelKey}`)}
              className="h-7 w-full cursor-pointer bg-transparent pl-6 text-[11px] font-extrabold tabular-nums text-nexoraText outline-none"
            />
          </label>

          <button
            type="button"
            onClick={() => movePeriod(1)}
            disabled={isAtLatestPeriod}
            aria-label={t(`${TK}.next`)}
            className="flex h-9 w-8 shrink-0 items-center justify-center rounded-lg border border-nexoraBorder bg-white text-nexoraMuted transition-colors hover:border-nexoraBrand hover:text-nexoraBrand disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:border-nexoraBorder disabled:hover:text-nexoraMuted"
          >
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      <div
        className="w-full max-w-xl rounded-lg bg-violet-50 px-3 py-2"
        role="status"
        aria-live="polite"
      >
        <p className="text-xs font-extrabold tabular-nums text-violet-800">{periodLabel}</p>
        <p className="mt-0.5 text-[10px] text-violet-600">{t(`${TK}.${hintKey}`)}</p>
      </div>
    </div>
  )
}

function weekKeyFromDate(isoDate: IsoDate): string {
  const [year, month, day] = isoDate.split('-').map(Number)
  const week = isoWeekOf(year, month, day)
  return isoWeekKey(week.year, week.week)
}

function weekStart(key: string, fallback: IsoDate): IsoDate {
  const parsed = parseIsoWeekKey(key)
  return parsed ? isoWeekBounds(parsed.year, parsed.week).start : fallback
}

function shiftIsoDate(isoDate: string, days: number): IsoDate {
  const [year, month, day] = isoDate.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day + days))
  return [
    date.getUTCFullYear(),
    String(date.getUTCMonth() + 1).padStart(2, '0'),
    String(date.getUTCDate()).padStart(2, '0'),
  ].join('-')
}

function shiftMonth(monthKey: string, delta: number): string {
  const [year, month] = monthKey.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1 + delta, 1))
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`
}
