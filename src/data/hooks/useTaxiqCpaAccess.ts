/**
 * TanStack Query hooks for TaxIQ CPA Access Grant settings (US-10 Phần A) — shared
 * between the Owner and Staff scopes (differ only by which tax year id is passed).
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { qk } from '../queryKeys'
import taxiqCpaAccessRepository from '../repositories/taxiqCpaAccess'
import type {
  CpaAccessGrant,
  CpaAccessGrantListItem,
  CreateCpaAccessGrantParams,
  ListCpaAccessGrantsParams,
} from '../repositories/taxiqCpaAccess'

export function useTaxiqCpaAccessGrants(params: ListCpaAccessGrantsParams) {
  return useQuery<CpaAccessGrantListItem[]>({
    queryKey: qk.taxiqCpaAccessGrants(params.ownerTaxYearId, params.staffTaxYearId),
    queryFn: () => taxiqCpaAccessRepository.list(params),
    enabled: !!(params.ownerTaxYearId || params.staffTaxYearId),
  })
}

export function useCreateCpaAccessGrant(params: ListCpaAccessGrantsParams) {
  const queryClient = useQueryClient()
  return useMutation<CpaAccessGrant, Error, CreateCpaAccessGrantParams>({
    mutationFn: (grantParams) => taxiqCpaAccessRepository.create(grantParams),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: qk.taxiqCpaAccessGrants(params.ownerTaxYearId, params.staffTaxYearId),
      }),
  })
}

export function useRevokeCpaAccessGrant(params: ListCpaAccessGrantsParams) {
  const queryClient = useQueryClient()
  return useMutation<void, Error, string>({
    mutationFn: (grantId) => taxiqCpaAccessRepository.revoke(grantId),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: qk.taxiqCpaAccessGrants(params.ownerTaxYearId, params.staffTaxYearId),
      }),
  })
}
