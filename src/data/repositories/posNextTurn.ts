import type { OrderDetailApiDto } from '../../types/repositories'
import { PosOrderStatus } from '../../constants/posOrderStatus'
import posOrdersRepository from './posOrders'

export interface NextTurnBalance {
  completedAmounts: Map<string, number>
  committedAmounts: Map<string, number>
  availableSince: Map<string, number>
}

function calendarDay(timestamp: string, timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone, year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date(timestamp))
  const part = (type: string) => parts.find(value => value.type === type)?.value
  return `${part('year')}-${part('month')}-${part('day')}`
}

export function calculateNextTurnBalance(
  orders: readonly OrderDetailApiDto[], day: string, timeZone: string,
): NextTurnBalance {
  const balance: NextTurnBalance = {
    completedAmounts: new Map(), committedAmounts: new Map(),
    availableSince: new Map(),
  }
  for (const order of new Map(orders.map(order => [order.id, order])).values()) {
    const paid = order.status === PosOrderStatus.Completed
    if (!paid && order.status !== PosOrderStatus.Waiting && order.status !== PosOrderStatus.InService) continue
    if (paid) {
      if (!order.completedAt) continue
      if (calendarDay(order.completedAt, timeZone) !== day) continue
    }
    for (const line of order.serviceLines) {
      const staffId = line.assignedPosStaffProfileId
      if (!staffId) continue
      // Match the report's gross services, including add-ons, without tax, tips or products.
      const amount = [line.lineTotal, ...line.addOns.map(addOn => addOn.lineTotal)]
        .reduce((sum, value) => sum + (Number.isFinite(value) ? Math.max(0, value) : 0), 0)
      const amounts = paid ? balance.completedAmounts : balance.committedAmounts
      amounts.set(staffId, Math.round(((amounts.get(staffId) ?? 0) + amount) * 100) / 100)
      const finishedAt = Date.parse(line.completedAt ?? (paid ? order.completedAt : '') ?? '')
      if (Number.isFinite(finishedAt)) {
        balance.availableSince.set(staffId, Math.max(balance.availableSince.get(staffId) ?? 0, finishedAt))
      }
    }
  }
  return balance
}

// Read both sides of checkout into one balance. Computing paid and open amounts in separate
// queries can briefly double-count (or lose) a ticket while those queries refresh independently.
export async function getNextTurnBalance(
  businessId: string,
  day: string,
  timeZone: string,
  loadDetail: (orderId: string) => Promise<OrderDetailApiDto>,
) {
  // The completed-list endpoint filters UTC dates. Widen by one day on either side, then
  // calculate using the salon's calendar, including DST and time zones ahead of UTC.
  const shiftDay = (offset: number) => {
    const date = new Date(`${day}T12:00:00Z`)
    date.setUTCDate(date.getUTCDate() + offset)
    return date.toISOString().slice(0, 10)
  }
  const query = { dateFrom: shiftDay(-1), dateTo: shiftDay(1), pageSize: 200 }
  const [openOrders, firstPage] = await Promise.all([
    posOrdersRepository.getOrderList(businessId),
    posOrdersRepository.getCompletedOrders(businessId, { ...query, pageNumber: 1 }),
  ])
  const completedToday = (order: { completedAt?: string | null }) =>
    Boolean(order.completedAt && calendarDay(order.completedAt, timeZone) === day)
  const ids = new Set([...openOrders, ...firstPage.items.filter(completedToday)].map(order => order.id))
  for (let pageNumber = 2; pageNumber <= firstPage.totalPages; pageNumber++) {
    const page = await posOrdersRepository.getCompletedOrders(businessId, { ...query, pageNumber })
    page.items.filter(completedToday).forEach(order => ids.add(order.id))
  }
  const orderIds = [...ids]
  const details: OrderDetailApiDto[] = []
  // Limit concurrent detail requests for a busy salon. Completed details are cached by the hook.
  for (let offset = 0; offset < orderIds.length; offset += 6) {
    details.push(...await Promise.all(orderIds.slice(offset, offset + 6).map(loadDetail)))
  }
  return calculateNextTurnBalance(details, day, timeZone)
}
