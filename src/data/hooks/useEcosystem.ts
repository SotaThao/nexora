/**
 * useEcosystem — TanStack Query hooks for ecosystem list + SSO sign-in.
 */
import { useMutation, useQuery } from '@tanstack/react-query'
import { qk } from '../queryKeys'
import ecosystemRepository from '../repositories/ecosystem'
import type { EcosystemItem, EcosystemSignInResult } from '../../types/domain'

export function useEcosystems({ enabled = true } = {}) {
  return useQuery<EcosystemItem[]>({
    queryKey: qk.ecosystems(),
    queryFn: () => ecosystemRepository.list(),
    enabled,
    staleTime: 5 * 60_000,
  })
}

export function useEcosystemSignIn() {
  return useMutation<
    EcosystemSignInResult,
    Error,
    { name: string; path?: string | null }
  >({
    mutationFn: (params) => ecosystemRepository.signIn(params),
  })
}
