import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { useTranslation } from '../../../../contexts/LanguageContext'
import PosReceiptPrintDocument from './receipt/PosReceiptPrintDocument'
import { printDomWithBodyClass } from './receipt/browserPrintTransport'
import type { BrowserPrintHandle } from './receipt/browserPrintTransport'
import type { PosReceiptDocument } from '../../../../types/domain'

export const POS_INVOICE_PRINT_BODY_CLASS = 'printing-pos-invoice'

interface PosReceiptPrintPreviewProps {
  open: boolean
  onClose: () => void
  /** Everything shown on the receipt, already resolved — see posReceiptDocument.ts. */
  doc: PosReceiptDocument
  /**
   * How many copies this dialog prints. Always 1 for an operator-initiated print; the auto-print
   * path is the only caller that asks for more, and it renders them as page-broken siblings so the
   * browser opens a single dialog rather than one per copy.
   */
  copies?: number
  /** Overrides the default browser print, e.g. to route the job through PassPRNT instead. */
  onPrint?: () => void
}

export default function PosReceiptPrintPreview({
  open,
  onClose,
  doc,
  copies = 1,
  onPrint,
}: PosReceiptPrintPreviewProps) {
  const { t } = useTranslation()
  const printHandleRef = useRef<BrowserPrintHandle | null>(null)

  // The body class outlives this component if a print is in flight when it unmounts, and the app
  // would then render under the print stylesheet.
  useEffect(() => () => printHandleRef.current?.cancel(), [])

  if (!open || typeof document === 'undefined') return null

  const handlePrintDocument = () => {
    if (onPrint) {
      onPrint()
      return
    }
    printHandleRef.current?.cancel()
    printHandleRef.current = printDomWithBodyClass(POS_INVOICE_PRINT_BODY_CLASS)
  }

  const extraCopies = Math.max(0, copies - 1)

  return createPortal(
    <div className="pos-front-desk-action-surface pos-invoice-modal-backdrop">
      <div
        className="pos-invoice-modal"
        role="dialog"
        aria-modal="true"
        aria-label={
          doc.isPaid
            ? undefined
            : t('components.dashboard.views.pos.PosOrderWorkspace.printPreviewLabel')
        }
        aria-labelledby={doc.isPaid ? 'pos-print-preview-title' : undefined}
      >
        <div className="pos-invoice-modal-header">
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-nexoraMuted">
              {t('components.dashboard.views.pos.PosOrderWorkspace.printPreviewLabel')}
            </p>
            {doc.isPaid ? (
              <h2 id="pos-print-preview-title" className="text-lg font-black text-nexoraText">
                {t('components.dashboard.views.pos.PosOrderWorkspace.printReceiptTitle')}
              </h2>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="pos-invoice-modal-close inline-flex h-9 w-9 items-center justify-center rounded-lg border border-nexoraBorder text-nexoraText hover:border-nexoraBrand"
            aria-label={t('components.dashboard.views.pos.PosOrderWorkspace.printPreviewClose')}
            title={t('components.dashboard.views.pos.PosOrderWorkspace.printPreviewClose')}
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="pos-invoice-modal-body">
          <PosReceiptPrintDocument
            doc={doc}
            className={extraCopies > 0 ? 'pos-receipt-print--page-break' : undefined}
          />
          {/* Extra copies are hidden on screen and revealed only while printing, so the operator
              previews one receipt but the printer receives all of them in one job. */}
          {Array.from({ length: extraCopies }, (_, index) => (
            <PosReceiptPrintDocument
              key={`copy-${index}`}
              doc={doc}
              className={`pos-receipt-print-extra${
                index < extraCopies - 1 ? ' pos-receipt-print--page-break' : ''
              }`}
            />
          ))}
        </div>

        <div className="pos-invoice-modal-actions">
          <button
            type="button"
            onClick={onClose}
            className="h-10 flex-1 rounded-lg border border-nexoraBorder text-xs font-bold text-nexoraText hover:border-nexoraBrand"
          >
            {t('components.dashboard.views.pos.PosOrderWorkspace.printPreviewClose')}
          </button>
          <button
            type="button"
            onClick={handlePrintDocument}
            className="h-10 flex-1 rounded-lg bg-nexoraBrand text-xs font-bold text-white hover:bg-nexoraBrandDark"
          >
            {t(
              `components.dashboard.views.pos.PosOrderWorkspace.${
                doc.isPaid ? 'printReceiptAction' : 'printInvoiceAction'
              }`,
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
