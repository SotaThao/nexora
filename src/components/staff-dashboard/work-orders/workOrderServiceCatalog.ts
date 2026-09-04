import { PosOrderStatus } from '../../../constants/posOrderStatus'
import type { StaffWorkOrderCatalogItem } from '../../../data/repositories/staffWorkOrders'
import type { SaveStaffWorkOrderServiceLinePayload } from '../../../types/repositories'
import { PosOrderItemStatus } from '../../../constants/posOrderItemStatus'

import type { WorkOrderItem } from './constants'

export const WORK_ORDER_SERVICE_APPROVAL = {
  pending: 'pending',
  approved: 'approved',
  rejected: 'rejected',
} as const

export type WorkOrderServiceApproval =
  (typeof WORK_ORDER_SERVICE_APPROVAL)[keyof typeof WORK_ORDER_SERVICE_APPROVAL]

export type WorkOrderCatalogService = {
  id: string
  name: string
  price: number
  durationMin: number
}

export type WorkOrderCatalogCategory = {
  id: string
  name: string
  services: WorkOrderCatalogService[]
}

export type WorkOrderEditableLine = {
  key: string
  id?: string
  /** Null on a custom (off-menu) line, which travels as name + price instead. */
  posServiceId?: string | null
  serviceName: string
  unitPrice: number
  durationMinutes: number
  isAddOn: boolean
  technicianName: string | null
  approval: WorkOrderServiceApproval | null
  lineStatus?: string
  isMine?: boolean
}

export const WORK_ORDER_CUSTOM_SERVICE_DEFAULT_DURATION = 30
export const WORK_ORDER_CUSTOM_SERVICE_MAX_DURATION = 10000
export const WORK_ORDER_CUSTOM_SERVICE_MAX_PRICE = 10000
export const WORK_ORDER_APPROVAL_CODE_LENGTH = 4
export const WORK_ORDER_PICKER_MODE = {
  add: 'add',
  edit: 'edit',
} as const

export type WorkOrderPickerMode =
  (typeof WORK_ORDER_PICKER_MODE)[keyof typeof WORK_ORDER_PICKER_MODE]

/** Mock salon catalog matching the staff work-order HTML prototype. */
export const WORK_ORDER_MOCK_SERVICE_CATEGORIES: WorkOrderCatalogCategory[] = [
  {
    id: 'manicure',
    name: 'Manicure',
    services: [
      { id: 'classic-manicure', name: 'Classic Manicure', price: 28, durationMin: 30 },
      { id: 'gel-manicure', name: 'Gel Manicure', price: 42, durationMin: 40 },
      { id: 'dip-powder', name: 'Dip Powder', price: 52, durationMin: 55 },
      { id: 'builder-gel', name: 'Builder Gel', price: 64, durationMin: 60 },
    ],
  },
  {
    id: 'pedicure',
    name: 'Pedicure',
    services: [
      { id: 'classic-pedicure', name: 'Classic Pedicure', price: 38, durationMin: 35 },
      { id: 'deluxe-pedicure', name: 'Deluxe Pedicure', price: 55, durationMin: 45 },
      { id: 'spa-pedicure', name: 'Spa Pedicure', price: 60, durationMin: 50 },
    ],
  },
  {
    id: 'sets',
    name: 'Full sets',
    services: [
      { id: 'acrylic-full-set', name: 'Acrylic Full Set', price: 68, durationMin: 65 },
      { id: 'gel-x-full-set', name: 'Gel-X Full Set', price: 72, durationMin: 70 },
    ],
  },
]

const LOCAL_LINE_PREFIX = 'wo-local-'
const UNCATEGORIZED_ID = 'uncategorized'

function nextLocalLineKey(): string {
  return `${LOCAL_LINE_PREFIX}${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function countsTowardTotal(line: WorkOrderEditableLine): boolean {
  if (line.approval === WORK_ORDER_SERVICE_APPROVAL.pending) return false
  if (line.approval === WORK_ORDER_SERVICE_APPROVAL.rejected) return false
  return true
}

export function canEditWorkOrderServices(status: PosOrderStatus): boolean {
  return status !== PosOrderStatus.Completed && status !== PosOrderStatus.Cancelled
}

export function toWorkOrderEditableLines(items: WorkOrderItem[]): WorkOrderEditableLine[] {
  return items.map((item, index) => ({
    key: item.id || `api-${index}`,
    id: item.id,
    posServiceId: item.posServiceId,
    serviceName: item.serviceName,
    unitPrice: item.lineTotal || item.unitPrice,
    durationMinutes: item.durationMinutes,
    isAddOn: item.isAddOn,
    technicianName: item.technicianName,
    approval: null,
    lineStatus: item.lineStatus,
    isMine: item.isMine,
  }))
}

function isParentServiceLine(line: WorkOrderEditableLine): boolean {
  return !line.isAddOn
}

export function applyWorkOrderLineStatus(
  lines: WorkOrderEditableLine[],
  lineId: string,
  lineStatus: PosOrderItemStatus,
): WorkOrderEditableLine[] {
  return lines.map((line) => (line.id === lineId ? { ...line, lineStatus } : line))
}

export function applyWorkOrderAssignedLinesStarted(lines: WorkOrderEditableLine[]): WorkOrderEditableLine[] {
  return lines.map((line) => (
    isParentServiceLine(line) && line.lineStatus === PosOrderItemStatus.Assigned
      ? { ...line, lineStatus: PosOrderItemStatus.Started }
      : line
  ))
}

export function applyWorkOrderStartedLinesCompleted(lines: WorkOrderEditableLine[]): WorkOrderEditableLine[] {
  return lines.map((line) => (
    isParentServiceLine(line) && line.lineStatus === PosOrderItemStatus.Started
      ? { ...line, lineStatus: PosOrderItemStatus.Completed }
      : line
  ))
}

/** Keep local mock add/change overlays; take line status from the ticket after a refetch. */
export function mergeWorkOrderLinesFromServer(
  current: WorkOrderEditableLine[],
  items: WorkOrderItem[],
): WorkOrderEditableLine[] {
  const fromServer = toWorkOrderEditableLines(items)
  const serverIds = new Set(
    fromServer.map((line) => line.id).filter((id): id is string => Boolean(id)),
  )
  const currentById = new Map(
    current.filter((line) => line.id).map((line) => [line.id as string, line]),
  )
  const currentByKey = new Map(current.map((line) => [line.key, line]))
  const merged = fromServer.map((line) => {
    const prev = (line.id ? currentById.get(line.id) : undefined) ?? currentByKey.get(line.key)
    if (!prev) return line
    if (prev.approval === WORK_ORDER_SERVICE_APPROVAL.pending) {
      return {
        ...prev,
        id: line.id,
        lineStatus: line.lineStatus,
        isMine: line.isMine,
      }
    }
    return { ...line, approval: prev.approval }
  })
  const localOnly = current.filter((line) => {
    if (line.id && serverIds.has(line.id)) return false
    if (!line.id && fromServer.some((server) => server.key === line.key)) return false
    return !line.id
  })
  return [...merged, ...localOnly]
}

export function workOrderEditableServiceTotal(lines: WorkOrderEditableLine[]): number {
  return lines.reduce((sum, line) => sum + (countsTowardTotal(line) ? line.unitPrice : 0), 0)
}

export function workOrderPendingServiceLines(lines: WorkOrderEditableLine[]): WorkOrderEditableLine[] {
  return lines.filter(
    (line) => !line.isAddOn && line.approval === WORK_ORDER_SERVICE_APPROVAL.pending,
  )
}

export const WORK_ORDER_TICKET_FOOTER_ACTION = {
  start: 'start',
  complete: 'complete',
} as const

export type WorkOrderTicketFooterAction =
  (typeof WORK_ORDER_TICKET_FOOTER_ACTION)[keyof typeof WORK_ORDER_TICKET_FOOTER_ACTION]

function parentLineHasStatus(lines: WorkOrderEditableLine[], status: PosOrderItemStatus): boolean {
  return lines.some((line) => isParentServiceLine(line) && line.lineStatus === status)
}

/** Ticket Start Service shows when any parent service is still Assigned. */
export function workOrderHasAssignedService(lines: WorkOrderEditableLine[]): boolean {
  return parentLineHasStatus(lines, PosOrderItemStatus.Assigned)
}

/** Ticket Complete shows when any parent service is In Service (Started). */
export function workOrderHasInServiceService(lines: WorkOrderEditableLine[]): boolean {
  return parentLineHasStatus(lines, PosOrderItemStatus.Started)
}

// find something, not a statement about where a service "really" belongs. Anything with no category
// still has to be reachable, hence the trailing bucket.
export function buildWorkOrderCatalogCategories(
  items: StaffWorkOrderCatalogItem[],
  uncategorizedLabel: string,
): WorkOrderCatalogCategory[] {
  const byCategory = new Map<string, WorkOrderCatalogCategory>()

  items.forEach((item) => {
    const service: WorkOrderCatalogService = {
      id: item.id,
      name: item.name,
      price: item.price,
      durationMin: item.durationMinutes,
    }
    const categories = item.categories.length > 0
      ? item.categories
      : [{ id: UNCATEGORIZED_ID, name: uncategorizedLabel }]

    categories.forEach((category) => {
      const existing = byCategory.get(category.id)
      if (existing) {
        existing.services.push(service)
        return
      }
      byCategory.set(category.id, { id: category.id, name: category.name, services: [service] })
    })
  })

  return [...byCategory.values()].sort((a, b) => {
    if (a.id === UNCATEGORIZED_ID) return 1
    if (b.id === UNCATEGORIZED_ID) return -1
    return a.name.localeCompare(b.name)
  })
}

/**
 * One ticket footer action, from the lowest parent-line status that still needs work.
 * Assigned beats In Service: a ticket with both only shows Start Service.
 */
export function workOrderTicketFooterAction(
  lines: WorkOrderEditableLine[],
): WorkOrderTicketFooterAction | null {
  if (workOrderHasAssignedService(lines)) return WORK_ORDER_TICKET_FOOTER_ACTION.start
  if (workOrderHasInServiceService(lines)) return WORK_ORDER_TICKET_FOOTER_ACTION.complete
  return null
}

export function flattenWorkOrderCatalog(
  categories: WorkOrderCatalogCategory[] = WORK_ORDER_MOCK_SERVICE_CATEGORIES,
): WorkOrderCatalogService[] {
  return categories.flatMap((category) => category.services)
}

export function findWorkOrderCatalogService(
  serviceId: string,
  categories: WorkOrderCatalogCategory[] = WORK_ORDER_MOCK_SERVICE_CATEGORIES,
): WorkOrderCatalogService | undefined {
  return flattenWorkOrderCatalog(categories).find((service) => service.id === serviceId)
}

export function matchWorkOrderCatalogServiceByName(
  name: string,
  categories: WorkOrderCatalogCategory[] = WORK_ORDER_MOCK_SERVICE_CATEGORIES,
): WorkOrderCatalogService | undefined {
  const needle = name.trim().toLowerCase()
  if (!needle) return undefined
  return flattenWorkOrderCatalog(categories).find((service) => service.name.toLowerCase() === needle)
}

export function filterWorkOrderCatalogCategories(
  query: string,
  categories: WorkOrderCatalogCategory[],
): WorkOrderCatalogCategory[] {
  const needle = query.trim().toLowerCase()
  if (!needle) return categories
  return categories
    .map((category) => ({
      ...category,
      services: category.services.filter(
        (service) =>
          service.name.toLowerCase().includes(needle) || category.name.toLowerCase().includes(needle),
      ),
    }))
    .filter((category) => category.services.length > 0)
}

function lineFromCatalog(
  service: WorkOrderCatalogService,
  extras?: Pick<WorkOrderEditableLine, 'key' | 'id' | 'technicianName' | 'isAddOn' | 'lineStatus' | 'isMine'>,
): WorkOrderEditableLine {
  return {
    key: extras?.key ?? nextLocalLineKey(),
    id: extras?.id,
    posServiceId: service.id,
    serviceName: service.name,
    unitPrice: service.price,
    durationMinutes: service.durationMin,
    isAddOn: extras?.isAddOn ?? false,
    technicianName: extras?.technicianName ?? null,
    approval: WORK_ORDER_SERVICE_APPROVAL.pending,
    lineStatus: extras?.lineStatus,
    isMine: extras?.isMine,
  }
}

export function addWorkOrderCatalogService(
  lines: WorkOrderEditableLine[],
  service: WorkOrderCatalogService,
): WorkOrderEditableLine[] {
  return [...lines, lineFromCatalog(service)]
}

// Keeps the line's identity (id/key) so the save swaps the existing service rather than deleting
// the line and adding another one, which would throw away its place on the ticket.
export function replaceWorkOrderCatalogService(
  lines: WorkOrderEditableLine[],
  key: string,
  service: WorkOrderCatalogService,
): WorkOrderEditableLine[] {
  return lines.map((line) => {
    if (line.key !== key) return line
    return lineFromCatalog(service, {
      key: line.key,
      id: line.id,
      technicianName: line.technicianName,
      isAddOn: line.isAddOn,
      lineStatus: line.lineStatus,
      isMine: line.isMine,
    })
  })
}

export function addWorkOrderCustomService(
  lines: WorkOrderEditableLine[],
  input: { name: string; price: number },
): WorkOrderEditableLine[] {
  return [
    ...lines,
    {
      key: nextLocalLineKey(),
      posServiceId: null,
      serviceName: input.name,
      unitPrice: input.price,
      // No duration is stored for an off-menu line, so the row shows a placeholder instead of "0m".
      durationMinutes: 0,
      isAddOn: false,
      technicianName: null,
      approval: WORK_ORDER_SERVICE_APPROVAL.pending,
    },
  ]
}

export function removeWorkOrderServiceLine(
  lines: WorkOrderEditableLine[],
  key: string,
): WorkOrderEditableLine[] {
  return lines.filter((line) => line.key !== key)
}

export function markWorkOrderLinePending(
  lines: WorkOrderEditableLine[],
  key: string,
): WorkOrderEditableLine[] {
  return lines.map((line) => (
    line.key === key && !line.isAddOn
      ? { ...line, approval: WORK_ORDER_SERVICE_APPROVAL.pending }
      : line
  ))
}

export function setWorkOrderPendingApproval(
  lines: WorkOrderEditableLine[],
  approval: typeof WORK_ORDER_SERVICE_APPROVAL.approved | typeof WORK_ORDER_SERVICE_APPROVAL.rejected,
): WorkOrderEditableLine[] {
  return lines.map((line) => (
    line.approval === WORK_ORDER_SERVICE_APPROVAL.pending ? { ...line, approval } : line
  ))
}

// The technician's own parent lines, exactly as they now stand. A line of theirs that is missing
// here is what tells the server to remove it, so add-ons and other technicians' lines must never
// be included — leaving one out would be read as "delete it".
export function toSaveWorkOrderServiceLinesPayload(
  lines: WorkOrderEditableLine[],
): SaveStaffWorkOrderServiceLinePayload[] {
  return lines
    .filter((line) => !line.isAddOn && line.isMine !== false)
    .map((line) => (
      line.posServiceId
        ? { id: line.id ?? null, posServiceId: line.posServiceId }
        : { id: line.id ?? null, customServiceName: line.serviceName, price: line.unitPrice }
    ))
}

export function parseWorkOrderLast4(value: string): string {
  return value.replace(/\D/g, '').slice(0, WORK_ORDER_APPROVAL_CODE_LENGTH)
}

export function clampWorkOrderPriceInput(raw: string): string {
  const cleaned = raw.replace(/[^\d.]/g, '')
  if (!cleaned) return ''
  const [whole = '', ...fractionParts] = cleaned.split('.')
  const wholeCapped = whole.slice(0, String(WORK_ORDER_CUSTOM_SERVICE_MAX_PRICE).length)
  if (fractionParts.length === 0) return wholeCapped
  return `${wholeCapped}.${fractionParts.join('').slice(0, 2)}`
}

export function isValidCustomWorkOrderService(input: { name: string; price: number }): boolean {
  return Boolean(input.name.trim())
    && Number.isFinite(input.price)
    && input.price > 0
    && input.price <= WORK_ORDER_CUSTOM_SERVICE_MAX_PRICE
}

export function canSubmitCustomWorkOrderService(raw: { name: string; price: string }): boolean {
  if (!raw.name.trim() || !raw.price.trim()) return false
  return isValidCustomWorkOrderService({ name: raw.name, price: Number(raw.price) })
}
