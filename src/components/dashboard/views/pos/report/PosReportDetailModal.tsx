import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Mail, Printer, X } from 'lucide-react'
import { useTranslation } from '../../../../../contexts/LanguageContext'
import { PosReportMode } from '../../../../../constants/posReportMode'
import { getPosCheckoutPaymentMethodLabel } from '../../../../../constants/posCheckoutPaymentMethod'
import { usePosReportDetail } from '../../../../../data/hooks/usePosReport'
import type {
  PosReportDetailParams,
  PosStaffReportDetail,
} from '../../../../../data/repositories/posReport'
import { SkeletonList } from '../../../../ui/skeleton'
import { formatCurrency } from '../../../utils'
import { formatDayLabel } from './posReportPeriod'

const TK = 'components.dashboard.views.pos.report.detail'
// There is no POS-report email endpoint yet. Keep the prepared UI behind one switch so it can be
// restored when the backend send API is available without exposing a non-functional action now.
export const POS_REPORT_EMAIL_ENABLED: boolean = false

type Props = {
  params: PosReportDetailParams
  displayName: string
  defaultEmail: string
  onClose: () => void
}

export default function PosReportDetailModal({
  params,
  displayName,
  defaultEmail,
  onClose,
}: Props) {
  const { t } = useTranslation()
  const detailQuery = usePosReportDetail(params, { enabled: true })
  const [recipientEmail, setRecipientEmail] = useState('')
  const [showEmailForm, setShowEmailForm] = useState(false)
  const printCleanupRef = useRef<(() => void) | null>(null)

  const detail = detailQuery.data
  useEffect(() => {
    setRecipientEmail(defaultEmail.trim())
  }, [defaultEmail, params.posStaffProfileId])

  useEffect(() => {
    setShowEmailForm(false)
  }, [params.posStaffProfileId, params.periodStart, params.periodEnd])

  useEffect(() => () => printCleanupRef.current?.(), [])

  const periodLabel = useMemo(() => {
    if (!detail) return ''
    const start = formatDayLabel(detail.periodStart, 'en-US')
    const end = formatDayLabel(detail.periodEnd, 'en-US')
    return start === end ? start : `${start} — ${end}`
  }, [detail])

  const mailtoHref = useMemo(() => {
    const email = recipientEmail.trim()
    if (!detail || !/^\S+@\S+\.\S+$/.test(email)) return ''
    const subject = `POS report - ${displayName} - ${periodLabel}`
    const body = buildEmailBody(detail, displayName, periodLabel)
    return `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  }, [detail, displayName, periodLabel, recipientEmail])

  const handlePrint = () => {
    if (!detail || typeof window === 'undefined' || typeof window.print !== 'function') return
    printCleanupRef.current?.()
    document.body.classList.add('printing-pos-report-detail')
    const cleanup = () => {
      window.removeEventListener('afterprint', cleanup)
      document.body.classList.remove('printing-pos-report-detail')
      if (printCleanupRef.current === cleanup) printCleanupRef.current = null
    }
    printCleanupRef.current = cleanup
    window.addEventListener('afterprint', cleanup, { once: true })
    try {
      window.print()
    } catch {
      cleanup()
    }
  }

  const modal = (
    <div className="pos-report-detail-backdrop fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-3 sm:p-5">
      <div
        className="pos-report-detail-modal nexora-modal-card flex w-[80mm] max-w-[calc(100vw-1.5rem)] flex-col bg-white"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pos-report-detail-title"
      >
        <div className="pos-report-detail-header relative shrink-0 border-b border-dashed border-slate-400 pb-3 text-center font-mono text-black">
          <div className="px-7">
            <h3 id="pos-report-detail-title" className="text-base font-black uppercase tracking-wide text-black">
              {detail ? displayName : t(`${TK}.title`)}
            </h3>
            <p className="mt-1 text-xs font-semibold text-black">
              {params.mode === PosReportMode.Daily ? t(`${TK}.dailyTitle`) : t(`${TK}.weeklyTitle`)}
            </p>
            {periodLabel ? <p className="mt-0.5 text-xs font-bold text-black">{periodLabel}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t(`${TK}.close`)}
            className="pos-report-detail-close absolute right-0 top-0 rounded-lg p-1.5 text-nexoraMuted hover:bg-nexoraCanvas hover:text-nexoraText"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="pos-report-detail-body mt-3 min-h-0 flex-1 overflow-y-auto font-mono">
          {detailQuery.isLoading ? (
            <div className="py-8"><SkeletonList count={4} lines={2} /></div>
          ) : detailQuery.isError || !detail ? (
            <div className="rounded-xl border border-nexoraBorder py-10 text-center text-xs text-nexoraMuted">
              {t(`${TK}.loadError`)}
            </div>
          ) : (
            <div className="pos-report-detail-print space-y-3 text-xs text-black" data-testid="pos-report-detail-print">
              {params.mode === PosReportMode.Daily
                ? <DailyDetail detail={detail} />
                : <WeeklyDetail detail={detail} />}
              <DetailTotals detail={detail} />
            </div>
          )}
        </div>

        <div className="pos-report-detail-actions mt-4 shrink-0 border-t border-nexoraBorder pt-3">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handlePrint}
              disabled={!detail}
              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg border border-nexoraBorder px-3 text-xs font-bold text-nexoraText hover:border-nexoraBrand disabled:opacity-50"
            >
              <Printer className="h-4 w-4" aria-hidden="true" />
              {t(`${TK}.print`)}
            </button>
            <button
              type="button"
              onClick={() => setShowEmailForm((visible) => !visible)}
              disabled={!POS_REPORT_EMAIL_ENABLED || !detail}
              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg bg-nexoraBrand px-3 text-xs font-bold text-white hover:bg-nexoraBrandDark disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Mail className="h-4 w-4" aria-hidden="true" />
              {t(`${TK}.email`)}
            </button>
          </div>
          {POS_REPORT_EMAIL_ENABLED && showEmailForm ? (
            <div className="mt-3 flex flex-col gap-2">
              <label className="min-w-0 flex-1">
                <span className="mb-1 block text-[10px] font-black uppercase tracking-wide text-nexoraMuted">
                  {t(`${TK}.emailLabel`)}
                </span>
                <small className="mb-1.5 block text-[10px] font-semibold text-amber-600">
                  {t(`${TK}.emailComingSoon`)}
                </small>
                <input
                  type="email"
                  value={recipientEmail}
                  onChange={(event) => setRecipientEmail(event.target.value)}
                  aria-label={t(`${TK}.emailLabel`)}
                  placeholder={t(`${TK}.emailPlaceholder`)}
                  autoFocus
                  className="h-10 w-full rounded-lg border border-nexoraBorder bg-white px-3 text-xs text-nexoraText outline-none focus:border-nexoraBrand"
                />
              </label>
              {mailtoHref ? (
                <a
                  href={mailtoHref}
                  className="inline-flex h-10 items-center justify-center rounded-lg bg-nexoraBrand px-4 text-xs font-bold text-white hover:bg-nexoraBrandDark"
                >
                  {t(`${TK}.send`)}
                </a>
              ) : (
                <button
                  type="button"
                  disabled
                  className="inline-flex h-10 items-center justify-center rounded-lg bg-nexoraBrand px-4 text-xs font-bold text-white opacity-50"
                >
                  {t(`${TK}.send`)}
                </button>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )

  return typeof document !== 'undefined' ? createPortal(modal, document.body) : null
}

function DailyDetail({ detail }: { detail: PosStaffReportDetail }) {
  const { t } = useTranslation()
  const tickets = detail.days.flatMap((day) => day.tickets)
  if (tickets.length === 0) {
    return <div className="py-8 text-center text-sm text-black">{t(`${TK}.noTickets`)}</div>
  }

  return (
    <div>
      <div className="grid grid-cols-[1fr_auto_auto] gap-3 border-b border-dashed border-slate-400 pb-1 font-black uppercase text-black">
        <span>{t(`${TK}.ticket`)}</span>
        <span className="text-right">{t(`${TK}.amount`)}</span>
        <span className="text-right">{t(`${TK}.tips`)}</span>
      </div>
      {tickets.map((ticket, ticketIndex) => (
        <div key={ticket.orderId} className="border-b border-dashed border-slate-300 py-2 last:border-b-0">
          <div className="grid grid-cols-[1fr_auto_auto] gap-3 text-black">
            <span className="font-black">{ticketIndex + 1}. #{ticket.orderNumber}</span>
            <span className="text-right font-bold tabular-nums">{formatCurrency(ticket.amount)}</span>
            <span className="text-right font-bold tabular-nums">{formatCurrency(ticket.tips)}</span>
          </div>
          <p className="mt-1 font-bold text-black">{formatReportTime(ticket.completedAtUtc, detail.timeZone)}</p>
          <div className="mt-1 space-y-0.5 text-black">
            {ticket.services.map((service, index) => <div key={`${ticket.orderId}-${index}`}>{service}</div>)}
          </div>
          <div className="mt-1 flex items-center justify-between gap-3 text-black">
            <span>-- {t(`${TK}.ownerDiscount`)}</span>
            <span className="font-bold tabular-nums text-black">
              {ticket.ownerDiscount > 0 ? formatCurrency(ticket.ownerDiscount) : '—'}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}

function WeeklyDetail({ detail }: { detail: PosStaffReportDetail }) {
  const { t } = useTranslation()
  return (
    <div>
      <div className="grid grid-cols-[1fr_auto_auto] gap-3 border-b border-dashed border-slate-400 pb-1 font-black uppercase text-black">
        <span>{t(`${TK}.day`)}</span>
        <span className="text-right">{t(`${TK}.amount`)}</span>
        <span className="text-right">{t(`${TK}.tips`)}</span>
      </div>
      {detail.days.map((day) => (
        <div key={day.date} className="grid grid-cols-[1fr_auto_auto] gap-3 border-b border-dashed border-slate-300 py-1.5 text-black last:border-b-0">
          <span className="font-semibold">{formatReportDay(day.date)}</span>
          <span className="text-right font-bold tabular-nums">{formatCurrency(day.amount)}</span>
          <span className="text-right font-bold tabular-nums">{formatCurrency(day.tips)}</span>
        </div>
      ))}
    </div>
  )
}

function DetailTotals({ detail }: { detail: PosStaffReportDetail }) {
  const { t } = useTranslation()
  const totals = [
    [t(`${TK}.totalAmount`), detail.totalAmount],
    [t(`${TK}.totalTips`), detail.totalTips],
    [t(`${TK}.totalDiscount`), detail.totalDiscount],
    [t(`${TK}.totalCommission`), detail.totalCommission],
    ...detail.paymentTotals.map((payment) => [
      t(`${TK}.collected`, { method: getPosCheckoutPaymentMethodLabel(payment.paymentMethod, t) }),
      payment.amount,
    ] as [string, number]),
  ] as Array<[string, number]>

  return (
    <div className="border-t border-dashed border-slate-500 pt-2">
      {totals.map(([label, amount], index) => (
        <div
          key={label}
          className={`flex items-center justify-between gap-3 py-0.5 text-black ${index === 0 ? 'font-black' : ''}`}
        >
          <span>{label}</span>
          <span className="font-bold tabular-nums text-black">{formatCurrency(amount)}</span>
        </div>
      ))}
    </div>
  )
}

function formatReportTime(isoUtc: string, timeZone: string): string {
  const normalized = /(?:z|[+-]\d{2}:?\d{2})$/i.test(isoUtc) ? isoUtc : `${isoUtc}Z`
  const date = new Date(normalized)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
    timeZone,
  }).format(date)
}

function formatReportDay(isoDate: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate)
  if (!match) return isoDate
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]))))
}

function buildEmailBody(
  detail: PosStaffReportDetail,
  displayName: string,
  periodLabel: string,
): string {
  const lines = [`POS report - ${displayName}`, periodLabel, '']
  if (detail.mode === PosReportMode.Daily) {
    for (const ticket of detail.days.flatMap((day) => day.tickets)) {
      lines.push(
        `#${ticket.orderNumber} | ${formatCurrency(ticket.amount)} | Tips ${formatCurrency(ticket.tips)} | ${formatReportTime(ticket.completedAtUtc, detail.timeZone)}`,
        ticket.services.join(', '),
      )
    }
  } else {
    for (const day of detail.days) {
      lines.push(`${formatReportDay(day.date)} | ${formatCurrency(day.amount)} | Tips ${formatCurrency(day.tips)}`)
    }
  }
  lines.push(
    '',
    `Total amount: ${formatCurrency(detail.totalAmount)}`,
    `Total tips: ${formatCurrency(detail.totalTips)}`,
    `Total discount: ${formatCurrency(detail.totalDiscount)}`,
    `Total commission: ${formatCurrency(detail.totalCommission)}`,
  )
  for (const payment of detail.paymentTotals) {
    lines.push(`${payment.paymentMethod} collected: ${formatCurrency(payment.amount)}`)
  }
  return lines.join('\n')
}
