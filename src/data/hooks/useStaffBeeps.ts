/**
 * TanStack Query hooks for the tech's own beeps.
 *
 * Polled at 10s, not the 60s the notification unread-count uses: "come to the front desk" that
 * arrives up to a minute late makes the feature feel broken and gets the front desk nudging
 * redundantly. The cost is real — 10s is ~360 requests/hour per signed-in device — so it is bought
 * back three ways:
 *
 *  1. The query is gated on the tech actually being linked to a business. A beep can only come from
 *     a linked salon, so an account with no links provably has none, and the (large) tips-only
 *     population never enters the poll at all. This is the biggest saving by far.
 *  2. TanStack's default `refetchIntervalInBackground: false` stops the poll on a hidden tab, and
 *     `refetchOnWindowFocus` catches up the moment the tech picks the phone back up — which is the
 *     real usage pattern, screen off between customers.
 *  3. The endpoint itself is one indexed lookup and usually returns an empty list.
 *
 * Deliberately not adaptive: "poll slower when empty" is backwards, because empty is exactly when
 * a new beep needs to be noticed quickly.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { qk } from '../queryKeys'
import { useSessionRole } from '../../auth/useSessionRole'
import { useStaffBusinesses } from './useStaffSelf'
import staffBeepRepository from '../repositories/staffBeep'
import type {
  ActiveStaffBeepsApiDto,
  RespondToBeepRequest,
  StaffBeepResponseResultApiDto,
} from '../../types/repositories'

const ACTIVE_BEEPS_REFETCH_MS = 10000

const EMPTY_ACTIVE_BEEPS: ActiveStaffBeepsApiDto = { allowedDelayMinutes: [], beeps: [] }

export function useStaffActiveBeeps() {
  const { isStaff } = useSessionRole()
  const { data: businesses } = useStaffBusinesses({ enabled: isStaff })
  const hasLinkedBusiness = Array.isArray(businesses) && businesses.length > 0

  return useQuery<ActiveStaffBeepsApiDto>({
    queryKey: qk.staffActiveBeeps(),
    queryFn: () => staffBeepRepository.listActive(),
    enabled: isStaff && hasLinkedBusiness,
    retry: false,
    refetchInterval: ACTIVE_BEEPS_REFETCH_MS,
    refetchOnWindowFocus: true,
    placeholderData: (previous) => previous ?? EMPTY_ACTIVE_BEEPS,
  })
}

export function useRespondToBeep() {
  const queryClient = useQueryClient()
  return useMutation<
    StaffBeepResponseResultApiDto,
    unknown,
    { beepId: string } & RespondToBeepRequest
  >({
    mutationFn: ({ beepId, ...body }) => staffBeepRepository.respond(beepId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.staffActiveBeeps() })
      // Answering marks the beep handled, which changes what the bell should show.
      queryClient.invalidateQueries({ queryKey: qk.notifications() })
      queryClient.invalidateQueries({ queryKey: qk.notificationsUnreadCount() })
    },
  })
}
