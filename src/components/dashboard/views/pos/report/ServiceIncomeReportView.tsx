import { useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useTranslation } from '../../../../../contexts/LanguageContext'
import { SkeletonList } from '../../../../ui/skeleton'
import {
  POS_SERVICE_INCOME_MAX_RANGE_DAYS,
  POS_SERVICE_INCOME_TOP_ROWS,
  PosServiceIncomeReportMode,
  PosServiceIncomeRowType,
} from '../../../../../constants/posServiceIncomeReport'
import {
  serializePosServiceIncomeSelection,
  usePosServiceIncomeReport,
} from '../../../../../data/hooks/usePosServiceIncomeReport'
import type {
  PosServiceIncomeReportParams,
  PosServiceIncomeRow,
} from '../../../../../data/repositories/posServiceIncomeReport'
import { formatCurrency } from '../../../utils'
import ServiceIncomeBarChart, { type ServiceIncomeChartBar } from './ServiceIncomeBarChart'
import ServiceIncomeLinesModal from './ServiceIncomeLinesModal'
import { buildServiceIncomeColorMap } from './serviceIncomeSeriesColor'
import {
  currentIsoWeekKey,
  currentMonthKey,
  isoWeekBounds,
  isoWeekKey,
  isoWeeksInYear,
  parseIsoWeekKey,
  parseMonthKey,
  todayIso,
} from './posReportPeriod'

const TK = 'components.dashboard.views.pos.reports.serviceIncome'
/** The Inactive badge is shared with the Technician report — do not add a duplicate key. */
const INACTIVE_TK = 'components.dashboard.views.pos.report.inactive'

type Props = {
  businessId: string
  businessTimeZone: string
}

const controlClass =
  'min-h-11 rounded-lg border border-nexoraBorder bg-white px-3 text-sm font-semibold text-nexoraText outline-none transition focus:border-nexoraBrand focus:ring-2 focus:ring-nexoraBrand/20'
const actionBaseClass =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border px-3 text-xs font-extrabold transition focus:outline-none focus:ring-2 focus:ring-nexoraBrand/20 disabled:cursor-not-allowed disabled:opacity-60'
const secondaryActionClass = `${actionBaseClass} border-nexoraBorder bg-white text-nexoraText hover:bg-nexoraCanvas`
const primaryActionClass = `${actionBaseClass} border-nexoraBrand bg-nexoraBrand text-white hover:bg-nexoraBrandDark`

/** Bar labels drop the cents so ten of them stay readable; the card total keeps them. */
const wholeCurrency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})

const dateFromIso = (iso: string) => new Date(`${iso}T00:00:00Z`)

function rangeLength(from: string, to: string): number {
  return Math.floor((dateFromIso(to).getTime() - dateFromIso(from).getTime()) / 86_400_000) + 1
}

function shiftIsoDate(iso: string, days: number): string {
  const date = dateFromIso(iso)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

function shiftIsoWeek(key: string, direction: -1 | 1): string {
  const parsed = parseIsoWeekKey(key)
  if (!parsed) return key
  let year = parsed.year
  let week = parsed.week + direction
  if (week < 1) {
    year -= 1
    week = isoWeeksInYear(year)
  } else if (week > isoWeeksInYear(year)) {
    year += 1
    week = 1
  }
  return isoWeekKey(year, week)
}

function shiftMonthKey(key: string, direction: -1 | 1): string {
  const parsed = parseMonthKey(key)
  if (!parsed) return key
  const date = new Date(Date.UTC(parsed.year, parsed.month - 1 + direction, 1))
  return date.toISOString().slice(0, 7)
}

function rowKeyOf(row: PosServiceIncomeRow): string {
  return `${row.rowType}:${row.rowId ?? 'custom'}`
}

export default function ServiceIncomeReportView({ businessId, businessTimeZone }: Props) {
  const { t, currentLanguage } = useTranslation()
  const locale = currentLanguage === 'vi' ? 'vi-VN' : 'en-US'
  const today = useMemo(() => todayIso(businessTimeZone), [businessTimeZone])
  const currentWeek = useMemo(() => currentIsoWeekKey(businessTimeZone), [businessTimeZone])
  const currentMonth = useMemo(() => currentMonthKey(businessTimeZone), [businessTimeZone])
  const currentWeekBounds = useMemo(() => {
    const parsed = parseIsoWeekKey(currentWeek)
    return parsed ? isoWeekBounds(parsed.year, parsed.week) : { start: today, end: today }
  }, [currentWeek, today])

  const [mode, setMode] = useState<PosServiceIncomeReportMode>(PosServiceIncomeReportMode.Day)
  const [dayDate, setDayDate] = useState(today)
  const [weekValue, setWeekValue] = useState(currentWeek)
  const [monthValue, setMonthValue] = useState(currentMonth)
  const [fromDate, setFromDate] = useState(today)
  const [toDate, setToDate] = useState(today)
  const [appliedRange, setAppliedRange] = useState({ start: today, end: today })
  const [rangeError, setRangeError] = useState<'order' | 'length' | null>(null)
  const [revenueExpanded, setRevenueExpanded] = useState(false)
  const [countExpanded, setCountExpanded] = useState(false)
  const [activeRowKey, setActiveRowKey] = useState<string | null>(null)

  const fullDate = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        month: locale === 'vi-VN' ? 'long' : 'short',
        day: 'numeric',
        year: 'numeric',
        timeZone: 'UTC',
      }),
    [locale],
  )

  const params = useMemo<PosServiceIncomeReportParams>(() => {
    if (mode === PosServiceIncomeReportMode.Day) return { businessId, mode, date: dayDate }
    if (mode === PosServiceIncomeReportMode.Week) {
      const parsed = parseIsoWeekKey(weekValue)
      return {
        businessId,
        mode,
        date: parsed ? isoWeekBounds(parsed.year, parsed.week).start : today,
      }
    }
    if (mode === PosServiceIncomeReportMode.Month) {
      // The server derives the month bounds; any day inside the month is a valid anchor.
      return { businessId, mode, date: `${monthValue || currentMonth}-01` }
    }
    return { businessId, mode, from: appliedRange.start, to: appliedRange.end }
  }, [
    appliedRange.end,
    appliedRange.start,
    businessId,
    currentMonth,
    dayDate,
    mode,
    monthValue,
    today,
    weekValue,
  ])

  const selectionKey = serializePosServiceIncomeSelection(params)
  // Requirement: changing the reporting period closes an open drill-down rather than silently
  // re-querying it against the new span.
  useEffect(() => {
    setActiveRowKey(null)
  }, [selectionKey])

  const reportQuery = usePosServiceIncomeReport(params)
  const report = reportQuery.data
  const rows = report?.rows ?? []
  const totals = report?.totals

  const rowLabel = (row: PosServiceIncomeRow): string => {
    if (row.rowType === PosServiceIncomeRowType.Custom) return t(`${TK}.customServiceRow`)
    if (row.rowType === PosServiceIncomeRowType.AddOn && row.parentServiceName) {
      return `${row.parentServiceName} — ${row.name ?? t(`${TK}.unnamedRow`)}`
    }
    return row.name || t(`${TK}.unnamedRow`)
  }

  /**
   * Built once per report, over the server's row order, then shared by both charts — that is what
   * keeps a service the same colour in the revenue chart and the count chart, which sort
   * differently. Deriving it per chart, or indexing a fixed palette by position, would not.
   */
  const colorByLabel = buildServiceIncomeColorMap(rows.map(rowLabel))

  const toBar = (row: PosServiceIncomeRow, measure: 'revenue' | 'count'): ServiceIncomeChartBar => ({
    key: rowKeyOf(row),
    label: rowLabel(row),
    color: colorByLabel.get(rowLabel(row)) ?? '#7a8296',
    parentLabel: row.rowType === PosServiceIncomeRowType.AddOn ? row.parentServiceName : null,
    badge: row.rowType === PosServiceIncomeRowType.AddOn ? t(`${TK}.chart.addOnBadge`) : null,
    inactiveBadge: row.isInactive ? t(INACTIVE_TK) : null,
    value: measure === 'revenue' ? row.netRevenue : row.completedCount,
    valueLabel:
      measure === 'revenue'
        ? wholeCurrency.format(row.netRevenue)
        : new Intl.NumberFormat(locale).format(row.completedCount),
    secondaryLabel:
      measure === 'revenue'
        ? t(`${TK}.chart.countDetail`, { count: row.completedCount })
        : formatCurrency(row.netRevenue),
  })

  // The server already sorts by netRevenue desc; sorting a copy keeps the chart right if that stops.
  const revenueRows = [...rows].sort(
    (a, b) => b.netRevenue - a.netRevenue || rowLabel(a).localeCompare(rowLabel(b)),
  )
  // The count chart sorts independently, which is why hue is pinned to the row rather than its rank.
  const countRows = [...rows].sort(
    (a, b) => b.completedCount - a.completedCount || rowLabel(a).localeCompare(rowLabel(b)),
  )

  const revenueBars = (revenueExpanded ? revenueRows : revenueRows.slice(0, POS_SERVICE_INCOME_TOP_ROWS))
    .map((row) => toBar(row, 'revenue'))
  const countBars = (countExpanded ? countRows : countRows.slice(0, POS_SERVICE_INCOME_TOP_ROWS))
    .map((row) => toBar(row, 'count'))

  const activeRow = activeRowKey ? rows.find((row) => rowKeyOf(row) === activeRowKey) ?? null : null

  const formatRange = (from: string, to: string) => {
    if (!from || !to) return ''
    if (from === to) return fullDate.format(dateFromIso(from))
    return `${fullDate.format(dateFromIso(from))} ${t(`${TK}.dateRangeSeparator`)} ${fullDate.format(dateFromIso(to))}`
  }

  const periodTitle =
    mode === PosServiceIncomeReportMode.Day
      ? dayDate === today
        ? t(`${TK}.today`)
        : t(`${TK}.dayReport`)
      : mode === PosServiceIncomeReportMode.Week
        ? weekValue === currentWeek
          ? t(`${TK}.thisWeek`)
          : t(`${TK}.week`)
        : mode === PosServiceIncomeReportMode.Month
          ? monthValue === currentMonth
            ? t(`${TK}.thisMonth`)
            : t(`${TK}.month`)
          : t(`${TK}.range`)

  const dateLabel =
    report?.periodStart && report.periodEnd ? formatRange(report.periodStart, report.periodEnd) : ''

  const selectMode = (next: PosServiceIncomeReportMode) => {
    setMode(next)
    setRangeError(null)
  }

  const shiftSelectedPeriod = (direction: -1 | 1) => {
    if (mode === PosServiceIncomeReportMode.Day) {
      setDayDate((previous) => shiftIsoDate(previous, direction))
    } else if (mode === PosServiceIncomeReportMode.Week) {
      setWeekValue((previous) => shiftIsoWeek(previous, direction))
    } else if (mode === PosServiceIncomeReportMode.Month) {
      setMonthValue((previous) => shiftMonthKey(previous, direction))
    }
  }

  const canMoveToNext =
    mode === PosServiceIncomeReportMode.Day
      ? dayDate < today
      : mode === PosServiceIncomeReportMode.Week
        ? weekValue < currentWeek
        : mode === PosServiceIncomeReportMode.Month
          ? monthValue < currentMonth
          : false

  const runRangeReport = () => {
    if (!fromDate || !toDate || fromDate > toDate) {
      setRangeError('order')
      return
    }
    if (rangeLength(fromDate, toDate) > POS_SERVICE_INCOME_MAX_RANGE_DAYS) {
      setRangeError('length')
      return
    }
    setRangeError(null)
    setAppliedRange({ start: fromDate, end: toDate })
  }

  const isReady = !reportQuery.isPending && !reportQuery.isError
  const hasRows = rows.length > 0
  const expandLabel = (expanded: boolean) =>
    rows.length > POS_SERVICE_INCOME_TOP_ROWS
      ? expanded
        ? t(`${TK}.chart.showTop`, { count: POS_SERVICE_INCOME_TOP_ROWS })
        : t(`${TK}.chart.showAll`, { count: rows.length })
      : null

  return (
    <section className="space-y-3 pb-5" aria-labelledby="service-income-title">
      <h2 id="service-income-title" className="text-xl font-extrabold tracking-tight text-nexoraText">
        {t(`${TK}.title`)}
      </h2>

      <div className="rounded-2xl border border-nexoraBorder bg-white p-2.5 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
          <div
            role="tablist"
            aria-label={t(`${TK}.periods.ariaLabel`)}
            className="flex shrink-0 gap-1 overflow-x-auto"
          >
            {Object.values(PosServiceIncomeReportMode).map((item) => (
              <button
                key={item}
                type="button"
                role="tab"
                aria-selected={mode === item}
                onClick={() => selectMode(item)}
                className={`min-h-11 shrink-0 rounded-lg px-3 text-xs font-extrabold transition ${
                  mode === item
                    ? 'bg-nexoraBrandSoft text-nexoraBrandDark'
                    : 'text-nexoraMuted hover:bg-nexoraCanvas hover:text-nexoraText'
                }`}
              >
                {t(`${TK}.${item.toLowerCase()}`)}
              </button>
            ))}
          </div>

          <div className="flex min-w-0 flex-1 flex-wrap items-end justify-end gap-2">
            {mode !== PosServiceIncomeReportMode.Range ? (
              <div className="flex items-end gap-1.5">
                <button
                  type="button"
                  aria-label={t(`${TK}.previousPeriod`)}
                  title={t(`${TK}.previousPeriod`)}
                  onClick={() => shiftSelectedPeriod(-1)}
                  className={`${secondaryActionClass} h-11 w-11 px-0`}
                >
                  <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                </button>
                {mode === PosServiceIncomeReportMode.Day ? (
                  <label className="grid min-w-[168px] gap-1 text-[10px] font-bold text-nexoraMuted">
                    {t(`${TK}.reportDate`)}
                    <input
                      type="date"
                      value={dayDate}
                      max={today}
                      onChange={(event) => setDayDate(event.target.value || today)}
                      className={controlClass}
                    />
                  </label>
                ) : null}
                {mode === PosServiceIncomeReportMode.Week ? (
                  <label className="grid min-w-[190px] gap-1 text-[10px] font-bold text-nexoraMuted">
                    {t(`${TK}.reportWeek`)}
                    <input
                      type="week"
                      value={weekValue}
                      max={currentWeek}
                      onChange={(event) => setWeekValue(event.target.value || currentWeek)}
                      className={controlClass}
                    />
                  </label>
                ) : null}
                {mode === PosServiceIncomeReportMode.Month ? (
                  <label className="grid min-w-[168px] gap-1 text-[10px] font-bold text-nexoraMuted">
                    {t(`${TK}.reportMonth`)}
                    <input
                      type="month"
                      value={monthValue}
                      max={currentMonth}
                      onChange={(event) => setMonthValue(event.target.value || currentMonth)}
                      className={controlClass}
                    />
                  </label>
                ) : null}
                <button
                  type="button"
                  aria-label={t(`${TK}.nextPeriod`)}
                  title={t(`${TK}.nextPeriod`)}
                  disabled={!canMoveToNext}
                  onClick={() => shiftSelectedPeriod(1)}
                  className={`${secondaryActionClass} h-11 w-11 px-0`}
                >
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            ) : (
              <>
                <label className="grid min-w-[155px] flex-1 gap-1 text-[10px] font-bold text-nexoraMuted sm:flex-none">
                  {t(`${TK}.fromDate`)}
                  <input
                    type="date"
                    value={fromDate}
                    max={today}
                    onChange={(event) => setFromDate(event.target.value)}
                    className={controlClass}
                  />
                </label>
                <label className="grid min-w-[155px] flex-1 gap-1 text-[10px] font-bold text-nexoraMuted sm:flex-none">
                  {t(`${TK}.toDate`)}
                  <input
                    type="date"
                    value={toDate}
                    max={today}
                    onChange={(event) => setToDate(event.target.value)}
                    className={controlClass}
                  />
                </label>
                <button type="button" onClick={runRangeReport} className={primaryActionClass}>
                  {t(`${TK}.runReport`)}
                </button>
              </>
            )}
          </div>
        </div>
        {rangeError ? (
          <p className="mt-2 text-xs font-bold text-rose-600" role="alert">
            {t(`${TK}.${rangeError === 'length' ? 'rangeTooLong' : 'rangeError'}`)}
          </p>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-0.5">
        <h3 className="text-sm font-extrabold text-nexoraText">{periodTitle}</h3>
        {dateLabel ? (
          <p className="text-xs font-semibold text-nexoraMuted">
            {dateLabel}
            <span className="px-1.5 text-nexoraBorder">•</span>
            {businessTimeZone}
          </p>
        ) : null}
      </div>

      {reportQuery.isPending ? (
        <div className="nexora-card p-5">
          <SkeletonList count={4} lines={2} />
        </div>
      ) : null}

      {reportQuery.isError ? (
        <div className="nexora-card p-5 text-center" role="alert">
          <p className="text-sm font-bold text-rose-600">{t(`${TK}.loadError`)}</p>
          <button
            type="button"
            onClick={() => void reportQuery.refetch()}
            className={`${secondaryActionClass} mt-3`}
          >
            {t(`${TK}.retry`)}
          </button>
        </div>
      ) : null}

      {isReady ? (
        <div className="space-y-3">
          <ServiceIncomeBarChart
            title={t(`${TK}.chart.revenueTitle`)}
            totalValue={formatCurrency(totals?.servicesNet ?? 0)}
            totalCaption={t(`${TK}.chart.netRevenueCaption`)}
            bars={revenueBars}
            emptyLabel={t(`${TK}.empty`)}
            onSelectBar={hasRows ? setActiveRowKey : null}
            expandLabel={expandLabel(revenueExpanded)}
            onToggleExpand={() => setRevenueExpanded((previous) => !previous)}
            isExpanded={revenueExpanded}
            isStale={reportQuery.isFetching}
          />
          <ServiceIncomeBarChart
            title={t(`${TK}.chart.countTitle`)}
            totalValue={new Intl.NumberFormat(locale).format(totals?.completedCount ?? 0)}
            totalCaption={t(`${TK}.chart.serviceLinesCaption`)}
            bars={countBars}
            emptyLabel={t(`${TK}.empty`)}
            onSelectBar={hasRows ? setActiveRowKey : null}
            expandLabel={expandLabel(countExpanded)}
            onToggleExpand={() => setCountExpanded((previous) => !previous)}
            isExpanded={countExpanded}
            isStale={reportQuery.isFetching}
          />
        </div>
      ) : null}

      {activeRow ? (
        <ServiceIncomeLinesModal
          // Remount per row so the page number starts at 1 instead of carrying over.
          key={activeRowKey ?? ''}
          params={params}
          row={activeRow}
          rowLabel={rowLabel(activeRow)}
          periodLabel={[periodTitle, dateLabel].filter(Boolean).join(' • ')}
          onClose={() => setActiveRowKey(null)}
        />
      ) : null}
    </section>
  )
}
