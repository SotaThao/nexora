import { PosOrderStatus } from '../../../constants/posOrderStatus'
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
  serviceName: string
  unitPrice: number
  durationMinutes: number
  isAddOn: boolean
  technicianName: string | null
  approval: WorkOrderServiceApproval | null
}

export const WORK_ORDER_CUSTOM_SERVICE_DEFAULT_DURATION = 30
export const WORK_ORDER_CUSTOM_SERVICE_MAX_DURATION = 999
export const WORK_ORDER_CUSTOM_SERVICE_MAX_PRICE = 9999.99
export const WORK_ORDER_MOCK_APPROVAL_LAST4 = '0184'
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
    serviceName: item.serviceName,
    unitPrice: item.lineTotal || item.unitPrice,
    durationMinutes: item.durationMinutes,
    isAddOn: item.isAddOn,
    technicianName: item.technicianName,
    approval: null,
  }))
}

export function workOrderEditableServiceTotal(lines: WorkOrderEditableLine[]): number {
  return lines.reduce((sum, line) => sum + (countsTowardTotal(line) ? line.unitPrice : 0), 0)
}

export function workOrderPendingServiceLines(lines: WorkOrderEditableLine[]): WorkOrderEditableLine[] {
  return lines.filter(
    (line) => !line.isAddOn && line.approval === WORK_ORDER_SERVICE_APPROVAL.pending,
  )
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
  categories: WorkOrderCatalogCategory[] = WORK_ORDER_MOCK_SERVICE_CATEGORIES,
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
  extras?: Pick<WorkOrderEditableLine, 'key' | 'technicianName' | 'isAddOn'>,
): WorkOrderEditableLine {
  return {
    key: extras?.key ?? nextLocalLineKey(),
    serviceName: service.name,
    unitPrice: service.price,
    durationMinutes: service.durationMin,
    isAddOn: extras?.isAddOn ?? false,
    technicianName: extras?.technicianName ?? null,
    approval: WORK_ORDER_SERVICE_APPROVAL.pending,
  }
}

export function addWorkOrderCatalogService(
  lines: WorkOrderEditableLine[],
  service: WorkOrderCatalogService,
): WorkOrderEditableLine[] {
  return [...lines, lineFromCatalog(service)]
}

export function replaceWorkOrderCatalogService(
  lines: WorkOrderEditableLine[],
  key: string,
  service: WorkOrderCatalogService,
): WorkOrderEditableLine[] {
  return lines.map((line) => {
    if (line.key !== key) return line
    return lineFromCatalog(service, {
      key: line.key,
      technicianName: line.technicianName,
      isAddOn: line.isAddOn,
    })
  })
}

export function addWorkOrderCustomService(
  lines: WorkOrderEditableLine[],
  input: { name: string; price: number; durationMinutes: number },
): WorkOrderEditableLine[] {
  return [
    ...lines,
    {
      key: nextLocalLineKey(),
      serviceName: input.name,
      unitPrice: input.price,
      durationMinutes: input.durationMinutes,
      isAddOn: false,
      technicianName: null,
      approval: WORK_ORDER_SERVICE_APPROVAL.pending,
    },
  ]
}

export function setWorkOrderPendingApproval(
  lines: WorkOrderEditableLine[],
  approval: typeof WORK_ORDER_SERVICE_APPROVAL.approved | typeof WORK_ORDER_SERVICE_APPROVAL.rejected,
): WorkOrderEditableLine[] {
  return lines.map((line) => (
    line.approval === WORK_ORDER_SERVICE_APPROVAL.pending ? { ...line, approval } : line
  ))
}

export function parseWorkOrderLast4(value: string): string {
  return value.replace(/\D/g, '').slice(0, 4)
}

export function clampWorkOrderDurationInput(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, String(WORK_ORDER_CUSTOM_SERVICE_MAX_DURATION).length)
  if (!digits) return ''
  const value = Number(digits)
  if (!Number.isFinite(value) || value <= 0) return digits
  return String(Math.min(WORK_ORDER_CUSTOM_SERVICE_MAX_DURATION, value))
}

export function clampWorkOrderPriceInput(raw: string): string {
  const cleaned = raw.replace(/[^\d.]/g, '')
  if (!cleaned) return ''
  const [whole = '', ...fractionParts] = cleaned.split('.')
  const wholeCapped = whole.slice(0, 4)
  if (fractionParts.length === 0) return wholeCapped
  return `${wholeCapped}.${fractionParts.join('').slice(0, 2)}`
}

export function isValidCustomWorkOrderService(input: {
  name: string
  price: number
  durationMinutes: number
}): boolean {
  return Boolean(input.name.trim())
    && Number.isFinite(input.price)
    && input.price >= 0
    && input.price <= WORK_ORDER_CUSTOM_SERVICE_MAX_PRICE
    && Number.isFinite(input.durationMinutes)
    && input.durationMinutes > 0
    && input.durationMinutes <= WORK_ORDER_CUSTOM_SERVICE_MAX_DURATION
}

export function canSubmitCustomWorkOrderService(raw: {
  name: string
  price: string
  duration: string
}): boolean {
  if (!raw.name.trim() || !raw.price.trim() || !raw.duration.trim()) return false
  return isValidCustomWorkOrderService({
    name: raw.name,
    price: Number(raw.price),
    durationMinutes: Number(raw.duration),
  })
}
