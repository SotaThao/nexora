/**
 * staffInvitesRepository — API implementation for staff invite token flows.
 * These are anonymous (unauthenticated) endpoints used by invitees to load
 * invite metadata and accept invitations.
 */
import httpClient from '../../lib/httpClient'

/**
 * Normalize an InviteInfoDto into the shape the invite portal uses.
 *
 * @param {object} dto - Raw InviteInfoDto from GET /api/v1/staff/invite/{token}
 * @returns {object} Normalized invite metadata
 */
export function normalizeInviteInfo(dto) {
  return {
    invitedName: dto.invitedName ?? '',
    invitedPosition: dto.invitedPosition ?? null,
    businessName: dto.businessName ?? '',
  }
}

/**
 * Factory to create a staff invites repository instance.
 *
 * @param {object} [client] - HTTP client (defaults to httpClient)
 * @returns {object} Repository with invite token methods
 */
export function createStaffInvitesRepository(client = httpClient) {
  return {
    /**
     * Load invite metadata by token (anonymous).
     * @param {string} token
     * @returns {Promise<object>} Normalized invite info
     */
    async getInviteInfo(token) {
      const data = await client.get(
        `/api/v1/staff/invite/${encodeURIComponent(token)}`,
        { anonymous: true }
      )
      return normalizeInviteInfo(data)
    },

    /**
     * Accept an invite token (anonymous).
     * @param {string} token
     * @param {{ displayName: string, position?: string, bio?: string, photoUrl?: string }} body
     * @returns {Promise<void>}
     */
    async acceptInvite(token, { displayName, position, bio, photoUrl, password }) {
      return await client.post(
        `/api/v1/staff/invite/${encodeURIComponent(token)}/accept`,
        {
          token,
          displayName,
          position: position ?? null,
          bio: bio ?? null,
          photoUrl: photoUrl ?? null,
          password: password ?? null,
        }
      )
    },
  }
}

export const staffInvitesRepository = createStaffInvitesRepository()
export default staffInvitesRepository
