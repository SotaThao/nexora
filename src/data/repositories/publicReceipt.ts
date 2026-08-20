/**
 * publicReceiptRepository — the receipt a customer opens from the link in their checkout SMS.
 * Anonymous: the token in the URL is the only credential, same convention as publicBooking.ts.
 */
import httpClient from '../../lib/httpClient'
import type { ReceiptApiDto } from '../../types/repositories'

type HttpClient = typeof httpClient

export function createPublicReceiptRepository(client: HttpClient = httpClient) {
  return {
    async getReceipt(receiptToken: string): Promise<ReceiptApiDto> {
      return await client.get<ReceiptApiDto>(
        `/api/v1/public/receipt/${encodeURIComponent(receiptToken)}`,
        { anonymous: true },
      )
    },
  }
}

export const publicReceiptRepository = createPublicReceiptRepository()
export default publicReceiptRepository
