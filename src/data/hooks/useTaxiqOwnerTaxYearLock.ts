/**
 * TanStack Query hooks for TaxIQ Owner Lock Tax Year + Adjustment Records (US-06).
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { qk } from '../queryKeys'
import taxiqOwnerAdjustmentsRepository from '../repositories/taxiqOwnerAdjustments'
import type { AdjustmentRecord, CreateAdjustmentParams, LockTaxYearParams } from '../repositories/taxiqOwnerAdjustments'

export function useLockOwnerTaxYear() {
  const queryClient = useQueryClient()
  return useMutation<void, Error, { ownerTaxYearId: string } & LockTaxYearParams>({
    mutationFn: ({ ownerTaxYearId, ...params }) => taxiqOwnerAdjustmentsRepository.lock(ownerTaxYearId, params),
    onSuccess: (_data, variables) => {
      // Lock endpoint returns 204 with no body — refetch OwnerTaxYear so
      // status/lockedAt propagate to every screen reading it (DoD requirement).
      queryClient.invalidateQueries({ queryKey: qk.taxiqOwnerTaxYear() })
      queryClient.invalidateQueries({ queryKey: qk.taxiqOwnerTaxYearById(variables.ownerTaxYearId) })
    },
  })
}

export function useOwnerAdjustments(ownerTaxYearId?: string | null) {
  return useQuery<AdjustmentRecord[]>({
    queryKey: qk.taxiqOwnerAdjustments(ownerTaxYearId ?? undefined),
    queryFn: () => taxiqOwnerAdjustmentsRepository.listAdjustments(ownerTaxYearId as string),
    enabled: !!ownerTaxYearId,
  })
}

export function useCreateOwnerAdjustment() {
  const queryClient = useQueryClient()
  return useMutation<string, Error, { ownerTaxYearId: string } & CreateAdjustmentParams>({
    mutationFn: ({ ownerTaxYearId, ...params }) =>
      taxiqOwnerAdjustmentsRepository.createAdjustment(ownerTaxYearId, params),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: qk.taxiqOwnerAdjustments(variables.ownerTaxYearId) })
    },
  })
}
