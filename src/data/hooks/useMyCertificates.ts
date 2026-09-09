/**
 * TanStack Query hook for the signed-in account's own certificates.
 *
 * `retry: false` because the endpoint this calls is not deployed yet (see myCertificates.ts): a
 * 404 stays a 404, and retrying only delays the empty state.
 */
import { useQuery } from '@tanstack/react-query'
import { qk } from '../queryKeys'
import { useSessionRole } from '../../auth/useSessionRole'
import myCertificatesRepository from '../repositories/myCertificates'
import type { CertificateVerificationApiDto } from '../../types/repositories'

export function useMyCertificates() {
  const { isAuthenticated } = useSessionRole()
  return useQuery<CertificateVerificationApiDto[]>({
    queryKey: qk.myCertificates(),
    queryFn: () => myCertificatesRepository.listMyCertificates(),
    enabled: isAuthenticated,
    retry: false,
    staleTime: 5 * 60 * 1000,
  })
}
