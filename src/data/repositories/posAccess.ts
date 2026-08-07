/**
 * posAccessRepository — POS Merchant Ops: Front Desk self-check (US-12).
 * Lets FE decide what to show/hide for the current caller (Owner or Staff)
 * against a specific business, instead of only reacting to a 403.
 */
import httpClient from '../../lib/httpClient'
import type { PosAccessApiDto } from '../../types/repositories'

type HttpClient = typeof httpClient

export function createPosAccessRepository(client: HttpClient = httpClient) {
  return {
    async getMyPosAccess(businessId: string): Promise<PosAccessApiDto> {
      return await client.get<PosAccessApiDto>(`/api/v1/merchant/pos/${businessId}/access`)
    },
  }
}

export const posAccessRepository = createPosAccessRepository()
export default posAccessRepository
