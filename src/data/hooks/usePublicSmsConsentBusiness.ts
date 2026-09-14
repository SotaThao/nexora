import { useQuery } from '@tanstack/react-query'
import { qk } from '../queryKeys'
import publicBusinessesRepository from '../repositories/publicBusinesses'
import type { SmsConsentBusinessDto } from '../../types/repositories'

export function usePublicSmsConsentBusiness(businessSlug?: string) {
  return useQuery<SmsConsentBusinessDto>({
    queryKey: qk.publicSmsConsentBusiness(businessSlug),
    queryFn: () => publicBusinessesRepository.getSmsConsentBusiness(businessSlug as string),
    enabled: Boolean(businessSlug),
    retry: false,
  })
}
