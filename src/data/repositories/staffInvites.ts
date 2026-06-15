/**
 * staffInvitesRepository — API implementation for staff invite token flows.
 */
import httpClient from '../../lib/httpClient'
import type { StaffInviteInfo } from '../../types/domain'
import type {
  AcceptStaffInviteDto,
  InviteInfoApiDto,
  JoinPublicInviteDto,
  MerchantPublicInviteApiDto,
} from '../../types/repositories'

type HttpClient = typeof httpClient

export function normalizeInviteInfo(dto: InviteInfoApiDto): StaffInviteInfo {
  return {
    invitedName: dto.invitedName ?? '',
    invitedPosition: dto.invitedPosition ?? null,
    invitedEmail: dto.invitedEmail ?? null,
    businessName: dto.businessName ?? '',
    businessAddress: dto.businessAddress ?? null,
    businessId: dto.businessId ?? null,
    businessSlug: dto.businessSlug ?? null,
  }
}

/**
 * Normalize the public merchant-invite DTO into the shared StaffInviteInfo shape
 * so the invite landing renders business info uniformly. Public invites are not
 * person-specific, so invited* fields stay empty.
 */
export function normalizeMerchantPublicInvite(dto: MerchantPublicInviteApiDto): StaffInviteInfo {
  return {
    invitedName: '',
    invitedPosition: null,
    invitedEmail: null,
    businessName: dto.businessName ?? dto.name ?? '',
    businessAddress: dto.businessAddress ?? dto.address ?? null,
    businessId: dto.businessId ?? null,
    businessSlug: dto.businessSlug ?? dto.slug ?? null,
    refCode: dto.referralCode ?? null,
    source: 'public_link',
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

    // Public invite landing — business info by business referralCode (ANON).
    async getPublicMerchantInvite(referralCode: string): Promise<StaffInviteInfo> {
      const data = await client.get<MerchantPublicInviteApiDto>(
        `/api/v1/public/merchant-invite?ref=${encodeURIComponent(referralCode)}`,
        { anonymous: true },
      )
      return normalizeMerchantPublicInvite(data)
    },

    async acceptInvite(
      token: string,
      { displayName, position, bio, photoUrl }: Omit<AcceptStaffInviteDto, 'token'>,
    ): Promise<void> {
      await client.post(
        `/api/v1/staff/invite/${encodeURIComponent(token)}/accept`,
        {
          token,
          displayName,
          position: position ?? null,
          bio: bio ?? null,
          photoUrl: photoUrl ?? null,
        },
        { anonymous: true },
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
