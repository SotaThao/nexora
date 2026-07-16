/**
 * posStaffProfileRepository — POS Owner Setup: Staff Profile (US-019).
 */
import httpClient from '../../lib/httpClient'
import type { PosStaffProfileApiDto, StaffWeeklyScheduleDayApiDto } from '../../types/repositories'

type HttpClient = typeof httpClient

export interface SaveStaffPosProfileParams {
  businessStaffLinkId: string
  posRoleId: string
  payStructureType: string
  commissionPercent?: number | null
  weeklySalaryAmount?: number | null
  agreedAmount?: number | null
  tipsEnabled: boolean
}

export function createPosStaffProfileRepository(client: HttpClient = httpClient) {
  return {
    async getStaffPosProfile(businessStaffLinkId: string): Promise<PosStaffProfileApiDto> {
      return await client.get<PosStaffProfileApiDto>(
        `/api/v1/merchant/pos/staff-profiles/${encodeURIComponent(businessStaffLinkId)}`,
      )
    },

    async saveStaffPosProfile(params: SaveStaffPosProfileParams): Promise<boolean> {
      const { businessStaffLinkId, ...body } = params
      return await client.put<boolean>(
        `/api/v1/merchant/pos/staff-profiles/${encodeURIComponent(businessStaffLinkId)}`,
        body,
      )
    },

    async updateContractType(businessStaffLinkId: string, contractType: string): Promise<void> {
      await client.put<void>(
        `/api/v1/merchant/pos/staff-profiles/${encodeURIComponent(businessStaffLinkId)}/contract-type`,
        { contractType },
      )
    },

    async getStaffServiceAssignments(businessStaffLinkId: string): Promise<string[]> {
      return await client.get<string[]>(
        `/api/v1/merchant/pos/staff-profiles/${encodeURIComponent(businessStaffLinkId)}/services`,
      )
    },

    async saveStaffServiceAssignments(businessStaffLinkId: string, posServiceIds: string[]): Promise<boolean> {
      return await client.put<boolean>(
        `/api/v1/merchant/pos/staff-profiles/${encodeURIComponent(businessStaffLinkId)}/services`,
        { posServiceIds },
      )
    },

    async getStaffWeeklySchedule(businessStaffLinkId: string): Promise<StaffWeeklyScheduleDayApiDto[]> {
      return await client.get<StaffWeeklyScheduleDayApiDto[]>(
        `/api/v1/merchant/pos/staff-profiles/${encodeURIComponent(businessStaffLinkId)}/weekly-schedule`,
      )
    },

    async saveStaffWeeklySchedule(
      businessStaffLinkId: string,
      days: StaffWeeklyScheduleDayApiDto[],
    ): Promise<boolean> {
      return await client.put<boolean>(
        `/api/v1/merchant/pos/staff-profiles/${encodeURIComponent(businessStaffLinkId)}/weekly-schedule`,
        { days },
      )
    },
  }
}

export const posStaffProfileRepository = createPosStaffProfileRepository()
export default posStaffProfileRepository
