import { useQuery } from '@tanstack/react-query'
import { qk } from '../queryKeys'
import publicServicesRepository from '../repositories/publicServices'

export function usePublicServices(businessSlug?: string) {
  return useQuery({
    queryKey: qk.publicServices(businessSlug),
    queryFn: () => publicServicesRepository.getMenu(businessSlug as string),
    enabled: Boolean(businessSlug),
    retry: false,
    staleTime: 60_000,
  })
}
