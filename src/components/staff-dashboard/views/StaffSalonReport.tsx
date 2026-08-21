import { useMemo, useState } from 'react'
import { BarChart3, CalendarDays, Store } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'

import {
  StaffIncomeReportPeriod,
  StaffIncomeReportScope,
} from '../../../constants/staffIncomeReport'
import { useTranslation } from '../../../contexts/LanguageContext'
import { useStaffIncomeReport } from '../../../data/hooks/useStaffIncomeReport'
import { useStaffBusinesses } from '../../../data/hooks/useStaffSelf'
import type {
  StaffIncomeReportParams,
  StaffIncomeReportScopeParams,
} from '../../../data/repositories/staffIncomeReport'
import {
  STAFF_BUSINESS_LINK_STATUS,
  resolveStaffBusinessLinkStatusLabel,
} from '../../../utils/staffBusinessLinkStatus'
import { sortSalonBusinesses } from '../utils/staffSalonDisplay'

const REPORT_TABS = ['daily', 'weekly', 'monthly', 'yearly'] as const

type ReportTab = (typeof REPORT_TABS)[number]

type ReportMetric = {
  key: 'turns' | 'totalHours' | 'service' | 'pay' | 'commission' | 'tip' | 'commissionPercent' | 'techTakes' | 'income' | 'otherIncome' | 'paidAmount' | 'directPayments' | 'selfReportedIncome'
  value: number | null
  format: 'number' | 'decimal' | 'currency' | 'percent'
}

const ALL_SOURCES_VALUE = 'all'
const INDEPENDENT_SOURCE_VALUE = 'independent'

function toLocalIsoDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getIsoWeekSelection(date: Date): { week: number; year: number } {
  const utcDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNumber = utcDate.getUTCDay() || 7
  utcDate.setUTCDate(utcDate.getUTCDate() + 4 - dayNumber)
  const yearStart = new Date(Date.UTC(utcDate.getUTCFullYear(), 0, 1))
  return {
    week: Math.ceil((((utcDate.getTime() - yearStart.getTime()) / 86_400_000) + 1) / 7),
    year: utcDate.getUTCFullYear(),
  }
}

function getIsoWeekStart(year: number, week: number): string {
  const januaryFourth = new Date(Date.UTC(year, 0, 4))
  const januaryFourthDay = januaryFourth.getUTCDay() || 7
  const monday = new Date(januaryFourth)
  monday.setUTCDate(januaryFourth.getUTCDate() - januaryFourthDay + 1 + ((week - 1) * 7))
  return monday.toISOString().slice(0, 10)
}

function getIsoWeeksInYear(year: number): number {
  return getIsoWeekSelection(new Date(year, 11, 28, 12)).week
}

export default function StaffSalonReport() {
  const { t, currentLanguage } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()
  const { data: businesses = [], isPending: isBusinessesPending } = useStaffBusinesses()
  const now = useMemo(() => new Date(), [])
  const currentIsoWeek = useMemo(() => getIsoWeekSelection(now), [now])
  const requestedTab = searchParams.get('tab')
  const activeTab: ReportTab = REPORT_TABS.includes(requestedTab as ReportTab)
    ? requestedTab as ReportTab
    : 'daily'
  const [selectedDate, setSelectedDate] = useState(() => toLocalIsoDate(now))
  const [selectedWeek, setSelectedWeek] = useState(() => String(currentIsoWeek.week))
  const [selectedWeekYear, setSelectedWeekYear] = useState(() => String(currentIsoWeek.year))
  const [selectedMonth, setSelectedMonth] = useState(() => String(now.getMonth() + 1))
  const [selectedYear, setSelectedYear] = useState(() => String(now.getFullYear()))

  const activeBusinesses = useMemo(
    () => sortSalonBusinesses(
      businesses.filter(
        (business) => resolveStaffBusinessLinkStatusLabel(business).trim().toLowerCase()
          === STAFF_BUSINESS_LINK_STATUS.active,
      ),
    ),
    [businesses],
  )
  const requestedSalonId = searchParams.get('salon')
  const selectedSourceValue = requestedSalonId
    && activeBusinesses.some((business) => business.businessId === requestedSalonId)
    ? requestedSalonId
    : requestedSalonId === INDEPENDENT_SOURCE_VALUE
      ? INDEPENDENT_SOURCE_VALUE
      : ALL_SOURCES_VALUE

  const years = useMemo(
    () => Array.from({ length: 6 }, (_, index) => now.getFullYear() - index),
    [now],
  )
  const weekYears = useMemo(
    () => Array.from({ length: 7 }, (_, index) => now.getFullYear() + 1 - index),
    [now],
  )
  const availableWeeks = useMemo(
    () => Array.from({ length: getIsoWeeksInYear(Number(selectedWeekYear)) }, (_, index) => index + 1),
    [selectedWeekYear],
  )
  const months = useMemo(
    () => Array.from({ length: 12 }, (_, index) => ({
      value: String(index + 1),
      label: new Intl.DateTimeFormat(currentLanguage === 'vi' ? 'vi-VN' : 'en-US', {
        month: 'long',
      }).format(new Date(2024, index, 1)),
    })),
    [currentLanguage],
  )
  const currencyFormatter = useMemo(
    () => new Intl.NumberFormat(currentLanguage === 'vi' ? 'vi-VN' : 'en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }),
    [currentLanguage],
  )
  const reportParams = useMemo<StaffIncomeReportParams>(() => {
    const scopeParams: StaffIncomeReportScopeParams = selectedSourceValue === INDEPENDENT_SOURCE_VALUE
      ? { scope: StaffIncomeReportScope.Independent }
      : selectedSourceValue === ALL_SOURCES_VALUE
        ? { scope: StaffIncomeReportScope.All }
        : { scope: StaffIncomeReportScope.Business, businessId: selectedSourceValue }

    switch (activeTab) {
      case 'weekly':
        return {
          ...scopeParams,
          period: StaffIncomeReportPeriod.Weekly,
          weekStart: getIsoWeekStart(Number(selectedWeekYear), Number(selectedWeek)),
        }
      case 'monthly':
        return {
          ...scopeParams,
          period: StaffIncomeReportPeriod.Monthly,
          month: Number(selectedMonth),
          year: Number(selectedYear),
        }
      case 'yearly':
        return {
          ...scopeParams,
          period: StaffIncomeReportPeriod.Yearly,
          year: Number(selectedYear),
        }
      default:
        return {
          ...scopeParams,
          period: StaffIncomeReportPeriod.Daily,
          date: selectedDate,
        }
    }
  }, [
    activeTab,
    selectedDate,
    selectedMonth,
    selectedSourceValue,
    selectedWeek,
    selectedWeekYear,
    selectedYear,
  ])
  const shouldLoadReport = !requestedSalonId
    || requestedSalonId === INDEPENDENT_SOURCE_VALUE
    || !isBusinessesPending
  const reportQuery = useStaffIncomeReport(reportParams, { enabled: shouldLoadReport })
  const summary = reportQuery.data?.summary
  const sources = reportQuery.data?.sources
  const metrics: ReportMetric[] = selectedSourceValue === ALL_SOURCES_VALUE
    ? [
        { key: 'income', value: summary?.income ?? null, format: 'currency' },
        { key: 'service', value: summary?.pay ?? null, format: 'currency' },
        { key: 'tip', value: summary?.tip ?? null, format: 'currency' },
        { key: 'otherIncome', value: summary?.otherIncome ?? null, format: 'currency' },
      ]
    : selectedSourceValue === INDEPENDENT_SOURCE_VALUE
      ? [
          { key: 'income', value: summary?.income ?? null, format: 'currency' },
          { key: 'directPayments', value: sources?.directPayments ?? null, format: 'currency' },
          { key: 'selfReportedIncome', value: sources?.selfReportedIncome ?? null, format: 'currency' },
        ]
      : [
          { key: 'turns', value: summary?.turns ?? null, format: 'number' },
          { key: 'totalHours', value: summary?.totalHours ?? null, format: 'decimal' },
          { key: 'service', value: summary?.service ?? null, format: 'currency' },
          { key: 'commission', value: summary?.commission ?? null, format: 'currency' },
          { key: 'commissionPercent', value: summary?.commissionPercent ?? null, format: 'percent' },
          { key: 'tip', value: summary?.tip ?? null, format: 'currency' },
          { key: 'techTakes', value: summary?.techTakes ?? null, format: 'currency' },
        ]
  const controlClass = 'h-10 min-w-36 rounded-xl border border-nexoraBorder bg-white px-3 text-sm font-bold text-nexoraText outline-none transition focus:border-nexoraBrand focus:ring-2 focus:ring-nexoraBrand/15'

  const formatMetric = (metric: ReportMetric) => {
    if (metric.value === null) return '—'
    if (metric.format === 'currency') return currencyFormatter.format(metric.value)
    if (metric.format === 'percent') return `${metric.value}%`
    if (metric.format === 'decimal') return metric.value.toFixed(1)
    return new Intl.NumberFormat(currentLanguage === 'vi' ? 'vi-VN' : 'en-US').format(metric.value)
  }

  const setActiveTab = (tab: ReportTab) => {
    const next = new URLSearchParams(searchParams)
    if (tab === 'daily') next.delete('tab')
    else next.set('tab', tab)
    setSearchParams(next, { replace: true })
  }

  const setSelectedSource = (sourceValue: string) => {
    const next = new URLSearchParams(searchParams)
    if (sourceValue === ALL_SOURCES_VALUE) next.delete('salon')
    else next.set('salon', sourceValue)
    setSearchParams(next, { replace: true })
  }

  const setSelectedIsoWeekYear = (yearValue: string) => {
    const maxWeek = getIsoWeeksInYear(Number(yearValue))
    setSelectedWeek((currentWeek) => String(Math.min(Number(currentWeek), maxWeek)))
    setSelectedWeekYear(yearValue)
  }

  const renderYearSelect = (
    value: string,
    onChange: (value: string) => void,
    options = years,
  ) => (
    <label className="flex min-w-36 flex-col gap-1.5 text-xs font-bold text-nexoraMuted">
      <span className="sr-only">{t('staff_salon_report.year')}</span>
      <select
        aria-label={t('staff_salon_report.year')}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={controlClass}
      >
        {options.map((year) => <option key={year} value={year}>{year}</option>)}
      </select>
    </label>
  )

  return (
    <div className="space-y-5">
      <div>
        <div>
          <div className="mb-2 flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-nexoraBrandSoft text-nexoraBrand">
              <BarChart3 className="h-5 w-5" aria-hidden="true" />
            </span>
            <h1 className="text-2xl font-extrabold text-nexoraText sm:text-[30px] sm:leading-9">
              {t('staff_salon_report.title')}
            </h1>
          </div>
          <p className="text-sm font-medium text-nexoraMuted">{t('staff_salon_report.subtitle')}</p>
        </div>
      </div>

      <section className="overflow-hidden rounded-2xl border border-nexoraBorder bg-white shadow-sm">
        <div
          role="group"
          aria-label={t('staff_salon_report.scope')}
          className="flex flex-wrap items-center gap-3 border-b border-nexoraBorder bg-nexoraSurfaceMuted/60 p-4 sm:px-5"
        >
          <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-nexoraMuted">
            <Store className="h-4 w-4 text-nexoraBrand" aria-hidden="true" />
            {t('staff_salon_report.scope')}
          </div>

          <select
            aria-label={t('staff_salon_report.scope')}
            value={selectedSourceValue}
            onChange={(event) => setSelectedSource(event.target.value)}
            className={`${controlClass} w-64 max-w-full`}
          >
            <option value={ALL_SOURCES_VALUE}>{t('staff_salon_report.all')}</option>
            <option value={INDEPENDENT_SOURCE_VALUE}>
              {t('staff_salon_report.independent')}
            </option>
            {activeBusinesses.map((business) => (
              <option key={business.businessId} value={business.businessId}>
                {business.businessName}
              </option>
            ))}
          </select>
        </div>

        <div className="border-b border-nexoraBorder px-4 pt-3 sm:px-5">
          <div className="flex gap-1 overflow-x-auto" role="tablist" aria-label={t('staff_salon_report.period')}>
            {REPORT_TABS.map((tab) => {
              const isActive = activeTab === tab
              return (
                <button
                  key={tab}
                  id={`staff-report-tab-${tab}`}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  aria-controls="staff-report-panel"
                  onClick={() => setActiveTab(tab)}
                  className={`relative min-w-24 px-4 py-3 text-sm font-extrabold transition ${
                    isActive
                      ? 'text-nexoraBrand'
                      : 'text-nexoraMuted hover:text-nexoraText'
                  }`}
                >
                  {t(`staff_salon_report.${tab}`)}
                  {isActive && <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-nexoraBrand" />}
                </button>
              )
            })}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 bg-nexoraSurfaceMuted/60 p-4 sm:px-5">
          <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-nexoraMuted">
            <CalendarDays className="h-4 w-4 text-nexoraBrand" aria-hidden="true" />
            {t('staff_salon_report.period')}
          </div>

          <div className="flex flex-wrap gap-3">
            {activeTab === 'daily' && (
              <label className="flex min-w-44 flex-col gap-1.5 text-xs font-bold text-nexoraMuted">
                <span className="sr-only">{t('staff_salon_report.date')}</span>
                <input
                  type="date"
                  aria-label={t('staff_salon_report.date')}
                  value={selectedDate}
                  onChange={(event) => {
                    if (event.target.value) setSelectedDate(event.target.value)
                  }}
                  className={controlClass}
                />
              </label>
            )}

            {activeTab === 'weekly' && (
              <>
                <label className="flex min-w-36 flex-col gap-1.5 text-xs font-bold text-nexoraMuted">
                  <span className="sr-only">{t('staff_salon_report.week')}</span>
                  <select
                    aria-label={t('staff_salon_report.week')}
                    value={selectedWeek}
                    onChange={(event) => setSelectedWeek(event.target.value)}
                    className={controlClass}
                  >
                    {availableWeeks.map((week) => (
                      <option key={week} value={week}>
                        {t('staff_salon_report.filters.week_option', { week })}
                      </option>
                    ))}
                  </select>
                </label>
                {renderYearSelect(selectedWeekYear, setSelectedIsoWeekYear, weekYears)}
              </>
            )}

            {activeTab === 'monthly' && (
              <>
                <label className="flex min-w-40 flex-col gap-1.5 text-xs font-bold text-nexoraMuted">
                  <span className="sr-only">{t('staff_salon_report.month')}</span>
                  <select
                    aria-label={t('staff_salon_report.month')}
                    value={selectedMonth}
                    onChange={(event) => setSelectedMonth(event.target.value)}
                    className={controlClass}
                  >
                    {months.map((month) => (
                      <option key={month.value} value={month.value}>{month.label}</option>
                    ))}
                  </select>
                </label>
                {renderYearSelect(selectedYear, setSelectedYear)}
              </>
            )}

            {activeTab === 'yearly' && renderYearSelect(selectedYear, setSelectedYear)}
          </div>
        </div>

        <div
          id="staff-report-panel"
          role="tabpanel"
          aria-labelledby={`staff-report-tab-${activeTab}`}
          className="p-4 sm:p-5"
        >
          {reportQuery.isPending ? (
            <div
              role="status"
              className="rounded-xl border border-nexoraBorder bg-nexoraSurfaceMuted/60 px-4 py-8 text-center text-sm font-bold text-nexoraMuted"
            >
              {t('staff_salon_report.loading')}
            </div>
          ) : reportQuery.isError ? (
            <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-8 text-center">
              <p className="text-sm font-bold text-nexoraDanger">
                {t('staff_salon_report.loadError')}
              </p>
              <button
                type="button"
                onClick={() => void reportQuery.refetch()}
                className="mt-3 h-10 rounded-lg bg-nexoraBrand px-4 text-sm font-bold text-white transition hover:bg-nexoraBrandDark"
              >
                {t('staff_salon_report.states.retry')}
              </button>
            </div>
          ) : (
            <>
              <div className="hidden overflow-x-auto rounded-xl border border-nexoraBorder md:block">
                <table className="w-full min-w-[920px] table-fixed text-left">
                  <thead className="bg-nexoraCanvas">
                    <tr>
                      {metrics.map((metric) => (
                        <th key={metric.key} scope="col" className="px-4 py-3 text-[10px] font-extrabold uppercase tracking-wider text-nexoraMuted">
                          {t(`staff_salon_report.${metric.key}`)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-t border-nexoraBorder">
                      {metrics.map((metric) => (
                        <td key={metric.key} className="px-4 py-5 text-sm font-extrabold text-nexoraText">
                          {formatMetric(metric)}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="grid grid-cols-2 gap-3 md:hidden">
                {metrics.map((metric, index) => (
                  <div
                    key={metric.key}
                    className={`rounded-xl border border-nexoraBorder bg-nexoraSurfaceMuted/60 p-3 ${
                      index === metrics.length - 1 ? 'col-span-2' : ''
                    }`}
                  >
                    <div className="text-[10px] font-extrabold uppercase tracking-wider text-nexoraMuted">
                      {t(`staff_salon_report.${metric.key}`)}
                    </div>
                    <div className="mt-1.5 text-base font-black text-nexoraText">{formatMetric(metric)}</div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  )
}
