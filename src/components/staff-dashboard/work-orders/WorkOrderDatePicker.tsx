import { useEffect, useMemo, useRef, useState } from 'react'
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'
import { useTranslation } from '../../../contexts/LanguageContext'
import { WORK_ORDER_KEYBOARD, WORK_ORDERS_I18N, WORK_ORDERS_LAYOUT_CLASS } from './constants'
import {
  addLocalDateIso,
  buildWorkOrderMonthCells,
  formatWorkOrderMonthLabel,
  formatWorkOrderNavDate,
  parseLocalIso,
  shiftLocalMonth,
  workOrderCalendarDayState,
  workOrderWeekdayLabels,
  type WorkOrderCalendarDay,
} from './workOrderTickets'

interface WorkOrderDatePickerProps {
  value: string
  todayIso: string
  language: string
  onChange: (iso: string) => void
}

export default function WorkOrderDatePicker({
  value,
  todayIso,
  language,
  onChange,
}: WorkOrderDatePickerProps) {
  const { t } = useTranslation()
  const rootRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const selected = parseLocalIso(value)
  const [viewYear, setViewYear] = useState(selected.year)
  const [viewMonth, setViewMonth] = useState(selected.month)

  useEffect(() => {
    if (!open) return
    const parts = parseLocalIso(value)
    setViewYear(parts.year)
    setViewMonth(parts.month)
  }, [open, value])

  useEffect(() => {
    if (!open) return undefined

    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null
      if (target && rootRef.current && !rootRef.current.contains(target)) {
        setOpen(false)
      }
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === WORK_ORDER_KEYBOARD.escape) setOpen(false)
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

  const dateLabel = formatWorkOrderNavDate(value, language)
  const monthLabel = formatWorkOrderMonthLabel(viewYear, viewMonth, language)
  const weekdayLabels = useMemo(() => workOrderWeekdayLabels(language), [language])
  const cells = useMemo(
    () => buildWorkOrderMonthCells(viewYear, viewMonth, value, todayIso),
    [viewMonth, viewYear, value, todayIso],
  )

  const shiftViewMonth = (delta: number) => {
    const next = shiftLocalMonth(viewYear, viewMonth, delta)
    setViewYear(next.year)
    setViewMonth(next.month)
  }

  return (
    <div ref={rootRef} className={WORK_ORDERS_LAYOUT_CLASS.dateNav}>
      <div className={WORK_ORDERS_LAYOUT_CLASS.dateNavRow}>
        <button
          type="button"
          className={WORK_ORDERS_LAYOUT_CLASS.dateNavButton}
          aria-label={t(WORK_ORDERS_I18N.prevDay)}
          onClick={() => onChange(addLocalDateIso(value, -1))}
        >
          <ChevronLeft className={WORK_ORDERS_LAYOUT_CLASS.iconMd} aria-hidden="true" />
        </button>
        <button
          type="button"
          className={WORK_ORDERS_LAYOUT_CLASS.dateNavLabel}
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-label={t(WORK_ORDERS_I18N.pickDate)}
          onClick={() => setOpen((prev) => !prev)}
        >
          <CalendarDays className={WORK_ORDERS_LAYOUT_CLASS.dateNavIcon} aria-hidden="true" />
          {dateLabel}
        </button>
        <button
          type="button"
          className={WORK_ORDERS_LAYOUT_CLASS.dateNavButton}
          aria-label={t(WORK_ORDERS_I18N.nextDay)}
          onClick={() => onChange(addLocalDateIso(value, 1))}
        >
          <ChevronRight className={WORK_ORDERS_LAYOUT_CLASS.iconMd} aria-hidden="true" />
        </button>
      </div>

      {open ? (
        <div
          className={WORK_ORDERS_LAYOUT_CLASS.calendarPopover}
          role="dialog"
          aria-label={t(WORK_ORDERS_I18N.pickDate)}
        >
          <div className={WORK_ORDERS_LAYOUT_CLASS.calendarNav}>
            <button
              type="button"
              className={WORK_ORDERS_LAYOUT_CLASS.dateNavButton}
              aria-label={t(WORK_ORDERS_I18N.prevMonth)}
              onClick={() => shiftViewMonth(-1)}
            >
              <ChevronLeft className={WORK_ORDERS_LAYOUT_CLASS.iconSm} aria-hidden="true" />
            </button>
            <span className={WORK_ORDERS_LAYOUT_CLASS.calendarMonth}>{monthLabel}</span>
            <button
              type="button"
              className={WORK_ORDERS_LAYOUT_CLASS.dateNavButton}
              aria-label={t(WORK_ORDERS_I18N.nextMonth)}
              onClick={() => shiftViewMonth(1)}
            >
              <ChevronRight className={WORK_ORDERS_LAYOUT_CLASS.iconSm} aria-hidden="true" />
            </button>
          </div>
          <div className={WORK_ORDERS_LAYOUT_CLASS.calendarWeekdays}>
            {weekdayLabels.map((label, index) => (
              <span key={`${label}-${index}`}>{label}</span>
            ))}
          </div>
          <div className={WORK_ORDERS_LAYOUT_CLASS.calendarGrid}>
            {cells.map((cell, index) => (
              <WorkOrderCalendarCell
                key={cell?.iso ?? `pad-${index}`}
                cell={cell}
                onSelect={(iso) => {
                  onChange(iso)
                  setOpen(false)
                }}
              />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}

function WorkOrderCalendarCell({
  cell,
  onSelect,
}: {
  cell: WorkOrderCalendarDay | null
  onSelect: (iso: string) => void
}) {
  if (!cell) {
    return <span className={WORK_ORDERS_LAYOUT_CLASS.calendarDaySpacer} />
  }

  return (
    <button
      type="button"
      className={`${WORK_ORDERS_LAYOUT_CLASS.calendarDay} ${
        WORK_ORDERS_LAYOUT_CLASS[workOrderCalendarDayState(cell)]
      }`}
      aria-pressed={cell.selected}
      onClick={() => onSelect(cell.iso)}
    >
      {cell.day}
    </button>
  )
}
