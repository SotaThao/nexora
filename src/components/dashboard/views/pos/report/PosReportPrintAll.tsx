import { useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { Printer, X } from 'lucide-react'
import { useTranslation } from '../../../../../contexts/LanguageContext'
import type { PosStaffReportDetail } from '../../../../../data/repositories/posReport'
import { usePosReceiptPrint } from '../receipt/usePosReceiptPrint'
import PosReceiptPrintDocument from '../receipt/PosReceiptPrintDocument'
import { buildTechnicianReportReceipt } from './buildTechnicianReportReceipt'
import { PosFrontDeskTab } from '../../../../../constants/posFrontDesk'
import { DASHBOARD_MENU_ID } from '../../../constants'

export type TechnicianPrintReport = { displayName: string; detail: PosStaffReportDetail }
import './posReportPrintAll.css'

const TK = 'components.dashboard.views.pos.report'

export default function PosReportPrintAll({ reports, onClose }: { reports: TechnicianPrintReport[]; onClose: () => void }) {
  const { t } = useTranslation()
  const [skipEmptyReports, setSkipEmptyReports] = useState(true)
  const { print, isPrinting, printSurface } = usePosReceiptPrint()
  const document = useMemo(() => {
    const pages = reports.filter(({ detail }) => !skipEmptyReports || hasReportActivity(detail)).map(({ detail, displayName }) => buildTechnicianReportReceipt(detail, displayName, t))
    return pages.length ? { ...pages[0], pages } : null
  }, [reports, t, skipEmptyReports])

  return <>
    {createPortal(
      <div className="pos-report-all-preview pos-front-desk-action-surface pos-invoice-modal-backdrop">
        <section className="pos-invoice-modal" role="dialog" aria-modal="true" aria-label={t(`${TK}.printAll`)}>
          <header className="pos-invoice-modal-header">
            <div><p className="text-[10px] font-black uppercase text-nexoraMuted">{t('components.dashboard.views.pos.PosOrderWorkspace.printPreviewLabel')}</p>
              <h2 className="text-lg font-black text-nexoraText">{t(`${TK}.printAll`)}</h2></div>
            <button type="button" onClick={onClose} disabled={isPrinting} aria-label={t(`${TK}.detail.close`)} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-nexoraBorder disabled:opacity-50"><X className="h-4 w-4" /></button>
          </header>
          <label className="flex min-h-11 shrink-0 cursor-pointer items-center gap-2 border-b border-nexoraBorder px-4 py-2 text-xs font-semibold text-nexoraText">
            <input type="checkbox" checked={skipEmptyReports} disabled={isPrinting} onChange={event => setSkipEmptyReports(event.target.checked)} className="h-4 w-4 accent-nexoraBrand" />
            {t(`${TK}.skipEmptyReports`)}
          </label>
          <div className="pos-invoice-modal-body space-y-4" data-testid="pos-report-all-print">
            {document ? <PosReceiptPrintDocument doc={document} /> : <p role="status" className="py-8 text-center text-sm text-nexoraMuted">{t(`${TK}.noReportsToPrint`)}</p>}
          </div>
          <footer className="pos-invoice-modal-actions">
            <button type="button" disabled={isPrinting || !document} onClick={() => document && print(document, {
              jobId: `staff-report-${Date.now()}`, copies: 1,
              backPath: `/dashboard/${DASHBOARD_MENU_ID.pos}`,
              restore: { surface: 'frontDesk', tab: PosFrontDeskTab.Report },
            })} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-nexoraBrand px-5 text-xs font-bold text-white disabled:opacity-50">
              <Printer className="h-4 w-4" />{t(`${TK}.detail.print`)}
            </button>
          </footer>
        </section>
      </div>, window.document.body,
    )}
    {printSurface}
  </>
}

export function hasReportActivity(detail: PosStaffReportDetail): boolean {
  return detail.days.some(day => day.tickets.length > 0 || day.amount !== 0 || day.tips !== 0 || day.totalDiscount !== 0)
    || [detail.totalAmount, detail.totalTips, detail.totalDiscount, detail.totalCommission].some(value => value !== 0)
    || detail.paymentTotals.some(payment => payment.amount !== 0)
}
