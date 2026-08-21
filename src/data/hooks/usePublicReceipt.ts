/**
 * TanStack Query hook for the public receipt page. Anonymous — no session gating.
 */
import { useQuery } from '@tanstack/react-query'
import { qk } from '../queryKeys'
import publicReceiptRepository from '../repositories/publicReceipt'
import type { ReceiptApiDto } from '../../types/repositories'

export function usePublicReceipt(receiptToken?: string) {
  return useQuery<ReceiptApiDto>({
    queryKey: qk.publicReceipt(receiptToken),
    queryFn: () => publicReceiptRepository.getReceipt(receiptToken as string),
    enabled: Boolean(receiptToken),
    // A wrong token is a 404 that will stay a 404 — retrying only delays the "not found" screen.
    retry: false,
  })
}
