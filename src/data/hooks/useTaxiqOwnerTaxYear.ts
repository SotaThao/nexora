/**
 * TanStack Query hooks for TaxIQ OwnerTaxYear (onboarding, module config).
 * See openspec/changes/integrate-taxiq-owner-onboarding/design.md.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { qk } from '../queryKeys'
import taxiqOwnerTaxYearRepository from '../repositories/taxiqOwnerTaxYear'
import type {
  CreateOwnerTaxYearParams,
  OwnerTaxYear,
  OwnerTaxYearListPage,
  UpdateOwnerTaxYearModulesParams,
} from '../repositories/taxiqOwnerTaxYear'

// Single source of truth for "does this business already have an OwnerTaxYear for
// this year" — drives the onboarding-wizard-vs-home branch (design.md D1).
export function useOwnerTaxYearByBusiness(businessId?: string | null, taxYear?: number) {
  return useQuery<OwnerTaxYearListPage>({
    queryKey: qk.taxiqOwnerTaxYear(businessId ?? undefined, taxYear),
    queryFn: () => taxiqOwnerTaxYearRepository.listByBusiness(businessId as string, taxYear as number),
    enabled: !!businessId && !!taxYear,
  })
}

export function useOwnerTaxYear(id?: string | null) {
  return useQuery<OwnerTaxYear>({
    queryKey: qk.taxiqOwnerTaxYearById(id ?? undefined),
    queryFn: () => taxiqOwnerTaxYearRepository.getById(id as string),
    enabled: !!id,
  })
}

export function useCreateOwnerTaxYear() {
  const queryClient = useQueryClient()
  return useMutation<OwnerTaxYear | null, Error, CreateOwnerTaxYearParams>({
    mutationFn: (params) => taxiqOwnerTaxYearRepository.create(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.taxiqOwnerTaxYear() })
    },
  })
}

export function useUpdateOwnerTaxYearModules() {
  const queryClient = useQueryClient()
  return useMutation<void, Error, { id: string } & UpdateOwnerTaxYearModulesParams>({
    mutationFn: ({ id, ...params }) => taxiqOwnerTaxYearRepository.updateModules(id, params),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: qk.taxiqOwnerTaxYear() })
      queryClient.invalidateQueries({ queryKey: qk.taxiqOwnerTaxYearById(variables.id) })
    },
  })
}

export function useUpdateBusinessEin() {
  const queryClient = useQueryClient()
  return useMutation<void, Error, { businessId: string; ein: string; ownerTaxYearId: string }>({
    mutationFn: ({ businessId, ein }) => taxiqOwnerTaxYearRepository.updateBusinessEin(businessId, ein),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: qk.taxiqOwnerTaxYearById(variables.ownerTaxYearId) })
    },
  })
}
