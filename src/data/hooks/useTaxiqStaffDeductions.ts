/**
 * TanStack Query hooks for the TaxIQ Staff Deduction Center (US-11).
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { qk } from '../queryKeys'
import taxiqStaffDeductionsRepository from '../repositories/taxiqStaffDeductions'
import type {
  CreateStaffDeductionParams,
  StaffDeductionListPage,
  StaffDeductionListParams,
  UpdateStaffDeductionParams,
} from '../repositories/taxiqStaffDeductions'

export function useTaxiqStaffDeductions(params: StaffDeductionListParams | undefined) {
  return useQuery<StaffDeductionListPage>({
    queryKey: qk.taxiqStaffDeductions(params?.staffTaxYearId, params?.recordStatus, params?.categoryId),
    queryFn: () => taxiqStaffDeductionsRepository.list(params as StaffDeductionListParams),
    enabled: !!params?.staffTaxYearId,
  })
}

function invalidateStaffDeductionList(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: qk.taxiqStaffDeductions() })
}

export function useCreateStaffDeduction() {
  const queryClient = useQueryClient()
  return useMutation<string, Error, CreateStaffDeductionParams>({
    mutationFn: (params) => taxiqStaffDeductionsRepository.create(params),
    onSuccess: () => invalidateStaffDeductionList(queryClient),
  })
}

export function useUpdateStaffDeduction() {
  const queryClient = useQueryClient()
  return useMutation<void, Error, { id: string } & UpdateStaffDeductionParams>({
    mutationFn: ({ id, ...params }) => taxiqStaffDeductionsRepository.update(id, params),
    onSuccess: () => invalidateStaffDeductionList(queryClient),
  })
}

export function useSubmitStaffDeduction() {
  const queryClient = useQueryClient()
  return useMutation<void, Error, string>({
    mutationFn: (id) => taxiqStaffDeductionsRepository.submit(id),
    onSuccess: () => invalidateStaffDeductionList(queryClient),
  })
}

export function useDeleteStaffDeduction() {
  const queryClient = useQueryClient()
  return useMutation<void, Error, string>({
    mutationFn: (id) => taxiqStaffDeductionsRepository.remove(id),
    onSuccess: () => invalidateStaffDeductionList(queryClient),
  })
}
