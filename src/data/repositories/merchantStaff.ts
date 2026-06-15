/**
 * merchantStaffRepository — API implementation for staff management.
 */
import httpClient from '../../lib/httpClient'
import type { StaffMember, StaffSearchResult } from '../../types/domain'
import type {
  MerchantStaffInvite,
  StaffInviteDetailApiDto,
  StaffInviteListItemApiDto,
  StaffInviteParams,
  StaffInviteResult,
  StaffInvitesQuery,
  StaffLinkRequestParams,
  StaffListItemApiDto,
  StaffPaymentMethodApiDto,
  StaffReorderItem,
  StaffSearchResultApiDto,
} from '../../types/repositories'

type HttpClient = typeof httpClient

const PAYOUT_TYPE_TO_KEY: Record<string, string> = {
  Zelle: 'zelle',
  BankWire: 'bankwire',
  PayPal: 'paypal',
  Venmo: 'venmo',
  CashApp: 'cashapp',
  AppleCash: 'applecash',
  VlinkPay: 'vlinkpay',
}

const normalizeDateOnly = (value?: string | null) => {
  if (!value) return null
  return value.split('T')[0]
}

export function normalizePaymentMethods(
  paymentMethods: StaffPaymentMethodApiDto[] | undefined,
  displayName = '',
) {
  const payoutConfigs: Record<string, { enabled: boolean; value: string; qrCode: string; accountName: string }> = {
    zelle: { enabled: false, value: '', qrCode: '', accountName: '' },
    bankwire: { enabled: false, value: '', qrCode: '', accountName: '' },
    paypal: { enabled: false, value: '', qrCode: '', accountName: '' },
    venmo: { enabled: false, value: '', qrCode: '', accountName: '' },
    cashapp: { enabled: false, value: '', qrCode: '', accountName: '' },
    applecash: { enabled: false, value: '', qrCode: '', accountName: '' },
  }
  const paymentAccounts: Record<string, string> = {}

  for (const method of paymentMethods ?? []) {
    const key = PAYOUT_TYPE_TO_KEY[method?.type ?? '']
    if (!key) continue
    const value = method.accountInfo ?? ''
    paymentAccounts[key] = value
    if (key === 'vlinkpay') continue
    payoutConfigs[key] = {
      enabled: !!method.isActive,
      value,
      qrCode: method.imageUrl ?? '',
      accountName: displayName ?? '',
    }
  }

  return { payoutConfigs, paymentAccounts }
}

export function normalizeStaffListItem(dto: StaffListItemApiDto): StaffMember {
  const isActive = dto.status === 'Active' || dto.status === 'Accepted'
  const displayName = dto.displayName ?? ''
  const { payoutConfigs, paymentAccounts } = normalizePaymentMethods(dto.paymentMethods, displayName)
  const itemType =
    dto.itemType ??
    (dto.inviteId ? 'invite' : undefined) ??
    (dto.linkId || dto.staffLinkId || dto.status === 'Pending' ? 'link' : undefined)
  const status =
    itemType === 'invite' && dto.status === 'Pending'
      ? 'Pending Setup'
      : itemType === 'link' && dto.status === 'Pending'
        ? 'Pending Acceptance'
        : (dto.status ?? null)

  return {
    id: dto.id ?? dto.linkId ?? dto.inviteId,
    staffLinkId: itemType === 'link' ? (dto.staffLinkId ?? dto.linkId ?? dto.id) : null,
    inviteId: itemType === 'invite' ? (dto.inviteId ?? dto.id) : null,
    staffProfileId: dto.staffProfileId ?? null,
    staffCode: dto.staffCode ?? null,
    refCode: dto.refCode ?? null,
    source: dto.source ?? dto.inviteSource ?? null,
    itemType,
    sortOrder: dto.sortOrder ?? 0,
    isProfileComplete: dto.isProfileComplete ?? false,
    tipCount: dto.tipCount ?? 0,
    averageRating: dto.averageRating ?? 0,
    fullName: displayName,
    avatar: dto.photoUrl ?? null,
    status,
    isActive,
    showInTipsFlow: isActive,
    position: dto.position ?? null,
    bio: dto.bio ?? null,
    invitedEmail: dto.invitedEmail ?? null,
    invitedPhone: dto.invitedPhone ?? null,
    phone:
      dto.phoneNumber ??
      dto.staffProfile?.phoneNumber ??
      dto.staffProfile?.phone ??
      dto.user?.phoneNumber ??
      dto.user?.phone ??
      dto.phone ??
      dto.invitedPhone ??
      null,
    email:
      dto.email ?? dto.staffProfile?.email ?? dto.user?.email ?? dto.invitedEmail ?? null,
    joinedDate: normalizeDateOnly(dto.joinDate),
    payoutConfigs,
    paymentAccounts,
  }
}

export function normalizeStaffInvite(
  dto: StaffInviteListItemApiDto | StaffInviteDetailApiDto,
): MerchantStaffInvite {
  return {
    inviteId: dto.id ?? null,
    invitedName: dto.invitedName ?? '',
    invitedEmail: dto.invitedEmail ?? null,
    invitedPhone: dto.invitedPhone ?? null,
    invitedPosition: dto.invitedPosition ?? null,
    status: dto.status ?? null,
    expiresAt: dto.expiresAt ?? null,
    invitedAt: dto.invitedAt ?? null,
    acceptedAt: dto.acceptedAt ?? null,
    acceptedByUserProfileId:
      (dto as StaffInviteDetailApiDto).acceptedByUserProfileId ?? null,
  }
}

export function normalizeStaffSearchResult(dto: StaffSearchResultApiDto): StaffSearchResult {
  return {
    staffProfileId: dto.staffProfileId,
    staffCode: dto.staffCode ?? null,
    fullName: dto.displayName ?? '',
    avatar: dto.photoUrl ?? null,
    position: dto.position ?? null,
  }
}

interface StaffListApiResponse {
  items?: StaffListItemApiDto[]
}

export function createMerchantStaffRepository(client: HttpClient = httpClient) {
  return {
    async list(): Promise<StaffMember[]> {
      const data = await client.get<StaffListItemApiDto[] | StaffListApiResponse>('/api/v1/merchant/staff')
      const items = Array.isArray(data) ? data : (data?.items ?? [])
      return items.map(normalizeStaffListItem)
    },

    async invite({ name, email, phone, position }: StaffInviteParams): Promise<StaffInviteResult> {
      return await client.post<StaffInviteResult>('/api/v1/merchant/staff/invite', {
        invitedName: name,
        invitedEmail: email ?? null,
        invitedPhone: phone ?? null,
        invitedPosition: position ?? null,
      })
    },

    async resendInvite(inviteId: string): Promise<void> {
      await client.post(`/api/v1/merchant/staff/${encodeURIComponent(inviteId)}/resend`)
    },

    // v3.3 — invite lifecycle management.
    async listInvites(query: StaffInvitesQuery = {}): Promise<MerchantStaffInvite[]> {
      const params = new URLSearchParams()
      if (query.keyword) params.set('Keyword', query.keyword)
      if (query.statusFilter) params.set('StatusFilter', query.statusFilter)
      if (query.pageNumber != null) params.set('PageNumber', String(query.pageNumber))
      if (query.pageSize != null) params.set('PageSize', String(query.pageSize))
      const qs = params.toString()
      const data = await client.get<
        StaffInviteListItemApiDto[] | { items?: StaffInviteListItemApiDto[] }
      >(`/api/v1/merchant/staff/invites${qs ? `?${qs}` : ''}`)
      const items = Array.isArray(data) ? data : (data?.items ?? [])
      return items.map(normalizeStaffInvite)
    },

    async getInvite(inviteId: string): Promise<MerchantStaffInvite> {
      const data = await client.get<StaffInviteDetailApiDto>(
        `/api/v1/merchant/staff/invites/${encodeURIComponent(inviteId)}`,
      )
      return normalizeStaffInvite(data)
    },

    async cancelInvite(inviteId: string): Promise<void> {
      await client.del(`/api/v1/merchant/staff/invites/${encodeURIComponent(inviteId)}`)
    },

    async getByStaffCode(staffCode: string): Promise<StaffMember> {
      // StaffDetailByCodeDto is a superset of StaffListItemDto, so the existing
      // list normalizer covers the shared fields.
      const dto = await client.get<StaffListItemApiDto>(
        `/api/v1/merchant/staff/${encodeURIComponent(staffCode)}`,
      )
      return normalizeStaffListItem(dto)
    },

    async search(q: string): Promise<StaffSearchResult[]> {
      const data = await client.get<StaffSearchResultApiDto[] | { items?: StaffSearchResultApiDto[] }>(
        `/api/v1/merchant/staff/search?q=${encodeURIComponent(q)}`,
      )
      const items = Array.isArray(data) ? data : (data?.items ?? [])
      return items.map(normalizeStaffSearchResult)
    },

    async sendLinkRequest(params: string | StaffLinkRequestParams): Promise<void> {
      const dto = typeof params === 'string'
        ? { staffProfileId: params }
        : params
      await client.post(`/api/v1/merchant/staff/link-request/${encodeURIComponent(dto.staffProfileId)}`)
    },

    async approveLink(linkId: string): Promise<void> {
      await client.put(`/api/v1/merchant/staff/links/${encodeURIComponent(linkId)}/approve`)
    },

    async updateStatus(staffLinkId: string, status: string): Promise<void> {
      await client.put(`/api/v1/merchant/staff/${encodeURIComponent(staffLinkId)}/status`, {
        staffLinkId,
        status,
      })
    },

    async rejectLink(linkId: string): Promise<void> {
      await client.put(`/api/v1/merchant/staff/links/${encodeURIComponent(linkId)}/reject`)
    },

    async reorder(items: StaffReorderItem[]): Promise<void> {
      await client.put('/api/v1/merchant/staff/reorder', { items })
    },

    async remove(staffLinkId: string): Promise<void> {
      await client.del(`/api/v1/merchant/staff/${encodeURIComponent(staffLinkId)}`)
    },
  }
}

export const merchantStaffRepository = createMerchantStaffRepository()
export default merchantStaffRepository
