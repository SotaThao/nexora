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
