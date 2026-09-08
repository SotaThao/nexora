import { useCallback, useEffect, useSyncExternalStore } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useSessionRole } from '../../auth/useSessionRole'
import { PosOrderStatus } from '../../constants/posOrderStatus'
import type { OrderDetailApiDto } from '../../types/repositories'
import { qk } from '../queryKeys'
import posCheckoutRepository from '../repositories/posCheckout'
import { calculateNextTurnBalance, getNextTurnBalance } from '../repositories/posNextTurn'

type NextTurnData = Awaited<ReturnType<typeof getNextTurnBalance>>

export function usePosNextTurnBalance(
  businessId: string | undefined,
  day: string,
  timeZone: string | null | undefined,
  enabled: boolean,
) {
  const { isAuthenticated } = useSessionRole()
  const queryClient = useQueryClient()
  const salonTimeZone = timeZone?.trim() || 'America/Chicago'
  const isEnabled = isAuthenticated && Boolean(businessId) && enabled
  // Invalidating an already-fetching query may leave all QueryObserver fields unchanged.
  // Subscribe to the cache flag itself so a mutation immediately hides the old recommendation.
  const isRecalculating = useSyncExternalStore(
    useCallback(notify => queryClient.getQueryCache().subscribe(notify), [queryClient]),
    useCallback(() => Boolean(queryClient.getQueryState(
      qk.merchantPosNextTurnBalance(businessId, day, salonTimeZone),
    )?.isInvalidated), [businessId, day, salonTimeZone, queryClient]),
    () => false,
  )
  // Only confirmed detail responses count. Optimistic assignment patches may still roll back.
  const subscribeToConfirmedOrders = useCallback((onOrder: (order: OrderDetailApiDto) => void) => {
    const prefix = qk.merchantPosOrderDetail(businessId).slice(0, -1)
    return queryClient.getQueryCache().subscribe(event => {
      if (event.type !== 'updated' || event.action.type !== 'success' || event.action.manual) return
      if (event.query.queryKey.length !== prefix.length + 1
        || !prefix.every((value, index) => event.query.queryKey[index] === value)) return
      if (event.query.state.data) onOrder(event.query.state.data as OrderDetailApiDto)
    })
  }, [businessId, queryClient])

  useEffect(() => {
    if (!isEnabled) return
    const queryKey = qk.merchantPosNextTurnBalance(businessId, day, salonTimeZone)
    return subscribeToConfirmedOrders(order => {
      const state = queryClient.getQueryState(queryKey)
      // During a full scan, publish once at the end rather than mixing partly refreshed tickets.
      if (state?.status === 'error' || state?.fetchStatus === 'fetching') return
      queryClient.setQueryData<NextTurnData>(queryKey, current => {
        if (!current?.orders) return current
        const orders = new Map(current.orders.map(item => [item.id, item]))
        orders.set(order.id, order)
        const latestOrders = [...orders.values()]
        return { ...calculateNextTurnBalance(latestOrders, day, salonTimeZone), orders: latestOrders }
      })
    })
  }, [businessId, day, salonTimeZone, isEnabled, queryClient, subscribeToConfirmedOrders])

  const query = useQuery({
    queryKey: qk.merchantPosNextTurnBalance(businessId, day, salonTimeZone),
    queryFn: async ({ signal }) => {
      const confirmedDuringLoad = new Map<string, OrderDetailApiDto>()
      const unsubscribe = subscribeToConfirmedOrders(order => confirmedDuringLoad.set(order.id, order))
      try {
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
        // A mutation may finish while a different ticket is still loading. Do not overwrite that
        // confirmed assignment with the earlier response when the full scan finally completes.
        const orders = new Map(result.orders.map(order => [order.id, order]))
        confirmedDuringLoad.forEach((order, id) => orders.set(id, order))
        const latestOrders = [...orders.values()]
        return { ...calculateNextTurnBalance(latestOrders, day, salonTimeZone), orders: latestOrders }
      } finally {
        unsubscribe()
      }
    },
    enabled: isEnabled,
    staleTime: 0,
    refetchInterval: 5000,
    retry: false,
  })
  return {
    ...query,
    isRecalculating,
  }
}
