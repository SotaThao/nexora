import { useMutation, useQueryClient } from '@tanstack/react-query'
import { qk } from '../queryKeys'
import type { SubmitVoiceTrialRequest } from '../voiceTrial/domain'
import { voiceTrialRepository } from '../repositories/voiceTrial'

export function useSubmitVoiceTrialRequest() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (body: SubmitVoiceTrialRequest) => voiceTrialRepository.submitTrialRequest(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.voiceTrialRequestMe() })
    },
  })
}
