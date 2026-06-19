/**
 * transactionsRepository — API integration for tips / transaction data.
 */

import httpClient from '../../lib/httpClient'
import { isApiError } from '../../types/domain'
import type { TipApiDto, TipsPaginatedApiDto } from '../../types/repositories'
import type { TransactionRecord } from '../../types/domain'

type HttpClient = typeof httpClient

export interface TransactionsListQuery {
  pageNumber?: number
  pageSize?: number
  dateFrom?: string
  dateTo?: string
  status?: string
  paymentMethod?: string
  staffProfileId?: string
  staffSearch?: string
  touchPointId?: string
  isMultiStaff?: boolean
}

export interface TransactionsListPage {
  items: TransactionRecord[]
  pageNumber: number
  totalPages: number
  totalCount: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

function buildListParams(query: TransactionsListQuery = {}) {
  const params: Record<string, string | number | boolean> = {}
  if (query.pageNumber != null) params.PageNumber = query.pageNumber
  if (query.pageSize != null) params.PageSize = query.pageSize
  if (query.dateFrom) params.DateFrom = query.dateFrom
  if (query.dateTo) params.DateTo = query.dateTo
  if (query.status != null) params.Status = query.status
  if (query.paymentMethod != null) params.PaymentMethod = query.paymentMethod
  if (query.staffProfileId) params.StaffProfileId = query.staffProfileId
  if (query.staffSearch) params.StaffSearch = query.staffSearch
  if (query.touchPointId) params.TouchPointId = query.touchPointId
  if (query.isMultiStaff != null) params.IsMultiStaff = query.isMultiStaff
  return params
}

function normalizeTip(tip: TipApiDto): TransactionRecord {
  return {
    id: tip.id,
    amount: tip.amount ?? 0,
    status: tip.status ?? 'Initiated',
    paymentMethod: tip.paymentMethod ?? '',
    staffName: tip.staffName ?? '',
    staffProfileId: tip.staffProfileId ?? null,
    touchpoint: tip.touchPointName ?? '',
    touchPointId: tip.touchPointId ?? null,
    dateTime: tip.createdAt ?? '',
    confirmedAt: tip.confirmedAt ?? null,
    isMultiStaff: tip.isMultiStaff ?? false,
    tipItems: tip.tipItems ?? [],
  }
}

const EMPTY_PAGE: TransactionsListPage = {
  items: [],
  pageNumber: 0,
  totalPages: 0,
  totalCount: 0,
  hasNextPage: false,
  hasPreviousPage: false,
}

function isNotFound(err: unknown): boolean {
  if (isApiError(err) && err.status === 404) return true
  if (typeof err === 'object' && err !== null && 'response' in err) {
    return (err as { response?: { status?: number } }).response?.status === 404
  }
  return false
}

export function createTransactionsRepository(client: HttpClient = httpClient) {
  return {
    async list(params: TransactionsListQuery = {}): Promise<TransactionRecord[]> {
      try {
        const response = await client.get<TipsPaginatedApiDto | TipApiDto[]>(
          '/api/v1/merchant/dashboard/tips',
          { params: buildListParams(params) },
        )
        const items = Array.isArray(response) ? response : (response?.items ?? [])
        return items.map(normalizeTip)
      } catch (err: unknown) {
        if (isNotFound(err)) return []
        throw err
      }
    },

    async listPaginated(params: TransactionsListQuery = {}): Promise<TransactionsListPage> {
      try {
        const response = await client.get<TipsPaginatedApiDto>(
          '/api/v1/merchant/dashboard/tips',
          { params: buildListParams(params) },
        )
        return {
          items: (response?.items ?? []).map(normalizeTip),
          pageNumber: response?.pageNumber ?? 0,
          totalPages: response?.totalPages ?? 0,
          totalCount: response?.totalCount ?? 0,
          hasNextPage: response?.hasNextPage ?? false,
          hasPreviousPage: response?.hasPreviousPage ?? false,
        }
      } catch (err: unknown) {
        if (isNotFound(err)) return EMPTY_PAGE
        throw err
      }
    },

    async add(tx: LooseObject): Promise<LooseObject> {
      return await client.post<LooseObject>('/api/v1/merchant/transactions', tx)
    },

    async update(id: string, patch: LooseObject): Promise<LooseObject> {
      return await client.patch<LooseObject>(`/api/v1/merchant/transactions/${id}`, patch)
    },
  }
}

export const transactionsRepository = createTransactionsRepository()
export default transactionsRepository
