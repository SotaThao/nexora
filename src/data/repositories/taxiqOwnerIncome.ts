/**
 * taxiqOwnerIncomeRepository — API implementation for Owner Income Summary
 * (US-014, BE Enhancement Ticket 1 `OwnerIncomeController`). Mirrors
 * `taxiqSelfReportedIncome.ts` (Staff) 1:1, scoped by `ownerTaxYearId` instead of
 * `staffTaxYearId`, with a different `incomeType` enum (Owner revenue categories).
 */
import httpClient from '../../lib/httpClient'

type HttpClient = typeof httpClient

export interface OwnerIncomeReceiptApiDto {
  id: string
  fileName: string
  url: string
}

export interface OwnerIncomeApiDto {
  id: string
  ownerTaxYearId: string
  amount: number
  transactionDate: string
  periodEndDate?: string | null
  periodType?: string | null
  source: string
  incomeType?: string | null
  incomeTypeNote?: string | null
  notes?: string | null
  status: string
  receipts: OwnerIncomeReceiptApiDto[]
  createdAt: string
  lastModified?: string | null
}

export interface OwnerIncomeRecord {
  id: string
  ownerTaxYearId: string
  amount: number
  transactionDate: string
  periodEndDate: string | null
  periodType: string | null
  source: string
  incomeType: string | null
  incomeTypeNote: string | null
  notes: string | null
  status: string
  receipts: OwnerIncomeReceiptApiDto[]
  hasReceipt: boolean
  createdAt: string
  lastModified: string | null
}

export interface OwnerIncomeFields {
  amount: number
  transactionDate: string
  periodEndDate?: string | null
  periodType?: string | null
  source: string
  incomeType?: string | null
  incomeTypeNote?: string | null
  notes?: string | null
}

export interface CreateOwnerIncomeParams extends OwnerIncomeFields {
  ownerTaxYearId: string
}

function normalizeOwnerIncome(dto: OwnerIncomeApiDto): OwnerIncomeRecord {
  const receipts = dto.receipts ?? []
  return {
    id: dto.id,
    ownerTaxYearId: dto.ownerTaxYearId,
    amount: dto.amount ?? 0,
    transactionDate: dto.transactionDate,
    periodEndDate: dto.periodEndDate ?? null,
    periodType: dto.periodType ?? null,
    source: dto.source ?? '',
    incomeType: dto.incomeType ?? null,
    incomeTypeNote: dto.incomeTypeNote ?? null,
    notes: dto.notes ?? null,
    status: dto.status,
    receipts,
    hasReceipt: receipts.length > 0,
    createdAt: dto.createdAt,
    lastModified: dto.lastModified ?? null,
  }
}

function toArray<T>(data: T[] | { items?: T[] } | null | undefined): T[] {
  if (Array.isArray(data)) return data
  return data?.items ?? []
}

export function createTaxiqOwnerIncomeRepository(client: HttpClient = httpClient) {
  return {
    async list(ownerTaxYearId: string): Promise<OwnerIncomeRecord[]> {
      const query = new URLSearchParams({ ownerTaxYearId })
      const data = await client.get<OwnerIncomeApiDto[] | { items: OwnerIncomeApiDto[] }>(
        `/api/v1/taxiq/owner/incomes?${query.toString()}`,
      )
      return toArray(data).map(normalizeOwnerIncome)
    },

    async getDetail(id: string): Promise<OwnerIncomeRecord> {
      const dto = await client.get<OwnerIncomeApiDto>(
        `/api/v1/taxiq/owner/incomes/${encodeURIComponent(id)}`,
      )
      return normalizeOwnerIncome(dto)
    },

    async create(params: CreateOwnerIncomeParams): Promise<string> {
      return await client.post<string>('/api/v1/taxiq/owner/incomes', {
        ownerTaxYearId: params.ownerTaxYearId,
        amount: params.amount,
        transactionDate: params.transactionDate,
        periodEndDate: params.periodEndDate ?? null,
        periodType: params.periodType ?? null,
        source: params.source,
        incomeType: params.incomeType ?? null,
        incomeTypeNote: params.incomeTypeNote ?? null,
        notes: params.notes ?? null,
      })
    },

    async update(id: string, params: OwnerIncomeFields): Promise<void> {
      await client.put(`/api/v1/taxiq/owner/incomes/${encodeURIComponent(id)}`, {
        amount: params.amount,
        transactionDate: params.transactionDate,
        periodEndDate: params.periodEndDate ?? null,
        periodType: params.periodType ?? null,
        source: params.source,
        incomeType: params.incomeType ?? null,
        incomeTypeNote: params.incomeTypeNote ?? null,
        notes: params.notes ?? null,
      })
    },

    async remove(id: string): Promise<void> {
      await client.del(`/api/v1/taxiq/owner/incomes/${encodeURIComponent(id)}`)
    },

    async linkReceipt(id: string, receiptId: string): Promise<void> {
      await client.post(`/api/v1/taxiq/owner/incomes/${encodeURIComponent(id)}/receipts`, {
        receiptId,
      })
    },
  }
}

export const taxiqOwnerIncomeRepository = createTaxiqOwnerIncomeRepository()
export default taxiqOwnerIncomeRepository
