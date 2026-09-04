import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Mail, Printer, X } from 'lucide-react'
import { useTranslation } from '../../../../../contexts/LanguageContext'
import { useNotification } from '../../../../../contexts/NotificationContext'
import { SkeletonList } from '../../../../ui/skeleton'
import {
  POS_STORE_INCOME_PAYMENT_METHODS,
  POS_STORE_INCOME_SPLIT_PAYMENT_METHOD,
  PosStoreIncomeReportMode,
  type PosStoreIncomePaymentMethod,
} from '../../../../../constants/posStoreIncomeReport'
import {
  useEmailPosStoreIncomeReport,
  useExportPosStoreIncomeReport,
  usePosStoreIncomeReport,
} from '../../../../../data/hooks/usePosStoreIncomeReport'
import type {
  PosStoreIncomeBucket,
  PosStoreIncomeReportParams,
} from '../../../../../data/repositories/posStoreIncomeReport'
import {
  currentIsoWeekKey,
  isoWeekBounds,
  isoWeekKey,
  isoWeeksInYear,
  parseIsoWeekKey,
  todayIso,
} from './posReportPeriod'

const TK = 'components.dashboard.views.pos.reports.storeIncome'

type Props = {
  businessId: string
  businessTimeZone: string
}

const controlClass = 'min-h-11 rounded-lg border border-nexoraBorder bg-white px-3 text-sm font-semibold text-nexoraText outline-none transition focus:border-nexoraBrand focus:ring-2 focus:ring-nexoraBrand/20'
const actionBaseClass = 'inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border px-3 text-xs font-extrabold transition focus:outline-none focus:ring-2 focus:ring-nexoraBrand/20 disabled:cursor-not-allowed disabled:opacity-60'
const secondaryActionClass = `${actionBaseClass} border-nexoraBorder bg-white text-nexoraText hover:bg-nexoraCanvas`
const primaryActionClass = `${actionBaseClass} border-nexoraBrand bg-nexoraBrand text-white hover:bg-nexoraBrandDark`

const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })
const formatMoney = (value: number | null | undefined) => currency.format(value ?? 0)
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

export default function StoreIncomeReportView({ businessId, businessTimeZone }: Props) {
  const { t, currentLanguage } = useTranslation()
  const { showToast } = useNotification()
  const locale = currentLanguage === 'vi' ? 'vi-VN' : 'en-US'
  const today = useMemo(() => todayIso(businessTimeZone), [businessTimeZone])
  const currentWeek = useMemo(() => currentIsoWeekKey(businessTimeZone), [businessTimeZone])
  const currentWeekBounds = useMemo(() => {
    const parsed = parseIsoWeekKey(currentWeek)
    return parsed ? isoWeekBounds(parsed.year, parsed.week) : { start: today, end: today }
  }, [currentWeek, today])
  const currentYear = Number(today.slice(0, 4))
  const [mode, setMode] = useState<PosStoreIncomeReportMode>(PosStoreIncomeReportMode.Day)
  const [dayDate, setDayDate] = useState(today)
  const [weekValue, setWeekValue] = useState(currentWeek)
  const [yearValue, setYearValue] = useState(currentYear)
  const [fromDate, setFromDate] = useState(currentWeekBounds.start)
  const [toDate, setToDate] = useState(currentWeekBounds.end)
  const [appliedRange, setAppliedRange] = useState(currentWeekBounds)
  const [rangeError, setRangeError] = useState<'order' | 'length' | null>(null)
  const [emailOpen, setEmailOpen] = useState(false)
  const [recipientEmail, setRecipientEmail] = useState('')
  const [emailError, setEmailError] = useState(false)
  const [toast, setToast] = useState('')

  const fullDate = useMemo(
    () => new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }),
    [locale],
  )
  const rowDate = useMemo(
    () => new Intl.DateTimeFormat(locale, { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' }),
    [locale],
  )
  const monthName = useMemo(
    () => new Intl.DateTimeFormat(locale, { month: 'short', timeZone: 'UTC' }),
    [locale],
  )

  const params = useMemo<PosStoreIncomeReportParams>(() => {
    if (mode === PosStoreIncomeReportMode.Day) return { businessId, mode, date: dayDate }
    if (mode === PosStoreIncomeReportMode.Week) {
      const parsed = parseIsoWeekKey(weekValue)
      return {
        businessId,
        mode,
        date: parsed ? isoWeekBounds(parsed.year, parsed.week).start : today,
      }
    }
    if (mode === PosStoreIncomeReportMode.Year) return { businessId, mode, year: yearValue }
    return { businessId, mode, from: appliedRange.start, to: appliedRange.end }
  }, [appliedRange.end, appliedRange.start, businessId, dayDate, mode, today, weekValue, yearValue])

  const reportQuery = usePosStoreIncomeReport(params)
  const exportMutation = useExportPosStoreIncomeReport()
  const emailMutation = useEmailPosStoreIncomeReport()
  const report = reportQuery.data
  const daySummary = report?.daySummary
  const rows = report?.buckets ?? []
  const totals = report?.bucketsTotal

  const formatRange = (from: string, to: string) => {
    if (!from || !to) return ''
    const start = dateFromIso(from)
    const end = dateFromIso(to)
    if (from === to) return fullDate.format(start)
    return `${fullDate.format(start)} ${t(`${TK}.dateRangeSeparator`)} ${fullDate.format(end)}`
  }

  const periodTitle = mode === PosStoreIncomeReportMode.Day
    ? (dayDate === today ? t(`${TK}.today`) : t(`${TK}.dayReport`))
    : mode === PosStoreIncomeReportMode.Week
      ? (weekValue === currentWeek ? t(`${TK}.thisWeek`) : t(`${TK}.week`))
      : mode === PosStoreIncomeReportMode.Year
        ? (yearValue === currentYear ? t(`${TK}.thisYear`) : `${t(`${TK}.year`)} ${yearValue}`)
        : t(`${TK}.range`)
  const dateLabel = report?.periodStart && report.periodEnd
    ? formatRange(report.periodStart, report.periodEnd)
    : ''

  const paymentMethods = useMemo<PosStoreIncomePaymentMethod[]>(() => {
    const hasSplitPay = rows.some((row) => POS_STORE_INCOME_SPLIT_PAYMENT_METHOD in row.paymentAmounts)
      || Boolean(totals && POS_STORE_INCOME_SPLIT_PAYMENT_METHOD in totals.paymentAmounts)
    return hasSplitPay
      ? [...POS_STORE_INCOME_PAYMENT_METHODS, POS_STORE_INCOME_SPLIT_PAYMENT_METHOD]
      : [...POS_STORE_INCOME_PAYMENT_METHODS]
  }, [rows, totals])

  const paymentName = (method: string) => {
    const key = method.charAt(0).toLowerCase() + method.slice(1)
    return t(`${TK}.payment.${key}`)
  }

  const selectMode = (next: PosStoreIncomeReportMode) => {
    setMode(next)
    setRangeError(null)
    setToast('')
  }

  const shiftSelectedPeriod = (direction: -1 | 1) => {
    setToast('')
    if (mode === PosStoreIncomeReportMode.Day) {
      setDayDate((previous) => shiftIsoDate(previous, direction))
    } else if (mode === PosStoreIncomeReportMode.Week) {
      setWeekValue((previous) => shiftIsoWeek(previous, direction))
    } else if (mode === PosStoreIncomeReportMode.Year) {
      setYearValue((previous) => previous + direction)
    }
  }

  const canMoveToPrevious = mode !== PosStoreIncomeReportMode.Year || yearValue > 2000
  const canMoveToNext = mode === PosStoreIncomeReportMode.Day
    ? dayDate < today
    : mode === PosStoreIncomeReportMode.Week
      ? weekValue < currentWeek
      : mode === PosStoreIncomeReportMode.Year
        ? yearValue < currentYear
        : false

  const applyRange = () => {
    if (!fromDate || !toDate || fromDate > toDate) {
      setRangeError('order')
      return
    }
    if (rangeLength(fromDate, toDate) > 366) {
      setRangeError('length')
      return
    }
    setRangeError(null)
    setAppliedRange({ start: fromDate, end: toDate })
  }

  const exportPdf = async () => {
    setToast('')
    try {
      const blob = await exportMutation.mutateAsync(params)
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `store-income-${mode.toLowerCase()}.pdf`
      link.click()
      URL.revokeObjectURL(url)
    } catch {
      setToast(t(`${TK}.exportError`))
    }
  }

  const sendEmail = async () => {
    const email = recipientEmail.trim()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError(true)
      return
    }
    setEmailError(false)
    try {
      await emailMutation.mutateAsync({ params, toEmails: [email] })
      setEmailOpen(false)
      showToast(t(`${TK}.email.sent`, { email }), 'success')
    } catch {
      showToast(t(`${TK}.email.error`), 'error')
    }
  }

  const drillIntoRow = (row: PosStoreIncomeBucket) => {
    if (mode !== PosStoreIncomeReportMode.Week && mode !== PosStoreIncomeReportMode.Range) return
    setDayDate(row.start || row.key)
    selectMode(PosStoreIncomeReportMode.Day)
  }

  const rowKind = mode === PosStoreIncomeReportMode.Year ? 'month' : 'date'
  const reportTotal = mode === PosStoreIncomeReportMode.Day
    ? daySummary?.totalCollected ?? 0
    : totals?.totalCollected ?? 0

  return (
    <section className="store-income-report space-y-3 pb-5" aria-labelledby="store-income-title">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="store-income-title" className="text-xl font-extrabold tracking-tight text-nexoraText">{t(`${TK}.title`)}</h2>
        <div className="flex items-center gap-2" aria-label={t(`${TK}.actionsLabel`)}>
          <button type="button" onClick={() => { setEmailError(false); setEmailOpen(true) }} className={`${secondaryActionClass} print:hidden`}>
            <Mail className="h-4 w-4" aria-hidden="true" />{t(`${TK}.email.action`)}
          </button>
          <button type="button" onClick={() => void exportPdf()} disabled={exportMutation.isPending} className={`${primaryActionClass} print:hidden`}>
            <Printer className="h-4 w-4" aria-hidden="true" />{t(`${TK}.print`)}
          </button>
        </div>
      </header>

      <div className="rounded-2xl border border-nexoraBorder bg-white p-2.5 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
          <div role="tablist" aria-label={t(`${TK}.periods.ariaLabel`)} className="flex shrink-0 gap-1 overflow-x-auto">
            {Object.values(PosStoreIncomeReportMode).map((item) => (
              <button key={item} type="button" role="tab" aria-selected={mode === item} onClick={() => selectMode(item)} className={`min-h-10 shrink-0 rounded-lg px-3 text-xs font-extrabold transition ${mode === item ? 'bg-nexoraBrandSoft text-nexoraBrandDark' : 'text-nexoraMuted hover:bg-nexoraCanvas hover:text-nexoraText'}`}>
                {t(`${TK}.${item.toLowerCase()}`)}
              </button>
            ))}
          </div>

          <div className="flex min-w-0 flex-1 flex-wrap items-end justify-end gap-2">
            {mode !== PosStoreIncomeReportMode.Range ? (
              <div className="flex items-end gap-1.5">
                <button
                  type="button"
                  aria-label={t(`${TK}.previousPeriod`)}
                  title={t(`${TK}.previousPeriod`)}
                  disabled={!canMoveToPrevious}
                  onClick={() => shiftSelectedPeriod(-1)}
                  className={`${secondaryActionClass} h-11 w-11 px-0`}
                >
                  <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                </button>
                {mode === PosStoreIncomeReportMode.Day ? <label className="grid min-w-[168px] gap-1 text-[10px] font-bold text-nexoraMuted">{t(`${TK}.reportDate`)}<input type="date" value={dayDate} max={today} onChange={(event) => setDayDate(event.target.value || today)} className={controlClass} /></label> : null}
                {mode === PosStoreIncomeReportMode.Week ? <label className="grid min-w-[190px] gap-1 text-[10px] font-bold text-nexoraMuted">{t(`${TK}.reportWeek`)}<input type="week" value={weekValue} max={currentWeek} onChange={(event) => setWeekValue(event.target.value || currentWeek)} className={controlClass} /></label> : null}
                {mode === PosStoreIncomeReportMode.Year ? <label className="grid min-w-[168px] gap-1 text-[10px] font-bold text-nexoraMuted">{t(`${TK}.reportYear`)}<select value={yearValue} onChange={(event) => setYearValue(Number(event.target.value))} className={controlClass}>{Array.from({ length: currentYear - 1999 }, (_, index) => currentYear - index).map((year) => <option key={year} value={year}>{year}</option>)}</select></label> : null}
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
            ) : null}
            {mode === PosStoreIncomeReportMode.Range ? <><label className="grid min-w-[155px] flex-1 gap-1 text-[10px] font-bold text-nexoraMuted sm:flex-none">{t(`${TK}.fromDate`)}<input type="date" value={fromDate} max={currentWeekBounds.end} onChange={(event) => setFromDate(event.target.value)} className={controlClass} /></label><label className="grid min-w-[155px] flex-1 gap-1 text-[10px] font-bold text-nexoraMuted sm:flex-none">{t(`${TK}.toDate`)}<input type="date" value={toDate} max={currentWeekBounds.end} onChange={(event) => setToDate(event.target.value)} className={controlClass} /></label><button type="button" onClick={applyRange} className={primaryActionClass}>{t(`${TK}.applyRange`)}</button></> : null}
          </div>
        </div>
        {rangeError ? <p className="mt-2 text-xs font-bold text-rose-600" role="alert">{t(`${TK}.${rangeError === 'length' ? 'rangeTooLong' : 'rangeError'}`)}</p> : null}
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-0.5">
        <h3 className="text-sm font-extrabold text-nexoraText">{periodTitle}</h3>
        {dateLabel ? <p className="text-xs font-semibold text-nexoraMuted">{dateLabel} <span className="px-1.5 text-nexoraBorder">•</span> {businessTimeZone}</p> : null}
      </div>

      {reportQuery.isPending ? <div className="nexora-card p-5"><SkeletonList count={4} lines={2} /></div> : null}
      {reportQuery.isError ? <div className="nexora-card p-5 text-center" role="alert"><p className="text-sm font-bold text-rose-600">{t(`${TK}.loadError`)}</p><button type="button" onClick={() => void reportQuery.refetch()} className={`${secondaryActionClass} mt-3`}>{t(`${TK}.retry`)}</button></div> : null}

      {!reportQuery.isPending && !reportQuery.isError && mode === PosStoreIncomeReportMode.Day && daySummary ? (
        <div className="grid gap-3 lg:grid-cols-[1fr_minmax(300px,0.82fr)]">
          <article className="nexora-card overflow-hidden" role="region" aria-labelledby="payment-breakdown-title">
            <header className="flex items-center justify-between gap-3 border-b border-nexoraBorder px-4 py-3"><h3 id="payment-breakdown-title" className="text-sm font-extrabold text-nexoraText">{t(`${TK}.paymentBreakdown`)}</h3><strong className="text-sm tabular-nums text-nexoraText">{formatMoney(daySummary.totalCollected)}</strong></header>
            <div className="space-y-0.5 px-4 py-2">{daySummary.paymentBreakdown.map((payment) => <div key={payment.paymentMethodType} className="grid min-h-9 w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-lg px-1.5 py-1 hover:bg-nexoraCanvas/70"><span className="min-w-0 truncate text-xs font-extrabold text-nexoraText">{paymentName(payment.paymentMethodType)}</span><strong className="text-xs tabular-nums text-nexoraText">{formatMoney(payment.amount)}</strong></div>)}</div>
          </article>

          <article className="nexora-card overflow-hidden" role="region" aria-labelledby="income-details-title">
            <header className="border-b border-nexoraBorder px-4 py-3"><h3 id="income-details-title" className="text-sm font-extrabold text-nexoraText">{t(`${TK}.details`)}</h3></header>
            <div className="space-y-0.5 px-4 py-2">
              {([['servicesSubtotal', formatMoney(daySummary.servicesSubtotal)], ['serviceDiscounts', `−${formatMoney(daySummary.serviceDiscounts)}`], ['productsSubtotal', formatMoney(daySummary.productsSubtotal)], ['salesTax', formatMoney(daySummary.salesTax)], ['tips', formatMoney(daySummary.tips)], ['supplyFee', formatMoney(daySummary.supplyFee)], ['merchantFee', formatMoney(daySummary.merchantFee)]] as const).map(([key, value]) => <div key={key} className="flex min-h-9 items-center justify-between gap-3 rounded-lg px-1.5 py-1 text-xs"><span className="font-semibold text-nexoraMuted">{t(`${TK}.${key}`)}</span><strong className={`tabular-nums ${key === 'serviceDiscounts' ? 'text-rose-600' : 'text-nexoraText'}`}>{value}</strong></div>)}
              <div className="flex min-h-9 items-center justify-between gap-3 rounded-lg px-1.5 py-1 text-xs"><span className="font-semibold text-nexoraMuted">{t(`${TK}.returnTransactions`)}</span><strong className="tabular-nums text-nexoraText">{daySummary.returnTransactionCount} · {formatMoney(daySummary.returnTransactionAmount)}</strong></div>
              <div className="mt-1 flex min-h-11 items-center justify-between gap-3 border-t border-nexoraBorder/70 px-1.5 pt-2 text-sm"><span className="font-extrabold text-nexoraText">{t(`${TK}.totalCollected`)}</span><strong className="tabular-nums text-nexoraBrandDark">{formatMoney(daySummary.totalCollected)}</strong></div>
            </div>
          </article>
        </div>
      ) : null}

      {!reportQuery.isPending && !reportQuery.isError && mode !== PosStoreIncomeReportMode.Day ? (
        <article className="nexora-card overflow-hidden">
          <header className="flex items-center justify-between gap-3 border-b border-nexoraBorder px-4 py-3"><h3 className="text-sm font-extrabold text-nexoraText">{t(`${TK}.${rowKind === 'month' ? 'monthlyCollection' : 'dailyCollection'}`)}</h3><strong className="text-sm tabular-nums text-nexoraText">{formatMoney(totals?.totalCollected)}</strong></header>
          <div className="max-h-[calc(100dvh-260px)] overflow-auto">
            <table className="w-full text-left text-xs" style={{ minWidth: `${460 + paymentMethods.length * 116}px` }} aria-label={t(`${TK}.table.ariaLabel`)}>
              <thead className="sticky top-0 z-[1] bg-nexoraCanvas/95"><tr className="border-b border-nexoraBorder text-[10px] uppercase tracking-wide text-nexoraMuted"><th className="sticky left-0 bg-nexoraCanvas px-4 py-3">{t(`${TK}.table.${rowKind}`)}</th>{paymentMethods.map((method) => <th key={method} className="px-4 py-3 text-right">{paymentName(method)}</th>)}<th className="px-4 py-3 text-right">{t(`${TK}.table.tipsIncluded`)}</th><th className="sticky right-0 bg-nexoraCanvas px-4 py-3 text-right">{t(`${TK}.table.totalCollected`)}</th></tr></thead>
              <tbody>{rows.map((row) => {
                const date = dateFromIso(row.start || row.key)
                const label = rowKind === 'month' ? `${monthName.format(date)} ${date.getUTCFullYear()}` : rowDate.format(date)
                const canOpenDay = mode === PosStoreIncomeReportMode.Week || mode === PosStoreIncomeReportMode.Range
                const rowLabel = <><strong className="block whitespace-nowrap text-xs text-nexoraText">{label}</strong><span className="mt-0.5 block whitespace-nowrap text-[10px] font-semibold text-nexoraMuted">{t(`${TK}.table.transactions`, { count: row.transactionCount })}</span></>
                return <tr key={row.key} className="border-b border-nexoraBorder/70 last:border-b-0 hover:bg-violet-50/30"><td className="sticky left-0 bg-white px-4 py-3">{canOpenDay ? <button type="button" onClick={() => drillIntoRow(row)} className="block w-full text-left">{rowLabel}</button> : <div>{rowLabel}</div>}</td>{paymentMethods.map((method) => <td key={method} className="px-4 py-3 text-right tabular-nums">{formatMoney(row.paymentAmounts[method])}</td>)}<td className="px-4 py-3 text-right tabular-nums text-emerald-700">{formatMoney(row.tipAmount)}</td><td className="sticky right-0 bg-white px-4 py-3 text-right font-extrabold tabular-nums text-nexoraText">{formatMoney(row.totalCollected)}</td></tr>
              })}</tbody>
              {totals ? <tfoot className="sticky bottom-0 bg-nexoraBrandSoft font-extrabold text-nexoraBrandDark"><tr><td className="sticky left-0 bg-nexoraBrandSoft px-4 py-3">{t(`${TK}.table.periodTotal`)}</td>{paymentMethods.map((method) => <td key={method} className="px-4 py-3 text-right tabular-nums">{formatMoney(totals.paymentAmounts[method])}</td>)}<td className="px-4 py-3 text-right tabular-nums">{formatMoney(totals.tipAmount)}</td><td className="sticky right-0 bg-nexoraBrandSoft px-4 py-3 text-right tabular-nums">{formatMoney(totals.totalCollected)}</td></tr></tfoot> : null}
            </table>
          </div>
        </article>
      ) : null}

      {emailOpen ? <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) setEmailOpen(false) }}><section className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="store-income-email-title"><header className="flex items-start justify-between gap-3 border-b border-nexoraBorder p-5"><div><h3 id="store-income-email-title" className="text-lg font-extrabold text-nexoraText">{t(`${TK}.email.title`)}</h3><p className="mt-1 text-xs font-semibold text-nexoraMuted">{t(`${TK}.email.description`)}</p></div><button type="button" onClick={() => setEmailOpen(false)} aria-label={t(`${TK}.email.close`)} className="rounded-lg p-2 text-nexoraMuted hover:bg-nexoraCanvas"><X className="h-5 w-5" aria-hidden="true" /></button></header><div className="space-y-3 p-5"><label className="grid gap-1 text-xs font-bold text-nexoraMuted">{t(`${TK}.email.recipient`)}<input type="email" value={recipientEmail} onChange={(event) => { setRecipientEmail(event.target.value); setEmailError(false) }} placeholder="owner@example.com" className={controlClass} /></label>{emailError ? <p role="alert" className="text-xs font-bold text-rose-600">{t(`${TK}.email.invalid`)}</p> : null}<div className="rounded-xl border border-nexoraBorder bg-nexoraCanvas p-4 text-xs"><strong className="block text-nexoraText">{t(`${TK}.title`)}</strong><span className="mt-1 block text-nexoraMuted">{periodTitle} · {formatMoney(reportTotal)}</span><span className="mt-1 block text-nexoraMuted">{businessTimeZone} · {t(`${TK}.email.attachment`)}</span></div></div><footer className="flex justify-end gap-2 border-t border-nexoraBorder bg-nexoraCanvas/50 p-4"><button type="button" onClick={() => setEmailOpen(false)} className={secondaryActionClass}>{t(`${TK}.email.cancel`)}</button><button type="button" onClick={() => void sendEmail()} disabled={emailMutation.isPending} className={primaryActionClass}>{t(`${TK}.email.send`)}</button></footer></section></div> : null}
      {toast ? <div role="status" aria-live="polite" className="fixed bottom-5 left-1/2 z-[60] -translate-x-1/2 rounded-xl bg-nexoraText px-4 py-3 text-xs font-bold text-white shadow-xl">{toast}</div> : null}
    </section>
  )
}
