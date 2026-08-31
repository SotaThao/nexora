/**
 * Technician read-only Work Orders — GET /api/v1/staff/pos/work-orders.
 *
 * Salon picker reuses `useStaffBusinesses` (GET /api/v1/staff/businesses) instead of
 * a second businesses request. This module only loads the order list and detail.
 */
import httpClient from '../../lib/httpClient'
import { PosOrderStatus } from '../../constants/posOrderStatus'
import type {
  StaffWorkOrderDetailApiDto,
  StaffWorkOrderItemApiDto,
  StaffWorkOrderListItemApiDto,
  StaffWorkOrdersListQuery,
} from '../../types/repositories'

type HttpClient = typeof httpClient

export type StaffWorkOrderItem = {
  id: string
  serviceName: string
  unitPrice: number
  lineTotal: number
  durationMinutes: number
  isAddOn: boolean
  note: string | null
  technicianName: string | null
  completedAt: string | null
}

export type StaffWorkOrderListItem = {
  id: string
  orderNumber: string
  customerName: string
  status: PosOrderStatus
  checkedInAt: string
  scheduledAt: string | null
  serviceNames: string[]
  technicianNames: string[]
  stationNumber: number | null
  beeper: string | null
}

export type StaffWorkOrderDetail = {
  id: string
  orderNumber: string
  customerName: string
  status: PosOrderStatus
  checkedInAt: string
  scheduledAt: string | null
  stationNumber: number | null
  beeper: string | null
  customerNotes: string | null
  serviceTotal: number
  canStartService: boolean
  canCompleteService: boolean
  items: StaffWorkOrderItem[]
}

const STAFF_WORK_ORDERS_API_PATH = '/api/v1/staff/pos/work-orders'
const STAFF_WORK_ORDER_ACTION = {
  startService: 'start-service',
  completeService: 'complete-service',
} as const

const LIST_QUERY_PARAM = {
  businessId: 'businessId',
  date: 'date',
  status: 'status',
} as const

const POS_ORDER_STATUS_BY_WIRE = new Set<string>(Object.values(PosOrderStatus))

function asRecord(dto: object): Record<string, unknown> {
  return dto as Record<string, unknown>
}

function readValue<T>(dto: object, camel: string, pascal: string): T | undefined {
  const raw = asRecord(dto)
  return (raw[camel] ?? raw[pascal]) as T | undefined
}

function readText(dto: object, camel: string, pascal: string): string {
  const value = readValue<unknown>(dto, camel, pascal)
  return typeof value === 'string' ? value : ''
}

function readOptionalText(dto: object, camel: string, pascal: string): string | null {
  const value = readText(dto, camel, pascal).trim()
  return value || null
}

function readTextList(dto: object, camel: string, pascal: string): string[] {
  const value = readValue<unknown>(dto, camel, pascal)
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string' && Boolean(item))
    : []
}

function readOptionalNumber(dto: object, camel: string, pascal: string): number | null {
  const value = readValue<unknown>(dto, camel, pascal)
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function readNumber(dto: object, camel: string, pascal: string): number {
  return readOptionalNumber(dto, camel, pascal) ?? 0
}

function readFlag(dto: object, camel: string, pascal: string): boolean {
  return readValue<unknown>(dto, camel, pascal) === true
}

function toPosOrderStatus(raw: string): PosOrderStatus {
  if (POS_ORDER_STATUS_BY_WIRE.has(raw)) return raw as PosOrderStatus
  return PosOrderStatus.Waiting
}

function normalizeListItem(dto: StaffWorkOrderListItemApiDto): StaffWorkOrderListItem | null {
  const id = readText(dto, 'id', 'Id')
  if (!id) return null
  return {
    id,
    orderNumber: readText(dto, 'orderNumber', 'OrderNumber'),
    customerName: readText(dto, 'customerName', 'CustomerName'),
    status: toPosOrderStatus(readText(dto, 'status', 'Status')),
    checkedInAt: readText(dto, 'checkedInAt', 'CheckedInAt'),
    scheduledAt: readOptionalText(dto, 'scheduledAt', 'ScheduledAt'),
    serviceNames: readTextList(dto, 'serviceNames', 'ServiceNames'),
    technicianNames: readTextList(dto, 'technicianNames', 'TechnicianNames'),
    stationNumber: readOptionalNumber(dto, 'stationNumber', 'StationNumber'),
    beeper: readOptionalText(dto, 'beeper', 'Beeper'),
  }
}

function normalizeItem(dto: StaffWorkOrderItemApiDto): StaffWorkOrderItem {
  return {
    id: readText(dto, 'id', 'Id'),
    serviceName: readText(dto, 'serviceName', 'ServiceName'),
    unitPrice: readNumber(dto, 'unitPrice', 'UnitPrice'),
    lineTotal: readNumber(dto, 'lineTotal', 'LineTotal'),
    durationMinutes: readNumber(dto, 'durationMinutes', 'DurationMinutes'),
    isAddOn: readFlag(dto, 'isAddOn', 'IsAddOn'),
    note: readOptionalText(dto, 'note', 'Note'),
    technicianName: readOptionalText(dto, 'technicianName', 'TechnicianName'),
    completedAt: readOptionalText(dto, 'completedAt', 'CompletedAt'),
  }
}

function normalizeDetail(dto: StaffWorkOrderDetailApiDto | null): StaffWorkOrderDetail | null {
  if (!dto) return null
  const id = readText(dto, 'id', 'Id')
  if (!id) return null
  const items = readValue<StaffWorkOrderItemApiDto[]>(dto, 'items', 'Items') ?? []
  return {
    id,
    orderNumber: readText(dto, 'orderNumber', 'OrderNumber'),
    customerName: readText(dto, 'customerName', 'CustomerName'),
    status: toPosOrderStatus(readText(dto, 'status', 'Status')),
    checkedInAt: readText(dto, 'checkedInAt', 'CheckedInAt'),
    scheduledAt: readOptionalText(dto, 'scheduledAt', 'ScheduledAt'),
    stationNumber: readOptionalNumber(dto, 'stationNumber', 'StationNumber'),
    beeper: readOptionalText(dto, 'beeper', 'Beeper'),
    customerNotes: readOptionalText(dto, 'customerNotes', 'CustomerNotes'),
    serviceTotal: readNumber(dto, 'serviceTotal', 'ServiceTotal'),
    canStartService: readFlag(dto, 'canStartService', 'CanStartService'),
    canCompleteService: readFlag(dto, 'canCompleteService', 'CanCompleteService'),
    items: Array.isArray(items) ? items.map(normalizeItem) : [],
  }
}

function buildListParams(query: StaffWorkOrdersListQuery): Record<string, string | string[]> {
  const params: Record<string, string | string[]> = {
    [LIST_QUERY_PARAM.businessId]: query.businessId,
    [LIST_QUERY_PARAM.date]: query.date,
  }
  if (query.status?.length) {
    params[LIST_QUERY_PARAM.status] = query.status
  }
  return params
}

function workOrderDetailPath(orderId: string): string {
  return `${STAFF_WORK_ORDERS_API_PATH}/${encodeURIComponent(orderId)}`
}

function createStaffWorkOrdersRepository(client: HttpClient = httpClient) {
  return {
    async listWorkOrders(query: StaffWorkOrdersListQuery): Promise<StaffWorkOrderListItem[]> {
      const res = await client.get<StaffWorkOrderListItemApiDto[]>(
        STAFF_WORK_ORDERS_API_PATH,
        { params: buildListParams(query) },
      )
      if (!Array.isArray(res)) return []
      return res
        .map(normalizeListItem)
        .filter((item): item is StaffWorkOrderListItem => item != null)
    },

    async getWorkOrderDetail(orderId: string): Promise<StaffWorkOrderDetail | null> {
      const res = await client.get<StaffWorkOrderDetailApiDto>(workOrderDetailPath(orderId))
      return normalizeDetail(res)
    },

    async startWorkOrderService(orderId: string): Promise<boolean> {
      return client.post<boolean>(`${workOrderDetailPath(orderId)}/${STAFF_WORK_ORDER_ACTION.startService}`)
    },

    async completeWorkOrderService(orderId: string): Promise<boolean> {
      return client.post<boolean>(`${workOrderDetailPath(orderId)}/${STAFF_WORK_ORDER_ACTION.completeService}`)
    },
  }
}

export const staffWorkOrdersRepository = createStaffWorkOrdersRepository()
export default staffWorkOrdersRepository
