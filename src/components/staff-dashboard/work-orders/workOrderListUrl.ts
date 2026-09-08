import {
  WORK_ORDER_TICKET_FILTER,
  staffWorkOrdersHref,
  type WorkOrderTicketFilter,
} from './constants'

export const WORK_ORDER_QUERY_PARAM = {
  date: 'date',
  status: 'status',
} as const

export const WORK_ORDER_NAVIGATE_REPLACE = { replace: true } as const

export const WORK_ORDER_LOCATION_STATE_FROM = 'from' as const

export type WorkOrderLocationState = {
  [WORK_ORDER_LOCATION_STATE_FROM]?: string
}

/** URL slugs for the ticket tabs — not backend PosOrderStatus wire values. */
export const WORK_ORDER_STATUS_QUERY_VALUE = {
  [WORK_ORDER_TICKET_FILTER.All]: 'all',
  [WORK_ORDER_TICKET_FILTER.Assigned]: 'assigned',
  [WORK_ORDER_TICKET_FILTER.InService]: 'in-service',
  [WORK_ORDER_TICKET_FILTER.Completed]: 'completed',
} as const

const FILTER_BY_STATUS_QUERY: Record<string, WorkOrderTicketFilter> = {
  [WORK_ORDER_STATUS_QUERY_VALUE[WORK_ORDER_TICKET_FILTER.All]]: WORK_ORDER_TICKET_FILTER.All,
  [WORK_ORDER_STATUS_QUERY_VALUE[WORK_ORDER_TICKET_FILTER.Assigned]]: WORK_ORDER_TICKET_FILTER.Assigned,
  [WORK_ORDER_STATUS_QUERY_VALUE[WORK_ORDER_TICKET_FILTER.InService]]: WORK_ORDER_TICKET_FILTER.InService,
  [WORK_ORDER_STATUS_QUERY_VALUE[WORK_ORDER_TICKET_FILTER.Completed]]: WORK_ORDER_TICKET_FILTER.Completed,
}

const LOCAL_ISO_DATE = /^\d{4}-\d{2}-\d{2}$/
const ISO_DATE_PARTS = 3
const JS_MONTH_OFFSET = 1

function isValidLocalIsoDate(value: string): boolean {
  if (!LOCAL_ISO_DATE.test(value)) return false
  const parts = value.split('-').map(Number)
  if (parts.length !== ISO_DATE_PARTS) return false
  const [year, month, day] = parts
  const date = new Date(year, month - JS_MONTH_OFFSET, day)
  return date.getFullYear() === year
    && date.getMonth() === month - JS_MONTH_OFFSET
    && date.getDate() === day
}

export function parseWorkOrderListDate(raw: string | null | undefined, todayIso: string): string {
  const value = raw?.trim() ?? ''
  return isValidLocalIsoDate(value) ? value : todayIso
}

export function parseWorkOrderListStatus(raw: string | null | undefined): WorkOrderTicketFilter {
  return FILTER_BY_STATUS_QUERY[raw?.trim() ?? ''] ?? WORK_ORDER_TICKET_FILTER.Assigned
}

export function workOrderListStatusQuery(filter: WorkOrderTicketFilter): string {
  return WORK_ORDER_STATUS_QUERY_VALUE[filter as keyof typeof WORK_ORDER_STATUS_QUERY_VALUE]
    ?? WORK_ORDER_STATUS_QUERY_VALUE[WORK_ORDER_TICKET_FILTER.All]
}

export function applyWorkOrderListParams(
  params: URLSearchParams,
  dateIso: string,
  filter: WorkOrderTicketFilter,
): URLSearchParams {
  const next = new URLSearchParams(params)
  next.set(WORK_ORDER_QUERY_PARAM.date, dateIso)
  next.set(WORK_ORDER_QUERY_PARAM.status, workOrderListStatusQuery(filter))
  return next
}

export function workOrderListSearch(dateIso: string, filter: WorkOrderTicketFilter): string {
  return applyWorkOrderListParams(new URLSearchParams(), dateIso, filter).toString()
}

export function workOrderListParamsNeedSync(
  params: URLSearchParams,
  dateIso: string,
  filter: WorkOrderTicketFilter,
): boolean {
  return applyWorkOrderListParams(params, dateIso, filter).toString() !== params.toString()
}

export function workOrderListHref(
  salonId: string,
  dateIso: string,
  filter: WorkOrderTicketFilter,
  ticketId?: string,
): string {
  return staffWorkOrdersHref(salonId, ticketId, workOrderListSearch(dateIso, filter))
}

export function workOrderLocationFromPath(state: unknown): string | undefined {
  if (!state || typeof state !== 'object') return undefined
  const from = (state as WorkOrderLocationState)[WORK_ORDER_LOCATION_STATE_FROM]
  return typeof from === 'string' ? from : undefined
}
