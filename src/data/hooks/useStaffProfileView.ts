/**
 * Fetches and merges GET /api/v1/userprofile/me + GET /api/v1/staff/profile
 * for the staff profile settings screen.
 */
import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { qk } from '../queryKeys'
import profileSettingsRepository from '../repositories/profileSettings'
import staffSelfRepository from '../repositories/staffSelf'
import { useSessionRole } from '../../auth/useSessionRole'
import { mapStaffProfileView } from '../../utils/mapStaffProfileView'
import type { StaffProfile, UserProfile } from '../../types/domain'

export function useStaffProfileView({ enabled: callerEnabled = true } = {}) {
  const { isStaff } = useSessionRole()

  const userProfileQuery = useQuery<UserProfile | null>({
    queryKey: qk.userProfile(),
    queryFn: () => profileSettingsRepository.get(),
    enabled: isStaff && callerEnabled,
    staleTime: 30_000,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  })

  const staffProfileQuery = useQuery<StaffProfile | null>({
    queryKey: qk.staffProfile(),
    queryFn: () => staffSelfRepository.getMyProfile(),
    enabled: isStaff && callerEnabled,
    staleTime: 30_000,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  })

  const data = useMemo(
    () => mapStaffProfileView(userProfileQuery.data, staffProfileQuery.data),
    [userProfileQuery.data, staffProfileQuery.data],
  )

  return {
    data,
    userProfile: userProfileQuery.data ?? null,
    staffProfile: staffProfileQuery.data ?? null,
    isLoading: userProfileQuery.isLoading || staffProfileQuery.isLoading,
    isFetching: userProfileQuery.isFetching || staffProfileQuery.isFetching,
    isError: userProfileQuery.isError || staffProfileQuery.isError,
    error: userProfileQuery.error || staffProfileQuery.error,
    refetch: () => Promise.all([userProfileQuery.refetch(), staffProfileQuery.refetch()]),
  }
}
