import { useQuery } from '@tanstack/react-query'
import { qk } from '../queryKeys'
import publicPosVisitRepository from '../repositories/publicPosVisit'
import type { PosVisitLandingApiDto } from '../../types/posSms'

export function usePublicPosVisit(token?: string) {
  return useQuery<PosVisitLandingApiDto>({
    queryKey: qk.publicPosVisit(token),
    queryFn: () => publicPosVisitRepository.getVisit(token as string),
    enabled: Boolean(token),
    retry: false,
  })
}
