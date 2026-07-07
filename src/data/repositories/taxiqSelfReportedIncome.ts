/**
 * taxiqSelfReportedIncomeRepository — API implementation for Staff Self-Reported Income
 * (US-13, BE US-06.1 `StaffSelfReportedIncomeController`). DTO has no `hasReceipt`/
 * `receiptUrl` field (open question from the ticket, resolved by reading the BE DTO) —
 * it returns `receipts: [{id, fileName, url}]`; `hasReceipt` is derived here.
 */
import httpClient from '../../lib/httpClient'

type HttpClient = typeof httpClient

export interface SelfReportedIncomeReceiptApiDto {
  id: string
  fileName: string
  url: string
}

export interface SelfReportedIncomeApiDto {
  id: string
  staffTaxYearId: string
  amount: number
  transactionDate: string
  periodEndDate?: string | null
  periodType?: string | null
  source: string
  incomeType?: string | null
  incomeTypeNote?: string | null
  notes?: string | null
  status: string
  receipts: SelfReportedIncomeReceiptApiDto[]
  createdAt: string
  lastModified?: string | null
}

export interface SelfReportedIncomeRecord {
  id: string
  staffTaxYearId: string
  amount: number
  transactionDate: string
  periodEndDate: string | null
  periodType: string | null
  source: string
  incomeType: string | null
  incomeTypeNote: string | null
  notes: string | null
  status: string
  receipts: SelfReportedIncomeReceiptApiDto[]
  hasReceipt: boolean
  createdAt: string
  lastModified: string | null
}

export interface SelfReportedIncomeFields {
  amount: number
  transactionDate: string
  periodEndDate?: string | null
  periodType?: string | null
  source: string
  incomeType?: string | null
  incomeTypeNote?: string | null
  notes?: string | null
}

export interface CreateSelfReportedIncomeParams extends SelfReportedIncomeFields {
  staffTaxYearId: string
}

function normalizeSelfReportedIncome(dto: SelfReportedIncomeApiDto): SelfReportedIncomeRecord {
  const receipts = dto.receipts ?? []
  return {
    id: dto.id,
    staffTaxYearId: dto.staffTaxYearId,
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

export function createTaxiqSelfReportedIncomeRepository(client: HttpClient = httpClient) {
  return {
    async list(staffTaxYearId: string): Promise<SelfReportedIncomeRecord[]> {
      const query = new URLSearchParams({ staffTaxYearId })
      const data = await client.get<SelfReportedIncomeApiDto[] | { items: SelfReportedIncomeApiDto[] }>(
        `/api/v1/taxiq/staff/self-reported-incomes?${query.toString()}`,
      )
      return toArray(data).map(normalizeSelfReportedIncome)
    },

    async getDetail(id: string): Promise<SelfReportedIncomeRecord> {
      const dto = await client.get<SelfReportedIncomeApiDto>(
        `/api/v1/taxiq/staff/self-reported-incomes/${encodeURIComponent(id)}`,
      )
      return normalizeSelfReportedIncome(dto)
    },

    async create(params: CreateSelfReportedIncomeParams): Promise<string> {
      return await client.post<string>('/api/v1/taxiq/staff/self-reported-incomes', {
        staffTaxYearId: params.staffTaxYearId,
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

    async update(id: string, params: SelfReportedIncomeFields): Promise<void> {
      await client.put(`/api/v1/taxiq/staff/self-reported-incomes/${encodeURIComponent(id)}`, {
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
      await client.del(`/api/v1/taxiq/staff/self-reported-incomes/${encodeURIComponent(id)}`)
    },

    async linkReceipt(id: string, receiptId: string): Promise<void> {
      await client.post(`/api/v1/taxiq/staff/self-reported-incomes/${encodeURIComponent(id)}/receipts`, {
        receiptId,
      })
    },
  }
}

export const taxiqSelfReportedIncomeRepository = createTaxiqSelfReportedIncomeRepository()
export default taxiqSelfReportedIncomeRepository
