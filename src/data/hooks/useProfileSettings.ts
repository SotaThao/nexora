/**
 * useProfileSettings — TanStack Query hooks for the profile-settings domain.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { qk } from '../queryKeys'
import profileSettingsRepository from '../repositories/profileSettings'
import { useSessionRole } from '../../auth/useSessionRole'
import type { LooseObject, UserProfile } from '../../types/domain'
import type { UpdateStaffProfileDto, UpdateUserProfileDto } from '../../types/repositories'

export function useProfileSettings({ enabled: callerEnabled = true } = {}) {
  const queryClient = useQueryClient()
  const { isAuthenticated } = useSessionRole()
  const hasCachedProfile = queryClient.getQueryData(qk.userProfile()) !== undefined

  return useQuery<UserProfile | null>({
    queryKey: qk.userProfile(),
    queryFn: () => profileSettingsRepository.get(),
    enabled: isAuthenticated && callerEnabled && !hasCachedProfile,
    initialData: () => queryClient.getQueryData<UserProfile | null>(qk.userProfile()),
    staleTime: Infinity,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  })
}

export function useVerifiedStatus({ enabled = true } = {}) {
  return useQuery<LooseObject>({
    queryKey: qk.verifiedStatus(),
    queryFn: () => profileSettingsRepository.getVerifiedStatus(),
    enabled,
    refetchOnWindowFocus: false,
  })
}

export function useKycInitialize({ enabled = false } = {}) {
  return useQuery<{ url?: string }>({
    queryKey: qk.kycInitialize(),
    queryFn: () => profileSettingsRepository.initializeKyc(),
    enabled,
    refetchOnWindowFocus: false,
  })
}

export function useUpdateUserProfile() {
  const queryClient = useQueryClient()
  return useMutation<LooseObject, Error, UpdateUserProfileDto>({
    mutationFn: (dto) => profileSettingsRepository.updateUserProfile(dto),
    onSuccess: (_data, dto) => {
      if (dto.profileImageUrl !== undefined) {
        queryClient.setQueryData(qk.userProfile(), (prev: UserProfile | null | undefined) => (
          prev
            ? {
                ...prev,
                profileImageUrl: dto.profileImageUrl || undefined,
                profileImage: dto.profileImageUrl
                  ? { imageUrl: dto.profileImageUrl, thumbnailUrl: dto.profileImageUrl }
                  : prev.profileImage,
              }
            : prev
        ))
      }
      queryClient.invalidateQueries({ queryKey: qk.userProfile() })
    },
  })
}

export function useUpdateStaffProfile() {
  const queryClient = useQueryClient()
  return useMutation<LooseObject, Error, UpdateStaffProfileDto>({
    mutationFn: (dto) => profileSettingsRepository.updateStaffProfile(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.staffProfile() })
    },
  })
}

/** @deprecated */
export function useSaveProfileSettings() {
  const queryClient = useQueryClient()
  return useMutation<void, Error, LooseObject>({
    mutationFn: (settings) => profileSettingsRepository.save(settings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.userProfile() })
    },
  })
}

export function useClearProfileSettings() {
  const queryClient = useQueryClient()
  return useMutation<void, Error, void>({
    mutationFn: () => profileSettingsRepository.clear(),
    onSuccess: () => {
      queryClient.setQueryData(qk.userProfile(), null)
      queryClient.invalidateQueries({ queryKey: qk.userProfile() })
    },
  })
}
