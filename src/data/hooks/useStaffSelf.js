/**
 * useStaffSelf — TanStack Query hooks for the staff self-service domain
 * (own staff profile + linked businesses).
 */
import { useQuery } from '@tanstack/react-query'
import { qk } from '../queryKeys'
import staffSelfRepository from '../repositories/staffSelf'

/** GET /api/v1/staff/profile — StaffProfileDto (null when no StaffProfile). */
export function useStaffProfile({ enabled = true } = {}) {
  return useQuery({
    queryKey: qk.staffProfile(),
    queryFn: () => staffSelfRepository.getMyProfile(),
    enabled,
  })
}

/** GET /api/v1/staff/businesses — linked businesses for the signed-in staff. */
export function useStaffBusinesses({ enabled = true } = {}) {
  return useQuery({
    queryKey: qk.staffBusinesses(),
    queryFn: () => staffSelfRepository.getMyBusinesses(),
    enabled,
  })
}
