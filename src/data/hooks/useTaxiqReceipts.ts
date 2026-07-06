/**
 * TanStack Query hooks for TaxIQ receipt upload + link (Deduction Center wizard only).
 * See openspec/changes/integrate-taxiq-owner-deductions/design.md D6.
 */
import { useMutation } from '@tanstack/react-query'
import taxiqReceiptsRepository from '../repositories/taxiqReceipts'

export function useUploadTaxiqReceipt() {
  return useMutation<string, Error, { ownerTaxYearId: string; file: File }>({
    mutationFn: ({ ownerTaxYearId, file }) => taxiqReceiptsRepository.upload(ownerTaxYearId, file),
  })
}

export function useLinkTaxiqReceiptToDeduction() {
  return useMutation<void, Error, { receiptId: string; deductionRecordId: string }>({
    mutationFn: ({ receiptId, deductionRecordId }) =>
      taxiqReceiptsRepository.linkToDeduction(receiptId, deductionRecordId),
  })
}
