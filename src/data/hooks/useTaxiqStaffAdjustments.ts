/**
 * TanStack Query hooks for TaxIQ Staff Adjustment Records (US-013).
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { qk } from '../queryKeys'
import taxiqStaffAdjustmentsRepository from '../repositories/taxiqStaffAdjustments'
import type { AdjustmentRecord, CreateAdjustmentParams } from '../repositories/taxiqOwnerAdjustments'

export function useStaffAdjustments(staffTaxYearId?: string | null) {
  return useQuery<AdjustmentRecord[]>({
    queryKey: qk.taxiqStaffAdjustments(staffTaxYearId ?? undefined),
    queryFn: () => taxiqStaffAdjustmentsRepository.listAdjustments(staffTaxYearId as string),
    enabled: !!staffTaxYearId,
  })
}

export function useCreateStaffAdjustment() {
  const queryClient = useQueryClient()
  return useMutation<string, Error, { staffTaxYearId: string } & CreateAdjustmentParams>({
    mutationFn: ({ staffTaxYearId, ...params }) =>
      taxiqStaffAdjustmentsRepository.createAdjustment(staffTaxYearId, params),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: qk.taxiqStaffAdjustments(variables.staffTaxYearId) })
    },
  })
}
