/**
 * useProfileSettings — TanStack Query hooks for the profile-settings domain.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { qk } from '../queryKeys'
import profileSettingsRepository from '../repositories/profileSettings'

/**
 * @param {Object} [options]
 * @param {boolean} [options.enabled=true] - Whether the query should execute.
 */
export function useProfileSettings({ enabled = true } = {}) {
  return useQuery({
    queryKey: qk.userProfile(),
    queryFn: () => profileSettingsRepository.get(),
    enabled,
    staleTime: 5 * 60_000, // 5 min — profile rarely changes mid-session
  })
}

export function useVerifiedStatus() {
  return useQuery({
    queryKey: qk.verifiedStatus(),
    queryFn: () => profileSettingsRepository.getVerifiedStatus(),
    staleTime: 5 * 60_000, // 5 min — KYB status rarely changes
  })
}

/** PUT /api/v1/userprofile/update — firstName/lastName/phoneNumber. */
export function useUpdateUserProfile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto) => profileSettingsRepository.updateUserProfile(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.userProfile() })
    },
  })
}

/** PUT /api/v1/staff/profile — displayName/position/bio/photoUrl. */
export function useUpdateStaffProfile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto) => profileSettingsRepository.updateStaffProfile(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.staffProfile() })
    },
  })
}

/** @deprecated Use useSaveProfileSettings directly on API if needed */
export function useSaveProfileSettings() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (settings) => profileSettingsRepository.save(settings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.userProfile() })
    },
  })
}

export function useClearProfileSettings() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => profileSettingsRepository.clear(),
    onSuccess: () => {
      queryClient.setQueryData(qk.userProfile(), null)
      queryClient.invalidateQueries({ queryKey: qk.userProfile() })
    },
  })
}
