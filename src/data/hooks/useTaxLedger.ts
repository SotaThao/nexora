/**
 * TanStack Query hooks for TaxIQ Tax Ledger (mục 16, backend US-27/28/29).
 */
import { useContext } from 'react'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { qk } from '../queryKeys'
import taxLedgerRepository, {
  type TaxLedgerListPage,
  type TaxLedgerListQuery,
  type VerifyTaxLedgerEntryResult,
} from '../repositories/taxLedger'
import { AuthContext } from '../../auth/AuthContext'

export function useTaxLedger(businessId: string | undefined, query: TaxLedgerListQuery = {}) {
  const auth = useContext(AuthContext)
  const isOwner = auth?.status === 'authenticated' && auth?.session?.role === 'owner'
  return useQuery<TaxLedgerListPage>({
    queryKey: qk.taxiqTaxLedger(businessId, query),
    queryFn: () => taxLedgerRepository.listTaxLedger(query),
    enabled: isOwner && !!businessId && !!query.employerId,
    placeholderData: keepPreviousData,
  })
}

export function useVerifyTaxLedgerEntry(businessId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation<VerifyTaxLedgerEntryResult, Error, string>({
    mutationFn: (id) => taxLedgerRepository.verifyEntry(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.taxiqTaxLedger(businessId) })
    },
  })
}
