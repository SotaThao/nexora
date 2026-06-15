/**
 * TanStack Query hooks for merchant settings.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { qk } from '../queryKeys'
import merchantSettingsRepository from '../repositories/merchantSettings'
import type { InviteLinkSettingDto } from '../../types/repositories'

export function useMerchantInviteLinkSetting({ enabled = true } = {}) {
  return useQuery<InviteLinkSettingDto>({
    queryKey: qk.merchantInviteLink(),
    queryFn: () => merchantSettingsRepository.getInviteLink(),
    enabled,
    retry: false,
  })
}

export function useUpdateMerchantInviteLinkSetting() {
  const queryClient = useQueryClient()

  return useMutation<InviteLinkSettingDto, Error, boolean>({
    mutationFn: (isEnabled) => merchantSettingsRepository.updateInviteLink(isEnabled),
    onSuccess: (data) => {
      queryClient.setQueryData(qk.merchantInviteLink(), data)
      queryClient.invalidateQueries({ queryKey: qk.merchantInviteLink() })
    },
  })
}
