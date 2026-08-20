/**
 * TanStack Query hooks for POS Merchant Ops: Checkout (US-14 / US-025, refactored to
 * Order + multi-staff service lines + product lines + tip split in US-026).
 * Usable by both Owner and Staff sessions (gated server-side via
 * IPosOperationsAccessService) — see usePosAccess for the FE show/hide check.
 */
import { useQuery, useMutation, useQueryClient, type QueryKey } from '@tanstack/react-query'
import { qk } from '../queryKeys'
import { useSessionRole } from '../../auth/useSessionRole'
import posCheckoutRepository from '../repositories/posCheckout'
import { randomUuid } from '../../utils/uuid'
import type {
  CheckoutProductCatalogItemApiDto,
  CheckoutServiceCatalogItemApiDto,
  CompleteOrderPayload,
  CompleteOrderResultApiDto,
  InServiceOrderApiDto,
  OrderDetailApiDto,
  SetOrderStaffTipSplitPayload,
} from '../../types/repositories'

function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100
}

interface OrderMutationContext {
  previousOrder?: OrderDetailApiDto
  queryKey: QueryKey
}

// Mirrors GetOrderDetailQueryHandler's live-total formula (servicesSubtotal +
// productsSubtotal + tipAmount + discountAmount + salesTaxAmount) closely enough to patch
// the cache optimistically between a mutation and its invalidate-triggered refetch, so the
// Payment Summary doesn't sit on stale numbers for a full round trip. Business.
// SalesTaxRatePercent isn't available on the client, so the effective rate is inferred
// from the order's own current subtotal/tax pair instead of duplicated — the refetch that
// always follows in onSuccess reconciles any drift, so this only needs to hold for one frame.
function applyOrderTotalsPatch(
  order: OrderDetailApiDto,
  patch: { servicesSubtotal?: number; productsSubtotal?: number; tipAmount?: number },
): OrderDetailApiDto {
  const servicesSubtotal = patch.servicesSubtotal ?? order.servicesSubtotal
  const productsSubtotal = patch.productsSubtotal ?? order.productsSubtotal
  const tipAmount = patch.tipAmount ?? order.tipAmount
  const previousTaxableBase = order.servicesSubtotal + order.productsSubtotal
  const inferredTaxRate = previousTaxableBase > 0 ? order.salesTaxAmount / previousTaxableBase : 0
  const salesTaxAmount = roundCurrency((servicesSubtotal + productsSubtotal) * inferredTaxRate)
  const total = roundCurrency(servicesSubtotal + productsSubtotal + tipAmount + order.discountAmount + salesTaxAmount)
  return { ...order, servicesSubtotal, productsSubtotal, tipAmount, salesTaxAmount, total }
}

async function snapshotOrderDetail(
  queryClient: ReturnType<typeof useQueryClient>,
  businessId: string | undefined,
  orderId: string,
): Promise<OrderMutationContext> {
  const queryKey = qk.merchantPosOrderDetail(businessId, orderId)
  await queryClient.cancelQueries({ queryKey })
  return { previousOrder: queryClient.getQueryData<OrderDetailApiDto>(queryKey), queryKey }
}

function rollbackOrderDetail(queryClient: ReturnType<typeof useQueryClient>, context?: OrderMutationContext) {
  if (context?.previousOrder) {
    queryClient.setQueryData(context.queryKey, context.previousOrder)
  }
}

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
  return useMutation<
    string,
    Error,
    { orderId: string; posServiceId: string; quantity?: number; unitPrice: number; serviceName: string },
    OrderMutationContext
  >({
    mutationFn: ({ orderId, posServiceId, quantity }) =>
      posCheckoutRepository.addOrderServiceLine(businessId as string, orderId, posServiceId, quantity),
    onMutate: async ({ orderId, posServiceId, quantity = 1, unitPrice, serviceName }) => {
      const context = await snapshotOrderDetail(queryClient, businessId, orderId)
      if (context.previousOrder) {
        const lineTotal = roundCurrency(unitPrice * quantity)
        queryClient.setQueryData<OrderDetailApiDto>(context.queryKey, {
          ...applyOrderTotalsPatch(context.previousOrder, {
            servicesSubtotal: roundCurrency(context.previousOrder.servicesSubtotal + lineTotal),
          }),
          serviceLines: [
            ...context.previousOrder.serviceLines,
            {
              id: `optimistic-${randomUuid()}`,
              posServiceId,
              serviceName,
              unitPrice,
              quantity,
              lineTotal,
              completedAt: null,
            },
          ],
        })
      }
      return context
    },
    onError: (_err, _vars, context) => rollbackOrderDetail(queryClient, context),
    onSuccess: (_result, { orderId }) => {
      queryClient.invalidateQueries({ queryKey: qk.merchantPosOrderDetail(businessId, orderId) })
      queryClient.invalidateQueries({ queryKey: qk.merchantPosInServiceOrders(businessId) })
      queryClient.invalidateQueries({ queryKey: qk.merchantPosOrderList(businessId) })
    },
  })
}

export function useRemoveOrderServiceLine(businessId?: string) {
  const queryClient = useQueryClient()
  return useMutation<boolean, Error, { orderId: string; serviceLineId: string }, OrderMutationContext>({
    mutationFn: ({ orderId, serviceLineId }) =>
      posCheckoutRepository.removeOrderServiceLine(businessId as string, orderId, serviceLineId),
    onMutate: async ({ orderId, serviceLineId }) => {
      const context = await snapshotOrderDetail(queryClient, businessId, orderId)
      const removedLine = context.previousOrder?.serviceLines.find((l) => l.id === serviceLineId)
      if (context.previousOrder && removedLine) {
        queryClient.setQueryData<OrderDetailApiDto>(context.queryKey, {
          ...applyOrderTotalsPatch(context.previousOrder, {
            servicesSubtotal: roundCurrency(context.previousOrder.servicesSubtotal - removedLine.lineTotal),
          }),
          serviceLines: context.previousOrder.serviceLines.filter((l) => l.id !== serviceLineId),
        })
      }
      return context
    },
    onError: (_err, _vars, context) => rollbackOrderDetail(queryClient, context),
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
  return useMutation<
    string,
    Error,
    { orderId: string; posProductId: string; quantity?: number; unitPrice: number; productName: string },
    OrderMutationContext
  >({
    mutationFn: ({ orderId, posProductId, quantity }) =>
      posCheckoutRepository.addOrderProductLine(businessId as string, orderId, posProductId, quantity),
    // AddOrderProductLineCommand merges Qty server-side when this product already has a
    // line on the order (see handleCatalogProductClick) — matched here by productName since
    // OrderProductLineApiDto doesn't carry posProductId, to avoid the optimistic patch
    // double-counting the line while the merge round-trips.
    onMutate: async ({ orderId, quantity = 1, unitPrice, productName }) => {
      const context = await snapshotOrderDetail(queryClient, businessId, orderId)
      if (context.previousOrder) {
        const deltaSubtotal = roundCurrency(unitPrice * quantity)
        const existingLine = context.previousOrder.productLines.find((l) => l.productName === productName)
        const productLines = existingLine
          ? context.previousOrder.productLines.map((l) =>
              l.id === existingLine.id
                ? { ...l, quantity: l.quantity + quantity, lineTotal: roundCurrency(l.lineTotal + deltaSubtotal) }
                : l,
            )
          : [
              ...context.previousOrder.productLines,
              {
                id: `optimistic-${randomUuid()}`,
                productName,
                unitPrice,
                quantity,
                lineTotal: deltaSubtotal,
              },
            ]
        queryClient.setQueryData<OrderDetailApiDto>(context.queryKey, {
          ...applyOrderTotalsPatch(context.previousOrder, {
            productsSubtotal: roundCurrency(context.previousOrder.productsSubtotal + deltaSubtotal),
          }),
          productLines,
        })
      }
      return context
    },
    onError: (_err, _vars, context) => rollbackOrderDetail(queryClient, context),
    onSuccess: (_result, { orderId }) => {
      queryClient.invalidateQueries({ queryKey: qk.merchantPosOrderDetail(businessId, orderId) })
      queryClient.invalidateQueries({ queryKey: qk.merchantPosOrderList(businessId) })
    },
  })
}

// Product-only (US-17) — a Service line is always Quantity = 1.
export function useUpdateOrderProductLineQuantity(businessId?: string) {
  const queryClient = useQueryClient()
  return useMutation<boolean, Error, { orderId: string; productLineId: string; quantity: number }, OrderMutationContext>({
    mutationFn: ({ orderId, productLineId, quantity }) =>
      posCheckoutRepository.updateOrderProductLineQuantity(businessId as string, orderId, productLineId, quantity),
    onMutate: async ({ orderId, productLineId, quantity }) => {
      const context = await snapshotOrderDetail(queryClient, businessId, orderId)
      const line = context.previousOrder?.productLines.find((l) => l.id === productLineId)
      if (context.previousOrder && line) {
        const newLineTotal = roundCurrency(line.unitPrice * quantity)
        const deltaSubtotal = roundCurrency(newLineTotal - line.lineTotal)
        queryClient.setQueryData<OrderDetailApiDto>(context.queryKey, {
          ...applyOrderTotalsPatch(context.previousOrder, {
            productsSubtotal: roundCurrency(context.previousOrder.productsSubtotal + deltaSubtotal),
          }),
          productLines: context.previousOrder.productLines.map((l) =>
            l.id === productLineId ? { ...l, quantity, lineTotal: newLineTotal } : l,
          ),
        })
      }
      return context
    },
    onError: (_err, _vars, context) => rollbackOrderDetail(queryClient, context),
    onSuccess: (_result, { orderId }) => {
      queryClient.invalidateQueries({ queryKey: qk.merchantPosOrderDetail(businessId, orderId) })
      queryClient.invalidateQueries({ queryKey: qk.merchantPosOrderList(businessId) })
    },
  })
}

export function useRemoveOrderProductLine(businessId?: string) {
  const queryClient = useQueryClient()
  return useMutation<boolean, Error, { orderId: string; productLineId: string }, OrderMutationContext>({
    mutationFn: ({ orderId, productLineId }) =>
      posCheckoutRepository.removeOrderProductLine(businessId as string, orderId, productLineId),
    onMutate: async ({ orderId, productLineId }) => {
      const context = await snapshotOrderDetail(queryClient, businessId, orderId)
      const removedLine = context.previousOrder?.productLines.find((l) => l.id === productLineId)
      if (context.previousOrder && removedLine) {
        queryClient.setQueryData<OrderDetailApiDto>(context.queryKey, {
          ...applyOrderTotalsPatch(context.previousOrder, {
            productsSubtotal: roundCurrency(context.previousOrder.productsSubtotal - removedLine.lineTotal),
          }),
          productLines: context.previousOrder.productLines.filter((l) => l.id !== productLineId),
        })
      }
      return context
    },
    onError: (_err, _vars, context) => rollbackOrderDetail(queryClient, context),
    onSuccess: (_result, { orderId }) => {
      queryClient.invalidateQueries({ queryKey: qk.merchantPosOrderDetail(businessId, orderId) })
      queryClient.invalidateQueries({ queryKey: qk.merchantPosOrderList(businessId) })
    },
  })
}

export function useSetOrderTip(businessId?: string) {
  const queryClient = useQueryClient()
  return useMutation<boolean, Error, { orderId: string; tipAmount: number }, OrderMutationContext>({
    mutationFn: ({ orderId, tipAmount }) =>
      posCheckoutRepository.setOrderTip(businessId as string, orderId, tipAmount),
    onMutate: async ({ orderId, tipAmount }) => {
      const context = await snapshotOrderDetail(queryClient, businessId, orderId)
      if (context.previousOrder) {
        queryClient.setQueryData<OrderDetailApiDto>(
          context.queryKey,
          applyOrderTotalsPatch(context.previousOrder, { tipAmount }),
        )
      }
      return context
    },
    onError: (_err, _vars, context) => rollbackOrderDetail(queryClient, context),
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
