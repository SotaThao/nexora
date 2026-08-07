/**
 * TanStack Query hooks for TaxIQ Staff 1099-K Reconciliation (US-018).
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { qk } from '../queryKeys'
import taxiqForm1099KRepository from '../repositories/taxiqForm1099K'
import type { Form1099KReconciliationRecord, UpsertForm1099KAmountParams } from '../repositories/taxiqForm1099K'

export function useTaxiqForm1099KReconciliation(staffTaxYearId?: string) {
  return useQuery<Form1099KReconciliationRecord[]>({
    queryKey: qk.taxiqForm1099KReconciliation(staffTaxYearId),
    queryFn: () => taxiqForm1099KRepository.listReconciliation(staffTaxYearId as string),
    enabled: !!staffTaxYearId,
  })
}

export function useUpsertForm1099KAmount() {
  const queryClient = useQueryClient()
  return useMutation<string, Error, UpsertForm1099KAmountParams>({
    mutationFn: (params) => taxiqForm1099KRepository.upsert(params),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: qk.taxiqForm1099KReconciliation(variables.staffTaxYearId) })
      queryClient.invalidateQueries({ queryKey: qk.taxiqSelfReportedIncome(variables.staffTaxYearId) })
    },
  })
}
