/**
 * posSmsSettingsRepository — POS > Salon Settings > SMS Settings (Welcome SMS, After Checkout,
 * Link Settings) and the Send Test action.
 */
import httpClient from '../../lib/httpClient'
import type {
  PosSmsSettingsApiDto,
  PosSmsTestResultApiDto,
  SendPosSmsTestRequest,
  UpdatePosSmsMessageSettingsRequest,
} from '../../types/posSms'

type HttpClient = typeof httpClient

const base = (businessId: string) => `/api/v1/merchant/pos/${businessId}/sms-settings`

export function createPosSmsSettingsRepository(client: HttpClient = httpClient) {
  return {
    async getSettings(businessId: string): Promise<PosSmsSettingsApiDto> {
      return await client.get<PosSmsSettingsApiDto>(base(businessId))
    },

    async updateWelcome(businessId: string, payload: UpdatePosSmsMessageSettingsRequest): Promise<boolean> {
      return await client.put<boolean>(`${base(businessId)}/welcome`, payload)
    },

    async updateAfterCheckout(businessId: string, payload: UpdatePosSmsMessageSettingsRequest): Promise<boolean> {
      return await client.put<boolean>(`${base(businessId)}/after-checkout`, payload)
    },

    async updateLinkSettings(businessId: string, visitLinkTtlDays: number): Promise<boolean> {
      return await client.put<boolean>(`${base(businessId)}/link`, { visitLinkTtlDays })
    },

    async sendTest(businessId: string, payload: SendPosSmsTestRequest): Promise<PosSmsTestResultApiDto> {
      return await client.post<PosSmsTestResultApiDto>(`${base(businessId)}/test`, payload)
    },
  }
}

const posSmsSettingsRepository = createPosSmsSettingsRepository()
export default posSmsSettingsRepository
