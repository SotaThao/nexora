/**
 * TanStack Query hooks for the TaxIQ Staff Payout Confirmation & Dispute (US-14).
 */
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { qk } from '../queryKeys'
import taxiqStaffPayoutsRepository from '../repositories/taxiqStaffPayouts'
import type {
  DisputeStaffPayoutParams,
  StaffPayoutHistoryPage,
  StaffPayoutHistoryQuery,
  StaffPendingPayout,
} from '../repositories/taxiqStaffPayouts'

export function useTaxiqStaffPendingPayouts() {
  return useQuery<StaffPendingPayout[]>({
    queryKey: qk.taxiqStaffPayoutsPending(),
    queryFn: () => taxiqStaffPayoutsRepository.listPending(),
  })
}

// BUG-03 — history of the Staff's own Confirmed/DisputeReported/CPAReviewRequired payouts.
export function useTaxiqStaffPayoutsHistory(query: StaffPayoutHistoryQuery = {}) {
  return useQuery<StaffPayoutHistoryPage>({
    queryKey: qk.taxiqStaffPayoutsHistory(query),
    queryFn: () => taxiqStaffPayoutsRepository.listHistory(query),
    placeholderData: keepPreviousData,
  })
}

// Both mutations also invalidate qk.taxiqStaffTaxYear() so the pending-payouts badge
// on StaffTaxIqHomeView (fed by the dashboard aggregate) updates immediately, and
// qk.taxiqStaffPayoutsHistory() so the History tab reflects the new status right away.
function invalidateStaffPayoutQueries(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: qk.taxiqStaffPayoutsPending() })
  queryClient.invalidateQueries({ queryKey: qk.taxiqStaffTaxYear() })
  queryClient.invalidateQueries({ queryKey: ['taxiqStaffPayoutsHistory'] })
}

export function useConfirmStaffPayout() {
  const queryClient = useQueryClient()
  return useMutation<void, Error, string>({
    mutationFn: (payoutRecordId) => taxiqStaffPayoutsRepository.confirm(payoutRecordId),
    onSuccess: () => invalidateStaffPayoutQueries(queryClient),
  })
}

export function useDisputeStaffPayout() {
  const queryClient = useQueryClient()
  return useMutation<void, Error, DisputeStaffPayoutParams>({
    mutationFn: (params) => taxiqStaffPayoutsRepository.dispute(params),
    onSuccess: () => invalidateStaffPayoutQueries(queryClient),
  })
}
