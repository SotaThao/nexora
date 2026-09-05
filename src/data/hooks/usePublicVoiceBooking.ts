import { useMutation, useQuery } from '@tanstack/react-query'
import { getApiErrorCode, isApiError } from '../../types/domain'
import { qk } from '../queryKeys'
import {
  VoiceLeadSource,
  toPublicBookingApiPhone,
  type CreateOnlineBookingRequest,
  type PublicBookingCreateResult,
  type PublicBookingPageData,
} from '../publicVoiceBooking/domain'
import publicVoiceBookingRepository from '../repositories/publicVoiceBooking'

export function usePublicBookingPageData(
  businessKey?: string | null,
  phone?: string | null,
  { enabled = true }: { enabled?: boolean } = {},
) {
  const key = String(businessKey ?? '').trim()
  const phoneParam = toPublicBookingApiPhone(phone) || null
  return useQuery<PublicBookingPageData>({
    queryKey: qk.publicVoiceBookingPage(key, phoneParam),
    queryFn: () => publicVoiceBookingRepository.getBookingPageData(key, phoneParam),
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

/** The backend's own message (errorDetail/detail/title), for codes with no localized copy. */
export function getPublicBookingSubmitErrorDetail(error: unknown): string {
  return isApiError(error) ? String(error.message ?? '').trim() : ''
}
