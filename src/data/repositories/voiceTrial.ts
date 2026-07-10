import httpClient from '../../lib/httpClient'
import type {
  SubmitVoiceTrialRequest,
  SubmitVoiceTrialRequestResponse,
} from '../voiceTrial/domain'

type HttpClient = typeof httpClient

const VOICE_TRIAL_HEADERS = {
  'x-api-version': '1',
  'x-app-source': 'WebPortal',
}

export function createVoiceTrialRepository(client: HttpClient = httpClient) {
  return {
    async submitTrialRequest(body: SubmitVoiceTrialRequest): Promise<SubmitVoiceTrialRequestResponse> {
      const result = await client.post<SubmitVoiceTrialRequestResponse>(
        '/api/v1/nexora-voice/trial-requests',
        body,
        {
          anonymous: true,
          headers: VOICE_TRIAL_HEADERS,
        },
      )
      if (!result) {
        throw new Error('voiceTrialRepository.submitTrialRequest: empty response')
      }
      return result
    },
  }
}

export const voiceTrialRepository = createVoiceTrialRepository()
export default voiceTrialRepository
