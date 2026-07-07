/**
 * TanStack Query hooks for the TaxIQ Owner Payout & Dispute Center (US-09).
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { qk } from '../queryKeys'
import taxiqOwnerPayoutsRepository from '../repositories/taxiqOwnerPayouts'
import type {
  CreatePayoutRecordParams,
  CreateStaffTaxYearByOwnerParams,
  DisputedPayout,
  ListPayoutRecordsParams,
  PayoutRecord,
  ResolveDisputeParams,
  StaffTaxIqItem,
  UpdatePayoutRecordParams,
} from '../repositories/taxiqOwnerPayouts'

export function useTaxiqOwnerStaffList(ownerTaxYearId: string | undefined) {
  return useQuery<StaffTaxIqItem[]>({
    queryKey: qk.taxiqOwnerStaffList(ownerTaxYearId),
    queryFn: () => taxiqOwnerPayoutsRepository.listStaff(ownerTaxYearId as string),
    enabled: !!ownerTaxYearId,
  })
}

export function useCreateStaffTaxYearByOwner() {
  const queryClient = useQueryClient()
  return useMutation<string, Error, CreateStaffTaxYearByOwnerParams>({
    mutationFn: (params) => taxiqOwnerPayoutsRepository.createStaffTaxYear(params),
    onSuccess: (_, params) =>
      queryClient.invalidateQueries({ queryKey: qk.taxiqOwnerStaffList(params.ownerTaxYearId) }),
  })
}

export function useTaxiqOwnerPayouts(params: ListPayoutRecordsParams | undefined) {
  return useQuery<PayoutRecord[]>({
    queryKey: qk.taxiqOwnerPayouts(params?.ownerTaxYearId, params?.staffUserId, params?.status),
    queryFn: () => taxiqOwnerPayoutsRepository.list(params as ListPayoutRecordsParams),
    enabled: !!params?.ownerTaxYearId,
  })
}

function invalidatePayoutQueries(queryClient: ReturnType<typeof useQueryClient>, ownerTaxYearId: string) {
  queryClient.invalidateQueries({ queryKey: qk.taxiqOwnerPayouts(ownerTaxYearId) })
  queryClient.invalidateQueries({ queryKey: qk.taxiqOwnerPayoutsDisputed(ownerTaxYearId) })
}

export function useCreatePayoutRecord() {
  const queryClient = useQueryClient()
  return useMutation<string, Error, CreatePayoutRecordParams>({
    mutationFn: (params) => taxiqOwnerPayoutsRepository.create(params),
    onSuccess: (_, params) => invalidatePayoutQueries(queryClient, params.ownerTaxYearId),
  })
}

export function useUpdatePayoutRecord(ownerTaxYearId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation<void, Error, UpdatePayoutRecordParams>({
    mutationFn: (params) => taxiqOwnerPayoutsRepository.update(params),
    onSuccess: () => {
      if (ownerTaxYearId) invalidatePayoutQueries(queryClient, ownerTaxYearId)
    },
  })
}

export function useTaxiqOwnerDisputedPayouts(ownerTaxYearId: string | undefined) {
  return useQuery<DisputedPayout[]>({
    queryKey: qk.taxiqOwnerPayoutsDisputed(ownerTaxYearId),
    queryFn: () => taxiqOwnerPayoutsRepository.listDisputed(ownerTaxYearId as string),
    enabled: !!ownerTaxYearId,
  })
}

export function useResolvePayoutDispute(ownerTaxYearId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation<void, Error, ResolveDisputeParams>({
    mutationFn: (params) => taxiqOwnerPayoutsRepository.resolveDispute(params),
    onSuccess: () => {
      if (ownerTaxYearId) invalidatePayoutQueries(queryClient, ownerTaxYearId)
    },
  })
}
