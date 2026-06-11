/**
 * staffSelfRepository — staff-side self-service endpoints (live Swagger).
 *
 * Endpoints:
 *   GET /api/v1/staff/profile     → StaffProfileDto { id, staffCode, displayName, position, bio, photoUrl, isProfileComplete }
 *   GET /api/v1/staff/businesses  → PaginatedListOfStaffBusinessDto
 */

import httpClient from '../../lib/httpClient'

export function createStaffSelfRepository(client = httpClient) {
  return {
    /**
     * The authenticated staff member's own profile.
     * @returns {Promise<object|null>} StaffProfileDto, or null when the user
     *   has no StaffProfile yet (404 STAFF_PROFILE_NOT_FOUND).
     */
    async getMyProfile() {
      try {
        return await client.get('/api/v1/staff/profile')
      } catch (err) {
        if (err?.status === 404) return null
        throw err
      }
    },

    /**
     * Businesses linked to the authenticated staff member.
     * @returns {Promise<Array<{ businessId: string, businessName: string,
     *   address: string|null, city: string|null, state: string|null,
     *   logoUrl: string|null, role: string|null, roleLabel: string|null,
     *   linkStatus: string|null, linkStatusLabel: string|null, linkedAt: string|null }>>}
     */
    async getMyBusinesses() {
      const res = await client.get('/api/v1/staff/businesses')
      const items = Array.isArray(res) ? res : (res?.items || [])
      return items.map((b) => ({
        businessId: b.businessId,
        businessName: b.businessName ?? '',
        address: b.address ?? null,
        city: b.city ?? null,
        state: b.state ?? null,
        logoUrl: b.logoUrl ?? null,
        role: b.role ?? null,
        roleLabel: b.roleLabel ?? null,
        linkStatus: b.linkStatus ?? null,
        linkStatusLabel: b.linkStatusLabel ?? null,
        linkedAt: b.linkedAt ?? null,
      }))
    },
  }
}

export const staffSelfRepository = createStaffSelfRepository()
export default staffSelfRepository
