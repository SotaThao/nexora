import React, { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronLeftIcon, ChevronRightIcon } from '../BookingHubIcons'

type Props = {
  value: string
  minDate: string
  locale: string
  disabled?: boolean
  placeholder: string
  prevMonthAriaLabel: string
  nextMonthAriaLabel: string
  formatDisplay: (isoDate: string, locale: string) => string
  onChange: (isoDate: string) => void
}

function parseIsoDate(iso: string): { year: number; month: number; day: number } | null {
  const [year, month, day] = iso.split('-').map(Number)
  if (!year || !month || !day) return null
  return { year, month, day }
}

function toIsoDate(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate()
}

function startWeekday(year: number, month: number): number {
  // 0 = Sunday
  return new Date(year, month - 1, 1).getDay()
}

export default function SmsScheduleDatePicker({
  value,
  minDate,
  locale,
  disabled = false,
  placeholder,
  prevMonthAriaLabel,
  nextMonthAriaLabel,
  formatDisplay,
  onChange,
}: Props) {
  const rootRef = useRef<HTMLDivElement | null>(null)
  const [open, setOpen] = useState(false)

  const selected = parseIsoDate(value)
  const min = parseIsoDate(minDate) ?? parseIsoDate(toIsoDate(
    new Date().getFullYear(),
    new Date().getMonth() + 1,
    new Date().getDate(),
  ))!

  const [viewYear, setViewYear] = useState(selected?.year ?? min.year)
  const [viewMonth, setViewMonth] = useState(selected?.month ?? min.month)

  useEffect(() => {
    if (!open) return
    if (selected) {
      setViewYear(selected.year)
      setViewMonth(selected.month)
      return
    }
    setViewYear(min.year)
    setViewMonth(min.month)
  }, [open, selected?.year, selected?.month, min.year, min.month])

  useEffect(() => {
    if (!open) return undefined

    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null
      if (target && rootRef.current && !rootRef.current.contains(target)) {
        setOpen(false)
      }
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

  const monthLabel = useMemo(
    () => new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' })
      .format(new Date(viewYear, viewMonth - 1, 1)),
    [locale, viewYear, viewMonth],
  )

  const weekdayLabels = useMemo(() => {
    const formatter = new Intl.DateTimeFormat(locale, { weekday: 'narrow' })
    // 2024-01-07 is Sunday
    return Array.from({ length: 7 }, (_, index) => (
      formatter.format(new Date(2024, 0, 7 + index))
    ))
  }, [locale])

  const cells = useMemo(() => {
    const totalDays = daysInMonth(viewYear, viewMonth)
    const offset = startWeekday(viewYear, viewMonth)
    const list: Array<{ iso: string; day: number; disabled: boolean; selected: boolean } | null> = []

    for (let i = 0; i < offset; i += 1) list.push(null)
    for (let day = 1; day <= totalDays; day += 1) {
      const iso = toIsoDate(viewYear, viewMonth, day)
      list.push({
        iso,
        day,
        disabled: iso < minDate,
        selected: iso === value,
      })
    }
    return list
  }, [viewYear, viewMonth, minDate, value])

  const canGoPrev = toIsoDate(viewYear, viewMonth, daysInMonth(viewYear, viewMonth)) >= minDate
    && (viewYear > min.year || (viewYear === min.year && viewMonth > min.month))

  const shiftMonth = (delta: number) => {
    const date = new Date(viewYear, viewMonth - 1 + delta, 1)
    setViewYear(date.getFullYear())
    setViewMonth(date.getMonth() + 1)
  }

  return (
    <div
      className={`schedule-datetime-shell schedule-date-picker${value ? ' has-value' : ' is-empty'}`}
      ref={rootRef}
    >
      <button
        type="button"
        className={`schedule-datetime-trigger${value ? ' has-value' : ' is-empty'}`}
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => {
          if (!disabled) setOpen((prev) => !prev)
        }}
      >
        <span className="schedule-datetime-display is-static">
          {value ? formatDisplay(value, locale) : placeholder}
        </span>
      </button>

      {open ? (
        <div className="schedule-calendar-popover" role="dialog" aria-label={placeholder}>
          <div className="schedule-calendar-nav">
            <button
              type="button"
              className="schedule-calendar-nav-btn"
              aria-label={prevMonthAriaLabel}
              disabled={!canGoPrev}
              onClick={() => shiftMonth(-1)}
            >
              <ChevronLeftIcon className="marketing-icon is-compact" />
            </button>
            <span className="schedule-calendar-month">{monthLabel}</span>
            <button
              type="button"
              className="schedule-calendar-nav-btn"
              aria-label={nextMonthAriaLabel}
              onClick={() => shiftMonth(1)}
            >
              <ChevronRightIcon className="marketing-icon is-compact" />
            </button>
          </div>

          <div className="schedule-calendar-weekdays">
            {weekdayLabels.map((label, index) => (
              <span key={`${label}-${index}`}>{label}</span>
            ))}
          </div>

          <div className="schedule-calendar-grid">
            {cells.map((cell, index) => {
              if (!cell) {
                return <span key={`empty-${index}`} className="schedule-calendar-day is-spacer" />
              }
              return (
                <button
                  key={cell.iso}
                  type="button"
                  className={[
                    'schedule-calendar-day',
                    cell.selected ? 'is-selected' : '',
                    cell.disabled ? 'is-disabled' : '',
                  ].filter(Boolean).join(' ')}
                  disabled={cell.disabled}
                  aria-pressed={cell.selected}
                  onClick={() => {
                    if (cell.disabled) return
                    onChange(cell.iso)
                    setOpen(false)
                  }}
                >
                  {cell.day}
                </button>
              )
            })}
          </div>
        </div>
      ) : null}
    </div>
  )
}
