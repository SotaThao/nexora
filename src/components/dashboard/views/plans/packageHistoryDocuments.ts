import { BOOKING_HUB_EMPTY_CELL } from '../bookingHubFormatters'
import {
  PackageHistoryDocumentKind,
  packageHistoryDocumentFileName,
} from './constants'

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    }
    return map[character] ?? character
  })
}

export type PackageHistoryDocumentCopy = {
  documentLabel: string
  sellerName: string
  descriptionLabel: string
  qtyLabel: string
  unitLabel: string
  amountLabel: string
  totalLabel: string
  packageLabel: string
  termLabel: string
  transactionLabel: string
  dateLabel: string
  statusLabel: string
}

export type PackageHistoryDocumentValues = {
  packageName: string
  term: string
  transactionId: string
  date: string
  status: string
  amount: string
}

export function buildPackageHistoryDocumentHtml(
  copy: PackageHistoryDocumentCopy,
  values: PackageHistoryDocumentValues,
): string {
  const cell = (value: string) => escapeHtml(value || BOOKING_HUB_EMPTY_CELL)
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${cell(copy.documentLabel)}</title>
  <style>
    body { font-family: Inter, system-ui, sans-serif; color: #0b1220; margin: 32px; }
    h1 { font-size: 22px; margin: 0 0 4px; }
    .seller { color: #4d5870; font-size: 13px; margin-bottom: 24px; }
    table { width: 100%; border-collapse: collapse; }
    th, td { border-bottom: 1px solid #dde5ef; padding: 10px 8px; text-align: left; font-size: 13px; }
    th { color: #4d5870; font-size: 11px; letter-spacing: .04em; text-transform: uppercase; }
    .total { font-weight: 800; }
    dl { display: grid; grid-template-columns: 160px 1fr; gap: 8px 16px; margin: 24px 0; }
    dt { color: #4d5870; font-size: 12px; }
    dd { margin: 0; font-size: 13px; font-weight: 600; }
  </style>
</head>
<body>
  <h1>${cell(copy.documentLabel)}</h1>
  <p class="seller">${cell(copy.sellerName)}</p>
  <dl>
    <dt>${cell(copy.packageLabel)}</dt><dd>${cell(values.packageName)}</dd>
    <dt>${cell(copy.termLabel)}</dt><dd>${cell(values.term)}</dd>
    <dt>${cell(copy.transactionLabel)}</dt><dd>${cell(values.transactionId)}</dd>
    <dt>${cell(copy.dateLabel)}</dt><dd>${cell(values.date)}</dd>
    <dt>${cell(copy.statusLabel)}</dt><dd>${cell(values.status)}</dd>
  </dl>
  <table>
    <thead>
      <tr>
        <th>${cell(copy.descriptionLabel)}</th>
        <th>${cell(copy.qtyLabel)}</th>
        <th>${cell(copy.unitLabel)}</th>
        <th>${cell(copy.amountLabel)}</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>${cell(values.packageName)}</td>
        <td>1</td>
        <td>${cell(values.amount)}</td>
        <td class="total">${cell(values.amount)}</td>
      </tr>
    </tbody>
  </table>
  <p class="total">${cell(copy.totalLabel)}: ${cell(values.amount)}</p>
</body>
</html>`
}

export function downloadPackageHistoryDocument(
  kind: PackageHistoryDocumentKind,
  copy: PackageHistoryDocumentCopy,
  values: PackageHistoryDocumentValues,
): void {
  const html = buildPackageHistoryDocumentHtml(copy, values)
  const filename = packageHistoryDocumentFileName(kind, values.transactionId)
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  const href = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = href
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(href)
}
