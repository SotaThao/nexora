import { useQuery } from '@tanstack/react-query'
import { qk } from '../queryKeys'
import { voiceTrialRepository } from '../repositories/voiceTrial'
import { isApiError } from '../../types/domain'
import type { VoiceTrialRequestDetailDto } from '../voiceTrial/domain'

export function useMyVoiceTrialRequest({ enabled = true } = {}) {
  return useQuery<VoiceTrialRequestDetailDto | null>({
    queryKey: qk.voiceTrialRequestMe(),
    queryFn: () => voiceTrialRepository.getMyTrialRequest(),
    enabled,
    retry: (failureCount, error) => {
      if (isApiError(error) && error.status === 404) return false
      return failureCount < 3
    },
  })
}
