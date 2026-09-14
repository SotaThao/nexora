import { useMemo, useState } from 'react'
import { BarChart3, CalendarDays, ChevronDown, ChevronLeft, ChevronRight, Store } from 'lucide-react'
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

import './staffSalonReport.css'

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
        month: 'short',
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
        { key: 'pay', value: summary?.pay ?? null, format: 'currency' },
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
  const controlClass = 'box-border h-11 min-w-0 max-w-full rounded-xl border border-nexoraBrand/25 bg-white px-3 text-sm font-bold text-nexoraText outline-none transition focus:border-nexoraBrand focus:ring-2 focus:ring-nexoraBrand/15'

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

  const periodNavigationClass = 'inline-flex h-11 w-9 shrink-0 items-center justify-center rounded-xl border border-nexoraBrand/25 bg-white text-nexoraBrand transition hover:bg-nexoraBrandSoft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nexoraBrand/30 disabled:cursor-not-allowed disabled:opacity-40'

  const canMovePeriod = (direction: -1 | 1) => {
    if (activeTab === 'daily') return true
    if (activeTab === 'weekly') {
      return direction === -1
        ? Number(selectedWeekYear) > weekYears[weekYears.length - 1] || Number(selectedWeek) > 1
        : Number(selectedWeekYear) < weekYears[0] || Number(selectedWeek) < getIsoWeeksInYear(Number(selectedWeekYear))
    }
    return direction === -1
      ? Number(selectedYear) > years[years.length - 1] || (activeTab === 'monthly' && Number(selectedMonth) > 1)
      : Number(selectedYear) < years[0] || (activeTab === 'monthly' && Number(selectedMonth) < 12)
  }

  const movePeriod = (direction: -1 | 1) => {
    if (!canMovePeriod(direction)) return
    if (activeTab === 'daily') {
      const date = new Date(`${selectedDate}T12:00:00`)
      date.setDate(date.getDate() + direction)
      setSelectedDate(toLocalIsoDate(date))
    } else if (activeTab === 'weekly') {
      const date = new Date(`${getIsoWeekStart(Number(selectedWeekYear), Number(selectedWeek))}T12:00:00`)
      date.setDate(date.getDate() + direction * 7)
      const next = getIsoWeekSelection(date)
      setSelectedWeek(String(next.week))
      setSelectedWeekYear(String(next.year))
    } else if (activeTab === 'monthly') {
      const date = new Date(Number(selectedYear), Number(selectedMonth) - 1 + direction, 1, 12)
      setSelectedMonth(String(date.getMonth() + 1))
      setSelectedYear(String(date.getFullYear()))
    } else {
      setSelectedYear(String(Number(selectedYear) + direction))
    }
  }

  const renderYearSelect = (
    value: string,
    onChange: (value: string) => void,
    options = years,
    isFullWidth = false,
  ) => (
    <label className={`relative flex min-w-0 flex-col gap-1.5 text-xs font-bold text-nexoraMuted ${
      isFullWidth ? 'w-full' : 'w-[80px] shrink-0'
    }`}>
      <span className="sr-only">{t('staff_salon_report.year')}</span>
      <select
        aria-label={t('staff_salon_report.year')}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={`${controlClass} w-full appearance-none pr-7 ${isFullWidth ? 'pl-10' : 'pl-2'}`}
      >
        {options.map((year) => <option key={year} value={year}>{year}</option>)}
      </select>
      <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-nexoraMuted" />
    </label>
  )

  return (
    <div className="staff-salon-report min-w-0 max-w-full space-y-4 sm:space-y-5">
      <div>
        <div>
          <div className="mb-1.5 flex items-center gap-2 sm:mb-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-nexoraBrandSoft text-nexoraBrand sm:h-9 sm:w-9 sm:rounded-xl">
              <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
            </span>
            <h1 className="text-nexoraText text-xl lg:text-2xl font-semibold leading-snug">
              {t('staff_salon_report.title')}
            </h1>
          </div>
          <p className="text-nexoraMuted text-[13px] font-normal leading-5">
            {t('staff_salon_report.subtitle')}
          </p>
        </div>
      </div>

      <section className="space-y-3">
        <div
          role="group"
          aria-label={t('staff_salon_report.filters_group')}
          className="flex flex-col gap-3 rounded-2xl bg-white p-3.5 sm:p-5 lg:flex-row lg:items-stretch lg:gap-4"
        >
          <div
            role="group"
            aria-label={t('staff_salon_report.scope')}
            className="min-w-0 lg:flex-1"
          >
            <div className="text-xs font-extrabold text-nexoraBrand sm:text-xs">
              {t('staff_salon_report.scope')}
            </div>

            <div className="relative mt-1.5">
              <Store
                className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-nexoraBrand"
                aria-hidden="true"
              />
              <select
                aria-label={t('staff_salon_report.scope')}
                value={selectedSourceValue}
                onChange={(event) => setSelectedSource(event.target.value)}
                className={`${controlClass} w-full appearance-none pl-10 pr-9`}
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
              <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-nexoraMuted" />
            </div>
          </div>

          <span aria-hidden="true" className="hidden w-px self-stretch bg-nexoraBorder lg:block" />

          <div
            className="flex h-[52px] w-full max-w-full shrink-0 items-center gap-1 self-start rounded-xl bg-nexoraBrandSoft p-1 sm:w-fit lg:mt-0 lg:self-end"
            role="tablist"
            aria-label={t('staff_salon_report.period')}
          >
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
                  className={`inline-flex h-11 min-w-0 flex-1 items-center justify-center whitespace-nowrap rounded-lg px-2 py-0 text-xs font-semibold leading-4 transition sm:flex-none sm:px-3 sm:text-xs ${
                    isActive
                      ? 'bg-nexoraBrand text-white shadow-sm'
                      : 'text-nexoraBrand hover:bg-white/70 hover:text-nexoraBrandDark'
                  }`}
                >
                  {t(`staff_salon_report.${tab}`)}
                </button>
              )
            })}
          </div>

          <span aria-hidden="true" className="hidden w-px self-stretch bg-nexoraBorder lg:block" />

          <div className="min-w-0 lg:flex-1">
            <div className="text-xs font-extrabold text-violet-700 sm:text-xs">
              {t('staff_salon_report.period')}
            </div>

            <div className="mt-1.5 flex items-center gap-1.5">
              <button
                type="button"
                aria-label={t('staff_salon_report.previousPeriod')}
                title={t('staff_salon_report.previousPeriod')}
                disabled={!canMovePeriod(-1)}
                onClick={() => movePeriod(-1)}
                className={periodNavigationClass}
              >
                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              </button>
              <div className="relative min-w-0 flex-1">
                <CalendarDays
                  className={`pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-nexoraBrand ${activeTab === 'weekly' || activeTab === 'monthly' ? 'hidden sm:block' : ''}`}
                  aria-hidden="true"
                />
                <div className="flex w-full min-w-0 flex-nowrap gap-2">
                  {activeTab === 'daily' && (
                    <label className="flex w-full min-w-0 flex-col gap-1.5 text-xs font-bold text-nexoraMuted">
                      <span className="sr-only">{t('staff_salon_report.date')}</span>
                      <input
                        type="date"
                        data-staff-report-date
                        aria-label={t('staff_salon_report.date')}
                        value={selectedDate}
                        onChange={(event) => {
                          if (event.target.value) setSelectedDate(event.target.value)
                        }}
                        className={`${controlClass} w-full pl-10`}
                      />
                    </label>
                  )}

                  {activeTab === 'weekly' && (
                    <>
                      <label className="relative flex min-w-0 flex-1 flex-col gap-1.5 text-xs font-bold text-nexoraMuted">
                        <span className="sr-only">{t('staff_salon_report.week')}</span>
                        <select
                          aria-label={t('staff_salon_report.week')}
                          value={selectedWeek}
                          onChange={(event) => setSelectedWeek(event.target.value)}
                          className={`${controlClass} w-full appearance-none pl-2 pr-6 sm:pl-10 sm:pr-9`}
                        >
                          {availableWeeks.map((week) => (
                            <option key={week} value={week}>
                              {t('staff_salon_report.filters.week_option', { week })}
                            </option>
                          ))}
                        </select>
                        <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-nexoraMuted" />
                      </label>
                      {renderYearSelect(selectedWeekYear, setSelectedIsoWeekYear, weekYears)}
                    </>
                  )}

                  {activeTab === 'monthly' && (
                    <>
                      <label className="relative flex min-w-0 flex-1 flex-col gap-1.5 text-xs font-bold text-nexoraMuted">
                        <span className="sr-only">{t('staff_salon_report.month')}</span>
                        <select
                          aria-label={t('staff_salon_report.month')}
                          value={selectedMonth}
                          onChange={(event) => setSelectedMonth(event.target.value)}
                          className={`${controlClass} w-full appearance-none pl-2 pr-6 sm:pl-10 sm:pr-9`}
                        >
                          {months.map((month) => (
                            <option key={month.value} value={month.value}>{month.label}</option>
                          ))}
                        </select>
                        <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-nexoraMuted" />
                      </label>
                      {renderYearSelect(selectedYear, setSelectedYear)}
                    </>
                  )}

                  {activeTab === 'yearly' && (
                    renderYearSelect(selectedYear, setSelectedYear, years, true)
                  )}
                </div>
              </div>
              <button
                type="button"
                aria-label={t('staff_salon_report.nextPeriod')}
                title={t('staff_salon_report.nextPeriod')}
                disabled={!canMovePeriod(1)}
                onClick={() => movePeriod(1)}
                className={periodNavigationClass}
              >
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>

        <div
          id="staff-report-panel"
          role="tabpanel"
          aria-labelledby={`staff-report-tab-${activeTab}`}
          className="rounded-2xl bg-white p-3.5 sm:p-5"
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
                className="mt-3 h-10 rounded-lg bg-nexoraBrand px-4 text-xs font-semibold text-white transition hover:bg-nexoraBrandDark"
              >
                {t('staff_salon_report.states.retry')}
              </button>
            </div>
          ) : (
            <>
              <div className="hidden overflow-x-auto rounded-xl border border-nexoraBorder md:block">
                <table
                  className={`w-full table-fixed text-left ${
                    metrics.length > 5 ? 'min-w-[840px]' : 'min-w-[560px]'
                  }`}
                >
                  <thead>
                    <tr>
                      {metrics.map((metric) => {
                        const isPrimary = metric.key === 'income' || metric.key === 'techTakes'
                        const isActivity = metric.key === 'turns' || metric.key === 'totalHours'
                        const isService = metric.key === 'service'
                          || metric.key === 'pay'
                          || metric.key === 'commission'
                          || metric.key === 'commissionPercent'
                        const isTip = metric.key === 'tip'
                        const headerTone = isPrimary
                          ? 'bg-nexoraBrandSoft text-nexoraBrand'
                          : isActivity
                            ? 'bg-sky-50 text-sky-700'
                            : isService
                              ? 'bg-violet-50 text-violet-700'
                              : isTip
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-amber-50 text-amber-700'

                        return (
                          <th key={metric.key} scope="col" className={`px-4 py-3.5 text-xs font-extrabold ${headerTone}`}>
                            {t(`staff_salon_report.${metric.key}`)}
                          </th>
                        )
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-t border-nexoraBorder">
                      {metrics.map((metric) => (
                        <td key={metric.key} className="px-4 py-5 text-base font-extrabold text-nexoraText">
                          {formatMetric(metric)}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>

              <dl
                role="list"
                aria-label={t('staff_salon_report.summary')}
                className="grid grid-cols-2 gap-2.5 md:hidden"
              >
                {metrics.map((metric) => {
                  const isFullWidth = selectedSourceValue === ALL_SOURCES_VALUE
                    ? metric.key === 'income' || metric.key === 'otherIncome'
                    : selectedSourceValue === INDEPENDENT_SOURCE_VALUE
                      ? metric.key === 'income'
                      : metric.key === 'service'
                  const isPrimary = metric.key === 'income' || metric.key === 'techTakes'
                  const isActivity = metric.key === 'turns' || metric.key === 'totalHours'
                  const isService = metric.key === 'service'
                    || metric.key === 'pay'
                    || metric.key === 'commission'
                    || metric.key === 'commissionPercent'
                  const isTip = metric.key === 'tip'
                  const cardTone = isPrimary
                    ? 'bg-nexoraBrand shadow-sm'
                    : isActivity
                      ? 'bg-sky-50'
                      : isService
                        ? 'bg-violet-50'
                        : isTip
                          ? 'bg-emerald-50'
                          : 'bg-amber-50'
                  const labelTone = isPrimary
                    ? 'text-white/80'
                    : isActivity
                      ? 'text-sky-700'
                      : isService
                        ? 'text-violet-700'
                        : isTip
                          ? 'text-emerald-700'
                          : 'text-amber-700'

                  return (
                    <div
                      key={metric.key}
                      role="listitem"
                      className={`min-w-0 rounded-xl p-2.5 sm:p-3.5 ${
                        isFullWidth ? 'col-span-2' : ''
                      } ${cardTone}`}
                    >
                      <dt className={`text-xs font-semibold leading-4 ${labelTone}`}>
                        {t(`staff_salon_report.${metric.key}`)}
                      </dt>
                      <dd className={`mt-1 break-words font-semibold leading-6 tabular-nums ${
                        isPrimary ? 'text-white' : 'text-nexoraText'
                      } ${
                        isFullWidth ? 'text-xl' : 'text-lg'
                      }`}>
                        {formatMetric(metric)}
                      </dd>
                    </div>
                  )
                })}
              </dl>
            </>
          )}
        </div>
      </section>
    </div>
  )
}
