import httpClient from '../../lib/httpClient'
import { isApiError } from '../../types/domain'
import type {
  SubmitVoiceTrialRequest,
  SubmitVoiceTrialRequestResponse,
  VoiceTrialRequestDetailDto,
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

    async getMyTrialRequest(): Promise<VoiceTrialRequestDetailDto | null> {
      try {
        return await client.get<VoiceTrialRequestDetailDto>(
          '/api/v1/nexora-voice/trial-requests/me',
          { headers: VOICE_TRIAL_HEADERS },
        )
      } catch (err: unknown) {
        if (isApiError(err) && err.status === 404) return null
        throw err
      }
    },
  }
}

export const voiceTrialRepository = createVoiceTrialRepository()
export default voiceTrialRepository
