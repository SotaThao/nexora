/**
 * Builds the one receipt document that every print path renders (US-047).
 *
 * Before this, the checkout screen and the completed-orders panel each grouped the order's lines
 * by technician themselves, in near-identical code that differed only in the unassigned label.
 * That was survivable while the receipt was a single component; it is not survivable now that the
 * same receipt is also serialized to HTML for the Star PassPRNT app and persisted for copy 2 of a
 * multi-copy job. Three renderers of three slightly different receipts is a bug factory, and the
 * failure is silent — the preview looks right while the paper is missing a line.
 *
 * So this is the only place the receipt takes shape. It reads the order once, applies the device's
 * receipt options, and returns something fully resolved: every string translated and formatted,
 * every amount a plain number. Downstream needs no `t`, no locale, and no order query — which is
 * also exactly what makes the result safe to persist and replay after a full app remount.
 */
import {
  PosCheckoutPaymentMethod,
  type PosCheckoutPaymentMethodType,
} from '../../../../../constants/posCheckoutPaymentMethod'
import type {
  PosReceiptDocument,
  PosReceiptLabels,
  PosReceiptRow,
  PosReceiptTotalRow,
} from '../../../../../types/domain'
import type {
  CompleteOrderResultApiDto,
  OrderDetailApiDto,
  OrderServiceAddOnLineApiDto,
  OrderServiceLineApiDto,
  PosReceiptSettings,
} from '../../../../../types/repositories'
import { formatCustomerPhone } from '../customer/customerFormatters'
import { formatPosDateTime } from '../posDateTime'

/** Money the server confirmed at completion. Overrides the order's own live figures. */
export type PosReceiptConfirmedTotals = Pick<
  CompleteOrderResultApiDto,
  | 'servicesSubtotal'
  | 'productsSubtotal'
  | 'tipAmount'
  | 'discountAmount'
  | 'orderDiscountAmount'
  | 'salesTaxAmount'
  | 'totalAmount'
  | 'completedAt'
>

export interface PosReceiptDocumentInput {
  order: OrderDetailApiDto
  confirmed?: PosReceiptConfirmedTotals | null
  business?: {
    name?: string | null
    address?: string | null
    phone?: string | null
  }
  /** Shown in place of a technician name on a line nobody is assigned to yet. */
  unassignedTechnicianLabel: string
  /** Heading for the products group. */
  productsLabel: string
  paymentMethodLabel?: string
  /** Totals-row copy, resolved by the caller so this stays free of `t`. */
  totalsLabels: {
    subtotal: string
    discount: string
    orderDiscount: string
    salesTax: string
    tip: string
    total: string
    products: string
  }
  labels: PosReceiptLabels
  locale?: string
}

function money(value: number | null | undefined): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0
}

/**
 * "(-20%)" for a percentage discount, "(-$5)" for a fixed one. Kept here rather than imported so
 * both the preview and the HTML get the identical badge — this used to exist twice, once in each
 * of the two call sites, with the same body.
 */
function formatDiscountBadge(
  discountType: string | null | undefined,
  discountValue: number | null | undefined,
  discountAmount: number,
): string {
  if (discountType === 'Percent' && discountValue != null) return `(-${discountValue}%)`
  const amount = discountValue ?? discountAmount
  const rounded = Math.round(amount * 100) / 100
  const text = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2)
  return `(-$${text})`
}

function addOnRow(addOn: OrderServiceAddOnLineApiDto): PosReceiptRow {
  return {
    id: `addon-${addOn.id}`,
    kind: 'addOn',
    label: addOn.addOnName,
    amount: money(addOn.lineTotal),
    ...(money(addOn.discountAmount) > 0
      ? {
          discountLabel: formatDiscountBadge(
            addOn.discountType,
            addOn.discountValue,
            money(addOn.discountAmount),
          ),
        }
      : {}),
  }
}

interface TechnicianGroup {
  label: string
  lines: OrderServiceLineApiDto[]
}

function groupByTechnician(
  serviceLines: OrderServiceLineApiDto[],
  unassignedLabel: string,
): TechnicianGroup[] {
  return serviceLines.reduce<TechnicianGroup[]>((groups, line) => {
    const label = line.technicianName?.trim() || unassignedLabel
    const existing = groups.find((group) => group.label === label)
    if (existing) existing.lines.push(line)
    else groups.push({ label, lines: [line] })
    return groups
  }, [])
}

/**
 * Deterministic ordering, and deliberately a copy rather than an in-place sort: copy 2 of a job is
 * rendered from the persisted document, so any instability here would print two different receipts
 * for the same order.
 */
function sortGroups(groups: TechnicianGroup[]): TechnicianGroup[] {
  return groups
    .map((group) => ({
      label: group.label,
      lines: [...group.lines].sort((a, b) => a.serviceName.localeCompare(b.serviceName)),
    }))
    .sort((a, b) => a.label.localeCompare(b.label))
}

/**
 * Card payments get one copy count, everything else another — matching how a salon actually works:
 * the card slip is the copy the customer signs, cash rarely needs paper at all.
 */
export function resolveReceiptCopies(
  paymentMethodType: PosCheckoutPaymentMethodType | string | null | undefined,
  settings: PosReceiptSettings,
): number {
  return paymentMethodType === PosCheckoutPaymentMethod.Card
    ? settings.cardCopies
    : settings.otherCopies
}

export function buildPosReceiptDocument(
  input: PosReceiptDocumentInput,
  settings: PosReceiptSettings,
): PosReceiptDocument {
  const { order, confirmed, business, labels, totalsLabels } = input

  const serviceLines = order.serviceLines ?? []
  const productLines = order.productLines ?? []

  const groups = settings.sortServices
    ? sortGroups(groupByTechnician(serviceLines, input.unassignedTechnicianLabel))
    : groupByTechnician(serviceLines, input.unassignedTechnicianLabel)

  const rows: PosReceiptRow[] = []
  for (const group of groups) {
    rows.push({ id: `technician-${group.label}`, kind: 'group', label: group.label })
    for (const line of group.lines) {
      rows.push({
        id: `line-${line.id}`,
        kind: 'line',
        label: line.serviceName,
        amount: money(line.lineTotal),
        ...(money(line.discountAmount) > 0
          ? {
              discountLabel: formatDiscountBadge(
                line.discountType,
                line.discountValue,
                money(line.discountAmount),
              ),
            }
          : {}),
      })
      for (const addOn of line.addOns ?? []) rows.push(addOnRow(addOn))
    }
  }

  // With products switched off we drop the detail rows but keep their money in the totals — the
  // customer still paid for them, and a receipt whose lines do not add up to its total is not a
  // receipt. Hiding the breakdown is a preference; hiding the charge would be wrong.
  const showProducts = settings.printProducts && productLines.length > 0
  if (showProducts) {
    rows.push({ id: 'products', kind: 'group', label: input.productsLabel })
    for (const line of productLines) {
      rows.push({
        id: `product-${line.id}`,
        kind: 'line',
        label: line.quantity > 1 ? `${line.productName} x${line.quantity}` : line.productName,
        amount: money(line.lineTotal),
      })
    }
  }

  const servicesSubtotal = money(confirmed?.servicesSubtotal ?? order.servicesSubtotal)
  const productsSubtotal = money(confirmed?.productsSubtotal ?? order.productsSubtotal)
  const tipAmount = money(confirmed?.tipAmount ?? order.tipAmount)
  const discountAmount = money(confirmed?.discountAmount ?? order.discountAmount)
  const orderDiscountAmount = money(confirmed?.orderDiscountAmount ?? order.orderDiscountAmount)
  const salesTaxAmount = money(confirmed?.salesTaxAmount ?? order.salesTaxAmount)
  const total = money(confirmed?.totalAmount ?? order.total)

  const totals: PosReceiptTotalRow[] = [
    {
      id: 'subtotal',
      label: totalsLabels.subtotal,
      amount: servicesSubtotal + productsSubtotal,
    },
  ]

  // Products are folded into Subtotal above, so the only case needing its own row is products the
  // operator chose not to itemize — without it the subtotal reads as unexplained.
  if (!settings.printProducts && productsSubtotal > 0) {
    totals.push({ id: 'products', label: totalsLabels.products, amount: productsSubtotal })
  }
  if (discountAmount > 0) {
    totals.push({
      id: 'discount',
      label: totalsLabels.discount,
      amount: discountAmount,
      negative: true,
    })
  }
  if (orderDiscountAmount > 0) {
    totals.push({
      id: 'orderDiscount',
      label: order.appliedPromotionName?.trim() || totalsLabels.orderDiscount,
      amount: orderDiscountAmount,
      negative: true,
    })
  }
  if (salesTaxAmount > 0) {
    totals.push({ id: 'salesTax', label: totalsLabels.salesTax, amount: salesTaxAmount })
  }
  if (tipAmount > 0) {
    totals.push({ id: 'tip', label: totalsLabels.tip, amount: tipAmount })
  }
  totals.push({ id: 'total', label: totalsLabels.total, amount: total, emphasis: true })

  const completedAt = confirmed?.completedAt ?? order.completedAt ?? null
  const isPaid = Boolean(completedAt)

  return {
    version: 1,
    orderNumber: order.orderNumber ?? '',
    customerName: order.customerName?.trim() ?? '',
    // Never the bare national number: since the phone refactor `customerPhone` carries no country
    // code, so the E.164 field is the only value that formats correctly.
    customerPhone: order.customerPhone || order.customerPhoneE164
      ? formatCustomerPhone(order.customerPhone, order.customerPhoneE164)
      : '',
    completedAtLabel: formatPosDateTime(
      completedAt ?? new Date().toISOString(),
      input.locale ?? 'en',
    ),
    businessName: business?.name?.trim() ?? '',
    businessAddress: business?.address?.trim() ?? '',
    businessPhone: formatCustomerPhone(business?.phone, business?.phone?.trim().startsWith('+') ? business.phone : undefined),
    rows,
    totals,
    paidWithLabel: isPaid ? (input.paymentMethodLabel ?? '') : '',
    isPaid,
    labels,
  }
}
