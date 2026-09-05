/**
 * Resolves the receipt's static copy once, so the document builder and both renderers stay free of
 * `t` — which is what lets a built document be persisted with a print job and replayed later,
 * outside any React tree.
 *
 * The keys all live under the PosOrderWorkspace namespace, where the receipt strings already were
 * before the receipt moved into its own module. They are shared by every print surface, so the
 * checkout screen and the completed-orders panel cannot drift into different wording.
 */
import type { TFunction } from '../../../../../types/contexts'
import type { PosReceiptLabels } from '../../../../../types/domain'

const K = 'components.dashboard.views.pos.PosOrderWorkspace'

export function resolvePosReceiptLabels(t: TFunction): PosReceiptLabels {
  return {
    ticket: t(`${K}.receiptTitle`),
    customer: t(`${K}.printPreviewCustomer`),
    phone: t(`${K}.printPreviewPhone`),
    paidWith: t(`${K}.printPreviewPaidWith`),
    thankYou: t(`${K}.printPreviewThankYou`),
    noLines: t(`${K}.noLines`),
  }
}

export function resolvePosReceiptTotalsLabels(t: TFunction) {
  return {
    subtotal: t(`${K}.summarySubtotal`),
    discount: t(`${K}.summaryDiscount`),
    orderDiscount: t(`${K}.summaryOrderDiscount`),
    salesTax: t(`${K}.summarySalesTax`),
    tip: t(`${K}.summaryTip`),
    total: t(`${K}.summaryTotal`),
    products: t(`${K}.summaryProducts`),
  }
}

/** Shown in place of a technician on a line nobody is assigned to yet. */
export function resolveUnassignedTechnicianLabel(t: TFunction): string {
  return t(`${K}.firstAvailableLabel`)
}

export function resolveProductsGroupLabel(t: TFunction): string {
  return t(`${K}.summaryProducts`)
}
