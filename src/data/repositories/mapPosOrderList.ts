import type { OrderListItemApiDto, PosServiceLineRollupApiDto } from '../../types/repositories'

const EMPTY_SERVICE_LINES: PosServiceLineRollupApiDto = {
  serviceLineCount: 0,
  completedServiceLineCount: 0,
  pendingAcceptanceCount: 0,
  pendingAcceptanceTechnicianNames: [],
}

function readField<T>(raw: Record<string, unknown>, camel: string, pascal: string): T | undefined {
  if (Object.prototype.hasOwnProperty.call(raw, camel)) return raw[camel] as T
  if (Object.prototype.hasOwnProperty.call(raw, pascal)) return raw[pascal] as T
  return undefined
}

function readText(raw: Record<string, unknown>, camel: string, pascal: string): string {
  const value = readField<unknown>(raw, camel, pascal)
  return typeof value === 'string' ? value : ''
}

function readOptionalText(raw: Record<string, unknown>, camel: string, pascal: string): string | null {
  const value = readField<unknown>(raw, camel, pascal)
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed || null
}

function readNumber(raw: Record<string, unknown>, camel: string, pascal: string): number {
  const value = readField<unknown>(raw, camel, pascal)
  return typeof value === 'number' && Number.isFinite(value) ? value : 0
}

function readFlag(raw: Record<string, unknown>, camel: string, pascal: string): boolean {
  return readField<unknown>(raw, camel, pascal) === true
}

function readTextList(raw: Record<string, unknown>, camel: string, pascal: string): string[] {
  const value = readField<unknown>(raw, camel, pascal)
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string' && Boolean(item))
    : []
}

function mapServiceLines(raw: unknown): PosServiceLineRollupApiDto {
  if (!raw || typeof raw !== 'object') return EMPTY_SERVICE_LINES
  const dto = raw as Record<string, unknown>
  return {
    serviceLineCount: readNumber(dto, 'serviceLineCount', 'ServiceLineCount'),
    completedServiceLineCount: readNumber(dto, 'completedServiceLineCount', 'CompletedServiceLineCount'),
    pendingAcceptanceCount: readNumber(dto, 'pendingAcceptanceCount', 'PendingAcceptanceCount'),
    pendingAcceptanceTechnicianNames: readTextList(
      dto,
      'pendingAcceptanceTechnicianNames',
      'PendingAcceptanceTechnicianNames',
    ),
  }
}

export function mapOrderListItem(raw: unknown): OrderListItemApiDto | null {
  if (!raw || typeof raw !== 'object') return null
  const dto = raw as Record<string, unknown>
  const id = readText(dto, 'id', 'Id').trim()
  if (!id) return null

  return {
    id,
    orderNumber: readText(dto, 'orderNumber', 'OrderNumber'),
    customerName: readText(dto, 'customerName', 'CustomerName'),
    customerPhone: readOptionalText(dto, 'customerPhone', 'CustomerPhone'),
    customerPhoneCountryCode: readOptionalText(dto, 'customerPhoneCountryCode', 'CustomerPhoneCountryCode'),
    customerPhoneE164: readOptionalText(dto, 'customerPhoneE164', 'CustomerPhoneE164'),
    status: readText(dto, 'status', 'Status'),
    checkedInAt: readText(dto, 'checkedInAt', 'CheckedInAt'),
    elapsedMinutes: readNumber(dto, 'elapsedMinutes', 'ElapsedMinutes'),
    serviceNames: readTextList(dto, 'serviceNames', 'ServiceNames'),
    technicianNames: readTextList(dto, 'technicianNames', 'TechnicianNames'),
    hasUnassignedService: readFlag(dto, 'hasUnassignedService', 'HasUnassignedService'),
    hasNoServiceLine: readFlag(dto, 'hasNoServiceLine', 'HasNoServiceLine'),
    serviceLines: mapServiceLines(readField(dto, 'serviceLines', 'ServiceLines')),
    isNewCustomer: readFlag(dto, 'isNewCustomer', 'IsNewCustomer'),
  }
}

export function mapOrderList(raw: unknown): OrderListItemApiDto[] {
  if (!Array.isArray(raw)) return []
  return raw.flatMap((item) => {
    const mapped = mapOrderListItem(item)
    return mapped ? [mapped] : []
  })
}
