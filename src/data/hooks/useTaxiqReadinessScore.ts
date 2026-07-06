/**
 * TanStack Query hook for the shared Tax Readiness Score widget (Owner + Staff).
 */
import { useQuery } from '@tanstack/react-query'
import { qk } from '../queryKeys'
import taxiqReadinessScoreRepository from '../repositories/taxiqReadinessScore'
import type { TaxReadinessScope, TaxReadinessScore } from '../repositories/taxiqReadinessScore'

export function useTaxiqReadinessScore(scope: TaxReadinessScope | undefined, taxYearId: string | undefined) {
  return useQuery<TaxReadinessScore>({
    queryKey: qk.taxiqReadinessScore(scope, taxYearId),
    queryFn: () => taxiqReadinessScoreRepository.get(scope as TaxReadinessScope, taxYearId as string),
    enabled: !!scope && !!taxYearId,
  })
}
