/**
 * TanStack Query hooks for the TaxIQ Employer Registry (US-029).
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { qk } from '../queryKeys'
import taxiqEmployerRepository from '../repositories/taxiqEmployer'
import type {
  CreateEmployerParams,
  Employer,
  EmployerListPage,
  EmployerRegistration,
  UpdateEmployerParams,
  UpsertEmployerRegistrationParams,
} from '../repositories/taxiqEmployer'

export function useTaxiqEmployers(businessId: string | undefined) {
  return useQuery<EmployerListPage>({
    queryKey: qk.taxiqEmployers(businessId),
    queryFn: () => taxiqEmployerRepository.listByBusiness(businessId as string),
    enabled: !!businessId,
  })
}

export function useTaxiqEmployer(employerId: string | undefined) {
  return useQuery<Employer>({
    queryKey: qk.taxiqEmployerById(employerId),
    queryFn: () => taxiqEmployerRepository.getById(employerId as string),
    enabled: !!employerId,
  })
}

export function useCreateEmployer() {
  const queryClient = useQueryClient()
  return useMutation<string, Error, CreateEmployerParams>({
    mutationFn: (params) => taxiqEmployerRepository.create(params),
    onSuccess: (_, params) => queryClient.invalidateQueries({ queryKey: qk.taxiqEmployers(params.businessId) }),
  })
}

export function useUpdateEmployer(businessId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation<void, Error, UpdateEmployerParams>({
    mutationFn: (params) => taxiqEmployerRepository.update(params),
    onSuccess: (_, params) => {
      queryClient.invalidateQueries({ queryKey: qk.taxiqEmployers(businessId) })
      queryClient.invalidateQueries({ queryKey: qk.taxiqEmployerById(params.employerId) })
    },
  })
}

export function useTaxiqEmployerRegistrations(employerId: string | undefined) {
  return useQuery<EmployerRegistration[]>({
    queryKey: qk.taxiqEmployerRegistrations(employerId),
    queryFn: () => taxiqEmployerRepository.listRegistrations(employerId as string),
    enabled: !!employerId,
  })
}

// Invalidates both the registrations list and the Employers list/detail queries — a
// registration upsert recomputes Employer.Status/Health server-side, so the parent list's
// Status/Health columns must refresh too, not just this modal's own registrations table.
export function useUpsertEmployerRegistration(businessId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation<void, Error, UpsertEmployerRegistrationParams>({
    mutationFn: (params) => taxiqEmployerRepository.upsertRegistration(params),
    onSuccess: (_, params) => {
      queryClient.invalidateQueries({ queryKey: qk.taxiqEmployerRegistrations(params.employerId) })
      queryClient.invalidateQueries({ queryKey: qk.taxiqEmployers(businessId) })
      queryClient.invalidateQueries({ queryKey: qk.taxiqEmployerById(params.employerId) })
      queryClient.invalidateQueries({ queryKey: qk.taxiqJurisdictionSummary(businessId, params.employerId) })
    },
  })
}
