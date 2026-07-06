/**
 * taxiqReceiptsRepository — upload + link-to-deduction only. Scoped to what the
 * Deduction Center wizard needs; the full Receipt Vault (list/resolve-duplicate) is a
 * separate future ticket. See openspec/changes/integrate-taxiq-owner-deductions/design.md D6.
 */
import httpClient from '../../lib/httpClient'

type HttpClient = typeof httpClient

export function createTaxiqReceiptsRepository(client: HttpClient = httpClient) {
  return {
    async upload(ownerTaxYearId: string, file: File): Promise<string> {
      const formData = new FormData()
      formData.append('file', file)
      return await client.upload<string>('/api/v1/taxiq/receipts/upload', formData, 'POST', {
        params: { ownerTaxYearId },
      })
    },

    async linkToDeduction(receiptId: string, deductionRecordId: string): Promise<void> {
      await client.post(`/api/v1/taxiq/receipts/${encodeURIComponent(receiptId)}/link-deduction`, {
        deductionRecordId,
      })
    },
  }
}

export const taxiqReceiptsRepository = createTaxiqReceiptsRepository()
export default taxiqReceiptsRepository
