// TanStack Query Hook for Public Site — US-107
import { useQuery } from '@tanstack/react-query'
import { PublicSiteDto } from '../../constants/merchantSiteStatus'
import { publicSiteRepository } from '../repositories/publicSite'
import { qk } from '../queryKeys'

export function usePublicSiteQuery(slug: string | undefined | null) {
  return useQuery<PublicSiteDto | null>({
    queryKey: qk.publicSite(slug ?? ''),
    queryFn: () => (slug ? publicSiteRepository.getPublicSite(slug) : null),
    enabled: Boolean(slug),
    staleTime: 60_000,
  })
}
