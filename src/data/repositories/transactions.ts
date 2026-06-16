/**
 * transactionsRepository — API integration for tips / transaction data.
 */

import httpClient from '../../lib/httpClient'
import { isApiError } from '../../types/domain'
import type { TipApiDto, TipsPaginatedApiDto } from '../../types/repositories'
import type { TransactionRecord } from '../../types/domain'

type HttpClient = typeof httpClient

interface ListParams {
  pageNumber?: number
  pageSize?: number
  startDate?: string
  endDate?: string
  [key: string]: string | number | boolean | null | undefined
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

const EMPTY_PAGE = {
  items: [] as TransactionRecord[],
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
    async list(params: ListParams = {}): Promise<TransactionRecord[]> {
      try {
        const response = await client.get<TipsPaginatedApiDto | TipApiDto[]>(
          '/api/v1/merchant/dashboard/tips',
          { params },
        )
        const items = Array.isArray(response) ? response : (response?.items ?? [])
        return items.map(normalizeTip)
      } catch (err: unknown) {
        if (isNotFound(err)) return []
        throw err
      }
    },

    async listPaginated(params: ListParams = {}) {
      try {
        const response = await client.get<TipsPaginatedApiDto>(
          '/api/v1/merchant/dashboard/tips',
          { params },
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
