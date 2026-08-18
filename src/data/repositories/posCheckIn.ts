/**
 * posCheckInRepository — the front desk's half of the shared check-in page.
 *
 * Every call here has a twin on posSelfCheckInRepository answering the same question for the
 * tablet. Same rules, different authentication: businessId is an explicit param (a Staff caller
 * may be linked to more than one business), where the kiosk is identified by its device token.
 */
import httpClient from '../../lib/httpClient'
import type {
  CheckInActiveVisitApiDto,
  CheckInTechnicianApiDto,
  PosCheckInSettingsApiDto,
} from '../../types/repositories'

type HttpClient = typeof httpClient

export function createPosCheckInRepository(client: HttpClient = httpClient) {
  return {
    async getTechnicians(businessId: string): Promise<CheckInTechnicianApiDto[]> {
      const res = await client.get<CheckInTechnicianApiDto[]>(
        `/api/v1/merchant/pos/${businessId}/checkin/technicians`,
      )
      return res ?? []
    },

    // null means this number has no visit in progress — not an error.
    async getActiveVisitOrderNumber(businessId: string, phone: string): Promise<string | null> {
      const res = await client.get<CheckInActiveVisitApiDto | null>(
        `/api/v1/merchant/pos/${businessId}/checkin/active-visit`,
        { params: { phone } },
      )
      return res?.orderNumber ?? null
    },

    async getSettings(businessId: string): Promise<PosCheckInSettingsApiDto> {
      return await client.get<PosCheckInSettingsApiDto>(
        `/api/v1/merchant/pos/${businessId}/checkin-settings`,
      )
    },

    async updateSettings(businessId: string, payload: PosCheckInSettingsApiDto): Promise<boolean> {
      return await client.put<boolean>(`/api/v1/merchant/pos/${businessId}/checkin-settings`, payload)
    },
  }
}

const posCheckInRepository = createPosCheckInRepository()
export default posCheckInRepository
