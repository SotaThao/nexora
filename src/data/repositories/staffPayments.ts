import httpClient from '../../lib/httpClient'
import { PaymentStatus, PaymentType } from '../../types/domain'
import type {
  PaymentStatusValue,
  StaffPaymentQr,
  StaffPaymentRecord,
  StaffPaymentsListPage,
  MerchantPaymentStats,
} from '../../types/domain'
import { normalizePaymentStats } from './paymentStatsNormalization'

type HttpClient = typeof httpClient

export interface StaffPaymentsListQuery {
  page?: number
  pageSize?: number
  type?: number
  status?: number
  from?: string
  to?: string
}

export interface StaffPaymentStatsQuery {
  from: string
  to: string
}

function readField<T>(raw: Record<string, unknown>, camel: string, pascal: string): T | undefined {
  return (raw[camel] ?? raw[pascal]) as T | undefined
}

function normalizeStatus(value: unknown): PaymentStatusValue {
  if (value === 'Initiated' || value === 0 || value === '0') return PaymentStatus.Initiated
  if (value === 'Confirmed' || value === 1 || value === '1') return PaymentStatus.Confirmed
  if (value === 'Completed' || value === 2 || value === '2') return PaymentStatus.Completed
  const num = Number(value)
  if (num === PaymentStatus.Initiated || num === PaymentStatus.Confirmed || num === PaymentStatus.Completed) {
    return num
  }
  return PaymentStatus.Initiated
}

function normalizeStaffPayment(raw: Record<string, unknown> | null | undefined): StaffPaymentRecord | null {
  if (!raw) return null
  const id = readField<string>(raw, 'id', 'Id') ?? ''
  if (!id) return null

  return {
    id,
    type: Number(readField<number>(raw, 'type', 'Type') ?? PaymentType.StaffDirectPayment),
    amount: Number(readField<number>(raw, 'amount', 'Amount') ?? 0),
    status: normalizeStatus(readField<number>(raw, 'status', 'Status')),
    paymentMethodType: readField<string>(raw, 'paymentMethodType', 'PaymentMethodType') ?? '',
    createdAt: readField<string>(raw, 'createdAt', 'CreatedAt') ?? '',
    customerConfirmedAt: readField<string | null>(raw, 'customerConfirmedAt', 'CustomerConfirmedAt') ?? null,
    staffConfirmedAt: readField<string | null>(raw, 'staffConfirmedAt', 'StaffConfirmedAt') ?? null,
    accountInfo: readField<string | null>(raw, 'accountInfo', 'AccountInfo') ?? null,
    imageUrl: readField<string | null>(raw, 'imageUrl', 'ImageUrl') ?? null,
  }
}

function normalizeStaffPaymentQr(raw: Record<string, unknown> | null | undefined): StaffPaymentQr {
  const paymentUrl = readField<string>(raw ?? {}, 'paymentUrl', 'PaymentUrl') ?? ''
  const staffProfileId = readField<string>(raw ?? {}, 'staffProfileId', 'StaffProfileId') ?? ''
  return { paymentUrl, staffProfileId }
}

function normalizeListPage(
  raw: Record<string, unknown> | null | undefined,
  fallbackPageSize: number,
): StaffPaymentsListPage {
  const source = raw ?? {}
  const itemsRaw = (source.items ?? source.Items ?? []) as Record<string, unknown>[]
  const items = itemsRaw
    .map((item) => normalizeStaffPayment(item))
    .filter((item): item is StaffPaymentRecord => Boolean(item))

  const pageNumber = Number(readField<number>(source, 'pageNumber', 'PageNumber') ?? 1)
  const pageSize = Number(readField<number>(source, 'pageSize', 'PageSize') ?? fallbackPageSize)
  const totalPages = Math.max(1, Number(readField<number>(source, 'totalPages', 'TotalPages') ?? 1))
  const totalCount = Number(readField<number>(source, 'totalCount', 'TotalCount') ?? items.length)
  const hasNextPageField = readField<boolean>(source, 'hasNextPage', 'HasNextPage')
  const hasPreviousPageField = readField<boolean>(source, 'hasPreviousPage', 'HasPreviousPage')

  return {
    items,
    pageNumber,
    pageSize,
    totalPages,
    totalCount,
    hasNextPage: hasNextPageField ?? pageNumber < totalPages,
    hasPreviousPage: hasPreviousPageField ?? pageNumber > 1,
  }
}

function buildListParams(query: StaffPaymentsListQuery = {}) {
  const params: Record<string, string | number> = {}
  if (query.page != null) params.page = query.page
  if (query.pageSize != null) params.pageSize = query.pageSize
  if (query.type != null) params.type = query.type
  if (query.status != null) params.status = query.status
  if (query.from) params.from = query.from
  if (query.to) params.to = query.to
  return params
}

export function createStaffPaymentsRepository(client: HttpClient = httpClient) {
  return {
    async getPaymentQr(): Promise<StaffPaymentQr> {
      const res = await client.get<Record<string, unknown>>('/api/v1/staff/payments/qr')
      return normalizeStaffPaymentQr(res)
    },

    async listPaginated(query: StaffPaymentsListQuery = {}): Promise<StaffPaymentsListPage> {
      const pageSize = query.pageSize ?? 20
      const res = await client.get<Record<string, unknown>>('/api/v1/staff/payments', {
        params: buildListParams(query),
      })
      return normalizeListPage(res, pageSize)
    },

    async getById(paymentId: string): Promise<StaffPaymentRecord> {
      const res = await client.get<Record<string, unknown>>(
        `/api/v1/staff/payments/${encodeURIComponent(paymentId)}`,
      )
      const payment = normalizeStaffPayment(res)
      if (!payment) {
        throw new Error('PAYMENT_NOT_FOUND')
      }
      return payment
    },

    async acknowledge(paymentId: string): Promise<void> {
      await client.patch<void>(
        `/api/v1/staff/payments/${encodeURIComponent(paymentId)}/acknowledge`,
        {},
      )
    },

    async getStats(query: StaffPaymentStatsQuery): Promise<MerchantPaymentStats> {
      const res = await client.get<Record<string, unknown>>('/api/v1/staff/payments/stats', {
        params: { from: query.from, to: query.to },
      })
      return normalizePaymentStats(res)
    },
  }
}

export const staffPaymentsRepository = createStaffPaymentsRepository()
export default staffPaymentsRepository
