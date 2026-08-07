/**
 * TanStack Query hook for the POS tag catalog — autocomplete source for
 * Service/Product tag inputs (US-017).
 */
import { useContext } from 'react'
import { useQuery } from '@tanstack/react-query'
import { qk } from '../queryKeys'
import posTagsRepository from '../repositories/posTags'
import { AuthContext } from '../../auth/AuthContext'
import type { PosTagApiDto } from '../../types/repositories'

export function usePosTags() {
  const auth = useContext(AuthContext)
  const isOwner = auth?.status === 'authenticated' && auth?.session?.role === 'owner'
  return useQuery<PosTagApiDto[]>({
    queryKey: qk.merchantPosTags(),
    queryFn: () => posTagsRepository.getPosTags(),
    enabled: isOwner,
    retry: false,
  })
}
