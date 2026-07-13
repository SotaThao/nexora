/**
 * TanStack Query hooks for TaxIQ receipts: upload/link (Deduction Center wizard) plus
 * the full Receipt Vault list + duplicate resolution (US-05).
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { qk } from '../queryKeys'
import taxiqReceiptsRepository from '../repositories/taxiqReceipts'
import type {
  DuplicateResolution,
  ReceiptVaultItem,
  ReceiptVaultListParams,
  UploadReceiptParams,
} from '../repositories/taxiqReceipts'

function invalidateReceiptRelatedCaches(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: qk.taxiqReceipts() })
  queryClient.invalidateQueries({ queryKey: qk.taxiqOwnerDeductions() })
  queryClient.invalidateQueries({ queryKey: qk.taxiqStaffDeductions() })
  // qk.taxiqSelfReportedIncome() pads with a literal 'unknown' fallback rather than acting
  // as a broad prefix (unlike the deductions key builders above) — invalidate by the raw
  // 'taxiqSelfReportedIncome' prefix instead so it matches every cached staffTaxYearId.
  queryClient.invalidateQueries({ queryKey: ['taxiqSelfReportedIncome'] })
}

export function useTaxiqReceipts(params: ReceiptVaultListParams | undefined) {
  return useQuery<ReceiptVaultItem[]>({
    queryKey: qk.taxiqReceipts(params?.ownerTaxYearId, params?.staffTaxYearId),
    queryFn: () => taxiqReceiptsRepository.list(params as ReceiptVaultListParams),
    enabled: !!(params?.ownerTaxYearId || params?.staffTaxYearId),
  })
}

export function useUploadTaxiqReceipt() {
  const queryClient = useQueryClient()
  return useMutation<string, Error, UploadReceiptParams & { file: File }>({
    mutationFn: ({ file, ...params }) => taxiqReceiptsRepository.upload(params, file),
    onSuccess: () => invalidateReceiptRelatedCaches(queryClient),
  })
}

export function useLinkTaxiqReceiptToDeduction() {
  const queryClient = useQueryClient()
  return useMutation<void, Error, { receiptId: string; deductionRecordId: string }>({
    mutationFn: ({ receiptId, deductionRecordId }) =>
      taxiqReceiptsRepository.linkToDeduction(receiptId, deductionRecordId),
    onSuccess: () => invalidateReceiptRelatedCaches(queryClient),
  })
}

export function useResolveTaxiqReceiptDuplicate() {
  const queryClient = useQueryClient()
  return useMutation<
    void,
    Error,
    { receiptId: string; resolution: DuplicateResolution; mergeTargetReceiptId?: string }
  >({
    mutationFn: ({ receiptId, resolution, mergeTargetReceiptId }) =>
      taxiqReceiptsRepository.resolveDuplicate(receiptId, resolution, mergeTargetReceiptId),
    onSuccess: () => invalidateReceiptRelatedCaches(queryClient),
  })
}

export function useDeleteTaxiqReceipt() {
  const queryClient = useQueryClient()
  return useMutation<void, Error, string>({
    mutationFn: (receiptId) => taxiqReceiptsRepository.remove(receiptId),
    onSuccess: () => invalidateReceiptRelatedCaches(queryClient),
  })
}
