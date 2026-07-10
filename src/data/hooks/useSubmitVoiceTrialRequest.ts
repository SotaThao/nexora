import { useMutation } from '@tanstack/react-query'
import type { SubmitVoiceTrialRequest } from '../voiceTrial/domain'
import { voiceTrialRepository } from '../repositories/voiceTrial'

export function useSubmitVoiceTrialRequest() {
  return useMutation({
    mutationFn: (body: SubmitVoiceTrialRequest) => voiceTrialRepository.submitTrialRequest(body),
  })
}
