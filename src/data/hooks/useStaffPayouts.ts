import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { qk } from '../queryKeys'
import { staffPayoutsRepository } from '../repositories/payouts'
import type { StaffPayoutsListQuery } from '../repositories/payouts'
import { useSessionRole } from '../../auth/useSessionRole'
import type {
  PayoutsListPage,
  StaffPayoutDetailRecord,
  StaffPayoutStats,
  StaffUnpaidDebtsPage,
} from '../../types/domain'

function useIsStaff(enabled = true) {
  const { isStaff } = useSessionRole()
  return isStaff && enabled
}

export function useStaffPayoutStats({ enabled = true } = {}) {
  const canFetch = useIsStaff(enabled)

  return useQuery<StaffPayoutStats>({
    queryKey: qk.staffPayoutStats(),
    queryFn: () => staffPayoutsRepository.getStats(),
    enabled: canFetch,
    retry: false,
  })
}

export function useStaffPayoutsList(query: StaffPayoutsListQuery, { enabled = true } = {}) {
  const canFetch = useIsStaff(enabled)

  return useQuery<PayoutsListPage>({
    queryKey: qk.staffPayoutsList(query),
    queryFn: () => staffPayoutsRepository.listPaginated(query),
    enabled: canFetch,
    placeholderData: keepPreviousData,
    retry: false,
  })
}

export function useStaffPayoutDetail(payoutId?: string | null, { enabled = true } = {}) {
  const canFetch = useIsStaff(enabled && Boolean(payoutId))

  return useQuery<StaffPayoutDetailRecord>({
    queryKey: qk.staffPayoutDetail(payoutId ?? ''),
    queryFn: () => staffPayoutsRepository.getById(payoutId!),
    enabled: canFetch,
    retry: false,
  })
}

export function useStaffUnpaidDebt({ enabled = true } = {}) {
  const canFetch = useIsStaff(enabled)

  return useQuery<StaffUnpaidDebtsPage>({
    queryKey: qk.staffUnpaidDebt(),
    queryFn: () => staffPayoutsRepository.getUnpaidDebt(),
    enabled: canFetch,
    retry: false,
  })
}

/** Query keys to invalidate after staff payout mutations (Phase 5). */
export const staffPayoutInvalidationKeys = {
  all: ['staffPayouts'] as const,
  list: ['staffPayouts', 'list'] as const,
  stats: qk.staffPayoutStats(),
  unpaidDebt: qk.staffUnpaidDebt(),
}

function invalidateStaffPayoutCaches(queryClient: ReturnType<typeof useQueryClient>, payoutId?: string) {
  queryClient.invalidateQueries({ queryKey: staffPayoutInvalidationKeys.all })
  queryClient.invalidateQueries({ queryKey: staffPayoutInvalidationKeys.list })
  queryClient.invalidateQueries({ queryKey: staffPayoutInvalidationKeys.stats })
  queryClient.invalidateQueries({ queryKey: staffPayoutInvalidationKeys.unpaidDebt })
  if (payoutId) {
    queryClient.invalidateQueries({ queryKey: qk.staffPayoutDetail(payoutId) })
  }
}

export function useConfirmStaffPayout() {
  const queryClient = useQueryClient()

  return useMutation<void, Error, string>({
    mutationFn: (payoutId) => staffPayoutsRepository.confirm(payoutId),
    onSuccess: (_data, payoutId) => invalidateStaffPayoutCaches(queryClient, payoutId),
  })
}
