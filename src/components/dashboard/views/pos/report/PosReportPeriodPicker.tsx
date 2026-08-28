import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from '../../../../../contexts/LanguageContext'
import { PosReportMode, POS_REPORT_MODE_OPTIONS } from '../../../../../constants/posReportMode'
import {
  MAX_DAILY_DATES,
  MAX_WEEKLY_WEEKS,
  currentMonthKey,
  daysInMonth,
  defaultSelectionFor,
  formatDayLabel,
  formatMonthLabel,
  formatWeekRangeLabel,
  isoWeekBounds,
  isoWeekKey,
  isoWeekOf,
  isoWeeksInYear,
  mondayFirstWeekday,
  parseMonthKey,
  todayIso,
  toIsoDate,
  type IsoDate,
  type IsoWeekKey,
  type PosReportSelection,
} from './posReportPeriod'

const TK = 'components.dashboard.views.pos.report.picker'

type Props = {
  selection: PosReportSelection
  onChange: (next: PosReportSelection) => void
}

/**
 * Daily = multi-select calendar, Weekly = multi-select list of ISO weeks in a year (current week
 * marked), Monthly = one month. Future dates are never selectable — a report can only look back.
 */
export default function PosReportPeriodPicker({ selection, onChange }: Props) {
  const { t, currentLanguage: language } = useTranslation()
  const today = todayIso()
  const rootRef = useRef<HTMLDivElement | null>(null)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return undefined
    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null
      if (target && rootRef.current && !rootRef.current.contains(target)) setOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('touchstart', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('touchstart', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  const handleModeChange = (mode: PosReportMode) => {
    if (mode === selection.mode) return
    onChange(defaultSelectionFor(mode))
    setOpen(false)
  }

  const chips = useMemo(() => {
    if (selection.mode === PosReportMode.Daily) {
      return [...selection.dates].sort().map((date) => ({
        key: date,
        label: formatDayLabel(date, language),
      }))
    }
    if (selection.mode === PosReportMode.Weekly) {
      return [...selection.weeks].sort().map((week) => ({
        key: week,
        label: `${week.replace('-', ' ')} · ${formatWeekRangeLabel(week, language)}`,
      }))
    }
    return selection.month
      ? [{ key: selection.month, label: formatMonthLabel(selection.month, language) }]
      : []
  }, [selection, language])

  const removeChip = (key: string) => {
    if (selection.mode === PosReportMode.Daily) {
      // The report needs at least one period; the last chip is not removable.
      if (selection.dates.length <= 1) return
      onChange({ ...selection, dates: selection.dates.filter((d) => d !== key) })
      return
    }
    if (selection.mode === PosReportMode.Weekly) {
      if (selection.weeks.length <= 1) return
      onChange({ ...selection, weeks: selection.weeks.filter((w) => w !== key) })
    }
  }

  const limitLabel = selection.mode === PosReportMode.Daily
    ? t(`${TK}.limitDays`, { count: MAX_DAILY_DATES })
    : t(`${TK}.limitWeeks`, { count: MAX_WEEKLY_WEEKS })
  const limitReached = selection.mode === PosReportMode.Daily
    ? selection.dates.length >= MAX_DAILY_DATES
    : selection.mode === PosReportMode.Weekly && selection.weeks.length >= MAX_WEEKLY_WEEKS

  return (
    <div className="space-y-2" ref={rootRef} data-testid="report-period-picker">
      <div className="flex flex-wrap items-center gap-2">
        <div
          className="inline-flex rounded-xl border border-nexoraBorder bg-white p-0.5"
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
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
                selection.mode === mode
                  ? 'bg-nexoraBrand text-white'
                  : 'text-nexoraMuted hover:bg-nexoraCanvas'
              }`}
            >
              {t(`${TK}.mode.${mode.toLowerCase()}`)}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          aria-haspopup="dialog"
          aria-expanded={open}
          className="inline-flex items-center gap-1.5 rounded-xl border border-nexoraBorder bg-white px-3 py-1.5 text-xs font-bold text-nexoraText hover:bg-nexoraCanvas"
        >
          <span aria-hidden="true">📅</span>
          {t(`${TK}.choose`)}
        </button>

        {limitReached ? (
          <span className="text-[11px] font-semibold text-amber-600" role="status">{limitLabel}</span>
        ) : null}
      </div>

      {chips.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {chips.map((chip) => (
            <span
              key={chip.key}
              className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2.5 py-1 text-[11px] font-bold tabular-nums text-violet-700"
            >
              {chip.label}
              {chips.length > 1 ? (
                <button
                  type="button"
                  onClick={() => removeChip(chip.key)}
                  aria-label={t(`${TK}.remove`, { period: chip.label })}
                  className="rounded-full px-1 text-violet-500 hover:bg-violet-100 hover:text-violet-800"
                >
                  ×
                </button>
              ) : null}
            </span>
          ))}
        </div>
      ) : null}

      {open ? (
        <div className="rounded-xl border border-nexoraBorder bg-white p-3 shadow-lg" role="dialog" aria-label={t(`${TK}.choose`)}>
          {selection.mode === PosReportMode.Daily ? (
            <DayGrid
              today={today}
              selected={selection.dates}
              language={language}
              onToggle={(date) => {
                const isSelected = selection.dates.includes(date)
                if (isSelected) {
                  if (selection.dates.length <= 1) return
                  onChange({ ...selection, dates: selection.dates.filter((d) => d !== date) })
                  return
                }
                if (selection.dates.length >= MAX_DAILY_DATES) return
                onChange({ ...selection, dates: [...selection.dates, date].sort() })
              }}
            />
          ) : null}

          {selection.mode === PosReportMode.Weekly ? (
            <WeekList
              today={today}
              selected={selection.weeks}
              language={language}
              onToggle={(week) => {
                const isSelected = selection.weeks.includes(week)
                if (isSelected) {
                  if (selection.weeks.length <= 1) return
                  onChange({ ...selection, weeks: selection.weeks.filter((w) => w !== week) })
                  return
                }
                if (selection.weeks.length >= MAX_WEEKLY_WEEKS) return
                onChange({ ...selection, weeks: [...selection.weeks, week].sort() })
              }}
            />
          ) : null}

          {selection.mode === PosReportMode.Monthly ? (
            <MonthGrid
              today={today}
              selected={selection.month}
              language={language}
              onSelect={(month) => {
                onChange({ ...selection, month })
                setOpen(false)
              }}
            />
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

function PanelHeader({
  label, onPrev, onNext, canGoNext,
}: { label: string; onPrev: () => void; onNext: () => void; canGoNext: boolean }) {
  const { t } = useTranslation()
  return (
    <div className="mb-2 flex items-center justify-between gap-2">
      <button
        type="button"
        onClick={onPrev}
        aria-label={t(`${TK}.prev`)}
        className="rounded-lg px-2 py-1 text-sm font-bold text-nexoraMuted hover:bg-nexoraCanvas"
      >
        ‹
      </button>
      <span className="text-xs font-extrabold text-nexoraText">{label}</span>
      <button
        type="button"
        onClick={onNext}
        disabled={!canGoNext}
        aria-label={t(`${TK}.next`)}
        className="rounded-lg px-2 py-1 text-sm font-bold text-nexoraMuted hover:bg-nexoraCanvas disabled:opacity-30"
      >
        ›
      </button>
    </div>
  )
}

function DayGrid({
  today, selected, language, onToggle,
}: { today: IsoDate; selected: IsoDate[]; language: string; onToggle: (date: IsoDate) => void }) {
  const { t } = useTranslation()
  const [year, month] = useMemo(() => {
    const [y, m] = today.split('-')
    return [Number(y), Number(m)]
  }, [today])
  const [viewYear, setViewYear] = useState(year)
  const [viewMonth, setViewMonth] = useState(month)

  const weekdayLabels = useMemo(() => {
    const formatter = new Intl.DateTimeFormat(language || 'en', { weekday: 'narrow' })
    // 2024-01-01 is a Monday — the ISO week start the backend groups by.
    return Array.from({ length: 7 }, (_, index) => formatter.format(new Date(Date.UTC(2024, 0, 1 + index))))
  }, [language])

  const cells = useMemo(() => {
    const total = daysInMonth(viewYear, viewMonth)
    const offset = mondayFirstWeekday(viewYear, viewMonth, 1)
    const list: Array<{ iso: IsoDate; day: number } | null> = Array.from({ length: offset }, () => null)
    for (let day = 1; day <= total; day += 1) {
      list.push({ iso: toIsoDate(viewYear, viewMonth, day), day })
    }
    return list
  }, [viewYear, viewMonth])

  const shift = (delta: number) => {
    const next = new Date(Date.UTC(viewYear, viewMonth - 1 + delta, 1))
    setViewYear(next.getUTCFullYear())
    setViewMonth(next.getUTCMonth() + 1)
  }
  const monthLabel = new Intl.DateTimeFormat(language || 'en', { month: 'long', year: 'numeric' })
    .format(new Date(Date.UTC(viewYear, viewMonth - 1, 1)))
  const canGoNext = `${viewYear}-${String(viewMonth).padStart(2, '0')}` < today.slice(0, 7)

  return (
    <div>
      <PanelHeader label={monthLabel} onPrev={() => shift(-1)} onNext={() => shift(1)} canGoNext={canGoNext} />
      <div className="grid grid-cols-7 gap-0.5 text-center">
        {weekdayLabels.map((label, index) => (
          <span key={`${label}-${index}`} className="py-1 text-[10px] font-bold uppercase text-nexoraMuted">{label}</span>
        ))}
        {cells.map((cell, index) => {
          if (!cell) return <span key={`empty-${index}`} />
          const isFuture = cell.iso > today
          const isSelected = selected.includes(cell.iso)
          return (
            <button
              key={cell.iso}
              type="button"
              disabled={isFuture}
              aria-pressed={isSelected}
              onClick={() => onToggle(cell.iso)}
              className={`rounded-lg py-1.5 text-xs font-semibold tabular-nums transition-colors ${
                isSelected
                  ? 'bg-nexoraBrand text-white'
                  : isFuture
                    ? 'text-nexoraMuted/40'
                    : cell.iso === today
                      ? 'bg-violet-50 text-violet-700'
                      : 'text-nexoraText hover:bg-nexoraCanvas'
              }`}
            >
              {cell.day}
            </button>
          )
        })}
      </div>
      <p className="mt-2 text-[10px] text-nexoraMuted">{t(`${TK}.dailyHint`)}</p>
    </div>
  )
}

function WeekList({
  today, selected, language, onToggle,
}: { today: IsoDate; selected: IsoWeekKey[]; language: string; onToggle: (week: IsoWeekKey) => void }) {
  const { t } = useTranslation()
  const [todayYear, todayMonth, todayDay] = today.split('-').map(Number)
  const currentWeek = useMemo(() => isoWeekOf(todayYear, todayMonth, todayDay), [todayYear, todayMonth, todayDay])
  const [viewYear, setViewYear] = useState(currentWeek.year)

  const weeks = useMemo(() => {
    const total = isoWeeksInYear(viewYear)
    return Array.from({ length: total }, (_, index) => {
      const week = index + 1
      const key = isoWeekKey(viewYear, week)
      const { start, end } = isoWeekBounds(viewYear, week)
      // A week whose Monday is still ahead has nothing to report on yet.
      return { key, week, start, end, isFuture: start > today }
    })
  }, [viewYear, today])

  const currentKey = isoWeekKey(currentWeek.year, currentWeek.week)

  return (
    <div>
      <PanelHeader
        label={String(viewYear)}
        onPrev={() => setViewYear((prev) => prev - 1)}
        onNext={() => setViewYear((prev) => prev + 1)}
        canGoNext={viewYear < currentWeek.year}
      />
      <div className="max-h-64 space-y-1 overflow-y-auto pr-1">
        {weeks.map((entry) => {
          const isSelected = selected.includes(entry.key)
          const isCurrent = entry.key === currentKey
          return (
            <button
              key={entry.key}
              type="button"
              disabled={entry.isFuture}
              aria-pressed={isSelected}
              onClick={() => onToggle(entry.key)}
              className={`flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left text-xs transition-colors ${
                isSelected
                  ? 'bg-nexoraBrand text-white'
                  : entry.isFuture
                    ? 'text-nexoraMuted/40'
                    : 'text-nexoraText hover:bg-nexoraCanvas'
              }`}
            >
              <span className="font-extrabold tabular-nums">W{String(entry.week).padStart(2, '0')}</span>
              <span className="flex-1 truncate text-right tabular-nums">
                {formatWeekRangeLabel(entry.key, language)}
              </span>
              {isCurrent ? (
                <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-emerald-50 text-emerald-700'
                }`}>
                  {t(`${TK}.thisWeek`)}
                </span>
              ) : null}
            </button>
          )
        })}
      </div>
      <p className="mt-2 text-[10px] text-nexoraMuted">{t(`${TK}.weeklyHint`)}</p>
    </div>
  )
}

function MonthGrid({
  today, selected, language, onSelect,
}: { today: IsoDate; selected: string; language: string; onSelect: (month: string) => void }) {
  const currentMonth = currentMonthKey()
  const parsed = parseMonthKey(selected) ?? parseMonthKey(currentMonth)!
  const [viewYear, setViewYear] = useState(parsed.year)
  const todayYear = Number(today.slice(0, 4))

  const monthLabels = useMemo(() => {
    const formatter = new Intl.DateTimeFormat(language || 'en', { month: 'short' })
    return Array.from({ length: 12 }, (_, index) => formatter.format(new Date(Date.UTC(2024, index, 1))))
  }, [language])

  return (
    <div>
      <PanelHeader
        label={String(viewYear)}
        onPrev={() => setViewYear((prev) => prev - 1)}
        onNext={() => setViewYear((prev) => prev + 1)}
        canGoNext={viewYear < todayYear}
      />
      <div className="grid grid-cols-3 gap-1">
        {monthLabels.map((label, index) => {
          const key = `${viewYear}-${String(index + 1).padStart(2, '0')}`
          const isFuture = key > currentMonth
          const isSelected = key === selected
          return (
            <button
              key={key}
              type="button"
              disabled={isFuture}
              aria-pressed={isSelected}
              onClick={() => onSelect(key)}
              className={`rounded-lg px-2 py-2 text-xs font-bold transition-colors ${
                isSelected
                  ? 'bg-nexoraBrand text-white'
                  : isFuture
                    ? 'text-nexoraMuted/40'
                    : 'text-nexoraText hover:bg-nexoraCanvas'
              }`}
            >
              {label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
