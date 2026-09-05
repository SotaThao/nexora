import { Fragment, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Printer, X } from 'lucide-react'
import { useTranslation } from '../../../../contexts/LanguageContext'
import { formatUsdAmount } from '../../../../utils/currencyInput'
import { formatCustomerPhone } from './customer/customerFormatters'
import { formatPosDateTime } from './posDateTime'

export interface PosReceiptPrintLine {
  id: string
  name: string
  amount: number
  discountLabel?: string
  note?: string
  addOns?: PosReceiptPrintLine[]
}

export interface PosReceiptPrintGroup {
  id: string
  label: string
  lines: PosReceiptPrintLine[]
}

interface PosReceiptPrintPreviewProps {
  open: boolean
  onClose: () => void
  orderNumber: string
  businessName?: string
  businessAddress?: string
  businessPhone?: string
  completedAt?: string | null
  groups: PosReceiptPrintGroup[]
  tipAmount: number
  discountAmount: number
  orderDiscountAmount?: number
  orderDiscountLabel?: string
  total: number
  paymentMethodLabel?: string
  isPaid: boolean
  ticketMode?: boolean
  customerName?: string | null
  orderNote?: string | null
}

export default function PosReceiptPrintPreview({
  open,
  onClose,
  orderNumber,
  businessName,
  businessAddress,
  businessPhone,
  completedAt,
  groups,
  tipAmount,
  discountAmount,
  orderDiscountAmount = 0,
  orderDiscountLabel,
  total,
  paymentMethodLabel,
  isPaid,
  ticketMode = false,
  customerName,
  orderNote,
}: PosReceiptPrintPreviewProps) {
  const { t, currentLanguage } = useTranslation()
  const printCleanupRef = useRef<(() => void) | null>(null)

  useEffect(() => () => printCleanupRef.current?.(), [])

  if (!open || typeof document === 'undefined') return null

  const handlePrintDocument = () => {
    if (typeof window === 'undefined' || typeof window.print !== 'function') return

    printCleanupRef.current?.()
    document.body.classList.add('printing-pos-invoice')

    const cleanup = () => {
      window.removeEventListener('afterprint', cleanup)
      document.body.classList.remove('printing-pos-invoice')
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

  const pages = ticketMode ? groups.map((group) => [group]) : [groups]
  const lineCount = groups.reduce((count, group) => count + group.lines.length, 0)
  const printableBusinessName = businessName?.trim()
  const printableBusinessAddress = businessAddress?.trim()
  const printableBusinessPhone = businessPhone?.trim()

  return createPortal(
    <div className="pos-front-desk-action-surface pos-invoice-modal-backdrop">
      <div
        className="pos-invoice-modal"
        role="dialog"
        aria-modal="true"
        aria-label={isPaid ? undefined : t('components.dashboard.views.pos.PosOrderWorkspace.printPreviewLabel')}
        aria-labelledby={isPaid ? 'pos-print-preview-title' : undefined}
      >
        <div className="pos-invoice-modal-header">
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-nexoraMuted">
              {t('components.dashboard.views.pos.PosOrderWorkspace.printPreviewLabel')}
            </p>
            {ticketMode || isPaid ? (
              <h2 id="pos-print-preview-title" className="text-lg font-black text-nexoraText">
                {t(`components.dashboard.views.pos.PosOrderWorkspace.${ticketMode ? 'printTicketAction' : 'printReceiptTitle'}`)}
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
          {pages.map((pageGroups, pageIndex) => (
            <article key={ticketMode ? pageGroups[0].id : 'receipt'} className={`pos-receipt-print pos-receipt-ink-black${ticketMode ? ' pos-ticket-print-page' : ''}`} data-testid="pos-receipt-print">
              <div className="pos-receipt-print-header">
                <p className="pos-receipt-ticket">Ticket #{orderNumber}</p>
                {!ticketMode && (printableBusinessName || printableBusinessAddress || printableBusinessPhone) ? (
                  <div className="pos-receipt-business">
                    {printableBusinessName ? <h2>{printableBusinessName}</h2> : null}
                    {printableBusinessAddress ? <p>{printableBusinessAddress}</p> : null}
                    {printableBusinessPhone ? (
                      <p>{formatCustomerPhone(printableBusinessPhone, printableBusinessPhone)}</p>
                    ) : null}
                  </div>
                ) : null}
                <p>{formatPosDateTime(completedAt ?? new Date().toISOString(), currentLanguage)}</p>
              </div>

              {ticketMode && customerName?.trim() ? (
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

              {ticketMode && (orderNote?.trim() || pageGroups.some((group) => group.lines.some((line) => line.note?.trim()))) ? (
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

              {!ticketMode ? (
                <>
                  <dl className="pos-receipt-totals">
                    <div>
                      <dt>{t('components.dashboard.views.pos.PosOrderWorkspace.summaryTip')}</dt>
                      <dd>{formatUsdAmount(tipAmount)}</dd>
                    </div>
                    <div>
                      <dt>{t('components.dashboard.views.pos.PosOrderWorkspace.summaryDiscount')}</dt>
                      <dd>{formatUsdAmount(discountAmount === 0 ? 0 : -Math.abs(discountAmount))}</dd>
                    </div>
                    {orderDiscountAmount > 0 ? (
                      <div>
                        <dt>{orderDiscountLabel ?? t('components.dashboard.views.pos.PosOrderWorkspace.summaryOrderDiscount')}</dt>
                        <dd>-${orderDiscountAmount.toFixed(2)}</dd>
                      </div>
                    ) : null}
                    <div className="pos-receipt-total">
                      <dt>{t('components.dashboard.views.pos.PosOrderWorkspace.summaryTotal')}</dt>
                      <dd>{formatUsdAmount(total)}</dd>
                    </div>
                  </dl>

                  {isPaid && paymentMethodLabel ? (
                    <p className="pos-receipt-payment">
                      {t('components.dashboard.views.pos.PosOrderWorkspace.printPreviewPaidWith')} {paymentMethodLabel}
                    </p>
                  ) : null}

                  <p className="pos-receipt-thank-you">
                    {t('components.dashboard.views.pos.PosOrderWorkspace.printPreviewThankYou')}
                  </p>
                </>
              ) : (
                <p className="pos-receipt-thank-you">{pageIndex + 1} / {pages.length}</p>
              )}
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
            onClick={handlePrintDocument}
            className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-lg bg-nexoraBrand text-xs font-bold text-white hover:bg-nexoraBrandDark"
          >
            <Printer className="h-4 w-4" aria-hidden="true" />
            {t(
              `components.dashboard.views.pos.PosOrderWorkspace.${ticketMode ? 'printTicketAction' : isPaid ? 'printReceiptAction' : 'printInvoiceAction'}`,
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
