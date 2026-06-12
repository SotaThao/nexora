/**
 * staffInvitesRepository — API implementation for staff invite token flows.
 */
import httpClient from '../../lib/httpClient'
import type { StaffInviteInfo } from '../../types/domain'
import type { AcceptStaffInviteDto, InviteInfoApiDto, JoinPublicInviteDto } from '../../types/repositories'

type HttpClient = typeof httpClient

export function normalizeInviteInfo(dto: InviteInfoApiDto): StaffInviteInfo {
  return {
    invitedName: dto.invitedName ?? '',
    invitedPosition: dto.invitedPosition ?? null,
    businessName: dto.businessName ?? '',
  }
}

export function createStaffInvitesRepository(client: HttpClient = httpClient) {
  return {
    async getInviteInfo(token: string): Promise<StaffInviteInfo> {
      const data = await client.get<InviteInfoApiDto>(
        `/api/v1/staff/invite/${encodeURIComponent(token)}`,
        { anonymous: true },
      )
      return normalizeInviteInfo(data)
    },

    async acceptInvite(
      token: string,
      { displayName, position, bio, photoUrl, password }: Omit<AcceptStaffInviteDto, 'token'>,
    ): Promise<void> {
      await client.post(
        `/api/v1/staff/invite/${encodeURIComponent(token)}/accept`,
        {
          token,
          displayName,
          position: position ?? null,
          bio: bio ?? null,
          photoUrl: photoUrl ?? null,
          password: password ?? null,
        },
      )
    },

    async joinPublicInvite(
      dto: JoinPublicInviteDto,
      { anonymous = false }: { anonymous?: boolean } = {},
    ): Promise<void> {
      await client.post(
        '/api/v1/staff/join-public-invite',
        {
          referralCode: dto.referralCode,
          displayName: dto.displayName,
          phoneNumber: dto.phoneNumber ?? null,
          position: dto.position ?? null,
          bio: dto.bio ?? null,
          photoUrl: dto.photoUrl ?? null,
        },
        anonymous ? { anonymous: true } : {},
      )
    },
  }
}

export const staffInvitesRepository = createStaffInvitesRepository()
export default staffInvitesRepository
