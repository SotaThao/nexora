/**
 * Renders a resolved receipt document as JSX — the on-screen preview, and the DOM the browser
 * print transport actually prints.
 *
 * It walks `doc.rows` / `doc.totals` and nothing else. Its sibling `posReceiptHtml.ts` walks the
 * same two arrays to produce the standalone HTML that goes to PassPRNT, and a test asserts the two
 * outputs carry identical text. That pairing is the whole point: a field added here and forgotten
 * there would otherwise show up in the preview and be missing from the paper.
 *
 * Styling stays on the existing `.pos-receipt-*` classes in index.css, which already carry the
 * 80mm @page rules and the force-black print ink.
 */
import { maskReceiptPhone } from './maskReceiptPhone'
import { Fragment } from 'react'
import { formatUsdAmount } from '../../../../../utils/currencyInput'
import type { PosReceiptDocument, PosReceiptTotalRow } from '../../../../../types/domain'

function totalAmountText(row: PosReceiptTotalRow): string {
  return row.negative && row.amount !== 0
    ? formatUsdAmount(-Math.abs(row.amount))
    : formatUsdAmount(row.amount)
}

export default function PosReceiptPrintDocument({
  doc,
  className,
}: {
  doc: PosReceiptDocument
  className?: string
}) {
  const hasLines = doc.rows.length > 0
  const hasBusiness = Boolean(doc.businessName || doc.businessAddress || doc.businessPhone)
  const hasCustomer = Boolean(doc.customerName || doc.customerPhone)

  return (
    <article
      className={`pos-receipt-print pos-receipt-ink-black${className ? ` ${className}` : ''}`}
      data-testid="pos-receipt-print"
    >
      <div className="pos-receipt-print-header">
        <p className="pos-receipt-ticket">
          {doc.labels.ticket} #{doc.orderNumber}
        </p>
        <p>{doc.completedAtLabel}</p>
        {hasBusiness ? (
          <div className="pos-receipt-business">
            {doc.businessName ? <h2>{doc.businessName}</h2> : null}
            {doc.businessAddress ? <p>{doc.businessAddress}</p> : null}
            {doc.businessPhone ? <p>{doc.businessPhone}</p> : null}
          </div>
        ) : null}
        {hasCustomer ? (
          <div className="pos-receipt-customer">
            {doc.customerName ? (
              <p>
                {doc.labels.customer}: {doc.customerName}
              </p>
            ) : null}
            {doc.customerPhone ? (
              <p>
                {doc.labels.phone}: <span className="pos-receipt-masked-phone">
                  {Array.from(maskReceiptPhone(doc.customerPhone)).map((character, index) => (
                    <span key={index}>{character}</span>
                  ))}
                </span>
              </p>
            ) : null}
          </div>
        ) : null}
      </div>

      <section className="pos-receipt-lines">
        {hasLines ? (
          doc.rows.map((row) =>
            row.kind === 'group' ? (
              <p className="pos-receipt-tech-heading" key={row.id}>
                {row.label.toUpperCase()}
              </p>
            ) : (
              <Fragment key={row.id}>
                <div className={`pos-receipt-line-row${row.kind === 'addOn' ? ' pos-receipt-addon-row' : ''}`}>
                  <span>
                    {row.kind === 'addOn' ? `+ ${row.label}` : row.label}
                    {row.discountLabel ? (
                      <span className="pos-receipt-line-discount ml-1 text-rose-500">
                        {row.discountLabel}
                      </span>
                    ) : null}
                  </span>
                  <span className="tabular-nums">{formatUsdAmount(row.amount ?? 0)}</span>
                </div>
              </Fragment>
            ),
          )
        ) : (
          <p>{doc.labels.noLines}</p>
        )}
      </section>

      <dl className="pos-receipt-totals">
        {doc.totals.map((row) => (
          <div key={row.id} className={row.emphasis ? 'pos-receipt-total' : undefined}>
            <dt>{row.label}</dt>
            <dd>{totalAmountText(row)}</dd>
          </div>
        ))}
      </dl>

      {doc.isPaid && doc.paidWithLabel ? (
        <p className="pos-receipt-payment">
          {doc.labels.paidWith} {doc.paidWithLabel}
        </p>
      ) : null}

      <p className="pos-receipt-thank-you">{doc.labels.thankYou}</p>
    </article>
  )
}
