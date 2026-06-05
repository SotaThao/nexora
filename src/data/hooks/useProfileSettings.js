/**
 * useProfileSettings — TanStack Query hooks for the profile-settings domain.
 *
 * Hooks:
 *   useProfileSettings()     → useQuery for the settings object
 *   useSaveProfileSettings() → useMutation to replace settings
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { qk } from '../queryKeys'
import profileSettingsRepository from '../repositories/profileSettings'

export function useProfileSettings() {
  return useQuery({
    queryKey: qk.profileSettings(),
    queryFn: () => profileSettingsRepository.get(),
  })
}

export function useSaveProfileSettings() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (settings) => profileSettingsRepository.save(settings),
    onMutate: (settings) => {
      queryClient.setQueryData(qk.profileSettings(), settings)
    },
    onSuccess: (_data, settings) => {
      queryClient.setQueryData(qk.profileSettings(), settings)
      queryClient.invalidateQueries({ queryKey: qk.profileSettings() })
    },
  })
}

export function useClearProfileSettings() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => profileSettingsRepository.clear(),
    onMutate: () => {
      queryClient.setQueryData(qk.profileSettings(), null)
    },
    onSuccess: () => {
      queryClient.setQueryData(qk.profileSettings(), null)
      queryClient.invalidateQueries({ queryKey: qk.profileSettings() })
    },
  })
}
