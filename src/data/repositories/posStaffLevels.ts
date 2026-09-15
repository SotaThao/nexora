/**
 * posStaffLevelsRepository — POS Owner Setup: Staff Levels.
 */
import httpClient from '../../lib/httpClient'
import type { PosStaffLevelApiDto } from '../../types/repositories'

type HttpClient = typeof httpClient

export function createPosStaffLevelsRepository(client: HttpClient = httpClient) {
  return {
    async getPosStaffLevels(): Promise<PosStaffLevelApiDto[]> {
      const res = await client.get<PosStaffLevelApiDto[]>('/api/v1/merchant/pos/staff-levels')
      return res ?? []
    },

    async createPosStaffLevel(name: string): Promise<string> {
      return await client.post<string>('/api/v1/merchant/pos/staff-levels', { name })
    },

    async updatePosStaffLevel(staffLevelId: string, name: string): Promise<boolean> {
      return await client.put<boolean>(`/api/v1/merchant/pos/staff-levels/${staffLevelId}`, { name })
    },

    async deletePosStaffLevel(staffLevelId: string): Promise<boolean> {
      return await client.del<boolean>(`/api/v1/merchant/pos/staff-levels/${staffLevelId}`)
    },
  }
}

export const posStaffLevelsRepository = createPosStaffLevelsRepository()
export default posStaffLevelsRepository
