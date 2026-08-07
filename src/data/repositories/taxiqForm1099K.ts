/**
 * taxiqForm1099KRepository — API implementation for TaxIQ Staff 1099-K Reconciliation
 * (US-018, BE Ticket 7 `StaffSelfReportedIncomeController` `/1099k` + `/1099k-reconciliation`).
 */
import httpClient from '../../lib/httpClient'

type HttpClient = typeof httpClient

export const PAYMENT_PLATFORMS = ['CashApp', 'Venmo', 'PayPal'] as const
export type PaymentPlatform = (typeof PAYMENT_PLATFORMS)[number]

export interface Form1099KReconciliationApiDto {
  id: string
  platform: string
  selfReportedAmount: number
  reportedAmount: number
  variance: number
  varianceNote?: string | null
  createdAt: string
  lastModified?: string | null
}

export interface Form1099KReconciliationRecord {
  id: string
  platform: PaymentPlatform
  selfReportedAmount: number
  reportedAmount: number
  variance: number
  varianceNote: string | null
  createdAt: string
  lastModified: string | null
}

export interface UpsertForm1099KAmountParams {
  staffTaxYearId: string
  platform: PaymentPlatform
  reportedAmount: number
  varianceNote?: string | null
}

function normalizeForm1099KReconciliation(dto: Form1099KReconciliationApiDto): Form1099KReconciliationRecord {
  return {
    id: dto.id,
    platform: dto.platform as PaymentPlatform,
    selfReportedAmount: dto.selfReportedAmount ?? 0,
    reportedAmount: dto.reportedAmount ?? 0,
    variance: dto.variance ?? 0,
    varianceNote: dto.varianceNote ?? null,
    createdAt: dto.createdAt,
    lastModified: dto.lastModified ?? null,
  }
}

function toArray<T>(data: T[] | { items?: T[] } | null | undefined): T[] {
  if (Array.isArray(data)) return data
  return data?.items ?? []
}

export function createTaxiqForm1099KRepository(client: HttpClient = httpClient) {
  return {
    async listReconciliation(staffTaxYearId: string): Promise<Form1099KReconciliationRecord[]> {
      const query = new URLSearchParams({ staffTaxYearId })
      const data = await client.get<Form1099KReconciliationApiDto[] | { items: Form1099KReconciliationApiDto[] }>(
        `/api/v1/taxiq/staff/self-reported-incomes/1099k-reconciliation?${query.toString()}`,
      )
      return toArray(data).map(normalizeForm1099KReconciliation)
    },

    async upsert(params: UpsertForm1099KAmountParams): Promise<string> {
      return await client.post<string>('/api/v1/taxiq/staff/self-reported-incomes/1099k', {
        staffTaxYearId: params.staffTaxYearId,
        platform: params.platform,
        reportedAmount: params.reportedAmount,
        varianceNote: params.varianceNote ?? null,
      })
    },
  }
}

export const taxiqForm1099KRepository = createTaxiqForm1099KRepository()
export default taxiqForm1099KRepository
