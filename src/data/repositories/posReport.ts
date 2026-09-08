/**
 * posReportRepository — Front Desk -> Report (backend T4/T5).
 * Read-only per-technician operations report: turns, hours, gross service revenue, commission,
 * tips, the discount the technician absorbed, and take-home. Pay actions live in Weekly Payroll,
 * not here.
 */
import httpClient from '../../lib/httpClient'
import { PosReportMode } from '../../constants/posReportMode'
import type {
  CompletedOrderListItemApiDto,
  CompletedOrdersPage,
  OrderDetailApiDto,
  OrderServiceLineApiDto,
} from '../../types/repositories'

type HttpClient = typeof httpClient
export type PosOrderDetailLoader = (businessId: string, orderId: string) => Promise<OrderDetailApiDto>

const BASE_PATH = '/api/v1/merchant/pos/reports/staff'

export interface PosReportRow {
  businessStaffLinkId: string
  posStaffProfileId: string
  displayName: string
  photoUrl?: string | null
  payStructureType: string
  isInactive: boolean
  turns: number
  hours: number
  serviceAmount: number
  /** Null for pay structures that earn no commission (Hourly / Weekly Salary / Agreed Amount). */
  commissionPercent?: number | null
  /** True when the percent came from a Tiered bracket rather than a flat configured rate. */
  isCommissionPercentEstimated: boolean
  commission: number
  tips: number
  discount: number
  techTakes: number
  weeklyGuarantee?: number | null
}

export interface PosReportTotals {
  turns: number
  hours: number
  serviceAmount: number
  commission: number
  tips: number
  discount: number
  techTakes: number
}

export interface PosReportPeriod {
  key: string
  start: string
  end: string
}

export interface PosStaffReport {
  mode: string
  periods: PosReportPeriod[]
  rows: PosReportRow[]
  totals: PosReportTotals
  generatedAtUtc: string
}

export interface PosStaffReportTicket {
  orderId: string
  orderNumber: string
  completedAtUtc: string
  amount: number
  tips: number
  ownerDiscount: number
  totalDiscount: number
  collectedAmount: number
  paymentMethod?: string | null
  services: string[]
}

export interface PosStaffReportDayDetail {
  date: string
  amount: number
  tips: number
  totalDiscount: number
  tickets: PosStaffReportTicket[]
}

export interface PosStaffReportPaymentTotal {
  paymentMethod: string
  amount: number
}

export interface PosStaffReportDetail {
  mode: PosReportMode
  posStaffProfileId: string
  timeZone: string
  periodStart: string
  periodEnd: string
  days: PosStaffReportDayDetail[]
  totalAmount: number
  totalTips: number
  totalDiscount: number
  totalCommission: number
  paymentTotals: PosStaffReportPaymentTotal[]
}

export interface PosReportParams {
  businessId: string
  /** Used only for client freshness decisions; the backend resolves its configured salon zone. */
  timeZone?: string
  mode: PosReportMode
  dates?: string[]
  weeks?: string[]
  month?: string
}

export interface PosReportDetailParams {
  businessId: string
  posStaffProfileId: string
  mode: PosReportMode
  periodKey: string
  displayName: string
  periodStart: string
  periodEnd: string
  timeZone: string
}

type QueryParams = Record<string, string | number | boolean | string[] | number[]>

/** Only the parameter matching the mode is sent — the backend validator rejects the others. */
function toQueryParams(params: PosReportParams): QueryParams {
  const query: QueryParams = {
    businessId: params.businessId,
    mode: params.mode,
  }
  if (params.mode === PosReportMode.Daily) query.dates = params.dates ?? []
  if (params.mode === PosReportMode.Weekly) query.weeks = params.weeks ?? []
  if (params.mode === PosReportMode.Monthly) query.month = params.month ?? ''
  return query
}

const COMPLETED_ORDER_PAGE_SIZE = 200
const ORDER_DETAIL_BATCH_SIZE = 12

function roundCurrency(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

function normalizeName(value: string | null | undefined): string {
  return (value ?? '').trim().toLocaleLowerCase()
}

function dateKeysBetween(start: string, end: string): string[] {
  const startMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(start)
  const endMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(end)
  if (!startMatch || !endMatch) return []
  const cursor = new Date(Date.UTC(Number(startMatch[1]), Number(startMatch[2]) - 1, Number(startMatch[3])))
  const last = new Date(Date.UTC(Number(endMatch[1]), Number(endMatch[2]) - 1, Number(endMatch[3])))
  const keys: string[] = []
  while (cursor <= last) {
    keys.push([
      cursor.getUTCFullYear(),
      String(cursor.getUTCMonth() + 1).padStart(2, '0'),
      String(cursor.getUTCDate()).padStart(2, '0'),
    ].join('-'))
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  }
  return keys
}

function parseUtcInstant(isoDateTime: string): Date | null {
  const value = isoDateTime.trim()
  if (!value) return null
  const normalized = /(?:z|[+-]\d{2}:?\d{2})$/i.test(value) ? value : `${value}Z`
  const date = new Date(normalized)
  return Number.isNaN(date.getTime()) ? null : date
}

function addIsoDays(isoDate: string, days: number): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate)
  if (!match) return isoDate
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]) + days))
  return [
    date.getUTCFullYear(),
    String(date.getUTCMonth() + 1).padStart(2, '0'),
    String(date.getUTCDate()).padStart(2, '0'),
  ].join('-')
}

function zonedParts(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date)
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value ?? 0)
  return {
    year: value('year'),
    month: value('month'),
    day: value('day'),
    hour: value('hour'),
    minute: value('minute'),
    second: value('second'),
  }
}

/** Convert midnight on a salon calendar date into its UTC instant, including DST transitions. */
function salonDateStartUtc(isoDate: string, timeZone: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate)
  if (!match) return new Date(Number.NaN)
  const targetUtcShape = Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
  let candidate = targetUtcShape
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const parts = zonedParts(new Date(candidate), timeZone)
    const candidateUtcShape = Date.UTC(
      parts.year,
      parts.month - 1,
      parts.day,
      parts.hour,
      parts.minute,
      parts.second,
    )
    const correction = targetUtcShape - candidateUtcShape
    candidate += correction
    if (correction === 0) break
  }
  return new Date(candidate)
}

function salonDateKey(isoDateTime: string, timeZone: string): string {
  const date = parseUtcInstant(isoDateTime)
  if (!date) return ''
  const parts = zonedParts(date, timeZone)
  return [
    parts.year,
    String(parts.month).padStart(2, '0'),
    String(parts.day).padStart(2, '0'),
  ].join('-')
}

function lineAmount(line: OrderServiceLineApiDto): number {
  return line.lineTotal + (line.addOns ?? []).reduce((total, addOn) => total + addOn.lineTotal, 0)
}

function lineDiscount(line: OrderServiceLineApiDto): number {
  return line.discountAmount + (line.addOns ?? []).reduce((total, addOn) => total + addOn.discountAmount, 0)
}

function lineStaffDiscount(line: OrderServiceLineApiDto): number {
  return line.staffDiscountShare
    + (line.addOns ?? []).reduce((total, addOn) => total + addOn.staffDiscountShare, 0)
}

function buildStaffTicket(
  order: OrderDetailApiDto,
  listItem: CompletedOrderListItemApiDto,
  posStaffProfileId: string,
): PosStaffReportTicket | null {
  const lines = (order.serviceLines ?? [])
    .filter((line) => line.assignedPosStaffProfileId === posStaffProfileId)
  if (lines.length === 0) return null

  const amount = lines.reduce((total, line) => total + lineAmount(line), 0)
  const discount = lines.reduce((total, line) => total + lineDiscount(line), 0)
  const staffDiscount = lines.reduce((total, line) => total + lineStaffDiscount(line), 0)
  const orderDiscountShare = order.servicesSubtotal > 0
    ? roundCurrency(order.orderDiscountAmount * amount / order.servicesSubtotal)
    : 0
  const staffTaxableAmount = Math.max(0, amount - discount - orderDiscountShare)
  const orderTaxableAmount = order.servicesNet + order.productsSubtotal
  const taxShare = orderTaxableAmount > 0
    ? roundCurrency(order.salesTaxAmount * staffTaxableAmount / orderTaxableAmount)
    : 0
  const tips = order.staffTipShares
    ?.find((share) => share.posStaffProfileId === posStaffProfileId)?.tipAmount ?? 0

  return {
    orderId: order.id,
    orderNumber: order.orderNumber || listItem.orderNumber,
    completedAtUtc: order.completedAt || listItem.completedAt || '',
    amount: roundCurrency(amount),
    tips: roundCurrency(tips),
    ownerDiscount: roundCurrency(Math.max(0, discount - staffDiscount) + orderDiscountShare),
    totalDiscount: roundCurrency(discount + orderDiscountShare),
    collectedAmount: Math.max(
      0,
      roundCurrency(amount - discount - orderDiscountShare + taxShare + tips),
    ),
    paymentMethod: order.paymentMethodType,
    services: lines.flatMap((line) => [
      line.serviceName,
      ...(line.addOns ?? []).map((addOn) => addOn.addOnName),
    ]).filter(Boolean),
  }
}

async function mapInBatches<TItem, TResult>(
  items: TItem[],
  batchSize: number,
  mapper: (item: TItem) => Promise<TResult>,
): Promise<TResult[]> {
  const results: TResult[] = []
  for (let start = 0; start < items.length; start += batchSize) {
    results.push(...await Promise.all(items.slice(start, start + batchSize).map(mapper)))
  }
  return results
}

export function createPosReportRepository(client: HttpClient = httpClient) {
  return {
    async getStaffReport(params: PosReportParams): Promise<PosStaffReport> {
      const data = await client.get<PosStaffReport>(BASE_PATH, { params: toQueryParams(params) })
      return {
        mode: data?.mode ?? params.mode,
        periods: data?.periods ?? [],
        rows: data?.rows ?? [],
        totals: data?.totals ?? {
          turns: 0, hours: 0, serviceAmount: 0, commission: 0, tips: 0, discount: 0, techTakes: 0,
        },
        generatedAtUtc: data?.generatedAtUtc ?? '',
      }
    },

    async exportStaffReportCsv(params: PosReportParams): Promise<Blob> {
      return await client.getBlob(`${BASE_PATH}/export.csv`, { params: toQueryParams(params) })
    },

    async getStaffReportsForPrint(
      params: PosReportParams,
      rows: PosReportRow[],
      period: PosReportPeriod,
    ): Promise<Array<{ displayName: string; detail: PosStaffReportDetail }>> {
      // Share summary, completed-order pages and ticket details within this print batch.
      // Every technician still uses exactly the same calculation as View → Print.
      const reads = new Map<string, Promise<unknown>>()
      const sharedClient: HttpClient = {
        ...client,
        get<T>(path: string, options?: Parameters<HttpClient['get']>[1]): Promise<T> {
          const key = JSON.stringify([path, options])
          let result = reads.get(key)
          if (!result) {
            result = client.get(path, options)
            reads.set(key, result)
          }
          return result as Promise<T>
        },
      }
      const repository = createPosReportRepository(sharedClient)
      return mapInBatches(rows, 4, async row => ({
        displayName: row.displayName,
        detail: await repository.getStaffReportDetail({
          businessId: params.businessId,
          posStaffProfileId: row.posStaffProfileId,
          displayName: row.displayName,
          mode: params.mode,
          periodKey: period.key,
          periodStart: period.start,
          periodEnd: period.end,
          timeZone: params.timeZone || 'America/Chicago',
        }),
      }))
    },

    async getStaffReportDetail(
      params: PosReportDetailParams,
      orderDetailLoader?: PosOrderDetailLoader,
    ): Promise<PosStaffReportDetail> {
      const summaryParams: PosReportParams = {
        businessId: params.businessId,
        mode: params.mode,
        dates: params.mode === PosReportMode.Daily ? [params.periodKey] : undefined,
        weeks: params.mode === PosReportMode.Weekly ? [params.periodKey] : undefined,
        month: params.mode === PosReportMode.Monthly ? params.periodKey : undefined,
      }
      // Start the existing summary and order-detail reads together so every figure in the modal
      // comes from the same refresh cycle instead of mixing fresh tickets with a stale table row.
      const summaryPromise = client.get<PosStaffReport>(BASE_PATH, {
        params: toQueryParams(summaryParams),
      })
      const periodStartUtc = salonDateStartUtc(params.periodStart, params.timeZone)
      const periodEndUtcExclusive = salonDateStartUtc(addIsoDays(params.periodEnd, 1), params.timeZone)
      const periodStartMs = periodStartUtc.getTime()
      const periodEndMs = periodEndUtcExclusive.getTime()
      if (!Number.isFinite(periodStartMs) || !Number.isFinite(periodEndMs)) {
        throw new Error('Invalid POS report period or business time zone')
      }

      const completedOrders: CompletedOrderListItemApiDto[] = []
      let pageNumber = 1
      let hasNextPage = false
      do {
        const page = await client.get<CompletedOrdersPage>(
          `/api/v1/merchant/pos/${encodeURIComponent(params.businessId)}/orders/completed`,
          {
            params: {
              PageNumber: pageNumber,
              PageSize: COMPLETED_ORDER_PAGE_SIZE,
              // Completed Orders filters in UTC. DateTo expands to its whole UTC day, so this
              // intentionally over-fetches the final day; the salon-zone bounds below are the
              // strict source of truth.
              DateFrom: periodStartUtc.toISOString(),
              DateTo: new Date(periodEndMs - 1).toISOString().slice(0, 10),
            },
          },
        )
        completedOrders.push(...(page?.items ?? []))
        hasNextPage = Boolean(page?.hasNextPage)
        pageNumber += 1
      } while (hasNextPage)

      const targetName = normalizeName(params.displayName)
      const candidates = completedOrders.filter((order) => {
        const completedAt = order.completedAt ? parseUtcInstant(order.completedAt)?.getTime() : null
        return completedAt != null
          && completedAt >= periodStartMs
          && completedAt < periodEndMs
          && (order.technicianNames ?? []).some((name) => normalizeName(name) === targetName)
      })
      const loadOrderDetail = orderDetailLoader ?? ((businessId: string, orderId: string) =>
        client.get<OrderDetailApiDto>(
          `/api/v1/merchant/pos/${encodeURIComponent(businessId)}/checkout/${encodeURIComponent(orderId)}`,
        ))
      const orderDetails = await mapInBatches(candidates, ORDER_DETAIL_BATCH_SIZE, (order) =>
        loadOrderDetail(params.businessId, order.id))
      const tickets = orderDetails
        .map((order, index) => buildStaffTicket(order, candidates[index], params.posStaffProfileId))
        .filter((ticket): ticket is PosStaffReportTicket => ticket !== null)
        .filter((ticket) => {
          const completedAt = parseUtcInstant(ticket.completedAtUtc)?.getTime()
          return completedAt != null && completedAt >= periodStartMs && completedAt < periodEndMs
        })
        .sort((left, right) => left.completedAtUtc.localeCompare(right.completedAtUtc))

      const dateKeys = dateKeysBetween(params.periodStart, params.periodEnd)
      const ticketsByDate = new Map<string, PosStaffReportTicket[]>()
      for (const ticket of tickets) {
        const dateKey = salonDateKey(ticket.completedAtUtc, params.timeZone)
        const dayTickets = ticketsByDate.get(dateKey) ?? []
        dayTickets.push(ticket)
        ticketsByDate.set(dateKey, dayTickets)
      }
      const days = dateKeys.map((date) => {
        const dayTickets = ticketsByDate.get(date) ?? []
        return {
          date,
          amount: roundCurrency(dayTickets.reduce((total, ticket) => total + ticket.amount, 0)),
          tips: roundCurrency(dayTickets.reduce((total, ticket) => total + ticket.tips, 0)),
          totalDiscount: roundCurrency(dayTickets.reduce((total, ticket) => total + ticket.totalDiscount, 0)),
          tickets: params.mode === PosReportMode.Daily ? dayTickets : [],
        }
      })

      const paymentTotals = Array.from(tickets.reduce((totals, ticket) => {
        const paymentMethod = ticket.paymentMethod?.trim()
        if (paymentMethod) {
          totals.set(paymentMethod, (totals.get(paymentMethod) ?? 0) + ticket.collectedAmount)
        }
        return totals
      }, new Map<string, number>()))
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([paymentMethod, amount]) => ({ paymentMethod, amount: roundCurrency(amount) }))
      const summary = await summaryPromise
      const totalCommission = summary?.rows?.find(
        (row) => row.posStaffProfileId === params.posStaffProfileId,
      )?.commission ?? 0

      return {
        mode: params.mode,
        posStaffProfileId: params.posStaffProfileId,
        timeZone: params.timeZone,
        periodStart: params.periodStart,
        periodEnd: params.periodEnd,
        days,
        totalAmount: roundCurrency(tickets.reduce((total, ticket) => total + ticket.amount, 0)),
        totalTips: roundCurrency(tickets.reduce((total, ticket) => total + ticket.tips, 0)),
        totalDiscount: roundCurrency(tickets.reduce((total, ticket) => total + ticket.totalDiscount, 0)),
        totalCommission: roundCurrency(totalCommission),
        paymentTotals,
      }
    },
  }
}

const posReportRepository = createPosReportRepository()
export default posReportRepository
