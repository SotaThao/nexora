/**
 * merchantSettingsRepository - API implementation for merchant settings.
 */
import httpClient from '../../lib/httpClient'
import type { InviteLinkSettingDto } from '../../types/repositories'

type HttpClient = typeof httpClient

export function createMerchantSettingsRepository(client: HttpClient = httpClient) {
  return {
    async getInviteLink(): Promise<InviteLinkSettingDto> {
      return await client.get<InviteLinkSettingDto>('/api/v1/merchant/settings/invite-link')
    },

    async updateInviteLink(isEnabled: boolean): Promise<InviteLinkSettingDto> {
      return await client.put<InviteLinkSettingDto>('/api/v1/merchant/settings/invite-link', {
        isEnabled,
      })
    },
  }
}

export const merchantSettingsRepository = createMerchantSettingsRepository()
export default merchantSettingsRepository
