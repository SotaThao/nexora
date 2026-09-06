import type { PosReceiptDocument, PosReceiptRow } from '../../../../../types/domain'
import type { PosTicketPrintGroup } from '../PosTicketPrintPreview'

/** Ticket pages use the same persisted document and printer transport as checkout receipts. */
export function buildPosTicketDocument(input: {
  orderNumber: string; completedAtLabel: string; customerName?: string | null
  orderNote?: string | null; noteLabel: string; customerLabel: string; groups: PosTicketPrintGroup[]
}): PosReceiptDocument {
  const pages = input.groups.map((group, index): PosReceiptDocument => {
    const rows: PosReceiptRow[] = [{ id: group.id, kind: 'group', label: group.label }]
    for (const line of group.lines) {
      rows.push({ id: line.id, kind: 'line', label: line.name, amount: line.amount, discountLabel: line.discountLabel })
      for (const addOn of line.addOns ?? []) rows.push({ id: addOn.id, kind: 'addOn', label: addOn.name, amount: addOn.amount, discountLabel: addOn.discountLabel })
    }
    const notes = [input.orderNote?.trim(), ...group.lines.filter(line => line.note?.trim()).map(line => `${line.name}: ${line.note!.trim()}`)].filter((note): note is string => !!note)
    return {
      version: 1, orderNumber: input.orderNumber, completedAtLabel: input.completedAtLabel,
      customerName: input.customerName?.trim() ?? '', customerPhone: '',
      businessName: '', businessAddress: '', businessPhone: '', rows, totals: [], paidWithLabel: '', isPaid: false,
      labels: { ticket: 'Ticket', customer: input.customerLabel, phone: '', paidWith: '', noLines: '', thankYou: `${index + 1} / ${input.groups.length}` },
      footerNotes: notes.length ? { heading: input.noteLabel, lines: notes } : undefined,
    }
  })
  if (!pages.length) throw new Error('No technician services to print')
  return { ...pages[0], pages }
}
