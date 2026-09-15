import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Mail, Printer, X } from 'lucide-react'
import { useTranslation } from '../../../../../contexts/LanguageContext'
import { usePosReportDetail, useSendPosStaffReportEmail } from '../../../../../data/hooks/usePosReport'
import type {
  PosReportDetailParams,
  PosStaffReportDetail,
} from '../../../../../data/repositories/posReport'
import { SkeletonList } from '../../../../ui/skeleton'
import { formatDayLabel } from './posReportPeriod'

import { buildTechnicianReportReceipt } from './buildTechnicianReportReceipt'
import PosTechnicianReportPrintDocument from '../receipt/PosTechnicianReportPrintDocument'

const TK = 'components.dashboard.views.pos.report.detail'
const EMAIL_PATTERN = /^\S+@\S+\.\S+$/

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
  const sendEmail = useSendPosStaffReportEmail()
  const [recipientEmail, setRecipientEmail] = useState('')
  const [showEmailForm, setShowEmailForm] = useState(false)
  const printCleanupRef = useRef<(() => void) | null>(null)

  const detail = detailQuery.data
  useEffect(() => {
    setRecipientEmail(defaultEmail.trim())
  }, [defaultEmail, params.posStaffProfileId])

  useEffect(() => {
    setShowEmailForm(false)
    sendEmail.reset()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.posStaffProfileId, params.periodStart, params.periodEnd])

  useEffect(() => () => printCleanupRef.current?.(), [])

  const periodLabel = useMemo(() => {
    if (!detail) return ''
    const start = formatDayLabel(detail.periodStart, 'en-US')
    const end = formatDayLabel(detail.periodEnd, 'en-US')
    return start === end ? start : `${start} — ${end}`
  }, [detail])

  const isEmailValid = EMAIL_PATTERN.test(recipientEmail.trim())

  const handleSendEmail = () => {
    if (!isEmailValid || !detail || sendEmail.isPending) return
    sendEmail.mutate({
      businessId: params.businessId,
      posStaffProfileId: params.posStaffProfileId,
      mode: params.mode,
      periodKey: params.periodKey,
      toEmails: [recipientEmail.trim()],
    })
  }

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
    <div className="pos-report-detail-backdrop pos-invoice-modal-backdrop">
      <div
        className="pos-report-detail-modal pos-invoice-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pos-report-detail-title"
      >
        <div className="pos-report-detail-toolbar pos-invoice-modal-header shrink-0">
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-wider text-nexoraMuted">
              {t('components.dashboard.views.pos.PosOrderWorkspace.printPreviewLabel')}
            </p>
            <h2 id="pos-report-detail-title" className="text-lg font-black text-nexoraText">
              {t(`${TK}.title`)}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t(`${TK}.close`)}
            className="pos-report-detail-close inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-nexoraBorder text-nexoraText hover:border-nexoraBrand"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="pos-report-detail-body pos-invoice-modal-body">
          {detailQuery.isLoading ? (
            <div className="py-8"><SkeletonList count={4} lines={2} /></div>
          ) : detailQuery.isError || !detail ? (
            <div className="rounded-xl border border-nexoraBorder py-10 text-center text-xs text-nexoraMuted">
              {t(`${TK}.loadError`)}
            </div>
          ) : (
            <PosReportDetailDocument detail={detail} displayName={displayName} />
          )}
        </div>

        <div className="pos-report-detail-actions shrink-0 border-t border-nexoraBorder bg-white px-4 py-3.5">
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
              onClick={() => setShowEmailForm(true)}
              disabled={!detail}
              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg bg-nexoraBrand px-3 text-xs font-bold text-white hover:bg-nexoraBrandDark disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Mail className="h-4 w-4" aria-hidden="true" />
              {t(`${TK}.email`)}
            </button>
          </div>
        </div>
      </div>

      {showEmailForm ? (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4"
          onMouseDown={(event) => { if (event.target === event.currentTarget) setShowEmailForm(false) }}
        >
          <section
            className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="pos-report-email-dialog-title"
          >
            <header className="flex items-start justify-between gap-3 border-b border-nexoraBorder p-5">
              <div>
                <h3 id="pos-report-email-dialog-title" className="text-lg font-extrabold text-nexoraText">
                  {t(`${TK}.emailDialogTitle`)}
                </h3>
                <p className="mt-1 text-xs font-semibold text-nexoraMuted">{displayName}</p>
              </div>
              <button
                type="button"
                onClick={() => setShowEmailForm(false)}
                aria-label={t(`${TK}.emailDialogClose`)}
                className="rounded-lg p-2 text-nexoraMuted hover:bg-nexoraCanvas"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </header>
            <div className="space-y-3 p-5">
              <label className="grid gap-1 text-xs font-bold text-nexoraMuted">
                {t(`${TK}.emailLabel`)}
                <input
                  type="email"
                  value={recipientEmail}
                  onChange={(event) => {
                    setRecipientEmail(event.target.value)
                    if (sendEmail.isSuccess || sendEmail.isError) sendEmail.reset()
                  }}
                  placeholder={t(`${TK}.emailPlaceholder`)}
                  autoFocus
                  className="min-h-11 rounded-lg border border-nexoraBorder bg-white px-3 text-sm font-semibold text-nexoraText outline-none transition focus:border-nexoraBrand focus:ring-2 focus:ring-nexoraBrand/20"
                />
              </label>
              {sendEmail.isSuccess ? (
                <p className="text-xs font-semibold text-nexoraSuccess" role="status">{t(`${TK}.sendSuccess`)}</p>
              ) : null}
              {sendEmail.isError ? (
                <p className="text-xs font-semibold text-nexoraDanger" role="alert">{t(`${TK}.sendError`)}</p>
              ) : null}
            </div>
            <footer className="flex justify-end gap-2 border-t border-nexoraBorder bg-nexoraCanvas/50 p-4">
              <button
                type="button"
                onClick={() => setShowEmailForm(false)}
                className="inline-flex h-10 items-center justify-center rounded-lg border border-nexoraBorder bg-white px-4 text-xs font-bold text-nexoraText hover:bg-nexoraCanvas"
              >
                {t(`${TK}.cancel`)}
              </button>
              <button
                type="button"
                onClick={handleSendEmail}
                disabled={!isEmailValid || sendEmail.isPending}
                className="inline-flex h-10 items-center justify-center rounded-lg border border-nexoraBrand bg-nexoraBrand px-4 text-xs font-bold text-white hover:bg-nexoraBrandDark disabled:cursor-not-allowed disabled:opacity-50"
              >
                {sendEmail.isPending ? t(`${TK}.sending`) : t(`${TK}.send`)}
              </button>
            </footer>
          </section>
        </div>
      ) : null}
    </div>
  )

  return typeof document !== 'undefined' ? createPortal(modal, document.body) : null
}

export function PosReportDetailDocument({ detail, displayName }: { detail: PosStaffReportDetail; displayName: string }) {
  const { t } = useTranslation()
  const document = buildTechnicianReportReceipt(detail, displayName, t)
  return <article className="pos-report-detail-print mx-auto w-[80mm] max-w-full bg-white p-6 text-black shadow-nexora-card" data-testid="pos-report-detail-print">
    <PosTechnicianReportPrintDocument report={document.technicianReport!} />
  </article>
}
