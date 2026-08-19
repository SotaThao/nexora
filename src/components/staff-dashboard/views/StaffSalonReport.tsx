import { useMemo, useState } from 'react'
import { BarChart3, CalendarDays, Info, Store } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'

import { useTranslation } from '../../../contexts/LanguageContext'
import { useStaffBusinesses } from '../../../data/hooks/useStaffSelf'
import {
  STAFF_BUSINESS_LINK_STATUS,
  resolveStaffBusinessLinkStatusLabel,
} from '../../../utils/staffBusinessLinkStatus'
import { sortSalonBusinesses } from '../utils/staffSalonDisplay'

const REPORT_TABS = ['daily', 'weekly', 'monthly', 'yearly'] as const

type ReportTab = (typeof REPORT_TABS)[number]

type ReportMetric = {
  key: 'turns' | 'hours' | 'service' | 'commission' | 'tip' | 'commissionPercent' | 'techTakes'
  value: number
  format: 'number' | 'decimal' | 'currency' | 'percent'
}

const PREVIEW_REPORT: Record<ReportTab, ReportMetric[]> = {
  daily: [
    { key: 'turns', value: 6, format: 'number' },
    { key: 'hours', value: 8, format: 'decimal' },
    { key: 'service', value: 480, format: 'currency' },
    { key: 'commission', value: 192, format: 'currency' },
    { key: 'tip', value: 86.5, format: 'currency' },
    { key: 'commissionPercent', value: 40, format: 'percent' },
    { key: 'techTakes', value: 278.5, format: 'currency' },
  ],
  weekly: [
    { key: 'turns', value: 32, format: 'number' },
    { key: 'hours', value: 41.5, format: 'decimal' },
    { key: 'service', value: 2740, format: 'currency' },
    { key: 'commission', value: 1096, format: 'currency' },
    { key: 'tip', value: 426, format: 'currency' },
    { key: 'commissionPercent', value: 40, format: 'percent' },
    { key: 'techTakes', value: 1522, format: 'currency' },
  ],
  monthly: [
    { key: 'turns', value: 134, format: 'number' },
    { key: 'hours', value: 176, format: 'decimal' },
    { key: 'service', value: 11680, format: 'currency' },
    { key: 'commission', value: 4672, format: 'currency' },
    { key: 'tip', value: 1814.5, format: 'currency' },
    { key: 'commissionPercent', value: 40, format: 'percent' },
    { key: 'techTakes', value: 6486.5, format: 'currency' },
  ],
  yearly: [
    { key: 'turns', value: 1482, format: 'number' },
    { key: 'hours', value: 1918.5, format: 'decimal' },
    { key: 'service', value: 128450, format: 'currency' },
    { key: 'commission', value: 51380, format: 'currency' },
    { key: 'tip', value: 19426, format: 'currency' },
    { key: 'commissionPercent', value: 40, format: 'percent' },
    { key: 'techTakes', value: 70806, format: 'currency' },
  ],
}

function toLocalIsoDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getIsoWeek(date: Date): number {
  const utcDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNumber = utcDate.getUTCDay() || 7
  utcDate.setUTCDate(utcDate.getUTCDate() + 4 - dayNumber)
  const yearStart = new Date(Date.UTC(utcDate.getUTCFullYear(), 0, 1))
  return Math.ceil((((utcDate.getTime() - yearStart.getTime()) / 86_400_000) + 1) / 7)
}

export default function StaffSalonReport() {
  const { t, currentLanguage } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()
  const { data: businesses = [], isPending: isBusinessesPending } = useStaffBusinesses()
  const now = useMemo(() => new Date(), [])
  const requestedTab = searchParams.get('tab')
  const activeTab: ReportTab = REPORT_TABS.includes(requestedTab as ReportTab)
    ? requestedTab as ReportTab
    : 'daily'
  const [selectedDate, setSelectedDate] = useState(() => toLocalIsoDate(now))
  const [selectedWeek, setSelectedWeek] = useState(() => String(getIsoWeek(now)))
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
  const selectedSalonId = requestedSalonId
    && activeBusinesses.some((business) => business.businessId === requestedSalonId)
    ? requestedSalonId
    : 'all'

  const years = useMemo(
    () => Array.from({ length: 6 }, (_, index) => now.getFullYear() - index),
    [now],
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
  const metrics = PREVIEW_REPORT[activeTab]
  const controlClass = 'h-10 min-w-36 rounded-xl border border-nexoraBorder bg-white px-3 text-sm font-bold text-nexoraText outline-none transition focus:border-nexoraBrand focus:ring-2 focus:ring-nexoraBrand/15'

  const formatMetric = (metric: ReportMetric) => {
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

  const setSelectedSalon = (businessId: string) => {
    const next = new URLSearchParams(searchParams)
    if (businessId === 'all') next.delete('salon')
    else next.set('salon', businessId)
    setSearchParams(next, { replace: true })
  }

  const renderYearSelect = () => (
    <label className="flex min-w-36 flex-col gap-1.5 text-xs font-bold text-nexoraMuted">
      <span className="sr-only">{t('staff_salon_report.filters.year')}</span>
      <select
        aria-label={t('staff_salon_report.filters.year')}
        value={selectedYear}
        onChange={(event) => setSelectedYear(event.target.value)}
        className={controlClass}
      >
        {years.map((year) => <option key={year} value={year}>{year}</option>)}
      </select>
    </label>
  )

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
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
        <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-[11px] font-extrabold text-amber-700">
          <Info className="h-3.5 w-3.5" aria-hidden="true" />
          {t('staff_salon_report.preview_badge')}
        </span>
      </div>

      <section className="overflow-hidden rounded-2xl border border-nexoraBorder bg-white shadow-sm">
        <div
          role="group"
          aria-label={t('staff_salon_report.filters.salon_group')}
          className="flex flex-wrap items-center gap-3 border-b border-nexoraBorder bg-nexoraSurfaceMuted/60 p-4 sm:px-5"
        >
          <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-nexoraMuted">
            <Store className="h-4 w-4 text-nexoraBrand" aria-hidden="true" />
            {t('staff_salon_report.salon_filter_title')}
          </div>

          <select
            aria-label={t('staff_salon_report.filters.salon')}
            value={selectedSalonId}
            disabled={isBusinessesPending || activeBusinesses.length === 0}
            onChange={(event) => setSelectedSalon(event.target.value)}
            className={`${controlClass} w-64 max-w-full disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-nexoraMuted`}
          >
            {isBusinessesPending ? (
              <option value="all">{t('staff_salon_report.filters.loading_salons')}</option>
            ) : activeBusinesses.length === 0 ? (
              <option value="all">{t('staff_salon_report.filters.no_linked_salons')}</option>
            ) : (
              <>
                <option value="all">{t('staff_salon_report.filters.all_salons')}</option>
                {activeBusinesses.map((business) => (
                  <option key={business.businessId} value={business.businessId}>
                    {business.businessName}
                  </option>
                ))}
              </>
            )}
          </select>
        </div>

        <div className="border-b border-nexoraBorder px-4 pt-3 sm:px-5">
          <div className="flex gap-1 overflow-x-auto" role="tablist" aria-label={t('staff_salon_report.period_label')}>
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
                  {t(`staff_salon_report.tabs.${tab}`)}
                  {isActive && <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-nexoraBrand" />}
                </button>
              )
            })}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 bg-nexoraSurfaceMuted/60 p-4 sm:px-5">
          <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-nexoraMuted">
            <CalendarDays className="h-4 w-4 text-nexoraBrand" aria-hidden="true" />
            {t('staff_salon_report.filter_title')}
          </div>

          <div className="flex flex-wrap gap-3">
            {activeTab === 'daily' && (
              <label className="flex min-w-44 flex-col gap-1.5 text-xs font-bold text-nexoraMuted">
                <span className="sr-only">{t('staff_salon_report.filters.date')}</span>
                <input
                  type="date"
                  aria-label={t('staff_salon_report.filters.date')}
                  value={selectedDate}
                  onChange={(event) => setSelectedDate(event.target.value)}
                  className={controlClass}
                />
              </label>
            )}

            {activeTab === 'weekly' && (
              <>
                <label className="flex min-w-36 flex-col gap-1.5 text-xs font-bold text-nexoraMuted">
                  <span className="sr-only">{t('staff_salon_report.filters.week')}</span>
                  <select
                    aria-label={t('staff_salon_report.filters.week')}
                    value={selectedWeek}
                    onChange={(event) => setSelectedWeek(event.target.value)}
                    className={controlClass}
                  >
                    {Array.from({ length: 53 }, (_, index) => index + 1).map((week) => (
                      <option key={week} value={week}>
                        {t('staff_salon_report.filters.week_option', { week })}
                      </option>
                    ))}
                  </select>
                </label>
                {renderYearSelect()}
              </>
            )}

            {activeTab === 'monthly' && (
              <>
                <label className="flex min-w-40 flex-col gap-1.5 text-xs font-bold text-nexoraMuted">
                  <span className="sr-only">{t('staff_salon_report.filters.month')}</span>
                  <select
                    aria-label={t('staff_salon_report.filters.month')}
                    value={selectedMonth}
                    onChange={(event) => setSelectedMonth(event.target.value)}
                    className={controlClass}
                  >
                    {months.map((month) => (
                      <option key={month.value} value={month.value}>{month.label}</option>
                    ))}
                  </select>
                </label>
                {renderYearSelect()}
              </>
            )}

            {activeTab === 'yearly' && renderYearSelect()}
          </div>
        </div>

        <div
          id="staff-report-panel"
          role="tabpanel"
          aria-labelledby={`staff-report-tab-${activeTab}`}
          className="p-4 sm:p-5"
        >
          <div className="hidden overflow-x-auto rounded-xl border border-nexoraBorder md:block">
            <table className="w-full min-w-[920px] table-fixed text-left">
              <thead className="bg-nexoraCanvas">
                <tr>
                  {metrics.map((metric) => (
                    <th key={metric.key} scope="col" className="px-4 py-3 text-[10px] font-extrabold uppercase tracking-wider text-nexoraMuted">
                      {t(`staff_salon_report.metrics.${metric.key}`)}
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
                  {t(`staff_salon_report.metrics.${metric.key}`)}
                </div>
                <div className="mt-1.5 text-base font-black text-nexoraText">{formatMetric(metric)}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
