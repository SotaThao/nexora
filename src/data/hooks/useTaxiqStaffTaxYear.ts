/**
 * TanStack Query hooks for TaxIQ StaffTaxYear (onboarding, dashboard, module config).
 * See openspec/changes/integrate-taxiq-staff-nav-onboarding/design.md.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { qk } from '../queryKeys'
import taxiqStaffTaxYearRepository from '../repositories/taxiqStaffTaxYear'
import type {
  CreateStaffTaxYearParams,
  StaffDashboard,
  StaffTaxProfile,
  StaffTaxYearListPage,
  UpdateStaffTaxYearModulesParams,
  UpsertStaffTaxProfileParams,
  UpsertW9RecordParams,
} from '../repositories/taxiqStaffTaxYear'

// Single source of truth for "does the current Staff user already have a
// StaffTaxYear for this year" — drives the onboarding-wizard-vs-home branch.
export function useStaffTaxYearByYear(taxYear?: number) {
  return useQuery<StaffTaxYearListPage>({
    queryKey: qk.taxiqStaffTaxYear(taxYear),
    queryFn: () => taxiqStaffTaxYearRepository.listByYear(taxYear as number),
    enabled: !!taxYear,
  })
}

export function useStaffTaxYearDashboard(id?: string | null) {
  return useQuery<StaffDashboard>({
    queryKey: qk.taxiqStaffTaxYearById(id ?? undefined),
    queryFn: () => taxiqStaffTaxYearRepository.getDashboard(id as string),
    enabled: !!id,
  })
}

export function useCreateStaffTaxYear() {
  const queryClient = useQueryClient()
  return useMutation<string, Error, CreateStaffTaxYearParams>({
    mutationFn: (params) => taxiqStaffTaxYearRepository.create(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.taxiqStaffTaxYear() })
    },
  })
}

export function useUpdateStaffTaxYearModules() {
  const queryClient = useQueryClient()
  return useMutation<void, Error, { id: string } & UpdateStaffTaxYearModulesParams>({
    mutationFn: ({ id, ...params }) => taxiqStaffTaxYearRepository.updateModules(id, params),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: qk.taxiqStaffTaxYear() })
      queryClient.invalidateQueries({ queryKey: qk.taxiqStaffTaxYearById(variables.id) })
    },
  })
}

export function useMyStaffTaxProfile() {
  return useQuery<StaffTaxProfile>({
    queryKey: qk.taxiqStaffTaxProfile(),
    queryFn: () => taxiqStaffTaxYearRepository.getMyTaxProfile(),
  })
}

export function useUpsertStaffTaxProfile() {
  const queryClient = useQueryClient()
  return useMutation<void, Error, UpsertStaffTaxProfileParams>({
    mutationFn: (params) => taxiqStaffTaxYearRepository.upsertMyTaxProfile(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.taxiqStaffTaxProfile() })
    },
  })
}

export function useUpsertW9Record() {
  const queryClient = useQueryClient()
  return useMutation<void, Error, UpsertW9RecordParams>({
    mutationFn: (params) => taxiqStaffTaxYearRepository.upsertW9Record(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.taxiqStaffTaxProfile() })
    },
  })
}

export function useUploadSignedW9() {
  const queryClient = useQueryClient()
  return useMutation<void, Error, File>({
    mutationFn: (file) => taxiqStaffTaxYearRepository.uploadSignedW9(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.taxiqStaffTaxProfile() })
    },
  })
}
