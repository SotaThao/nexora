/**
 * merchantStaffRepository — API implementation for staff management.
 * Handles merchant staff list, invitations, linking, status updates,
 * reordering, and removal via the Nexora REST API.
 */
import httpClient from '../../lib/httpClient'
import type { StaffMember, PaymentMethodDto } from '../../types/domain'

export interface StaffListPage {
  items: StaffMember[]
  pageNumber: number
  totalPages: number
  totalCount: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

/** Raw paginated response shape from GET /api/v1/merchant/staff */
interface StaffListApiResponse {
  items?: LooseObject[]
  pageNumber?: number
  totalPages?: number
  totalCount?: number
  hasNextPage?: boolean
  hasPreviousPage?: boolean
}

/** Raw search response shape from GET /api/v1/merchant/staff/search */
interface StaffSearchApiResponse {
  items?: LooseObject[]
}

/**
 * Map a PayoutMethodType enum value (from the API) to the dashboard wallet key.
 * Enum (Swagger): Zelle | BankWire | PayPal | Venmo | CashApp | AppleCash | VlinkPay
 */
const PAYOUT_TYPE_TO_KEY = {
  Zelle: 'zelle',
  BankWire: 'bankwire',
  PayPal: 'paypal',
  Venmo: 'venmo',
  CashApp: 'cashapp',
  AppleCash: 'applecash',
  VlinkPay: 'vlinkpay',
}

/**
 * Build the dashboard payoutConfigs + simple paymentAccounts maps from the
 * API `StaffPaymentMethodItemDto[]` (`{ type, isActive, accountInfo, imageUrl }`).
 *
 * @param {Array} paymentMethods - dto.paymentMethods from StaffListItemDto
 * @param {string} [displayName] - Fallback account-holder name
 */
export function normalizePaymentMethods(
  paymentMethods: PaymentMethodDto[] | undefined,
  displayName = ''
): { payoutConfigs: LooseObject; paymentAccounts: LooseObject } {
  const payoutConfigs = {
    zelle: { enabled: false, value: '', qrCode: '', accountName: '' },
    bankwire: { enabled: false, value: '', qrCode: '', accountName: '' },
    paypal: { enabled: false, value: '', qrCode: '', accountName: '' },
    venmo: { enabled: false, value: '', qrCode: '', accountName: '' },
    cashapp: { enabled: false, value: '', qrCode: '', accountName: '' },
    applecash: { enabled: false, value: '', qrCode: '', accountName: '' },
  }
  const paymentAccounts = {}

  for (const method of paymentMethods ?? []) {
    const key = PAYOUT_TYPE_TO_KEY[method?.type]
    if (!key) continue
    const value = method.accountInfo ?? ''
    paymentAccounts[key] = value
    // VlinkPay is shown as the ID field, not a payout toggle.
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

/**
 * Normalize a StaffListItemDto from the API into the dashboard-friendly shape.
 *
 * @param {object} dto - Raw StaffListItemDto from GET /api/v1/merchant/staff
 */
export function normalizeStaffListItem(dto: LooseObject): StaffMember {
  const isActive = dto['status'] === 'Active' || dto['status'] === 'Accepted'
  const displayName = (dto['displayName'] as string) ?? ''
  const { payoutConfigs, paymentAccounts } = normalizePaymentMethods(dto['paymentMethods'] as PaymentMethodDto[] | undefined, displayName)

  const staffProfile = dto['staffProfile'] as LooseObject | undefined
  const user = dto['user'] as LooseObject | undefined
  return {
    id: (dto['linkId'] ?? dto['id'] ?? dto['inviteId']) as string,
    linkId: (dto['linkId'] ?? dto['staffLinkId'] ?? dto['id'] ?? null) as string | null,
    staffLinkId: (dto['itemType'] === 'link' ? (dto['staffLinkId'] ?? dto['linkId']) : null) as string | null,
    inviteId: (dto['itemType'] === 'invite' ? dto['inviteId'] : null) as string | null,
    staffProfileId: (dto['staffProfileId'] ?? null) as string | null,
    staffCode: (dto['staffCode'] ?? null) as string | null,
    itemType: dto['itemType'] as string,
    sortOrder: (dto['sortOrder'] ?? 0) as number,
    isProfileComplete: (dto['isProfileComplete'] ?? false) as boolean,
    tipCount: (dto['tipCount'] ?? 0) as number,
    averageRating: (dto['averageRating'] ?? 0) as number,
    fullName: displayName,
    avatar: (dto['photoUrl'] ?? null) as string | null,
    status: (dto['itemType'] === 'invite' && dto['status'] === 'Pending') ? 'Pending Setup' : ((dto['status'] ?? null) as string | null),
    isActive,
    showInTipsFlow: isActive,
    position: (dto['position'] ?? null) as string | null,
    bio: (dto['bio'] ?? null) as string | null,
    invitedEmail: (dto['invitedEmail'] ?? null) as string | null,
    invitedPhone: (dto['invitedPhone'] ?? null) as string | null,
    phone: (dto['phoneNumber'] ?? staffProfile?.['phoneNumber'] ?? staffProfile?.['phone'] ?? user?.['phoneNumber'] ?? user?.['phone'] ?? dto['phone'] ?? dto['invitedPhone'] ?? null) as string | null,
    email: (dto['email'] ?? staffProfile?.['email'] ?? user?.['email'] ?? dto['invitedEmail'] ?? null) as string | null,
    // Payout methods from StaffListItemDto.paymentMethods (review/edit modal)
    payoutConfigs,
    paymentAccounts,
  }
}

/**
 * Normalize a StaffSearchResultDto from the API.
 *
 * @param {object} dto - Raw StaffSearchResultDto from GET /api/v1/merchant/staff/search
 */
export function normalizeStaffSearchResult(dto: LooseObject): Partial<StaffMember> {
  return {
    staffProfileId: (dto['staffProfileId'] ?? undefined) as string | undefined,
    staffCode: (dto['staffCode'] ?? null) as string | null,
    fullName: (dto['displayName'] ?? '') as string,
    avatar: (dto['photoUrl'] ?? null) as string | null,
    position: (dto['position'] ?? null) as string | null,
  }
}

export const StatusFilter = {
  Pending: 'Pending',
  Active: 'Active',
  InActive: 'InActive',
  Rejected: 'Rejected',
  Accepted: 'Accepted'
}

/**
 * Factory to create a merchant staff repository instance.
 *
 * @param {object} [client] - HTTP client (defaults to httpClient)
 * @returns {object} Repository with all staff management methods
 */
export function createMerchantStaffRepository(client = httpClient) {
  return {
    /**
     * Fetch the merchant's staff list (links + pending invites).
     * @param {string} [statusFilter] - Optional status filter (Pending, Active, InActive, Rejected)
     * @param {number} [pageNumber] - Page number (default: 1)
     * @param {number} [pageSize] - Page size (default: 10)
     * @returns {Promise<{items: Array, pageNumber: number, totalPages: number, totalCount: number, hasNextPage: boolean, hasPreviousPage: boolean}>} Normalized staff rows with pagination details
     */
    async list(statusFilter?: string, pageNumber = 1, pageSize = 10): Promise<StaffListPage> {
      let url = '/api/v1/merchant/staff'
      const queryParams = []
      if (statusFilter) {
        queryParams.push(`StatusFilter=${encodeURIComponent(statusFilter)}`)
      }
      if (pageNumber !== undefined) {
        queryParams.push(`PageNumber=${pageNumber}`)
      }
      if (pageSize !== undefined) {
        queryParams.push(`PageSize=${pageSize}`)
      }
      if (queryParams.length > 0) {
        url += `?${queryParams.join('&')}`
      }
      const data = await client.get<StaffListApiResponse>(url)
      const items: LooseObject[] = (data?.items ?? (Array.isArray(data) ? data : [])) as LooseObject[]
      return {
        items: items.map(normalizeStaffListItem),
        pageNumber: data?.pageNumber ?? pageNumber,
        totalPages: data?.totalPages ?? 1,
        totalCount: data?.totalCount ?? items.length,
        hasNextPage: data?.hasNextPage ?? false,
        hasPreviousPage: data?.hasPreviousPage ?? false,
      }
    },

    /**
     * Invite a new staff member.
     * @param {{ name: string, email?: string, phone?: string, position?: string }} params
     * @returns {Promise<{ inviteId: string }>}
     */
    async invite({ name, email, phone, position }) {
      return await client.post('/api/v1/merchant/staff/invite', {
        invitedName: name,
        invitedEmail: email ?? null,
        invitedPhone: phone ?? null,
        invitedPosition: position ?? null,
      })
    },

    /**
     * Resend a pending invite notification.
     * @param {string} linkId
     * @returns {Promise<void>}
     */
    async resendInvite(linkId) {
      return await client.post(`/api/v1/merchant/staff/${encodeURIComponent(linkId)}/resend-invite`)
    },

    /**
     * Search existing staff profiles by query string.
     * @param {string} q - Search query
     * @returns {Promise<Array>} Normalized search results
     */
    async search(q) {
      const data = await client.get<StaffSearchApiResponse>(`/api/v1/merchant/staff/search?q=${encodeURIComponent(q)}`)
      const items: LooseObject[] = (data?.items ?? (Array.isArray(data) ? data : [])) as LooseObject[]
      return items.map(normalizeStaffSearchResult)
    },

    /**
     * Send a link request to an existing staff profile.
     * @param {string} staffProfileId
     * @returns {Promise<void>}
     */
    async sendLinkRequest(staffProfileId) {
      return await client.post(`/api/v1/merchant/staff/link-request/${encodeURIComponent(staffProfileId)}`)
    },

    /**
     * Approve a staff link request.
     * @param {string} linkId
     * @returns {Promise<void>}
     */
    async approveLink(linkId) {
      return await client.put(`/api/v1/merchant/staff/links/${encodeURIComponent(linkId)}/approve`)
    },

    /**
     * Update the status of a staff link (Active, Inactive, etc.).
     * @param {string} staffLinkId
     * @param {string} status
     * @returns {Promise<void>}
     */
    async updateStatus(staffLinkId, status) {
      return await client.put(`/api/v1/merchant/staff/${encodeURIComponent(staffLinkId)}/status`, {
        staffLinkId,
        status,
      })
    },

    /**
     * Reject a pending staff link/join request.
     * Uses the dedicated reject endpoint — the status-update route only
     * accepts "Active" | "Inactive" and 400s on "Rejected".
     * @param {string} linkId - BusinessStaffLink id (same as staffLinkId)
     * @returns {Promise<void>}
     */
    async rejectLink(linkId) {
      return await client.post(`/api/v1/merchant/staff/links/${encodeURIComponent(linkId)}/reject`)
    },

    /**
     * Persist staff display order.
     * @param {Array<{ staffLinkId: string, sortOrder: number }>} items
     * @returns {Promise<void>}
     */
    async reorder(items) {
      return await client.put('/api/v1/merchant/staff/reorder', { items })
    },

    /**
     * Remove (unlink/delete) a staff link.
     * @param {string} staffLinkId
     * @returns {Promise<void>}
     */
    async remove(staffLinkId) {
      return await client.del(`/api/v1/merchant/staff/${encodeURIComponent(staffLinkId)}`)
    },
  }
}

export const merchantStaffRepository = createMerchantStaffRepository()
export default merchantStaffRepository
