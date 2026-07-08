import httpClient from '../../lib/httpClient'
import { normalizePayoutDebtTransactionType, normalizePayoutDateOnly, normalizePayoutMethodType, normalizePayoutStatus, payoutMethodTypeToApi } from '../payoutConstants'
import type {
  MerchantPayoutStaffStatRecord,
  MerchantPayoutStats,
  MerchantPayoutStatsByStaffPage,
  PayoutDebtHistoryPage,
  PayoutDebtHistoryRecord,
  PayoutRecord,
  PayoutsListPage,
  StaffDebtRecord,
  StaffPayoutDetailRecord,
  StaffPayoutStats,
  StaffUnpaidDebtRecord,
  StaffUnpaidDebtsPage,
  UnpaidTipDebtRecord,
  UnpaidTipDebtsPage,
} from '../../types/domain'

type HttpClient = typeof httpClient

export interface MerchantPayoutsListQuery {
  search?: string
  periodFrom?: string
  periodTo?: string
  staffProfileId?: string
  payoutType?: number
  status?: number
  page?: number
  pageSize?: number
}

export interface StaffPayoutsListQuery {
  status?: number
  page?: number
  pageSize?: number
}

export interface DebtHistoryQuery {
  staffProfileId?: string
  page?: number
  pageSize?: number
}

export interface CreateMerchantPayoutPayload {
  staffProfileId: string
  payoutMethodType: string
  amount: number
  payoutTypes: number
  periodStart: string
  periodEnd: string
  evidenceUrls?: string[]
  notes?: string | null
  /** API string enum: Pending | Confirmed | Cancelled */
  status?: string
}

export interface UpdateMerchantPayoutPayload {
  payoutMethodType: string
  payoutTypes: number
  periodStart: string
  periodEnd: string
  evidenceUrls?: string[]
  notes?: string | null
}

function readField<T>(raw: Record<string, unknown>, camel: string, pascal: string): T | undefined {
  return (raw[camel] ?? raw[pascal]) as T | undefined
}

function readStringArray(raw: Record<string, unknown>, camel: string, pascal: string): string[] {
  const value = readField<unknown>(raw, camel, pascal)
  if (!Array.isArray(value)) return []
  return value.filter((item): item is string => typeof item === 'string')
}

function normalizeStaffPayoutDetail(
  raw: Record<string, unknown> | null | undefined,
): StaffPayoutDetailRecord | null {
  if (!raw) return null
  const id = readField<string>(raw, 'id', 'Id') ?? ''
  if (!id) return null
  const evidenceUrls = readStringArray(raw, 'evidenceUrls', 'EvidenceUrls')

  return {
    id,
    payoutCode: readField<string>(raw, 'payoutCode', 'PayoutCode') ?? '',
    createdAt: readField<string>(raw, 'createdAt', 'CreatedAt') ?? '',
    businessId: readField<string>(raw, 'businessId', 'BusinessId') ?? '',
    businessName: readField<string>(raw, 'businessName', 'BusinessName') ?? '',
    businessLogoUrl: readField<string | null>(raw, 'businessLogoUrl', 'BusinessLogoUrl') ?? null,
    payoutMethodType: normalizePayoutMethodType(readField<string>(raw, 'payoutMethodType', 'PayoutMethodType')),
    staffPaymentAccountInfo:
      readField<string | null>(raw, 'staffPaymentAccountInfo', 'StaffPaymentAccountInfo') ?? null,
    amount: Number(readField<number>(raw, 'amount', 'Amount') ?? 0),
    payoutTypes: Number(readField<number>(raw, 'payoutTypes', 'PayoutTypes') ?? 0),
    periodStart: normalizePayoutDateOnly(readField<string>(raw, 'periodStart', 'PeriodStart')),
    periodEnd: normalizePayoutDateOnly(readField<string>(raw, 'periodEnd', 'PeriodEnd')),
    notes: readField<string | null>(raw, 'notes', 'Notes') ?? null,
    evidenceUrls,
    status: normalizePayoutStatus(readField<unknown>(raw, 'status', 'Status')),
    staffConfirmedAt: readField<string | null>(raw, 'staffConfirmedAt', 'StaffConfirmedAt') ?? null,
  }
}

function normalizeStaffDebt(raw: Record<string, unknown> | null | undefined): StaffDebtRecord | null {
  if (!raw) return null
  const staffProfileId = readField<string>(raw, 'staffProfileId', 'StaffProfileId') ?? ''
  if (!staffProfileId) return null
  return {
    staffProfileId,
    staffDisplayName: readField<string>(raw, 'staffDisplayName', 'StaffDisplayName') ?? '',
    staffCode: readField<string>(raw, 'staffCode', 'StaffCode') ?? '',
    staffPhotoUrl: readField<string | null>(raw, 'staffPhotoUrl', 'StaffPhotoUrl') ?? null,
    balance: Number(readField<number>(raw, 'balance', 'Balance') ?? 0),
    lastUpdatedAt: readField<string | null>(raw, 'lastUpdatedAt', 'LastUpdatedAt') ?? null,
  }
}

function normalizePayoutRecord(raw: Record<string, unknown> | null | undefined): PayoutRecord | null {
  if (!raw) return null
  const id = readField<string>(raw, 'id', 'Id') ?? ''
  if (!id) return null

  const evidenceUrls = readStringArray(raw, 'evidenceUrls', 'EvidenceUrls')
  const evidenceCountRaw = readField<number>(raw, 'evidenceCount', 'EvidenceCount')

  return {
    id,
    payoutCode: readField<string>(raw, 'payoutCode', 'PayoutCode') ?? '',
    staffProfileId: readField<string>(raw, 'staffProfileId', 'StaffProfileId') ?? '',
    staffDisplayName: readField<string>(raw, 'staffDisplayName', 'StaffDisplayName') ?? '',
    staffCode: readField<string>(raw, 'staffCode', 'StaffCode') ?? '',
    staffPhotoUrl: readField<string | null>(raw, 'staffPhotoUrl', 'StaffPhotoUrl') ?? null,
    staffPaymentAccountInfo:
      readField<string | null>(raw, 'staffPaymentAccountInfo', 'StaffPaymentAccountInfo') ?? null,
    amount: Number(readField<number>(raw, 'amount', 'Amount') ?? 0),
    payoutMethodType: normalizePayoutMethodType(readField<string>(raw, 'payoutMethodType', 'PayoutMethodType')),
    payoutTypes: Number(readField<number>(raw, 'payoutTypes', 'PayoutTypes') ?? 0),
    periodStart: normalizePayoutDateOnly(readField<string>(raw, 'periodStart', 'PeriodStart')),
    periodEnd: normalizePayoutDateOnly(readField<string>(raw, 'periodEnd', 'PeriodEnd')),
    evidenceCount: Number(evidenceCountRaw ?? evidenceUrls.length),
    evidenceUrls,
    notes: readField<string | null>(raw, 'notes', 'Notes') ?? null,
    status: normalizePayoutStatus(readField<unknown>(raw, 'status', 'Status')),
    staffConfirmedAt: readField<string | null>(raw, 'staffConfirmedAt', 'StaffConfirmedAt') ?? null,
    createdAt: readField<string>(raw, 'createdAt', 'CreatedAt') ?? '',
    lastModified: readField<string | null>(raw, 'lastModified', 'LastModified') ?? null,
  }
}

function normalizePayoutsListPage(
  raw: Record<string, unknown> | null | undefined,
  fallbackPageSize: number,
): PayoutsListPage {
  const source = raw ?? {}
  const itemsRaw = (source.items ?? source.Items ?? []) as Record<string, unknown>[]
  const items = itemsRaw
    .map((item) => normalizePayoutRecord(item))
    .filter((item): item is PayoutRecord => Boolean(item))

  const pageNumber = Number(readField<number>(source, 'pageNumber', 'PageNumber') ?? 1)
  const pageSize = Number(readField<number>(source, 'pageSize', 'PageSize') ?? fallbackPageSize)
  const totalPages = Math.max(0, Number(readField<number>(source, 'totalPages', 'TotalPages') ?? 0))
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

function normalizeMethodBreakdown(raw: Record<string, unknown>): { method: string; amount: number; count: number } {
  return {
    method: readField<string>(raw, 'method', 'Method') ?? '',
    amount: Number(readField<number>(raw, 'amount', 'Amount') ?? 0),
    count: Number(readField<number>(raw, 'count', 'Count') ?? 0),
  }
}

function normalizeMerchantPayoutStats(raw: Record<string, unknown> | null | undefined): MerchantPayoutStats {
  const source = raw ?? {}
  const breakdownRaw = (source.methodBreakdown ?? source.MethodBreakdown ?? []) as Record<string, unknown>[]

  return {
    totalPaidAllTime: Number(readField<number>(source, 'totalPaidAllTime', 'TotalPaidAllTime') ?? 0),
    totalPaidThisMonth: Number(readField<number>(source, 'totalPaidThisMonth', 'TotalPaidThisMonth') ?? 0),
    totalPendingAmount: Number(readField<number>(source, 'totalPendingAmount', 'TotalPendingAmount') ?? 0),
    totalPendingCount: Number(readField<number>(source, 'totalPendingCount', 'TotalPendingCount') ?? 0),
    totalUnpaidDebt: Number(readField<number>(source, 'totalUnpaidDebt', 'TotalUnpaidDebt') ?? 0),
    staffWithDebt: Number(readField<number>(source, 'staffWithDebt', 'StaffWithDebt') ?? 0),
    cancelledThisMonth: Number(readField<number>(source, 'cancelledThisMonth', 'CancelledThisMonth') ?? 0),
    methodBreakdown: breakdownRaw.map(normalizeMethodBreakdown),
  }
}

function normalizeStaffPayoutStats(raw: Record<string, unknown> | null | undefined): StaffPayoutStats {
  const source = raw ?? {}
  return {
    totalReceivedAllTime: Number(readField<number>(source, 'totalReceivedAllTime', 'TotalReceivedAllTime') ?? 0),
    totalReceivedThisMonth: Number(
      readField<number>(source, 'totalReceivedThisMonth', 'TotalReceivedThisMonth') ?? 0,
    ),
    totalPendingAmount: Number(readField<number>(source, 'totalPendingAmount', 'TotalPendingAmount') ?? 0),
    totalPendingCount: Number(readField<number>(source, 'totalPendingCount', 'TotalPendingCount') ?? 0),
    currentDebtBalance: Number(readField<number>(source, 'currentDebtBalance', 'CurrentDebtBalance') ?? 0),
  }
}

function normalizeUnpaidTipDebt(raw: Record<string, unknown>): UnpaidTipDebtRecord {
  return {
    payoutDebtId: readField<string>(raw, 'payoutDebtId', 'PayoutDebtId') ?? '',
    staffProfileId: readField<string>(raw, 'staffProfileId', 'StaffProfileId') ?? '',
    staffDisplayName: readField<string>(raw, 'staffDisplayName', 'StaffDisplayName') ?? '',
    staffCode: readField<string>(raw, 'staffCode', 'StaffCode') ?? '',
    staffPhotoUrl: readField<string | null>(raw, 'staffPhotoUrl', 'StaffPhotoUrl') ?? null,
    balance: Number(readField<number>(raw, 'balance', 'Balance') ?? 0),
    lastUpdatedAt: readField<string>(raw, 'lastUpdatedAt', 'LastUpdatedAt') ?? '',
  }
}

function normalizeUnpaidTipDebtsPage(raw: Record<string, unknown> | null | undefined): UnpaidTipDebtsPage {
  const source = raw ?? {}
  const itemsRaw = (source.items ?? source.Items ?? []) as Record<string, unknown>[]
  const items = itemsRaw.map(normalizeUnpaidTipDebt)
  return {
    items,
    totalCount: Number(readField<number>(source, 'totalCount', 'TotalCount') ?? items.length),
  }
}

function normalizeStaffUnpaidDebt(raw: Record<string, unknown>): StaffUnpaidDebtRecord {
  return {
    payoutDebtId: readField<string>(raw, 'payoutDebtId', 'PayoutDebtId') ?? '',
    businessId: readField<string>(raw, 'businessId', 'BusinessId') ?? '',
    businessName: readField<string>(raw, 'businessName', 'BusinessName') ?? '',
    balance: Number(readField<number>(raw, 'balance', 'Balance') ?? 0),
    lastUpdatedAt: readField<string>(raw, 'lastUpdatedAt', 'LastUpdatedAt') ?? '',
  }
}

function normalizeStaffUnpaidDebtsPage(raw: Record<string, unknown> | null | undefined): StaffUnpaidDebtsPage {
  const source = raw ?? {}
  const itemsRaw = (source.items ?? source.Items ?? []) as Record<string, unknown>[]
  const items = itemsRaw.map(normalizeStaffUnpaidDebt)
  return {
    items,
    totalCount: Number(readField<number>(source, 'totalCount', 'TotalCount') ?? items.length),
  }
}

function normalizeDebtHistoryRecord(raw: Record<string, unknown>): PayoutDebtHistoryRecord {
  return {
    id: readField<string>(raw, 'id', 'Id') ?? '',
    amount: Number(readField<number>(raw, 'amount', 'Amount') ?? 0),
    transactionType: normalizePayoutDebtTransactionType(
      readField<unknown>(raw, 'transactionType', 'TransactionType'),
    ),
    referenceId: readField<string>(raw, 'referenceId', 'ReferenceId') ?? '',
    description: readField<string | null>(raw, 'description', 'Description') ?? null,
    createdAt: readField<string>(raw, 'createdAt', 'CreatedAt') ?? '',
  }
}

function normalizeDebtHistoryPage(
  raw: Record<string, unknown> | null | undefined,
): PayoutDebtHistoryPage {
  const source = raw ?? {}
  const itemsRaw = (source.items ?? source.Items ?? []) as Record<string, unknown>[]
  const items = itemsRaw.map(normalizeDebtHistoryRecord)
  return {
    items,
    totalCount: Number(readField<number>(source, 'totalCount', 'TotalCount') ?? items.length),
  }
}

function normalizeStaffStatRecord(raw: Record<string, unknown>): MerchantPayoutStaffStatRecord {
  return {
    staffProfileId: readField<string>(raw, 'staffProfileId', 'StaffProfileId') ?? '',
    staffDisplayName: readField<string>(raw, 'staffDisplayName', 'StaffDisplayName') ?? '',
    staffCode: readField<string>(raw, 'staffCode', 'StaffCode') ?? '',
    staffPhotoUrl: readField<string | null>(raw, 'staffPhotoUrl', 'StaffPhotoUrl') ?? null,
    totalPaid: Number(readField<number>(raw, 'totalPaid', 'TotalPaid') ?? 0),
    totalPending: Number(readField<number>(raw, 'totalPending', 'TotalPending') ?? 0),
    currentDebt: Number(readField<number>(raw, 'currentDebt', 'CurrentDebt') ?? 0),
    payoutCount: Number(readField<number>(raw, 'payoutCount', 'PayoutCount') ?? 0),
  }
}

function normalizeStatsByStaffPage(
  raw: Record<string, unknown> | null | undefined,
): MerchantPayoutStatsByStaffPage {
  const source = raw ?? {}
  const itemsRaw = (source.items ?? source.Items ?? []) as Record<string, unknown>[]
  const items = itemsRaw.map(normalizeStaffStatRecord)
  return {
    items,
    totalCount: Number(readField<number>(source, 'totalCount', 'TotalCount') ?? items.length),
  }
}

function buildMerchantListParams(query: MerchantPayoutsListQuery = {}) {
  const params: Record<string, string | number> = {}
  if (query.search) params.search = query.search
  if (query.periodFrom) params.periodFrom = query.periodFrom
  if (query.periodTo) params.periodTo = query.periodTo
  if (query.staffProfileId) params.staffProfileId = query.staffProfileId
  if (query.payoutType != null) params.payoutType = query.payoutType
  if (query.status != null) params.status = query.status
  if (query.page != null) params.page = query.page
  if (query.pageSize != null) params.pageSize = query.pageSize
  return params
}

function buildStaffListParams(query: StaffPayoutsListQuery = {}) {
  const params: Record<string, string | number> = {}
  if (query.status != null) params.status = query.status
  if (query.page != null) params.page = query.page
  if (query.pageSize != null) params.pageSize = query.pageSize
  return params
}

function buildDebtHistoryParams(query: DebtHistoryQuery = {}) {
  const params: Record<string, string | number> = {}
  if (query.staffProfileId) params.staffProfileId = query.staffProfileId
  if (query.page != null) params.page = query.page
  if (query.pageSize != null) params.pageSize = query.pageSize
  return params
}

const EMPTY_PAYOUTS_PAGE: PayoutsListPage = {
  items: [],
  pageNumber: 1,
  pageSize: 20,
  totalPages: 0,
  totalCount: 0,
  hasNextPage: false,
  hasPreviousPage: false,
}

export function createMerchantPayoutsRepository(client: HttpClient = httpClient) {
  return {
    async listPaginated(query: MerchantPayoutsListQuery = {}): Promise<PayoutsListPage> {
      const pageSize = query.pageSize ?? 20
      const res = await client.get<Record<string, unknown>>('/api/v1/merchant/payouts', {
        params: buildMerchantListParams(query),
      })
      return normalizePayoutsListPage(res, pageSize)
    },

    async getById(payoutId: string): Promise<PayoutRecord> {
      const res = await client.get<Record<string, unknown>>(
        `/api/v1/merchant/payouts/${encodeURIComponent(payoutId)}`,
      )
      const payout = normalizePayoutRecord(res)
      if (!payout) {
        throw new Error('PAYOUT_NOT_FOUND')
      }
      return payout
    },

    async create(payload: CreateMerchantPayoutPayload): Promise<{ id: string }> {
      const { status, ...rest } = payload
      const res = await client.post<Record<string, unknown>>('/api/v1/merchant/payouts', {
        ...rest,
        ...(status ? { status } : {}),
        payoutMethodType: payoutMethodTypeToApi(payload.payoutMethodType),
        periodStart: normalizePayoutDateOnly(payload.periodStart),
        periodEnd: normalizePayoutDateOnly(payload.periodEnd),
      })
      const id = readField<string>(res, 'id', 'Id') ?? ''
      if (!id) {
        throw new Error('PAYOUT_CREATE_FAILED')
      }
      return { id }
    },

    async update(payoutId: string, payload: UpdateMerchantPayoutPayload): Promise<void> {
      await client.put<void>(
        `/api/v1/merchant/payouts/${encodeURIComponent(payoutId)}`,
        {
          ...payload,
          payoutMethodType: payoutMethodTypeToApi(payload.payoutMethodType),
          periodStart: normalizePayoutDateOnly(payload.periodStart),
          periodEnd: normalizePayoutDateOnly(payload.periodEnd),
        },
      )
    },

    async delete(payoutId: string): Promise<void> {
      await client.del<void>(`/api/v1/merchant/payouts/${encodeURIComponent(payoutId)}`)
    },

    async cancel(payoutId: string): Promise<void> {
      await client.patch<void>(
        `/api/v1/merchant/payouts/${encodeURIComponent(payoutId)}/cancel`,
        {},
      )
    },

    async getStats(): Promise<MerchantPayoutStats> {
      const res = await client.get<Record<string, unknown>>('/api/v1/merchant/payouts/stats')
      return normalizeMerchantPayoutStats(res)
    },

    async getStatsByStaff(): Promise<MerchantPayoutStatsByStaffPage> {
      const res = await client.get<Record<string, unknown>>('/api/v1/merchant/payouts/stats/by-staff')
      return normalizeStatsByStaffPage(res)
    },

    async getUnpaidTips(): Promise<UnpaidTipDebtsPage> {
      const res = await client.get<Record<string, unknown>>('/api/v1/merchant/payouts/unpaid-tips')
      return normalizeUnpaidTipDebtsPage(res)
    },

    async getDebtHistory(query: DebtHistoryQuery = {}): Promise<PayoutDebtHistoryPage> {
      const res = await client.get<Record<string, unknown>>('/api/v1/merchant/payouts/debt-history', {
        params: buildDebtHistoryParams(query),
      })
      return normalizeDebtHistoryPage(res)
    },

    async getStaffDebt(staffProfileId: string): Promise<StaffDebtRecord> {
      const res = await client.get<Record<string, unknown>>(
        `/api/v1/merchant/payouts/staff/${encodeURIComponent(staffProfileId)}/debt`,
      )
      const debt = normalizeStaffDebt(res)
      if (!debt) {
        throw new Error('STAFF_DEBT_NOT_FOUND')
      }
      return debt
    },
  }
}

export function createStaffPayoutsRepository(client: HttpClient = httpClient) {
  return {
    async listPaginated(query: StaffPayoutsListQuery = {}): Promise<PayoutsListPage> {
      const pageSize = query.pageSize ?? 20
      const res = await client.get<Record<string, unknown>>('/api/v1/staff/payouts', {
        params: buildStaffListParams(query),
      })
      return normalizePayoutsListPage(res, pageSize)
    },

    async getById(payoutId: string): Promise<StaffPayoutDetailRecord> {
      const res = await client.get<Record<string, unknown>>(
        `/api/v1/staff/payouts/${encodeURIComponent(payoutId)}`,
      )
      const payout = normalizeStaffPayoutDetail(res)
      if (!payout) {
        throw new Error('PAYOUT_NOT_FOUND')
      }
      return payout
    },

    async getStats(): Promise<StaffPayoutStats> {
      const res = await client.get<Record<string, unknown>>('/api/v1/staff/payouts/stats')
      return normalizeStaffPayoutStats(res)
    },

    async getUnpaidDebt(): Promise<StaffUnpaidDebtsPage> {
      const res = await client.get<Record<string, unknown>>('/api/v1/staff/payouts/unpaid-debt')
      return normalizeStaffUnpaidDebtsPage(res)
    },

    async confirm(payoutId: string): Promise<void> {
      await client.patch<void>(
        `/api/v1/staff/payouts/${encodeURIComponent(payoutId)}/confirm`,
        {},
      )
    },
  }
}

export const merchantPayoutsRepository = createMerchantPayoutsRepository()
export const staffPayoutsRepository = createStaffPayoutsRepository()
export default merchantPayoutsRepository

// Exported for unit tests and list fallbacks.
export const __testables = {
  normalizePayoutRecord,
  normalizePayoutsListPage,
  normalizeMerchantPayoutStats,
  normalizeStaffPayoutDetail,
  normalizeStaffDebt,
  EMPTY_PAYOUTS_PAGE,
}
