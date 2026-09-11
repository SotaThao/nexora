import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useSessionRole } from '../../auth/useSessionRole'
import { PosOrderStatus } from '../../constants/posOrderStatus'
import type { OrderDetailApiDto } from '../../types/repositories'
import { qk } from '../queryKeys'
import posCheckoutRepository from '../repositories/posCheckout'
import { getNextTurnBalance } from '../repositories/posNextTurn'

export function usePosNextTurnBalance(
  businessId: string | undefined,
  day: string,
  timeZone: string | null | undefined,
  enabled: boolean,
) {
  const { isAuthenticated } = useSessionRole()
  const queryClient = useQueryClient()
  const salonTimeZone = timeZone?.trim() || 'America/Chicago'
  return useQuery({
    queryKey: qk.merchantPosNextTurnBalance(businessId, day, salonTimeZone),
    queryFn: async ({ signal }) => {
      const result = await getNextTurnBalance(businessId as string, day, salonTimeZone, async orderId => {
        signal.throwIfAborted()
        const queryKey = qk.merchantPosOrderDetail(businessId, orderId)
        const cached = queryClient.getQueryData<OrderDetailApiDto>(queryKey)
        return queryClient.fetchQuery({
          queryKey,
          queryFn: () => posCheckoutRepository.getOrderDetail(businessId as string, orderId),
          staleTime: cached?.status === PosOrderStatus.Completed ? 5 * 60 * 1000 : 0,
        })
      })
      signal.throwIfAborted()
      return result
    },
    enabled: isAuthenticated && Boolean(businessId) && enabled,
    staleTime: 0,
    refetchInterval: 15000,
    retry: false,
  })
}
