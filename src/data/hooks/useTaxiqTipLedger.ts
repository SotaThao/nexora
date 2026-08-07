/**
 * TanStack Query hooks for Tip Ledger (mục 26) — owner and staff share the same query key
 * (scoped by staffTaxYearId) since both views read the exact same summary shape.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { qk } from '../queryKeys'
import taxiqTipLedgerRepository from '../repositories/taxiqTipLedger'
import type {
  AddTipLedgerEntryAsStaffParams,
  AddTipLedgerEntryParams,
  EditTipLedgerEntryParams,
  ExportTipLedgerForCpaParams,
  TipLedgerFilters,
  TipLedgerSummary,
} from '../repositories/taxiqTipLedger'
import type { ShareLink } from '../repositories/taxiqShareLinks'

export function useTipLedgerSummary(staffTaxYearId?: string, filters?: TipLedgerFilters, scope: 'owner' | 'staff' = 'owner') {
  return useQuery<TipLedgerSummary>({
    queryKey: [...qk.taxiqTipLedger(staffTaxYearId), scope, filters ?? {}],
    queryFn: () =>
      scope === 'owner'
        ? taxiqTipLedgerRepository.getOwnerSummary(staffTaxYearId as string, filters)
        : taxiqTipLedgerRepository.getStaffSummary(staffTaxYearId as string, filters),
    enabled: !!staffTaxYearId,
  })
}

export function useAddTipLedgerEntry() {
  const queryClient = useQueryClient()
  return useMutation<string, Error, AddTipLedgerEntryParams>({
    mutationFn: (params) => taxiqTipLedgerRepository.addTipAsOwner(params),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: qk.taxiqTipLedger(variables.staffTaxYearId) })
    },
  })
}

export function useAddTipLedgerEntryAsStaff() {
  const queryClient = useQueryClient()
  return useMutation<string, Error, AddTipLedgerEntryAsStaffParams>({
    mutationFn: (params) => taxiqTipLedgerRepository.addTipAsStaff(params),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: qk.taxiqTipLedger(variables.staffTaxYearId) })
    },
  })
}

export function useEditTipLedgerEntry(staffTaxYearId?: string) {
  const queryClient = useQueryClient()
  return useMutation<void, Error, { id: string; params: EditTipLedgerEntryParams }>({
    mutationFn: ({ id, params }) => taxiqTipLedgerRepository.editTip(id, params),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qk.taxiqTipLedger(staffTaxYearId) }),
  })
}

export function useDeleteTipLedgerEntry(staffTaxYearId?: string) {
  const queryClient = useQueryClient()
  return useMutation<void, Error, { id: string; deleteReason: string }>({
    mutationFn: ({ id, deleteReason }) => taxiqTipLedgerRepository.deleteTip(id, deleteReason),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qk.taxiqTipLedger(staffTaxYearId) }),
  })
}

export function useExportTipLedgerForCpa() {
  return useMutation<ShareLink, Error, { staffTaxYearId: string; params: ExportTipLedgerForCpaParams }>({
    mutationFn: ({ staffTaxYearId, params }) => taxiqTipLedgerRepository.exportForCpa(staffTaxYearId, params),
  })
}
