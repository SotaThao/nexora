import posOrdersRepository from './posOrders'
import posCheckoutRepository from './posCheckout'
import { MAX_CUSTOM_SERVICE_PRICE } from '../../constants/posCustomService'
import en from '../../locales/en.json'
import { resolveTranslation } from '../../utils/translate'
import type { PosCheckInResultApiDto } from '../../types/repositories'

export type EstimateDiscountType = 'percent' | 'amount'
export interface EstimateLine {
  key: string
  serviceId: string | null
  name: string
  price: number | null
  quantity: number
  note?: string | null
}
export interface EstimateCheckInDraft {
  customerName: string
  customerPhone: string
  lines: EstimateLine[]
  discountType: EstimateDiscountType
  discountInput: string
}
export interface EstimateCheckInProgress {
  result?: PosCheckInResultApiDto
  completedCustomLines?: number
  uncertain?: boolean
}

const cents = (value: number) => Math.round((value + Number.EPSILON) * 100)
const usd = (value: number) => `$${value.toFixed(2)}`

export function calculateEstimate(lines: EstimateLine[], type: EstimateDiscountType, input: string) {
  const validLines = lines.length > 0 && lines.every(line =>
    line.name.trim() !== '' && line.price != null && Number.isFinite(line.price) && line.price >= 0
    && (line.serviceId != null || (line.price > 0 && line.price <= MAX_CUSTOM_SERVICE_PRICE))
    && Number.isSafeInteger(line.quantity) && line.quantity >= 1 && line.quantity <= 99,
  )
  const subtotalCents = lines.reduce((sum, line) => sum + (
    line.price != null && Number.isFinite(line.price) && Number.isSafeInteger(line.quantity)
      ? cents(line.price) * line.quantity : 0
  ), 0)
  const value = input.trim() === '' ? 0 : Number(input)
  const validDiscount = Number.isFinite(value) && value >= 0
    && (type === 'percent' ? value <= 100 : cents(value) <= subtotalCents)
  const discountCents = validDiscount
    ? type === 'percent' ? Math.round(subtotalCents * value / 100) : cents(value)
    : 0
  return {
    subtotal: subtotalCents / 100,
    discount: discountCents / 100,
    total: (subtotalCents - discountCents) / 100,
    validDiscount,
    valid: validLines && validDiscount && Number.isSafeInteger(subtotalCents),
  }
}

function quoteNote(draft: EstimateCheckInDraft) {
  const totals = calculateEstimate(draft.lines, draft.discountType, draft.discountInput)
  const discountLabel = draft.discountType === 'percent' ? `${Number(draft.discountInput || 0)}%` : usd(totals.discount)
  // Persist the shared ticket record in US English, regardless of the operator's UI language.
  return resolveTranslation(en, 'components.dashboard.views.pos.PosEstimateTab.ticketNote', {
    subtotal: usd(totals.subtotal), discountLabel, discount: usd(totals.discount), total: usd(totals.total),
  })
}

function hasUnknownOutcome(error: unknown) {
  const status = (error as { status?: number })?.status
  return !status || status >= 500 || status === 408
}

// Progress belongs to one frozen draft. Confirmed writes are never repeated, even when the
// final note fails. A lost response to a POST cannot safely be retried without server idempotency.
export function createEstimateCheckIn(
  orders: Pick<typeof posOrdersRepository, 'checkInOrder'> = posOrdersRepository,
  checkout: Pick<typeof posCheckoutRepository, 'addOrderCustomServiceLine' | 'setOrderNote'> = posCheckoutRepository,
) {
  return async (businessId: string, draft: EstimateCheckInDraft, progress: EstimateCheckInProgress) => {
    if (progress.uncertain) throw new Error('Estimate check-in needs verification in Tickets')
    if (!calculateEstimate(draft.lines, draft.discountType, draft.discountInput).valid) throw new Error('Invalid estimate')
    if (!progress.result) {
      try {
        progress.result = await orders.checkInOrder(businessId, {
          customerName: draft.customerName,
          customerPhone: draft.customerPhone,
          items: draft.lines.filter(line => line.serviceId != null).flatMap(line =>
            Array.from({ length: line.quantity }, () => ({
              itemType: 'Service' as const,
              id: line.serviceId as string,
              note: line.note || null,
            })),
          ),
        })
        if (!progress.result?.orderId) throw new Error('Check-in response did not confirm an order')
      } catch (error) {
        progress.uncertain = hasUnknownOutcome(error)
        throw error
      }
    }
    const customLines = draft.lines.filter(line => line.serviceId == null)
      .flatMap(line => Array.from({ length: line.quantity }, () => line))
    for (let index = progress.completedCustomLines ?? 0; index < customLines.length; index++) {
      const line = customLines[index]
      try {
        const lineId = await checkout.addOrderCustomServiceLine(businessId, progress.result.orderId, {
          customServiceName: line.name,
          price: line.price as number,
          posStaffProfileId: null,
          note: line.note || null,
        })
        if (!lineId) throw new Error('Custom service response did not confirm a line')
        progress.completedCustomLines = index + 1
      } catch (error) {
        progress.uncertain = hasUnknownOutcome(error)
        throw error
      }
    }
    const saved = await checkout.setOrderNote(businessId, progress.result.orderId, quoteNote(draft))
    if (!saved) throw new Error('Estimate note was not saved')
    return progress.result
  }
}

export const checkInEstimate = createEstimateCheckIn()
