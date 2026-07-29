import { useMutation, useQuery } from '@tanstack/react-query'
import { getApiErrorCode } from '../../types/domain'
import { qk } from '../queryKeys'
import {
  VoiceLeadSource,
  type CreateOnlineBookingRequest,
  type PublicBookingCreateResult,
  type PublicBookingPageData,
} from '../publicVoiceBooking/domain'
import publicVoiceBookingRepository from '../repositories/publicVoiceBooking'

export function usePublicBookingPageData(
  businessKey?: string | null,
  { enabled = true }: { enabled?: boolean } = {},
) {
  const key = String(businessKey ?? '').trim()
  return useQuery<PublicBookingPageData>({
    queryKey: qk.publicVoiceBookingPage(key),
    queryFn: () => publicVoiceBookingRepository.getBookingPageData(key),
    enabled: enabled && Boolean(key),
    retry: false,
    staleTime: 60_000,
  })
}

interface CreatePublicOnlineBookingVars {
  businessKey: string
  body: CreateOnlineBookingRequest
  source?: string
}

export function useCreatePublicOnlineBooking() {
  return useMutation<PublicBookingCreateResult, Error, CreatePublicOnlineBookingVars>({
    mutationFn: ({ businessKey, body, source = VoiceLeadSource.Web }) =>
      publicVoiceBookingRepository.createOnlineBooking(businessKey, body, source),
  })
}

export function getPublicBookingSubmitErrorCode(error: unknown): string {
  return getApiErrorCode(error, 'unknown_error')
}
