/**
 * taxiqReceiptsRepository — upload, link-to-deduction, and the full Receipt Vault
 * (list + resolve-duplicate) per US-05. See docs/plan/tasks/taxiq/fe-tasks/US-05.
 *
 * `upload`/`list` take either `ownerTaxYearId` or `staffTaxYearId` — ReceiptController
 * (BE) accepts exactly one of the two (see US-11: Staff Deduction Center reuses this
 * same upload step, scoped to the Staff's own StaffTaxYear instead of an OwnerTaxYear).
 */
import httpClient from '../../lib/httpClient'

type HttpClient = typeof httpClient

export interface UploadReceiptParams {
  ownerTaxYearId?: string
  staffTaxYearId?: string
}

export type ReceiptQualityStatus = 'Pending' | 'Valid' | 'NeedsMoreInfo'
export type ReceiptLinkedEntityType = 'Standalone' | 'Deduction' | 'Payout' | 'SelfReportedIncome'
export type DuplicateResolution = 'Kept' | 'Merged' | 'Deleted'

export interface ReceiptVaultItemApiDto {
  id: string
  fileName: string
  url: string
  qualityStatus: string
  isDuplicate: boolean
  duplicateResolution?: string | null
  aiExtractedVendor?: string | null
  aiExtractedDate?: string | null
  aiExtractedAmount?: number | null
  aiExtractedCategory?: string | null
  linkedEntityType: string
  deductionRecordId?: string | null
  payoutRecordId?: string | null
  selfReportedIncomeId?: string | null
  createdAt: string
}

export interface ReceiptVaultItem {
  id: string
  fileName: string
  url: string
  qualityStatus: ReceiptQualityStatus
  isDuplicate: boolean
  duplicateResolution: DuplicateResolution | null
  aiExtractedVendor: string | null
  aiExtractedDate: string | null
  aiExtractedAmount: number | null
  aiExtractedCategory: string | null
  linkedEntityType: ReceiptLinkedEntityType
  deductionRecordId: string | null
  payoutRecordId: string | null
  selfReportedIncomeId: string | null
  createdAt: string
}

function normalizeReceiptVaultItem(dto: ReceiptVaultItemApiDto): ReceiptVaultItem {
  return {
    id: dto.id,
    fileName: dto.fileName,
    url: dto.url ?? '',
    qualityStatus: dto.qualityStatus as ReceiptQualityStatus,
    isDuplicate: dto.isDuplicate,
    duplicateResolution: (dto.duplicateResolution as DuplicateResolution | null) ?? null,
    aiExtractedVendor: dto.aiExtractedVendor ?? null,
    aiExtractedDate: dto.aiExtractedDate ?? null,
    aiExtractedAmount: dto.aiExtractedAmount ?? null,
    aiExtractedCategory: dto.aiExtractedCategory ?? null,
    linkedEntityType: dto.linkedEntityType as ReceiptLinkedEntityType,
    deductionRecordId: dto.deductionRecordId ?? null,
    payoutRecordId: dto.payoutRecordId ?? null,
    selfReportedIncomeId: dto.selfReportedIncomeId ?? null,
    createdAt: dto.createdAt,
  }
}

export interface ReceiptVaultListParams {
  ownerTaxYearId?: string
  staffTaxYearId?: string
  deductionRecordId?: string
}

export function createTaxiqReceiptsRepository(client: HttpClient = httpClient) {
  return {
    async upload(params: UploadReceiptParams, file: File): Promise<string> {
      const formData = new FormData()
      formData.append('file', file)
      return await client.upload<string>('/api/v1/taxiq/receipts/upload', formData, 'POST', {
        params: { ownerTaxYearId: params.ownerTaxYearId, staffTaxYearId: params.staffTaxYearId },
      })
    },

    async linkToDeduction(receiptId: string, deductionRecordId: string): Promise<void> {
      await client.post(`/api/v1/taxiq/receipts/${encodeURIComponent(receiptId)}/link-deduction`, {
        deductionRecordId,
      })
    },

    async list(params: ReceiptVaultListParams): Promise<ReceiptVaultItem[]> {
      const dtos = await client.get<ReceiptVaultItemApiDto[]>('/api/v1/taxiq/receipts', {
        params: {
          ownerTaxYearId: params.ownerTaxYearId,
          staffTaxYearId: params.staffTaxYearId,
          deductionRecordId: params.deductionRecordId,
        },
      })
      return (dtos ?? []).map(normalizeReceiptVaultItem)
    },

    async resolveDuplicate(
      receiptId: string,
      resolution: DuplicateResolution,
      mergeTargetReceiptId?: string,
    ): Promise<void> {
      await client.post(`/api/v1/taxiq/receipts/${encodeURIComponent(receiptId)}/resolve-duplicate`, {
        receiptId,
        resolution,
        mergeTargetReceiptId: mergeTargetReceiptId ?? null,
      })
    },

    async remove(receiptId: string): Promise<void> {
      await client.del(`/api/v1/taxiq/receipts/${encodeURIComponent(receiptId)}`)
    },

    async unlinkFromDeduction(receiptId: string): Promise<void> {
      await client.post(`/api/v1/taxiq/receipts/${encodeURIComponent(receiptId)}/unlink-deduction`)
    },
  }
}

export const taxiqReceiptsRepository = createTaxiqReceiptsRepository()
export default taxiqReceiptsRepository
