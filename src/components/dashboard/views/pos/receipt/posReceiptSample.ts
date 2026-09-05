/**
 * The sample receipt a test print sends.
 *
 * Built as a real `PosReceiptDocument` rather than a bespoke bit of markup, so a test print
 * exercises the same builder, the same renderer and the same paper width as a genuine receipt.
 * If the sample prints correctly, a real receipt will too — which is the entire point of the
 * button, and would not hold if this were a separate hand-written layout.
 */
import type { PosReceiptDocument, PosReceiptLabels } from '../../../../../types/domain'

export interface PosReceiptSampleInput {
  business?: { name?: string | null; address?: string | null; phone?: string | null }
  labels: PosReceiptLabels
  totalsLabels: { subtotal: string; salesTax: string; tip: string; total: string }
  /** Already-formatted timestamp, so this stays free of locale handling. */
  completedAtLabel: string
  /** Heading standing in for a technician name. */
  technicianLabel: string
  serviceLabel: string
  sampleCustomerName: string
}

export function buildPosReceiptSampleDocument(
  input: PosReceiptSampleInput,
): PosReceiptDocument {
  return {
    version: 1,
    orderNumber: 'TEST',
    customerName: input.sampleCustomerName,
    customerPhone: '',
    completedAtLabel: input.completedAtLabel,
    businessName: input.business?.name?.trim() ?? '',
    businessAddress: input.business?.address?.trim() ?? '',
    businessPhone: input.business?.phone?.trim() ?? '',
    rows: [
      { id: 'sample-group', kind: 'group', label: input.technicianLabel },
      { id: 'sample-line', kind: 'line', label: input.serviceLabel, amount: 25 },
    ],
    totals: [
      { id: 'subtotal', label: input.totalsLabels.subtotal, amount: 25 },
      { id: 'salesTax', label: input.totalsLabels.salesTax, amount: 2.06 },
      { id: 'tip', label: input.totalsLabels.tip, amount: 5 },
      { id: 'total', label: input.totalsLabels.total, amount: 32.06, emphasis: true },
    ],
    paidWithLabel: '',
    isPaid: false,
    labels: input.labels,
  }
}
