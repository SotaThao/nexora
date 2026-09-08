/**
 * Serializes a receipt document into the standalone HTML the Star PassPRNT app prints.
 *
 * PassPRNT rasterizes the markup at the printer's own resolution, so none of the app's styling is
 * available here — no Tailwind, no index.css, and no millimetre units to lean on. The document has
 * to carry its own inline CSS sized in pixels derived from the printer's dot width.
 *
 * It walks the same `doc.rows` / `doc.totals` as the JSX renderer, and a test asserts both produce
 * identical text. Follows `packageHistoryDocuments.ts` — a pure builder taking pre-translated copy
 * and returning a string.
 */
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import PosTechnicianReportPrintDocument from './PosTechnicianReportPrintDocument'
import { maskReceiptPhone } from './maskReceiptPhone'
import type { PosReceiptDocument, PosReceiptTotalRow } from '../../../../../types/domain'

/**
 * Written into a document that never passes through React's escaping. Customer and service names
 * are operator-entered free text, so this is the only thing standing between a name containing
 * markup and a broken (or forged) receipt. Same five replacements as the check-in poster builder.
 */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function money(amount: number): string {
  const rounded = Math.round(amount * 100) / 100
  const sign = rounded < 0 ? '-' : ''
  return `${sign}$${Math.abs(rounded).toFixed(2)}`
}

function totalAmountText(row: PosReceiptTotalRow): string {
  return row.negative && row.amount !== 0 ? money(-Math.abs(row.amount)) : money(row.amount)
}

/** Rough per-row heights, only precise enough to catch a receipt that would blow PassPRNT's
 *  8,000px ceiling before we hand it over and get an opaque error code back. */
const ROW_HEIGHT_PX = 34
const TOTAL_ROW_HEIGHT_PX = 34
const CHROME_HEIGHT_PX = 320

export function estimatePosReceiptHeightPx(doc: PosReceiptDocument): number {
  if (doc.pages?.length) return doc.pages.reduce((sum, page) => sum + estimatePosReceiptHeightPx(page), 0)
  if (doc.technicianReport) {
    const report = doc.technicianReport
    return CHROME_HEIGHT_PX + report.totals.length * TOTAL_ROW_HEIGHT_PX
      + report.entries.reduce((height, entry) => height + ROW_HEIGHT_PX * (
        2 + (entry.time ? 1 : 0) + (entry.discount ? 1 : 0)
        + (entry.services?.reduce((lines, text) => lines + Math.max(1, Math.ceil(text.length / 30)), 0) ?? 0)
      ), 0)
  }
  return (
    CHROME_HEIGHT_PX + doc.rows.length * ROW_HEIGHT_PX + doc.totals.length * TOTAL_ROW_HEIGHT_PX + (doc.footerNotes?.lines.reduce((sum, note) => sum + Math.ceil(note.length / 30) * ROW_HEIGHT_PX, ROW_HEIGHT_PX) ?? 0)
  )
}

function rowsMarkup(doc: PosReceiptDocument): string {
  if (doc.rows.length === 0) {
    return `<p class="empty">${escapeHtml(doc.labels.noLines)}</p>`
  }
  return doc.rows
    .map((row) => {
      if (row.kind === 'group') {
        return `<p class="group">${escapeHtml(row.label.toUpperCase())}</p>`
      }
      const label = row.kind === 'addOn' ? `+ ${row.label}` : row.label
      // No literal space before the badge: the JSX renderer separates it with a margin, and the
      // anti-drift test compares text content, so a space here would be a real difference.
      const discount = row.discountLabel
        ? `<span class="disc">${escapeHtml(row.discountLabel)}</span>`
        : ''
      const indent = row.kind === 'addOn' ? ' class="addon"' : ''
      return (
        `<div${indent}><span>${escapeHtml(label)}${discount}</span>` +
        `<span class="amt">${escapeHtml(money(row.amount ?? 0))}</span></div>`
      )
    })
    .join('')
}

function totalsMarkup(doc: PosReceiptDocument): string {
  return doc.totals
    .map((row) => {
      const cls = row.emphasis ? ' class="grand"' : ''
      return (
        `<div${cls}><span>${escapeHtml(row.label)}</span>` +
        `<span class="amt">${escapeHtml(totalAmountText(row))}</span></div>`
      )
    })
    .join('')
}

export function buildPosReceiptHtml(
  doc: PosReceiptDocument,
  options: { widthDots: number },
): string {
  if (doc.pages?.length) {
    const pages = doc.pages.map(page => buildPosReceiptHtml(page, options))
    const start = pages[0].indexOf('<body>') + '<body>'.length
    const content = pages.map((page, index) => `<section style="${index ? 'break-before:page;page-break-before:always;padding-top:24px;' : ''}">${page.slice(page.indexOf('<body>') + 6, page.lastIndexOf('</body>'))}</section>`).join('')
    return pages[0].slice(0, start) + content + '</body></html>'
  }
  if (doc.technicianReport) {
    const content = renderToStaticMarkup(createElement(PosTechnicianReportPrintDocument, {
      report: doc.technicianReport, fontSize: 22,
    }))
    return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="format-detection" content="telephone=no"><style>*{box-sizing:border-box}body{margin:0;width:${options.widthDots}px;padding:16px 24px;background:#fff;color:#000}</style></head><body>${content}</body></html>`
  }
  const businessBlock = [
    doc.businessName ? `<h1>${escapeHtml(doc.businessName)}</h1>` : '',
    doc.businessAddress ? `<p>${escapeHtml(doc.businessAddress)}</p>` : '',
    doc.businessPhone ? `<p>${escapeHtml(doc.businessPhone)}</p>` : '',
  ].join('')

  const customerBlock = [
    doc.customerName
      ? `<p>${escapeHtml(doc.labels.customer)}: ${escapeHtml(doc.customerName)}</p>`
      : '',
    doc.customerPhone
      ? `<p>${escapeHtml(doc.labels.phone)}: <span class="masked-phone">${Array.from(maskReceiptPhone(doc.customerPhone)).map((character) => `<span>${escapeHtml(character)}</span>`).join('')}</span></p>`
      : '',
  ].join('')

  const paidBlock =
    doc.isPaid && doc.paidWithLabel
      ? `<p class="paid">${escapeHtml(doc.labels.paidWith)} ${escapeHtml(doc.paidWithLabel)}</p>`
      : ''

  // format-detection is not cosmetic here: without it iOS turns the customer's phone number into a
  // tel: link and prints it underlined and blue-grey on a monochrome thermal printer.
  return (
    `<!DOCTYPE html><html><head><meta charset="utf-8">` +
    `<meta name="format-detection" content="telephone=no">` +
    `<title>${escapeHtml(doc.labels.ticket)} ${escapeHtml(doc.orderNumber)}</title><style>` +
    `*{margin:0;padding:0;box-sizing:border-box;}` +
    // Match the raster canvas passed as PassPRNT's `size`. CSS mm resolve at 96 dpi,
    // so converting printer dots to mm here shrinks the receipt to less than half-width.
    `body{width:${options.widthDots}px;padding:16px 24px;background:#fff;color:#000;` +
    `font-family:-apple-system,"Helvetica Neue",Helvetica,Arial,sans-serif;font-size:22px;line-height:1.35;}` +
    `.ticket{display:inline-block;background:#000;color:#fff;padding:2px 10px;font-size:24px;font-weight:700;}` +
    `.head{text-align:center;padding-bottom:8px;}` +
    `.head h1{font-size:30px;font-weight:700;margin:8px 0 2px;}` +
    `.head p{font-size:22px;}` +
    `.masked-phone{display:inline-flex;align-items:baseline;font:inherit;white-space:nowrap;}.masked-phone>span{display:inline-block;width:0.65em;font:inherit;text-align:center;}` +
    `.cust{text-align:left;margin-top:8px;font-size:22px;}` +
    `hr{border:0;border-top:2px dashed #000;margin:8px 0;}` +
    `.lines div,.totals div{display:flex;justify-content:space-between;gap:8px;padding:2px 0;}` +
    `.lines .addon{padding-left:14px;}` +
    `.lines div>span:first-child{min-width:0;overflow-wrap:anywhere;}.amt{white-space:nowrap;flex-shrink:0;}` +
    `.group{font-weight:700;font-size:22px;margin-top:8px;text-transform:uppercase;}` +
    `.disc{font-size:22px;margin-left:6px;}` +
    `.totals{margin-top:4px;}` +
    `.totals .grand{font-weight:700;font-size:22px;border-top:2px solid #000;margin-top:4px;padding-top:6px;}` +
    `.paid,.thanks{text-align:center;margin-top:10px;}` +
    `.thanks{font-weight:400;}` +
    `.empty{text-align:center;padding:8px 0;}` +
    `</style></head><body>` +
    `<div class="head"><span class="ticket">${escapeHtml(doc.labels.ticket)} #${escapeHtml(doc.orderNumber)}</span>` +
    `<p>${escapeHtml(doc.completedAtLabel)}</p>` +
    businessBlock +
    (customerBlock ? `<div class="cust">${customerBlock}</div>` : '') +
    `</div><hr>` +
    `<div class="lines">${rowsMarkup(doc)}</div><hr>` +
    `<div class="totals">${totalsMarkup(doc)}</div>` +
    (doc.footerNotes ? `<section style="margin-top:12px;border-top:2px dashed #000;padding-top:8px;overflow-wrap:anywhere"><strong>${escapeHtml(doc.footerNotes.heading)}</strong>${doc.footerNotes.lines.map(note => `<p style="white-space:pre-wrap">${escapeHtml(note)}</p>`).join('')}</section>` : '') +
    paidBlock +
    `<p class="thanks">${escapeHtml(doc.labels.thankYou)}</p>` +
    `</body></html>`
  )
}
