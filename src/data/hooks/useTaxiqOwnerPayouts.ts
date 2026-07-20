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
  SetStaffTinParams,
  StaffTaxIqItem,
  StaffTin,
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

// Masked-by-default view of a Staff's TIN, shown inline in StaffTaxProfileTab.
export function useStaffTinMasked(ownerTaxYearId: string | undefined, staffUserId: string | undefined) {
  return useQuery<StaffTin>({
    queryKey: qk.taxiqOwnerStaffTin(ownerTaxYearId, staffUserId, false),
    queryFn: () => taxiqOwnerPayoutsRepository.getStaffTin(ownerTaxYearId as string, staffUserId as string, false),
    enabled: !!ownerTaxYearId && !!staffUserId,
  })
}

// Fill-in-when-empty write, shared by TaxIQ's StaffTinCell and POS's
// PosStaffProfileView. Broadly invalidates both callers' cache namespaces (rather than
// a single scoped key) since merchantPosStaffProfile is keyed by businessStaffLinkId,
// which this hook's caller doesn't necessarily know — the query keys' default prefix
// matching makes this a cheap, safe way to cover both without threading extra ids through.
export function useSetStaffTin() {
  const queryClient = useQueryClient()
  return useMutation<void, Error, SetStaffTinParams>({
    mutationFn: (params) => taxiqOwnerPayoutsRepository.setStaffTin(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taxiqOwnerStaffTin'] })
      queryClient.invalidateQueries({ queryKey: ['merchantSettings', 'posStaffProfile'] })
    },
  })
}

// Plaintext reveal — deliberately a mutation (not cached by react-query) so the
// plaintext value isn't kept around after the component that requested it unmounts.
// Every call is audited server-side (GetStaffTinQuery, reveal=true).
export function useRevealStaffTin() {
  return useMutation<StaffTin, Error, { ownerTaxYearId: string; staffUserId: string }>({
    mutationFn: ({ ownerTaxYearId, staffUserId }) =>
      taxiqOwnerPayoutsRepository.getStaffTin(ownerTaxYearId, staffUserId, true),
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

export function useDeletePayoutRecord(ownerTaxYearId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation<void, Error, string>({
    mutationFn: (payoutRecordId) => taxiqOwnerPayoutsRepository.remove(payoutRecordId),
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
