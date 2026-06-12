/**
 * useStaffSelf — TanStack Query hooks for the staff self-service domain.
 */
import { useQuery } from '@tanstack/react-query'
import { qk } from '../queryKeys'
import staffSelfRepository from '../repositories/staffSelf'
import type { StaffBusinessLink, StaffProfile } from '../../types/domain'

export function useStaffProfile({ enabled = true } = {}) {
  return useQuery<StaffProfile | null>({
    queryKey: qk.staffProfile(),
    queryFn: () => staffSelfRepository.getMyProfile(),
    enabled,
  })
}

export function useStaffBusinesses({ enabled = true } = {}) {
  return useQuery<StaffBusinessLink[]>({
    queryKey: qk.staffBusinesses(),
    queryFn: () => staffSelfRepository.getMyBusinesses(),
    enabled,
  })
}
