/**
 * TanStack Query hooks for the TaxIQ Owner Deduction Center.
 * See openspec/changes/integrate-taxiq-owner-deductions/design.md.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { qk } from '../queryKeys'
import taxiqOwnerDeductionsRepository from '../repositories/taxiqOwnerDeductions'
import type {
  ConfirmedDeductionResult,
  ConfirmReceiptLineItemsParams,
  CreateDeductionParams,
  DeductionListPage,
  DeductionListParams,
  ReceiptAnalysisResult,
  UpdateDeductionParams,
} from '../repositories/taxiqOwnerDeductions'

export function useTaxiqOwnerDeductions(params: DeductionListParams | undefined) {
  return useQuery<DeductionListPage>({
    queryKey: qk.taxiqOwnerDeductions(params?.ownerTaxYearId, params?.recordStatus, params?.categoryId),
    queryFn: () => taxiqOwnerDeductionsRepository.list(params as DeductionListParams),
    enabled: !!params?.ownerTaxYearId,
  })
}

function invalidateDeductionList(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: qk.taxiqOwnerDeductions() })
}

export function useCreateOwnerDeduction() {
  const queryClient = useQueryClient()
  return useMutation<string, Error, CreateDeductionParams>({
    mutationFn: (params) => taxiqOwnerDeductionsRepository.create(params),
    onSuccess: () => invalidateDeductionList(queryClient),
  })
}

export function useUpdateOwnerDeduction() {
  const queryClient = useQueryClient()
  return useMutation<void, Error, { id: string } & UpdateDeductionParams>({
    mutationFn: ({ id, ...params }) => taxiqOwnerDeductionsRepository.update(id, params),
    onSuccess: () => invalidateDeductionList(queryClient),
  })
}

export function useSubmitOwnerDeduction() {
  const queryClient = useQueryClient()
  return useMutation<void, Error, string>({
    mutationFn: (id) => taxiqOwnerDeductionsRepository.submit(id),
    onSuccess: () => invalidateDeductionList(queryClient),
  })
}

export function useDeleteOwnerDeduction() {
  const queryClient = useQueryClient()
  return useMutation<void, Error, string>({
    mutationFn: (id) => taxiqOwnerDeductionsRepository.remove(id),
    onSuccess: () => invalidateDeductionList(queryClient),
  })
}

export function useReanalyzeOwnerDeduction() {
  const queryClient = useQueryClient()
  return useMutation<void, Error, string>({
    mutationFn: (id) => taxiqOwnerDeductionsRepository.reanalyze(id),
    onSuccess: () => invalidateDeductionList(queryClient),
  })
}

export function useApproveCpaReviewDeduction() {
  const queryClient = useQueryClient()
  return useMutation<void, Error, string>({
    mutationFn: (id) => taxiqOwnerDeductionsRepository.approveCpa(id),
    onSuccess: () => invalidateDeductionList(queryClient),
  })
}

export function useAnalyzeReceiptLineItems() {
  return useMutation<ReceiptAnalysisResult, Error, { ownerTaxYearId: string; file: File }>({
    mutationFn: ({ ownerTaxYearId, file }) =>
      taxiqOwnerDeductionsRepository.analyzeReceipt(ownerTaxYearId, file),
  })
}

export function useConfirmReceiptLineItems() {
  const queryClient = useQueryClient()
  return useMutation<{ items: ConfirmedDeductionResult[] }, Error, ConfirmReceiptLineItemsParams>({
    mutationFn: (params) => taxiqOwnerDeductionsRepository.confirmReceiptLineItems(params),
    onSuccess: () => invalidateDeductionList(queryClient),
  })
}
