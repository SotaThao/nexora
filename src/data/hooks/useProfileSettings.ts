/**
 * useProfileSettings — TanStack Query hooks for the profile-settings domain.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { qk } from '../queryKeys'
import profileSettingsRepository, {
  type InitializeKybResponse,
  type KybIframeInitializeResponse,
} from '../repositories/profileSettings'
import { useSessionRole } from '../../auth/useSessionRole'
import type { LooseObject, UserProfile } from '../../types/domain'
import type { UpdateStaffProfileDto, UpdateUserProfileDto } from '../../types/repositories'

export function useProfileSettings({ enabled: callerEnabled = true } = {}) {
  const { isAuthenticated } = useSessionRole()

  return useQuery<UserProfile | null>({
    queryKey: qk.userProfile(),
    queryFn: () => profileSettingsRepository.get(),
    enabled: isAuthenticated && callerEnabled,
    staleTime: 30_000,
    refetchOnMount: true,
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

/** KYB iframe session — POST /api/v1/UserProfile/iframe/initialize */
export function useKybInfo({
  language = 'en',
  enabled = true,
}: {
  language?: string
  enabled?: boolean
} = {}) {
  return useQuery<KybIframeInitializeResponse>({
    queryKey: qk.kybIframeInitialize(language),
    queryFn: () => profileSettingsRepository.initializeKybIframe({
      viewType: 'Identity',
      language,
    }),
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

/** POST /api/v1/UserProfile/kyb/initialize — KYB iframe portal URL. */
export function useRegisterKyb() {
  return useMutation<InitializeKybResponse, Error, void>({
    mutationFn: () => profileSettingsRepository.initializeKyb(),
  })
}

/** @deprecated Use useRegisterKyb — KYB does not use kyc/initialize. */
export function useInitializeKybPortal() {
  return useRegisterKyb()
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

export function useUpdateBasicInfo() {
  const queryClient = useQueryClient()
  return useMutation<void, Error, { firstName: string; lastName?: string; phoneNumber?: string; dateOfBirth?: string }>({
    mutationFn: (dto) => profileSettingsRepository.updateBasicInfo(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.userProfile() })
    },
  })
}

export function useUpdateAddress() {
  const queryClient = useQueryClient()
  return useMutation<void, Error, { address?: string; city?: string; state?: string; zipCode?: string; country?: string }>({
    mutationFn: (dto) => profileSettingsRepository.updateAddress(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.userProfile() })
    },
  })
}

export function useUpdateAvatar() {
  const queryClient = useQueryClient()
  return useMutation<{ avatarUrl: string }, Error, File>({
    mutationFn: (file) => profileSettingsRepository.updateAvatar(file),
    onSuccess: (data) => {
      queryClient.setQueryData(qk.userProfile(), (prev: UserProfile | null | undefined) =>
        prev
          ? {
              ...prev,
              profileImageUrl: data.avatarUrl,
              profileImage: { imageUrl: data.avatarUrl, thumbnailUrl: data.avatarUrl },
            }
          : prev,
      )
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

export function useDeleteAccount() {
  const queryClient = useQueryClient()
  return useMutation<void, Error, void>({
    mutationFn: () => profileSettingsRepository.deleteAccount(),
    onSuccess: () => {
      queryClient.clear()
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
