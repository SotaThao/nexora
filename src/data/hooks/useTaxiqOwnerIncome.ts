/**
 * TanStack Query hooks for TaxIQ Owner Income Summary (US-014).
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { qk } from '../queryKeys'
import taxiqOwnerIncomeRepository from '../repositories/taxiqOwnerIncome'
import type {
  CreateOwnerIncomeParams,
  OwnerIncomeFields,
  OwnerIncomeRecord,
} from '../repositories/taxiqOwnerIncome'

export function useTaxiqOwnerIncomeList(ownerTaxYearId?: string) {
  return useQuery<OwnerIncomeRecord[]>({
    queryKey: qk.taxiqOwnerIncome(ownerTaxYearId),
    queryFn: () => taxiqOwnerIncomeRepository.list(ownerTaxYearId as string),
    enabled: !!ownerTaxYearId,
  })
}

export function useTaxiqOwnerIncomeDetail(id?: string) {
  return useQuery<OwnerIncomeRecord>({
    queryKey: qk.taxiqOwnerIncomeDetail(id),
    queryFn: () => taxiqOwnerIncomeRepository.getDetail(id as string),
    enabled: !!id,
  })
}

function invalidateAfterMutation(
  queryClient: ReturnType<typeof useQueryClient>,
  ownerTaxYearId: string | undefined,
) {
  queryClient.invalidateQueries({ queryKey: qk.taxiqOwnerIncome(ownerTaxYearId) })
}

export function useCreateOwnerIncome() {
  const queryClient = useQueryClient()
  return useMutation<string, Error, CreateOwnerIncomeParams>({
    mutationFn: (params) => taxiqOwnerIncomeRepository.create(params),
    onSuccess: (_data, variables) => invalidateAfterMutation(queryClient, variables.ownerTaxYearId),
  })
}

export function useUpdateOwnerIncome() {
  const queryClient = useQueryClient()
  return useMutation<void, Error, { id: string; ownerTaxYearId: string } & OwnerIncomeFields>({
    mutationFn: ({ id, ownerTaxYearId: _ownerTaxYearId, ...params }) =>
      taxiqOwnerIncomeRepository.update(id, params),
    onSuccess: (_data, variables) => invalidateAfterMutation(queryClient, variables.ownerTaxYearId),
  })
}

export function useDeleteOwnerIncome() {
  const queryClient = useQueryClient()
  return useMutation<void, Error, { id: string; ownerTaxYearId: string }>({
    mutationFn: ({ id }) => taxiqOwnerIncomeRepository.remove(id),
    onSuccess: (_data, variables) => invalidateAfterMutation(queryClient, variables.ownerTaxYearId),
  })
}

export function useLinkReceiptToOwnerIncome() {
  const queryClient = useQueryClient()
  return useMutation<void, Error, { id: string; ownerTaxYearId: string; receiptId: string }>({
    mutationFn: ({ id, receiptId }) => taxiqOwnerIncomeRepository.linkReceipt(id, receiptId),
    onSuccess: (_data, variables) => invalidateAfterMutation(queryClient, variables.ownerTaxYearId),
  })
}
