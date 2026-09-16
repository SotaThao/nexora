/**
 * Technician Work Orders — GET /api/v1/staff/pos/work-orders plus start/complete.
 *
 * Salon picker reuses `useStaffBusinesses` (GET /api/v1/staff/businesses) instead of
 * a second businesses request. This module only loads the order list and detail.
 */
import httpClient from '../../lib/httpClient'
import { readRequiredApproval } from '../../constants/posServiceApproval'
import { PosOrderStatus } from '../../constants/posOrderStatus'
import type {
  CompleteStaffWorkOrderServicePayload,
  StaffBookingCalendarApiDto,
  StaffBookingCalendarItemApiDto,
  StaffBookingCalendarQuery,
  SaveStaffWorkOrderServiceLinesPayload,
  StaffWorkOrderCatalogItemApiDto,
  StaffWorkOrderCatalogCategoryApiDto,
  StaffWorkOrderServiceCatalogApiDto,
  StaffWorkOrderDetailApiDto,
  StaffWorkOrderItemApiDto,
  StaffWorkOrderListItemApiDto,
  StaffWorkOrdersListQuery,
} from '../../types/repositories'

type HttpClient = typeof httpClient

export type StaffWorkOrderCatalogItem = {
  id: string
  name: string
  price: number
  durationMinutes: number
  isRequiredApproval: boolean
  categories: { id: string; name: string }[]
}

export type StaffWorkOrderCatalogCategory = {
  id: string
  name: string
  displayOrder: number
}

export type StaffWorkOrderCatalog = {
  categories: StaffWorkOrderCatalogCategory[]
  services: StaffWorkOrderCatalogItem[]
}

export type StaffWorkOrderItem = {
  id: string
  /** Null on a custom (off-menu) line — the editor sends name and price back instead. */
  posServiceId: string | null
  serviceName: string
  unitPrice: number
  lineTotal: number
  durationMinutes: number
  isAddOn: boolean
  note: string | null
  technicianName: string | null
  /** See PosOrderItemStatus. */
  lineStatus: string
  isRequiredApproval: boolean
  /** True when this line is the caller's own — the ticket shows every technician on it. */
  isMine: boolean
  startedAt: string | null
  completedAt: string | null
}

export type StaffWorkOrderListItem = {
  id: string
  orderNumber: string
  customerName: string
  /** Shared ticket status (front desk). */
  status: PosOrderStatus
  /** Caller-local badge/filter status from their own parent lines. */
  myStatus: PosOrderStatus
  checkedInAt: string
  scheduledAt: string | null
  serviceNames: string[]
  technicianNames: string[]
  stationNumber: number | null
  beeper: string | null
}

/** One appointment on "My Calendar" — figures already narrowed to the caller's own lines. */
export type StaffBookingCalendarItem = {
  id: string
  orderNumber: string
  customerName: string
  status: PosOrderStatus
  lineStatus: string
  /** Carries the salon's UTC offset; parse the offset, do not shift to browser local. */
  scheduledAt: string
  serviceNames: string[]
  durationMinutes: number
}

export type StaffBookingCalendar = {
  date: string
  appointmentCount: number
  totalDurationMinutes: number
  items: StaffBookingCalendarItem[]
}

export type StaffWorkOrderDetail = {
  id: string
  /** Line-level actions are addressed per business, so the screen needs it. */
  businessId: string
  orderNumber: string
  customerName: string
  /** Shared ticket status (front desk). */
  status: PosOrderStatus
  /** Caller-local progress from their own parent lines. */
  myStatus: PosOrderStatus
  checkedInAt: string
  scheduledAt: string | null
  stationNumber: number | null
  beeper: string | null
  customerNotes: string | null
  completionNote: string | null
  serviceTotal: number
  canStartService: boolean
  canCompleteService: boolean
  items: StaffWorkOrderItem[]
}

/** Salon + day My Tickets should open — aligned with the shell badge pool. */
export type StaffMyTicketsEntryTarget = {
  businessId: string
  date: string
  orderId: string | null
}

const STAFF_WORK_ORDERS_API_PATH = '/api/v1/staff/pos/work-orders'
const STAFF_WORK_ORDER_ACTION = {
  startService: 'start-service',
  completeService: 'complete-service',
} as const

const STAFF_WORK_ORDER_SERVICE_CATALOG = 'service-catalog'
const STAFF_WORK_ORDER_MY_SERVICE_LINES = 'my-service-lines'

const PENDING_ACCEPTANCE_COUNT_PATH = `${STAFF_WORK_ORDERS_API_PATH}/pending-acceptance-count`
const ENTRY_TARGET_PATH = `${STAFF_WORK_ORDERS_API_PATH}/entry-target`
const BOOKING_CALENDAR_PATH = `${STAFF_WORK_ORDERS_API_PATH}/calendar`

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
  const status = toPosOrderStatus(readText(dto, 'status', 'Status'))
  const myStatusRaw = readText(dto, 'myStatus', 'MyStatus')
  return {
    id,
    orderNumber: readText(dto, 'orderNumber', 'OrderNumber'),
    customerName: readText(dto, 'customerName', 'CustomerName'),
    status,
    myStatus: myStatusRaw ? toPosOrderStatus(myStatusRaw) : status,
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
    posServiceId: readOptionalText(dto, 'posServiceId', 'PosServiceId'),
    serviceName: readText(dto, 'serviceName', 'ServiceName'),
    unitPrice: readNumber(dto, 'unitPrice', 'UnitPrice'),
    lineTotal: readNumber(dto, 'lineTotal', 'LineTotal'),
    durationMinutes: readNumber(dto, 'durationMinutes', 'DurationMinutes'),
    isAddOn: readFlag(dto, 'isAddOn', 'IsAddOn'),
    note: readOptionalText(dto, 'note', 'Note'),
    technicianName: readOptionalText(dto, 'technicianName', 'TechnicianName'),
    lineStatus: readText(dto, 'lineStatus', 'LineStatus'),
    isRequiredApproval: readRequiredApproval(dto),
    isMine: readFlag(dto, 'isMine', 'IsMine'),
    startedAt: readOptionalText(dto, 'startedAt', 'StartedAt'),
    completedAt: readOptionalText(dto, 'completedAt', 'CompletedAt'),
  }
}

function normalizeDetail(dto: StaffWorkOrderDetailApiDto | null): StaffWorkOrderDetail | null {
  if (!dto) return null
  const id = readText(dto, 'id', 'Id')
  if (!id) return null
  const items = readValue<StaffWorkOrderItemApiDto[]>(dto, 'items', 'Items') ?? []
  const status = toPosOrderStatus(readText(dto, 'status', 'Status'))
  const myStatusRaw = readText(dto, 'myStatus', 'MyStatus')
  return {
    id,
    businessId: readText(dto, 'businessId', 'BusinessId'),
    orderNumber: readText(dto, 'orderNumber', 'OrderNumber'),
    customerName: readText(dto, 'customerName', 'CustomerName'),
    status,
    myStatus: myStatusRaw ? toPosOrderStatus(myStatusRaw) : status,
    checkedInAt: readText(dto, 'checkedInAt', 'CheckedInAt'),
    scheduledAt: readOptionalText(dto, 'scheduledAt', 'ScheduledAt'),
    stationNumber: readOptionalNumber(dto, 'stationNumber', 'StationNumber'),
    beeper: readOptionalText(dto, 'beeper', 'Beeper'),
    customerNotes: readOptionalText(dto, 'customerNotes', 'CustomerNotes'),
    completionNote:
      readOptionalText(dto, 'completionNote', 'CompletionNote')
      ?? readOptionalText(dto, 'completeNote', 'CompleteNote'),
    serviceTotal: readNumber(dto, 'serviceTotal', 'ServiceTotal'),
    canStartService: readFlag(dto, 'canStartService', 'CanStartService'),
    canCompleteService: readFlag(dto, 'canCompleteService', 'CanCompleteService'),
    items: Array.isArray(items) ? items.map(normalizeItem) : [],
  }
}

function normalizeCatalogItem(dto: StaffWorkOrderCatalogItemApiDto): StaffWorkOrderCatalogItem | null {
  const id = readText(dto, 'id', 'Id')
  if (!id) return null
  const categories = readValue<{ id?: string; name?: string }[]>(dto, 'categories', 'Categories') ?? []
  return {
    id,
    name: readText(dto, 'name', 'Name'),
    price: readNumber(dto, 'price', 'Price'),
    durationMinutes: readNumber(dto, 'durationMinutes', 'DurationMinutes'),
    isRequiredApproval: readRequiredApproval(dto),
    categories: (Array.isArray(categories) ? categories : [])
      .map((category) => ({
        id: readText(category, 'id', 'Id'),
        name: readText(category, 'name', 'Name'),
      }))
      .filter((category) => Boolean(category.id)),
  }
}

function normalizeCatalogCategory(
  dto: StaffWorkOrderCatalogCategoryApiDto,
): StaffWorkOrderCatalogCategory | null {
  const id = readText(dto, 'id', 'Id')
  if (!id) return null
  return {
    id,
    name: readText(dto, 'name', 'Name'),
    displayOrder: readNumber(dto, 'displayOrder', 'DisplayOrder'),
  }
}

function normalizeCatalogServices(items: StaffWorkOrderCatalogItemApiDto[]): StaffWorkOrderCatalogItem[] {
  return items
    .map(normalizeCatalogItem)
    .filter((item): item is StaffWorkOrderCatalogItem => item != null)
}

function normalizeCatalog(
  dto: StaffWorkOrderServiceCatalogApiDto | StaffWorkOrderCatalogItemApiDto[] | null | undefined,
): StaffWorkOrderCatalog {
  // Older payloads were a flat service array. Empty salon categories could not exist in that
  // shape, so treat a leftover array as services-only rather than dropping the picker.
  if (Array.isArray(dto)) {
    return { categories: [], services: normalizeCatalogServices(dto) }
  }
  if (!dto || typeof dto !== 'object') {
    return { categories: [], services: [] }
  }
  const categories = readValue<StaffWorkOrderCatalogCategoryApiDto[]>(dto, 'categories', 'Categories') ?? []
  const services = readValue<StaffWorkOrderCatalogItemApiDto[]>(dto, 'services', 'Services') ?? []
  return {
    categories: (Array.isArray(categories) ? categories : [])
      .map(normalizeCatalogCategory)
      .filter((category): category is StaffWorkOrderCatalogCategory => category != null),
    services: Array.isArray(services) ? normalizeCatalogServices(services) : [],
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

function normalizeCalendarItem(
  dto: StaffBookingCalendarItemApiDto,
): StaffBookingCalendarItem | null {
  const id = readText(dto, 'id', 'Id')
  const scheduledAt = readText(dto, 'scheduledAt', 'ScheduledAt')
  // A calendar row without a schedule cannot be placed on the day — drop it rather than
  // render it at an invented time.
  if (!id || !scheduledAt) return null
  return {
    id,
    orderNumber: readText(dto, 'orderNumber', 'OrderNumber'),
    customerName: readText(dto, 'customerName', 'CustomerName'),
    status: toPosOrderStatus(readText(dto, 'status', 'Status')),
    lineStatus: readText(dto, 'myLineStatus', 'MyLineStatus'),
    scheduledAt,
    serviceNames: readTextList(dto, 'myServiceNames', 'MyServiceNames'),
    durationMinutes: readNumber(dto, 'myDurationMinutes', 'MyDurationMinutes'),
  }
}

function normalizeCalendar(
  dto: StaffBookingCalendarApiDto | null,
  fallbackDate: string,
): StaffBookingCalendar {
  const rawItems = readValue<StaffBookingCalendarItemApiDto[]>(dto ?? {}, 'items', 'Items') ?? []
  const items = (Array.isArray(rawItems) ? rawItems : [])
    .map(normalizeCalendarItem)
    .filter((item): item is StaffBookingCalendarItem => item != null)
  return {
    date: readText(dto ?? {}, 'date', 'Date') || fallbackDate,
    // Recount locally: a row dropped above must not leave the header claiming it.
    appointmentCount: items.length,
    totalDurationMinutes: items.reduce((sum, item) => sum + item.durationMinutes, 0),
    items,
  }
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

    // "My Calendar" — appointments only, already narrowed server-side to this technician's lines.
    async getBookingCalendar(query: StaffBookingCalendarQuery): Promise<StaffBookingCalendar> {
      const res = await client.get<StaffBookingCalendarApiDto>(BOOKING_CALENDAR_PATH, {
        params: {
          [LIST_QUERY_PARAM.businessId]: query.businessId,
          [LIST_QUERY_PARAM.date]: query.date,
        },
      })
      return normalizeCalendar(res, query.date)
    },

    // Polled from the app shell, so a failure must read as "no badge" rather than break the shell.
    async getPendingAcceptanceCount(): Promise<number> {
      const res = await client.get<number>(PENDING_ACCEPTANCE_COUNT_PATH)
      return typeof res === 'number' && Number.isFinite(res) ? res : 0
    },

    // Landing salon for My Tickets — same on-floor pool as the badge (PendingAcceptance first).
    async getMyTicketsEntryTarget(): Promise<StaffMyTicketsEntryTarget | null> {
      const res = await client.get<{
        businessId?: string
        BusinessId?: string
        date?: string
        Date?: string
        orderId?: string | null
        OrderId?: string | null
      } | null>(ENTRY_TARGET_PATH)
      if (!res || typeof res !== 'object') return null
      const businessId = (res.businessId ?? res.BusinessId)?.trim() ?? ''
      const date = (res.date ?? res.Date)?.trim() ?? ''
      if (!businessId || !date) return null
      const orderId = (res.orderId ?? res.OrderId)?.trim() || null
      return { businessId, date, orderId }
    },

    async getWorkOrderDetail(orderId: string): Promise<StaffWorkOrderDetail | null> {
      const res = await client.get<StaffWorkOrderDetailApiDto>(workOrderDetailPath(orderId))
      return normalizeDetail(res)
    },

    // Salon menu: every category plus every Active service, matching POS Settings > Services.
    async getMyServiceCatalog(orderId: string): Promise<StaffWorkOrderCatalog> {
      const res = await client.get<StaffWorkOrderServiceCatalogApiDto | StaffWorkOrderCatalogItemApiDto[]>(
        `${workOrderDetailPath(orderId)}/${STAFF_WORK_ORDER_SERVICE_CATALOG}`,
      )
      return normalizeCatalog(res)
    },

    // One call for the whole basket: the customer approves once, so the change lands once.
    async saveMyServiceLines(
      orderId: string,
      payload: SaveStaffWorkOrderServiceLinesPayload,
    ): Promise<StaffWorkOrderDetail | null> {
      const res = await client.put<StaffWorkOrderDetailApiDto>(
        `${workOrderDetailPath(orderId)}/${STAFF_WORK_ORDER_MY_SERVICE_LINES}`,
        payload,
      )
      return normalizeDetail(res)
    },

    async startWorkOrderService(orderId: string): Promise<boolean> {
      return client.post<boolean>(`${workOrderDetailPath(orderId)}/${STAFF_WORK_ORDER_ACTION.startService}`)
    },

    async completeWorkOrderService(orderId: string, note?: string | null): Promise<boolean> {
      const body: CompleteStaffWorkOrderServicePayload = { note: note ?? null }
      return client.post<boolean>(
        `${workOrderDetailPath(orderId)}/${STAFF_WORK_ORDER_ACTION.completeService}`,
        body,
      )
    },
  }
}

export const staffWorkOrdersRepository = createStaffWorkOrdersRepository()
export default staffWorkOrdersRepository
