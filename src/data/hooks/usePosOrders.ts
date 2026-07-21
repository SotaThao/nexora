/**
 * TanStack Query hooks for POS Merchant Ops: Check-in & Waitlist (US-12, refactored
 * to Order in US-026). Usable by both Owner and Staff sessions (gated server-side via
 * IPosOperationsAccessService) — see usePosAccess for the FE show/hide check.
 */
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { qk } from '../queryKeys'
import { useSessionRole } from '../../auth/useSessionRole'
import posOrdersRepository from '../repositories/posOrders'
import type {
  AssignableStaffApiDto,
  CheckInOrderPayload,
  CompletedOrdersListQuery,
  CompletedOrdersPage,
  OrderListItemApiDto,
  PosWaitlistOrderApiDto,
} from '../../types/repositories'

export function useWaitlist(businessId?: string) {
  const { isAuthenticated } = useSessionRole()
  return useQuery<PosWaitlistOrderApiDto[]>({
    queryKey: qk.merchantPosWaitlist(businessId),
    queryFn: () => posOrdersRepository.getWaitlist(businessId as string),
    enabled: isAuthenticated && Boolean(businessId),
    retry: false,
    // Wait time displayed to the front desk should stay fresh without a manual refresh.
    refetchInterval: 15000,
  })
}

export function useCheckInOrder(businessId?: string) {
  const queryClient = useQueryClient()
  return useMutation<string, Error, CheckInOrderPayload>({
    mutationFn: (payload) => posOrdersRepository.checkInOrder(businessId as string, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.merchantPosWaitlist(businessId) })
      queryClient.invalidateQueries({ queryKey: qk.merchantPosOrderList(businessId) })
    },
  })
}

// Order List tab (US-17) — Waiting + InService combined.
export function useOrderList(businessId?: string) {
  const { isAuthenticated } = useSessionRole()
  return useQuery<OrderListItemApiDto[]>({
    queryKey: qk.merchantPosOrderList(businessId),
    queryFn: () => posOrdersRepository.getOrderList(businessId as string),
    enabled: isAuthenticated && Boolean(businessId),
    retry: false,
    refetchInterval: 15000,
  })
}

// Completed Orders panel (US-17 follow-up) — paginated + filterable by date range/
// customer name/phone. keepPreviousData avoids a flicker back to an empty list while the
// user is paging or adjusting filters.
export function useCompletedOrders(businessId: string | undefined, filters: CompletedOrdersListQuery) {
  const { isAuthenticated } = useSessionRole()
  return useQuery<CompletedOrdersPage>({
    queryKey: qk.merchantPosCompletedOrders(businessId, filters),
    queryFn: () => posOrdersRepository.getCompletedOrders(businessId as string, filters),
    enabled: isAuthenticated && Boolean(businessId),
    placeholderData: keepPreviousData,
    retry: false,
  })
}

export function useCancelOrder(businessId?: string) {
  const queryClient = useQueryClient()
  return useMutation<boolean, Error, string>({
    mutationFn: (orderId) => posOrdersRepository.cancelOrder(businessId as string, orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.merchantPosWaitlist(businessId) })
      queryClient.invalidateQueries({ queryKey: qk.merchantPosOrderList(businessId) })
    },
  })
}

// US-026 — assigns one staff member to one service line (not the whole order).
// Does not by itself flip the order to InService — see useStartOrderService.
export function useAssignStaffToServiceLine(businessId?: string) {
  const queryClient = useQueryClient()
  return useMutation<
    boolean,
    Error,
    { orderId: string; serviceLineId: string; posStaffProfileId?: string; note?: string }
  >({
    mutationFn: ({ orderId, serviceLineId, posStaffProfileId, note }) =>
      posOrdersRepository.assignStaffToServiceLine(businessId as string, orderId, serviceLineId, posStaffProfileId, note),
    onSuccess: (_result, { orderId }) => {
      queryClient.invalidateQueries({ queryKey: qk.merchantPosWaitlist(businessId) })
      queryClient.invalidateQueries({ queryKey: qk.merchantPosOrderList(businessId) })
      queryClient.invalidateQueries({ queryKey: qk.merchantPosTurnBoard(businessId) })
      queryClient.invalidateQueries({ queryKey: qk.merchantPosOrderDetail(businessId, orderId) })
    },
  })
}

// US-026 — explicit manual Waiting -> InService transition, requires at least one
// service line already assigned. Moves the order out of the Waitlist.
export function useStartOrderService(businessId?: string) {
  const queryClient = useQueryClient()
  return useMutation<boolean, Error, string>({
    mutationFn: (orderId) => posOrdersRepository.startOrderService(businessId as string, orderId),
    onSuccess: (_result, orderId) => {
      queryClient.invalidateQueries({ queryKey: qk.merchantPosWaitlist(businessId) })
      queryClient.invalidateQueries({ queryKey: qk.merchantPosOrderList(businessId) })
      queryClient.invalidateQueries({ queryKey: qk.merchantPosTurnBoard(businessId) })
      queryClient.invalidateQueries({ queryKey: qk.merchantPosInServiceOrders(businessId) })
      queryClient.invalidateQueries({ queryKey: qk.merchantPosOrderDetail(businessId, orderId) })
    },
  })
}

// Technician picker filtered by skill for one service — includes busy staff (isBusy flag)
// so the manager can still assign them as an explicit override.
export function useAssignableStaffForService(businessId?: string, posServiceId?: string) {
  const { isAuthenticated } = useSessionRole()
  return useQuery<AssignableStaffApiDto[]>({
    queryKey: qk.merchantPosAssignableStaff(businessId, posServiceId),
    queryFn: () => posOrdersRepository.getAssignableStaffForService(businessId as string, posServiceId as string),
    enabled: isAuthenticated && Boolean(businessId) && Boolean(posServiceId),
    retry: false,
  })
}

// US-026 — frees the assigned staff on this line immediately, independent of the
// rest of the order.
export function useMarkServiceLineDone(businessId?: string) {
  const queryClient = useQueryClient()
  return useMutation<boolean, Error, { orderId: string; serviceLineId: string }>({
    mutationFn: ({ orderId, serviceLineId }) =>
      posOrdersRepository.markServiceLineDone(businessId as string, orderId, serviceLineId),
    onSuccess: (_result, { orderId }) => {
      queryClient.invalidateQueries({ queryKey: qk.merchantPosTurnBoard(businessId) })
      queryClient.invalidateQueries({ queryKey: qk.merchantPosOrderDetail(businessId, orderId) })
    },
  })
}
