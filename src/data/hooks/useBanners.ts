/**
 * useBanners — TanStack Query hook for public homepage banners.
 */
import { useQuery } from '@tanstack/react-query'
import { qk } from '../queryKeys'
import bannersRepository from '../repositories/banners'
import type { Banner } from '../../types/domain'

export function useActiveBanners({ enabled = true } = {}) {
  return useQuery<Banner[]>({
    queryKey: qk.activeBanners(),
    queryFn: () => bannersRepository.listActive(),
    enabled,
    staleTime: 2 * 60_000,
  })
}
