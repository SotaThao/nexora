/**
 * TanStack Query hooks for TaxIQ Staff Self-Reported Income (US-13).
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { qk } from '../queryKeys'
import taxiqSelfReportedIncomeRepository from '../repositories/taxiqSelfReportedIncome'
import type {
  CreateSelfReportedIncomeParams,
  SelfReportedIncomeFields,
  SelfReportedIncomeRecord,
} from '../repositories/taxiqSelfReportedIncome'

export function useTaxiqSelfReportedIncomeList(staffTaxYearId?: string) {
  return useQuery<SelfReportedIncomeRecord[]>({
    queryKey: qk.taxiqSelfReportedIncome(staffTaxYearId),
    queryFn: () => taxiqSelfReportedIncomeRepository.list(staffTaxYearId as string),
    enabled: !!staffTaxYearId,
  })
}

export function useTaxiqSelfReportedIncomeDetail(id?: string) {
  return useQuery<SelfReportedIncomeRecord>({
    queryKey: qk.taxiqSelfReportedIncomeDetail(id),
    queryFn: () => taxiqSelfReportedIncomeRepository.getDetail(id as string),
    enabled: !!id,
  })
}

// US-13 DoD: Delete/Edit/Create/Link-receipt must invalidate both the list and the
// StaffTaxYear dashboard cache (`taxiqStaffTaxYearById`) so Gross Income on Staff Home
// updates without a manual refresh.
function invalidateAfterMutation(
  queryClient: ReturnType<typeof useQueryClient>,
  staffTaxYearId: string | undefined,
) {
  queryClient.invalidateQueries({ queryKey: qk.taxiqSelfReportedIncome(staffTaxYearId) })
  if (staffTaxYearId) {
    queryClient.invalidateQueries({ queryKey: qk.taxiqStaffTaxYearById(staffTaxYearId) })
  }
}

export function useCreateSelfReportedIncome() {
  const queryClient = useQueryClient()
  return useMutation<string, Error, CreateSelfReportedIncomeParams>({
    mutationFn: (params) => taxiqSelfReportedIncomeRepository.create(params),
    onSuccess: (_data, variables) => invalidateAfterMutation(queryClient, variables.staffTaxYearId),
  })
}

export function useUpdateSelfReportedIncome() {
  const queryClient = useQueryClient()
  return useMutation<void, Error, { id: string; staffTaxYearId: string } & SelfReportedIncomeFields>({
    mutationFn: ({ id, staffTaxYearId: _staffTaxYearId, ...params }) =>
      taxiqSelfReportedIncomeRepository.update(id, params),
    onSuccess: (_data, variables) => invalidateAfterMutation(queryClient, variables.staffTaxYearId),
  })
}

export function useDeleteSelfReportedIncome() {
  const queryClient = useQueryClient()
  return useMutation<void, Error, { id: string; staffTaxYearId: string }>({
    mutationFn: ({ id }) => taxiqSelfReportedIncomeRepository.remove(id),
    onSuccess: (_data, variables) => invalidateAfterMutation(queryClient, variables.staffTaxYearId),
  })
}

export function useLinkReceiptToSelfReportedIncome() {
  const queryClient = useQueryClient()
  return useMutation<void, Error, { id: string; staffTaxYearId: string; receiptId: string }>({
    mutationFn: ({ id, receiptId }) => taxiqSelfReportedIncomeRepository.linkReceipt(id, receiptId),
    onSuccess: (_data, variables) => invalidateAfterMutation(queryClient, variables.staffTaxYearId),
  })
}
