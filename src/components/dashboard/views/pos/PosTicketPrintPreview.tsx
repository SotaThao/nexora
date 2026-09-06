import { Fragment } from 'react'
import { createPortal } from 'react-dom'
import { Printer, X } from 'lucide-react'
import { useTranslation } from '../../../../contexts/LanguageContext'
import { formatUsdAmount } from '../../../../utils/currencyInput'
import { formatPosDateTime } from './posDateTime'

export interface PosTicketPrintLine {
  id: string
  name: string
  amount: number
  discountLabel?: string
  note?: string
  addOns?: PosTicketPrintLine[]
}

export interface PosTicketPrintGroup {
  id: string
  label: string
  lines: PosTicketPrintLine[]
}

interface PosTicketPrintPreviewProps {
  open: boolean
  onClose: () => void
  onPrint: () => void
  isPrinting?: boolean
  orderNumber: string
  completedAt?: string | null
  groups: PosTicketPrintGroup[]
  customerName?: string | null
  orderNote?: string | null
}

export default function PosTicketPrintPreview({
  open,
  onClose,
  onPrint,
  isPrinting = false,
  orderNumber,
  completedAt,
  groups,
  customerName,
  orderNote,
}: PosTicketPrintPreviewProps) {
  const { t, currentLanguage } = useTranslation()
  if (!open || typeof document === 'undefined') return null

  const pages = groups.map((group) => [group])
  const lineCount = groups.reduce((count, group) => count + group.lines.length, 0)

  return createPortal(
    <div className="pos-front-desk-action-surface pos-invoice-modal-backdrop">
      <div
        className="pos-invoice-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pos-ticket-print-preview-title"
      >
        <div className="pos-invoice-modal-header">
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-nexoraMuted">
              {t('components.dashboard.views.pos.PosOrderWorkspace.printPreviewLabel')}
            </p>
            <h2 id="pos-ticket-print-preview-title" className="text-lg font-black text-nexoraText">
              {t('components.dashboard.views.pos.PosOrderWorkspace.printTicketAction')}
            </h2>
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
          {pages.map((pageGroups, pageIndex) => (
            <article key={pageGroups[0].id} className="pos-receipt-print pos-receipt-ink-black pos-ticket-print-page" data-testid="pos-receipt-print">
              <div className="pos-receipt-print-header">
                <p className="pos-receipt-ticket">Ticket #{orderNumber}</p>
                <p>{formatPosDateTime(completedAt ?? new Date().toISOString(), currentLanguage)}</p>
              </div>

              {customerName?.trim() ? (
                <p className="mt-2 break-words text-center text-xs">
                  {t('components.dashboard.views.pos.PosOrderWorkspace.printPreviewCustomer')}: <strong>{customerName.trim()}</strong>
                </p>
              ) : null}

              <section
                className="pos-receipt-lines"
                aria-label={t('components.dashboard.views.pos.PosOrderWorkspace.summaryItem')}
              >
                {lineCount > 0 ? pageGroups.map((group) => (
                  <div className="pos-receipt-tech-group" key={group.id}>
                    <p className="pos-receipt-tech-heading">{group.label.toUpperCase()}</p>
                    <div className="pos-receipt-group-lines">
                      {group.lines.map((line) => (
                        <Fragment key={line.id}>
                          <div>
                            <span>
                              {line.name}
                              {line.discountLabel ? (
                                <span className="pos-receipt-line-discount ml-1 text-rose-500">
                                  {line.discountLabel}
                                </span>
                              ) : null}
                            </span>
                            <span className="tabular-nums">{formatUsdAmount(line.amount)}</span>
                          </div>
                          {line.addOns?.map((addOn) => (
                            <div key={addOn.id}>
                              <span>
                                + {addOn.name}
                                {addOn.discountLabel ? (
                                  <span className="pos-receipt-line-discount ml-1 text-rose-500">
                                    {addOn.discountLabel}
                                  </span>
                                ) : null}
                              </span>
                              <span className="tabular-nums">{formatUsdAmount(addOn.amount)}</span>
                            </div>
                          ))}
                        </Fragment>
                      ))}
                    </div>
                  </div>
                )) : (
                  <p>{t('components.dashboard.views.pos.PosOrderWorkspace.noLines')}</p>
                )}
              </section>

              {(orderNote?.trim() || pageGroups.some((group) => group.lines.some((line) => line.note?.trim()))) ? (
                <section className="mt-3 space-y-1 border-t border-dashed border-nexoraBorder pt-2 text-[11px] leading-relaxed">
                  <h3 className="font-bold uppercase">
                    {t('components.dashboard.views.pos.PosOrderWorkspace.ticketNoteTitle')}
                  </h3>
                  {orderNote?.trim() ? <p className="whitespace-pre-wrap break-words">{orderNote.trim()}</p> : null}
                  {pageGroups.flatMap((group) => group.lines.filter((line) => line.note?.trim()).map((line) => (
                    <div key={line.id} className="whitespace-pre-wrap break-words">
                      <span className="font-semibold">{line.name}: </span>
                      <span>{line.note.trim()}</span>
                    </div>
                  )))}
                </section>
              ) : null}

              <p className="pos-receipt-thank-you">{pageIndex + 1} / {pages.length}</p>
            </article>
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
            onClick={onPrint}
            disabled={isPrinting || lineCount === 0}
            className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-lg bg-nexoraBrand text-xs font-bold text-white hover:bg-nexoraBrandDark"
          >
            <Printer className="h-4 w-4" aria-hidden="true" />
            {t(
              'components.dashboard.views.pos.PosOrderWorkspace.printTicketAction',
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
