/**
 * TanStack Query hook for the public certificate verify page. Anonymous — no session gating.
 */
import { useQuery } from '@tanstack/react-query'
import { qk } from '../queryKeys'
import publicCertificateRepository from '../repositories/publicCertificate'
import type { CertificateVerificationApiDto } from '../../types/repositories'

export function usePublicCertificate(certificateId?: string) {
  return useQuery<CertificateVerificationApiDto>({
    queryKey: qk.publicCertificate(certificateId),
    queryFn: () => publicCertificateRepository.verifyCertificate(certificateId as string),
    enabled: Boolean(certificateId),
    // A code that does not exist is a 404 that stays a 404, and the endpoint allows only 10
    // requests a minute per IP — retrying would burn that budget and turn a clean "not found"
    // into a rate-limit screen.
    retry: false,
    // A certificate's status changes only when an admin revokes or reinstates it, so a verified
    // answer stays good for the length of a visit. Keeping it fresh also means going Back to a
    // certificate does not spend another request against the rate limit.
    staleTime: 5 * 60 * 1000,
  })
}
