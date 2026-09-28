import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { qk } from '../queryKeys'
import posSmsSettingsRepository from '../repositories/posSmsSettings'
import { useSessionRole } from '../../auth/useSessionRole'
import { PosSmsTemplateType } from '../../constants/posSmsSettings'
import type {
  PosSmsSettingsApiDto,
  PosSmsTestResultApiDto,
  SendPosSmsTestRequest,
  UpdatePosSmsMessageSettingsRequest,
} from '../../types/posSms'

export function usePosSmsSettings(businessId?: string) {
  const { isAuthenticated } = useSessionRole()
  return useQuery<PosSmsSettingsApiDto>({
    queryKey: qk.merchantPosSmsSettings(businessId),
    queryFn: () => posSmsSettingsRepository.getSettings(businessId as string),
    enabled: isAuthenticated && Boolean(businessId),
    retry: false,
  })
}

export function useUpdatePosSmsMessageSettings(businessId: string | undefined, type: PosSmsTemplateType) {
  const queryClient = useQueryClient()
  return useMutation<boolean, Error, UpdatePosSmsMessageSettingsRequest>({
    mutationFn: (payload) =>
      type === PosSmsTemplateType.Welcome
        ? posSmsSettingsRepository.updateWelcome(businessId as string, payload)
        : posSmsSettingsRepository.updateAfterCheckout(businessId as string, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.merchantPosSmsSettings(businessId) })
    },
  })
}

export function useUpdatePosSmsLinkSettings(businessId?: string) {
  const queryClient = useQueryClient()
  return useMutation<boolean, Error, number>({
    mutationFn: (visitLinkTtlDays) =>
      posSmsSettingsRepository.updateLinkSettings(businessId as string, visitLinkTtlDays),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.merchantPosSmsSettings(businessId) })
    },
  })
}

export function useSendPosSmsTest(businessId?: string) {
  return useMutation<PosSmsTestResultApiDto, Error, SendPosSmsTestRequest>({
    mutationFn: (payload) => posSmsSettingsRepository.sendTest(businessId as string, payload),
  })
}
