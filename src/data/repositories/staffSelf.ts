/**
 * staffSelfRepository — staff-side self-service endpoints.
 */

import httpClient from '../../lib/httpClient'
import { isApiError } from '../../types/domain'
import type { StaffBusinessLink, StaffProfile } from '../../types/domain'

type HttpClient = typeof httpClient

interface StaffBusinessApiDto {
  businessId?: string
  businessName?: string
  address?: string | null
  city?: string | null
  state?: string | null
  logoUrl?: string | null
  role?: string | null
  roleLabel?: string | null
  linkStatus?: string | null
  linkStatusLabel?: string | null
  linkedAt?: string | null
}

interface StaffBusinessesResponse {
  items?: StaffBusinessApiDto[]
}

export function createStaffSelfRepository(client: HttpClient = httpClient) {
  return {
    async getMyProfile(): Promise<StaffProfile | null> {
      try {
        return await client.get<StaffProfile>('/api/v1/staff/profile')
      } catch (err: unknown) {
        if (isApiError(err) && err.status === 404) return null
        throw err
      }
    },

    async getMyBusinesses(): Promise<StaffBusinessLink[]> {
      const res = await client.get<StaffBusinessApiDto[] | StaffBusinessesResponse>('/api/v1/staff/businesses')
      const items = Array.isArray(res) ? res : (res?.items || [])
      return items.map((b) => ({
        businessId: b.businessId ?? '',
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
