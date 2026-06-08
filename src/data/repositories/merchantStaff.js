/**
 * merchantStaffRepository — API implementation for staff management.
 * Handles merchant staff list, invitations, linking, status updates,
 * reordering, and removal via the Nexora REST API.
 */
import httpClient from '../../lib/httpClient'

/**
 * Normalize a StaffListItemDto from the API into the dashboard-friendly shape.
 *
 * @param {object} dto - Raw StaffListItemDto from GET /api/v1/merchant/staff
 * @returns {object} Normalized staff row for dashboard rendering
 */
export function normalizeStaffListItem(dto) {
  const isActive = dto.status === 'Active' || dto.status === 'Accepted'

  return {
    id: dto.id,
    staffLinkId: dto.itemType === 'link' ? dto.staffLinkId : null,
    inviteId: dto.itemType === 'invite' ? dto.inviteId : null,
    staffProfileId: dto.staffProfileId ?? null,
    staffCode: dto.staffCode ?? null,
    itemType: dto.itemType,
    sortOrder: dto.sortOrder ?? 0,
    isProfileComplete: dto.isProfileComplete ?? false,
    tipCount: dto.tipCount ?? 0,
    averageRating: dto.averageRating ?? 0,
    fullName: dto.displayName ?? '',
    avatar: dto.photoUrl ?? null,
    status: dto.status ?? null,
    isActive,
    showInTipsFlow: isActive,
    position: dto.position ?? null,
    invitedEmail: dto.invitedEmail ?? null,
    invitedPhone: dto.invitedPhone ?? null,
  }
}

/**
 * Normalize a StaffSearchResultDto from the API.
 *
 * @param {object} dto - Raw StaffSearchResultDto from GET /api/v1/merchant/staff/search
 * @returns {object} Normalized search result for staff search UI
 */
export function normalizeStaffSearchResult(dto) {
  return {
    staffProfileId: dto.staffProfileId,
    staffCode: dto.staffCode ?? null,
    fullName: dto.displayName ?? '',
    avatar: dto.photoUrl ?? null,
    position: dto.position ?? null,
  }
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
     * @returns {Promise<Array>} Normalized staff rows
     */
    async list() {
      const data = await client.get('/api/v1/merchant/staff')
      return (data ?? []).map(normalizeStaffListItem)
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
     * @param {string} inviteId
     * @returns {Promise<void>}
     */
    async resendInvite(inviteId) {
      return await client.post(`/api/v1/merchant/staff/${encodeURIComponent(inviteId)}/resend`)
    },

    /**
     * Search existing staff profiles by query string.
     * @param {string} q - Search query
     * @returns {Promise<Array>} Normalized search results
     */
    async search(q) {
      const data = await client.get(`/api/v1/merchant/staff/search?q=${encodeURIComponent(q)}`)
      return (data ?? []).map(normalizeStaffSearchResult)
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
