/**
 * Badge count for "services waiting for me to accept", polled from the staff shell so it is
 * visible on every screen. Deliberately not scoped to one salon: a technician linked to several
 * salons needs one number covering all of them.
 */
import { useQuery } from '@tanstack/react-query'
import { qk } from '../queryKeys'
import { useSessionRole } from '../../auth/useSessionRole'
import staffWorkOrdersRepository from '../repositories/staffWorkOrders'

const POLL_INTERVAL_MS = 30_000

export function useStaffPendingAcceptanceCount() {
  const { isStaff } = useSessionRole()

  return useQuery<number>({
    queryKey: qk.staffPosPendingAcceptanceCount(),
    queryFn: () => staffWorkOrdersRepository.getPendingAcceptanceCount(),
    enabled: isStaff,
    retry: false,
    refetchInterval: POLL_INTERVAL_MS,
  })
}
