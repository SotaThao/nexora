/**
 * taxiqOwnerDeductionsRepository — API implementation for the Owner Deduction Center.
 * See openspec/changes/integrate-taxiq-owner-deductions/design.md.
 */
import httpClient from '../../lib/httpClient'

type HttpClient = typeof httpClient

export interface DeductionRecordApiDto {
  id: string
  ownerTaxYearId: string
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

interface DeductionListApiDto {
  items: DeductionRecordApiDto[]
  totalDeductibleAmount: number
}

export interface DeductionRecord {
  id: string
  ownerTaxYearId: string
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

export interface DeductionListPage {
  items: DeductionRecord[]
  totalDeductibleAmount: number
}

export interface DeductionListParams {
  ownerTaxYearId: string
  recordStatus?: string
  categoryId?: string
}

export interface CreateDeductionParams {
  ownerTaxYearId: string
  categoryId: string
  description: string
  amount: number
  date: string
  vendorName?: string | null
  businessUsePercent?: number | null
}

export interface UpdateDeductionParams {
  categoryId: string
  description: string
  amount: number
  date: string
  vendorName?: string | null
  businessUsePercent?: number | null
}

export interface ReceiptLineItemPreview {
  description: string
  amount: number | null
  suggestedCategoryName: string | null
  matchedCategoryId: string | null
  matchedCategoryName: string | null
  requiresBusinessUsePercent: boolean
}

export interface ReceiptAnalysisResult {
  s3Key: string
  fileName: string
  vendor: string | null
  date: string | null
  qualityStatus: string
  items: ReceiptLineItemPreview[]
  truncated: boolean
}

export interface ConfirmReceiptLineItemInput {
  description: string
  amount: number
  categoryId: string
  businessUsePercent?: number | null
}

export interface ConfirmReceiptLineItemsParams {
  ownerTaxYearId: string
  s3Key: string
  fileName: string
  vendor?: string | null
  date: string
  items: ConfirmReceiptLineItemInput[]
}

export interface ConfirmedDeductionResult {
  deductionRecordId: string
  receiptId: string
  description: string
  amount: number
  deductibleAmount: number
  recordStatus: string
  aiDeductionStatus: string | null
  aiExplanation: string | null
  aiDisclaimer: string | null
}

function normalizeDeductionRecord(dto: DeductionRecordApiDto): DeductionRecord {
  return {
    id: dto.id,
    ownerTaxYearId: dto.ownerTaxYearId,
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

export function createTaxiqOwnerDeductionsRepository(client: HttpClient = httpClient) {
  return {
    async list(params: DeductionListParams): Promise<DeductionListPage> {
      const query = new URLSearchParams({ ownerTaxYearId: params.ownerTaxYearId })
      if (params.recordStatus) query.set('recordStatus', params.recordStatus)
      if (params.categoryId) query.set('categoryId', params.categoryId)
      const data = await client.get<DeductionListApiDto>(
        `/api/v1/taxiq/owner/deductions?${query.toString()}`,
      )
      return {
        items: (data?.items ?? []).map(normalizeDeductionRecord),
        totalDeductibleAmount: data?.totalDeductibleAmount ?? 0,
      }
    },

    async create(params: CreateDeductionParams): Promise<string> {
      return await client.post<string>('/api/v1/taxiq/owner/deductions', {
        ownerTaxYearId: params.ownerTaxYearId,
        categoryId: params.categoryId,
        description: params.description,
        amount: params.amount,
        date: params.date,
        vendorName: params.vendorName ?? null,
        businessUsePercent: params.businessUsePercent ?? null,
      })
    },

    async update(id: string, params: UpdateDeductionParams): Promise<void> {
      await client.put(`/api/v1/taxiq/owner/deductions/${encodeURIComponent(id)}`, {
        categoryId: params.categoryId,
        description: params.description,
        amount: params.amount,
        date: params.date,
        vendorName: params.vendorName ?? null,
        businessUsePercent: params.businessUsePercent ?? null,
      })
    },

    async submit(id: string): Promise<void> {
      await client.post(`/api/v1/taxiq/owner/deductions/${encodeURIComponent(id)}/submit`)
    },

    async remove(id: string): Promise<void> {
      await client.del(`/api/v1/taxiq/owner/deductions/${encodeURIComponent(id)}`)
    },

    async reanalyze(id: string): Promise<void> {
      await client.post(`/api/v1/taxiq/owner/deductions/${encodeURIComponent(id)}/reanalyze`)
    },

    async approveCpa(id: string): Promise<void> {
      await client.post(`/api/v1/taxiq/owner/deductions/${encodeURIComponent(id)}/approve-cpa`)
    },

    async analyzeReceipt(ownerTaxYearId: string, file: File): Promise<ReceiptAnalysisResult> {
      const formData = new FormData()
      formData.append('file', file)
      return await client.upload<ReceiptAnalysisResult>(
        '/api/v1/taxiq/owner/deductions/analyze-receipt',
        formData,
        'POST',
        { params: { ownerTaxYearId } },
      )
    },

    async confirmReceiptLineItems(
      params: ConfirmReceiptLineItemsParams,
    ): Promise<{ items: ConfirmedDeductionResult[] }> {
      return await client.post('/api/v1/taxiq/owner/deductions/confirm-receipt', params)
    },
  }
}

export const taxiqOwnerDeductionsRepository = createTaxiqOwnerDeductionsRepository()
export default taxiqOwnerDeductionsRepository
