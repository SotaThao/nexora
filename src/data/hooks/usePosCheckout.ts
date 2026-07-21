/**
 * TanStack Query hooks for POS Merchant Ops: Checkout (US-14 / US-025, refactored to
 * Order + multi-staff service lines + product lines + tip split in US-026).
 * Usable by both Owner and Staff sessions (gated server-side via
 * IPosOperationsAccessService) — see usePosAccess for the FE show/hide check.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { qk } from '../queryKeys'
import { useSessionRole } from '../../auth/useSessionRole'
import posCheckoutRepository from '../repositories/posCheckout'
import type {
  CheckoutProductCatalogItemApiDto,
  CheckoutServiceCatalogItemApiDto,
  CompleteOrderPayload,
  CompleteOrderResultApiDto,
  InServiceOrderApiDto,
  OrderDetailApiDto,
  SetOrderStaffTipSplitPayload,
} from '../../types/repositories'

export function useInServiceOrders(businessId?: string) {
  const { isAuthenticated } = useSessionRole()
  return useQuery<InServiceOrderApiDto[]>({
    queryKey: qk.merchantPosInServiceOrders(businessId),
    queryFn: () => posCheckoutRepository.getInServiceOrders(businessId as string),
    enabled: isAuthenticated && Boolean(businessId),
    retry: false,
    // Checkout list should stay fresh without a manual refresh.
    refetchInterval: 15000,
  })
}

export function useOrderDetail(businessId?: string, orderId?: string) {
  const { isAuthenticated } = useSessionRole()
  return useQuery<OrderDetailApiDto>({
    queryKey: qk.merchantPosOrderDetail(businessId, orderId),
    queryFn: () => posCheckoutRepository.getOrderDetail(businessId as string, orderId as string),
    enabled: isAuthenticated && Boolean(businessId) && Boolean(orderId),
    retry: false,
  })
}

export function useCheckoutServiceCatalog(businessId?: string) {
  const { isAuthenticated } = useSessionRole()
  return useQuery<CheckoutServiceCatalogItemApiDto[]>({
    queryKey: qk.merchantPosCheckoutServiceCatalog(businessId),
    queryFn: () => posCheckoutRepository.getServiceCatalog(businessId as string),
    enabled: isAuthenticated && Boolean(businessId),
    retry: false,
  })
}

export function useCheckoutProductCatalog(businessId?: string) {
  const { isAuthenticated } = useSessionRole()
  return useQuery<CheckoutProductCatalogItemApiDto[]>({
    queryKey: qk.merchantPosCheckoutProductCatalog(businessId),
    queryFn: () => posCheckoutRepository.getProductCatalog(businessId as string),
    enabled: isAuthenticated && Boolean(businessId),
    retry: false,
  })
}

export function useAddOrderServiceLine(businessId?: string) {
  const queryClient = useQueryClient()
  return useMutation<string, Error, { orderId: string; posServiceId: string; quantity?: number }>({
    mutationFn: ({ orderId, posServiceId, quantity }) =>
      posCheckoutRepository.addOrderServiceLine(businessId as string, orderId, posServiceId, quantity),
    onSuccess: (_result, { orderId }) => {
      queryClient.invalidateQueries({ queryKey: qk.merchantPosOrderDetail(businessId, orderId) })
      queryClient.invalidateQueries({ queryKey: qk.merchantPosInServiceOrders(businessId) })
      queryClient.invalidateQueries({ queryKey: qk.merchantPosOrderList(businessId) })
    },
  })
}

export function useRemoveOrderServiceLine(businessId?: string) {
  const queryClient = useQueryClient()
  return useMutation<boolean, Error, { orderId: string; serviceLineId: string }>({
    mutationFn: ({ orderId, serviceLineId }) =>
      posCheckoutRepository.removeOrderServiceLine(businessId as string, orderId, serviceLineId),
    onSuccess: (_result, { orderId }) => {
      queryClient.invalidateQueries({ queryKey: qk.merchantPosOrderDetail(businessId, orderId) })
      queryClient.invalidateQueries({ queryKey: qk.merchantPosInServiceOrders(businessId) })
      queryClient.invalidateQueries({ queryKey: qk.merchantPosOrderList(businessId) })
      queryClient.invalidateQueries({ queryKey: qk.merchantPosTurnBoard(businessId) })
    },
  })
}

export function useAddOrderProductLine(businessId?: string) {
  const queryClient = useQueryClient()
  return useMutation<string, Error, { orderId: string; posProductId: string; quantity?: number }>({
    mutationFn: ({ orderId, posProductId, quantity }) =>
      posCheckoutRepository.addOrderProductLine(businessId as string, orderId, posProductId, quantity),
    onSuccess: (_result, { orderId }) => {
      queryClient.invalidateQueries({ queryKey: qk.merchantPosOrderDetail(businessId, orderId) })
      queryClient.invalidateQueries({ queryKey: qk.merchantPosOrderList(businessId) })
    },
  })
}

// Product-only (US-17) — a Service line is always Quantity = 1.
export function useUpdateOrderProductLineQuantity(businessId?: string) {
  const queryClient = useQueryClient()
  return useMutation<boolean, Error, { orderId: string; productLineId: string; quantity: number }>({
    mutationFn: ({ orderId, productLineId, quantity }) =>
      posCheckoutRepository.updateOrderProductLineQuantity(businessId as string, orderId, productLineId, quantity),
    onSuccess: (_result, { orderId }) => {
      queryClient.invalidateQueries({ queryKey: qk.merchantPosOrderDetail(businessId, orderId) })
      queryClient.invalidateQueries({ queryKey: qk.merchantPosOrderList(businessId) })
    },
  })
}

export function useRemoveOrderProductLine(businessId?: string) {
  const queryClient = useQueryClient()
  return useMutation<boolean, Error, { orderId: string; productLineId: string }>({
    mutationFn: ({ orderId, productLineId }) =>
      posCheckoutRepository.removeOrderProductLine(businessId as string, orderId, productLineId),
    onSuccess: (_result, { orderId }) => {
      queryClient.invalidateQueries({ queryKey: qk.merchantPosOrderDetail(businessId, orderId) })
      queryClient.invalidateQueries({ queryKey: qk.merchantPosOrderList(businessId) })
    },
  })
}

export function useSetOrderTip(businessId?: string) {
  const queryClient = useQueryClient()
  return useMutation<boolean, Error, { orderId: string; tipAmount: number }>({
    mutationFn: ({ orderId, tipAmount }) =>
      posCheckoutRepository.setOrderTip(businessId as string, orderId, tipAmount),
    onSuccess: (_result, { orderId }) => {
      queryClient.invalidateQueries({ queryKey: qk.merchantPosOrderDetail(businessId, orderId) })
    },
  })
}

// US-026 — cashier override of the default proportional tip split shown in
// OrderDetailApiDto.staffTipShares.
export function useSetOrderStaffTipSplit(businessId?: string) {
  const queryClient = useQueryClient()
  return useMutation<boolean, Error, { orderId: string; payload: SetOrderStaffTipSplitPayload }>({
    mutationFn: ({ orderId, payload }) =>
      posCheckoutRepository.setOrderStaffTipSplit(businessId as string, orderId, payload),
    onSuccess: (_result, { orderId }) => {
      queryClient.invalidateQueries({ queryKey: qk.merchantPosOrderDetail(businessId, orderId) })
    },
  })
}

// Complete is the terminal action for an order — it releases every serving staff and
// removes the order from both In-Service Orders and Turn Board, so all three caches
// (plus Waitlist, since a busy front desk may be checking it) must refresh together.
export function useCompleteOrder(businessId?: string) {
  const queryClient = useQueryClient()
  return useMutation<CompleteOrderResultApiDto, Error, { orderId: string; payload: CompleteOrderPayload }>({
    mutationFn: ({ orderId, payload }) =>
      posCheckoutRepository.completeOrder(businessId as string, orderId, payload),
    onSuccess: (_result, { orderId }) => {
      queryClient.invalidateQueries({ queryKey: qk.merchantPosInServiceOrders(businessId) })
      queryClient.invalidateQueries({ queryKey: qk.merchantPosOrderList(businessId) })
      queryClient.invalidateQueries({ queryKey: qk.merchantPosCompletedOrders(businessId) })
      queryClient.invalidateQueries({ queryKey: qk.merchantPosTurnBoard(businessId) })
      queryClient.invalidateQueries({ queryKey: qk.merchantPosWaitlist(businessId) })
      queryClient.invalidateQueries({ queryKey: qk.merchantPosOrderDetail(businessId, orderId) })
    },
  })
}
