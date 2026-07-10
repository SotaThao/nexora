/**
 * taxiqStaffDeductionsRepository — API implementation for the Staff Deduction Center
 * (US-11). Mirrors taxiqOwnerDeductions.ts field-for-field (BE US-08 Staff mirrors BE
 * US-02 Owner) — StaffDeductionController only exposes Create/Submit/Update/List, no
 * Reanalyze or ApproveCpa endpoints (Owner-only concepts), and no receipt-AI-parsing
 * endpoints (analyze-receipt/confirm-receipt) — see US-11-assumptions.md.
 */
import httpClient from '../../lib/httpClient'

type HttpClient = typeof httpClient

export interface StaffDeductionApiDto {
  id: string
  staffTaxYearId: string
  categoryId: string
  categoryName: string
  description: string
  amount: number
  deductibleAmount: number
  date: string
  vendorName?: string | null
  businessUsePercent?: number | null
  recordStatus: string
  aiDeductionStatus?: string | null
  aiExplanation?: string | null
  aiDisclaimer?: string | null
  aiAnalyzedAt?: string | null
  receiptCount: number
  createdAt: string
  lastModified?: string | null
}

interface StaffDeductionListApiDto {
  items: StaffDeductionApiDto[]
  totalDeductibleAmount: number
}

export interface StaffDeductionRecord {
  id: string
  staffTaxYearId: string
  categoryId: string
  categoryName: string
  description: string
  amount: number
  deductibleAmount: number
  date: string
  vendorName: string
  businessUsePercent: number | null
  recordStatus: string
  aiDeductionStatus: string | null
  aiExplanation: string | null
  aiDisclaimer: string | null
  aiAnalyzedAt: string | null
  receiptCount: number
  createdAt: string
  lastModified: string | null
}

export interface StaffDeductionListPage {
  items: StaffDeductionRecord[]
  totalDeductibleAmount: number
}

export interface StaffDeductionListParams {
  staffTaxYearId: string
  recordStatus?: string
  categoryId?: string
}

export interface CreateStaffDeductionParams {
  staffTaxYearId: string
  categoryId: string
  description: string
  amount: number
  date: string
  vendorName?: string | null
  businessUsePercent?: number | null
}

export interface UpdateStaffDeductionParams {
  categoryId: string
  description: string
  amount: number
  date: string
  vendorName?: string | null
  businessUsePercent?: number | null
}

function normalizeStaffDeduction(dto: StaffDeductionApiDto): StaffDeductionRecord {
  return {
    id: dto.id,
    staffTaxYearId: dto.staffTaxYearId,
    categoryId: dto.categoryId,
    categoryName: dto.categoryName,
    description: dto.description,
    amount: dto.amount,
    deductibleAmount: dto.deductibleAmount,
    date: dto.date,
    vendorName: dto.vendorName ?? '',
    businessUsePercent: dto.businessUsePercent ?? null,
    recordStatus: dto.recordStatus,
    aiDeductionStatus: dto.aiDeductionStatus ?? null,
    aiExplanation: dto.aiExplanation ?? null,
    aiDisclaimer: dto.aiDisclaimer ?? null,
    aiAnalyzedAt: dto.aiAnalyzedAt ?? null,
    receiptCount: dto.receiptCount ?? 0,
    createdAt: dto.createdAt,
    lastModified: dto.lastModified ?? null,
  }
}

export function createTaxiqStaffDeductionsRepository(client: HttpClient = httpClient) {
  return {
    async list(params: StaffDeductionListParams): Promise<StaffDeductionListPage> {
      const query = new URLSearchParams({ staffTaxYearId: params.staffTaxYearId })
      if (params.recordStatus) query.set('recordStatus', params.recordStatus)
      if (params.categoryId) query.set('categoryId', params.categoryId)
      const data = await client.get<StaffDeductionListApiDto>(
        `/api/v1/taxiq/staff/deductions?${query.toString()}`,
      )
      return {
        items: (data?.items ?? []).map(normalizeStaffDeduction),
        totalDeductibleAmount: data?.totalDeductibleAmount ?? 0,
      }
    },

    async create(params: CreateStaffDeductionParams): Promise<string> {
      return await client.post<string>('/api/v1/taxiq/staff/deductions', {
        staffTaxYearId: params.staffTaxYearId,
        categoryId: params.categoryId,
        description: params.description,
        amount: params.amount,
        date: params.date,
        vendorName: params.vendorName ?? null,
        businessUsePercent: params.businessUsePercent ?? null,
      })
    },

    async update(id: string, params: UpdateStaffDeductionParams): Promise<void> {
      await client.put(`/api/v1/taxiq/staff/deductions/${encodeURIComponent(id)}`, {
        categoryId: params.categoryId,
        description: params.description,
        amount: params.amount,
        date: params.date,
        vendorName: params.vendorName ?? null,
        businessUsePercent: params.businessUsePercent ?? null,
      })
    },

    async submit(id: string): Promise<void> {
      await client.post(`/api/v1/taxiq/staff/deductions/${encodeURIComponent(id)}/submit`)
    },
  }
}

export const taxiqStaffDeductionsRepository = createTaxiqStaffDeductionsRepository()
export default taxiqStaffDeductionsRepository
