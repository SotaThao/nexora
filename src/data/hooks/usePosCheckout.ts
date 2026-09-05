/**
 * TanStack Query hooks for POS Merchant Ops: Checkout (US-14 / US-025, refactored to
 * Order + multi-staff service lines + product lines + tip split in US-026).
 * Usable by both Owner and Staff sessions (gated server-side via
 * IPosOperationsAccessService) — see usePosAccess for the FE show/hide check.
 */
import { useQueries, useQuery, useMutation, useQueryClient, type QueryKey } from '@tanstack/react-query'
import { qk } from '../queryKeys'
import { useSessionRole } from '../../auth/useSessionRole'
import posCheckoutRepository from '../repositories/posCheckout'
import { resolveOrderDiscountAmount, resolveOrderDiscountCap } from '../../utils/posOrderDiscount'
import { isPersistedLineId, randomUuid, unlessOptimisticId } from '../../utils/uuid'
import type {
  CheckoutProductCatalogItemApiDto,
  CheckoutServiceCatalogItemApiDto,
  CompleteOrderPayload,
  CompleteOrderResultApiDto,
  EligiblePromotionApiDto,
  InServiceOrderApiDto,
  OrderDetailApiDto,
  ServiceLineAddOnOptionApiDto,
  SetOrderDiscountPayload,
  SetOrderServiceLineDiscountPayload,
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
  patch: {
    servicesSubtotal?: number
    productsSubtotal?: number
    tipAmount?: number
    discountAmount?: number
    orderDiscountType?: string | null
    orderDiscountValue?: number | null
  },
): OrderDetailApiDto {
  const servicesSubtotal = patch.servicesSubtotal ?? order.servicesSubtotal
  const productsSubtotal = patch.productsSubtotal ?? order.productsSubtotal
  const tipAmount = patch.tipAmount ?? order.tipAmount
  const discountAmount = patch.discountAmount ?? order.discountAmount

  // The order-level discount is re-resolved rather than carried over: a percentage follows the new
  // services total, and a dollar amount has to be re-checked against a cap that just moved.
  const orderDiscountType =
    patch.orderDiscountType !== undefined ? patch.orderDiscountType : order.orderDiscountType
  const orderDiscountValue =
    patch.orderDiscountValue !== undefined ? patch.orderDiscountValue : order.orderDiscountValue
  const orderDiscountCap = resolveOrderDiscountCap(servicesSubtotal, discountAmount)
  const orderDiscountAmount = resolveOrderDiscountAmount(
    orderDiscountType, orderDiscountValue, servicesSubtotal, orderDiscountCap,
  )

  const servicesNet = roundCurrency(servicesSubtotal - discountAmount - orderDiscountAmount)
  // Sales tax runs on the discounted figure (mirrors CompleteOrderCommand), so the rate has to be
  // inferred from the same net base the server used, not from the gross one.
  const previousTaxableBase = order.servicesNet + order.productsSubtotal
  const inferredTaxRate = previousTaxableBase > 0 ? order.salesTaxAmount / previousTaxableBase : 0
  const salesTaxAmount = roundCurrency((servicesNet + productsSubtotal) * inferredTaxRate)
  const total = roundCurrency(servicesNet + productsSubtotal + tipAmount + salesTaxAmount)
  return {
    ...order,
    servicesSubtotal,
    productsSubtotal,
    tipAmount,
    discountAmount,
    orderDiscountType,
    orderDiscountValue,
    orderDiscountAmount,
    orderDiscountCap,
    servicesNet,
    salesTaxAmount,
    total,
  }
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

function withPersistedLine<TLine extends { id: string }>(
  lines: TLine[],
  newLineId: string | undefined,
  createLine: (id: string) => TLine,
): TLine[] | null {
  if (!isPersistedLineId(newLineId)) return null
  const persistedLines = lines.filter((line) => isPersistedLineId(line.id))
  if (persistedLines.some((line) => line.id === newLineId)) return persistedLines
  return [...persistedLines, createLine(newLineId)]
}

export function useInServiceOrders(
  businessId?: string,
  options?: { enabled?: boolean; refetchInterval?: number | false },
) {
  const { isAuthenticated } = useSessionRole()
  return useQuery<InServiceOrderApiDto[]>({
    queryKey: qk.merchantPosInServiceOrders(businessId),
    queryFn: () => posCheckoutRepository.getInServiceOrders(businessId as string),
    enabled: isAuthenticated && Boolean(businessId) && (options?.enabled ?? true),
    retry: false,
    // Checkout list should stay fresh without a manual refresh.
    refetchInterval: options?.refetchInterval ?? 15000,
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

/**
 * Loads order details for a list of tickets while reusing React Query's per-order
 * cache. The completed-order list only exposes aggregated service and technician
 * names; the detail response is the source of truth for the technician assigned
 * to each individual service line.
 */
export function useOrderDetails(
  businessId: string | undefined,
  orderIds: string[],
  options?: { enabled?: boolean },
) {
  const { isAuthenticated } = useSessionRole()
  const enabled = options?.enabled ?? true

  return useQueries({
    queries: orderIds.map((orderId) => ({
      queryKey: qk.merchantPosOrderDetail(businessId, orderId),
      queryFn: () => posCheckoutRepository.getOrderDetail(businessId as string, orderId),
      enabled: enabled && isAuthenticated && Boolean(businessId),
      retry: false,
      // Completed tickets do not change after payment; keep the detail cache warm while the
      // Turn Board's 15-second roster/list poll continues.
      staleTime: 5 * 60 * 1000,
    })),
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
    onMutate: async ({ orderId, quantity = 1, unitPrice }) => {
      const context = await snapshotOrderDetail(queryClient, businessId, orderId)
      if (context.previousOrder) {
        const lineTotal = roundCurrency(unitPrice * quantity)
        // Totals only — never insert a client-generated line id. Assign/Delete/Discount
        // read ids off this cache, and `optimistic-*` is not a valid serviceLineId.
        queryClient.setQueryData<OrderDetailApiDto>(context.queryKey, applyOrderTotalsPatch(context.previousOrder, {
          servicesSubtotal: roundCurrency(context.previousOrder.servicesSubtotal + lineTotal),
        }))
      }
      return context
    },
    onError: (_err, _vars, context) => rollbackOrderDetail(queryClient, context),
    onSuccess: (newServiceLineId, { orderId, posServiceId, quantity = 1, unitPrice, serviceName }) => {
      const queryKey = qk.merchantPosOrderDetail(businessId, orderId)
      const current = queryClient.getQueryData<OrderDetailApiDto>(queryKey)
      const lineTotal = roundCurrency(unitPrice * quantity)
      const serviceLines = current
        ? withPersistedLine(current.serviceLines, newServiceLineId, (id) => ({
            id,
            posServiceId,
            serviceName,
            unitPrice,
            quantity,
            lineTotal,
            discountAmount: 0,
            staffDiscountShare: 0,
            lineTotalAfterDiscount: lineTotal,
            canAssignDiscountToStaff: false,
            completedAt: null,
            addOns: [],
          }))
        : null
      if (current && serviceLines) {
        queryClient.setQueryData<OrderDetailApiDto>(queryKey, { ...current, serviceLines })
      }
      queryClient.invalidateQueries({ queryKey: qk.merchantPosOrderDetail(businessId, orderId) })
      queryClient.invalidateQueries({ queryKey: qk.merchantPosInServiceOrders(businessId) })
      queryClient.invalidateQueries({ queryKey: qk.merchantPosOrderList(businessId) })
    },
  })
}

// A custom (off-menu) service: the price comes from the form, not the catalog, so the optimistic
// patch uses what was typed. Mirrors useAddOrderServiceLine otherwise, including never inserting a
// client-generated line id — Assign/Delete/Discount read ids off this cache.
export function useAddOrderCustomServiceLine(businessId?: string) {
  const queryClient = useQueryClient()
  return useMutation<
    string,
    Error,
    {
      orderId: string
      customServiceName: string
      price: number
      note: string | null
      posStaffProfileId: string | null
      // Display only — never sent. Lets the ticket show the technician straight away instead of
      // flashing "First available" until the refetch lands.
      technicianName: string | null
    },
    OrderMutationContext
  >({
    mutationFn: ({ orderId, customServiceName, price, note, posStaffProfileId }) =>
      posCheckoutRepository.addOrderCustomServiceLine(businessId as string, orderId, {
        customServiceName,
        price,
        note,
        posStaffProfileId,
      }),
    onMutate: async ({ orderId, price }) => {
      const context = await snapshotOrderDetail(queryClient, businessId, orderId)
      if (context.previousOrder) {
        queryClient.setQueryData<OrderDetailApiDto>(context.queryKey, applyOrderTotalsPatch(context.previousOrder, {
          servicesSubtotal: roundCurrency(context.previousOrder.servicesSubtotal + price),
        }))
      }
      return context
    },
    onError: (_err, _vars, context) => rollbackOrderDetail(queryClient, context),
    onSuccess: (
      newServiceLineId,
      { orderId, customServiceName, price, note, posStaffProfileId, technicianName },
    ) => {
      const queryKey = qk.merchantPosOrderDetail(businessId, orderId)
      const current = queryClient.getQueryData<OrderDetailApiDto>(queryKey)
      const serviceLines = current
        ? withPersistedLine(current.serviceLines, newServiceLineId, (id) => ({
            id,
            posServiceId: null,
            serviceName: customServiceName,
            unitPrice: price,
            quantity: 1,
            lineTotal: price,
            discountAmount: 0,
            staffDiscountShare: 0,
            lineTotalAfterDiscount: price,
            // Left false on purpose: whether the technician can absorb a discount depends on their
            // pay type, which only the refetch knows.
            canAssignDiscountToStaff: false,
            completedAt: null,
            note,
            assignedPosStaffProfileId: posStaffProfileId,
            technicianName,
            addOns: [],
          }))
        : null
      if (current && serviceLines) {
        queryClient.setQueryData<OrderDetailApiDto>(queryKey, { ...current, serviceLines })
      }
      queryClient.invalidateQueries({ queryKey: qk.merchantPosOrderDetail(businessId, orderId) })
      queryClient.invalidateQueries({ queryKey: qk.merchantPosInServiceOrders(businessId) })
      queryClient.invalidateQueries({ queryKey: qk.merchantPosOrderList(businessId) })
    },
  })
}

// Changing the service re-prices the line from the catalog server-side, and drops the technician
// when they are not trained on the new service — so the turn board is invalidated too, and the
// optimistic patch deliberately touches only name and price rather than guessing at the assignment.
export function useUpdateOrderServiceLine(businessId?: string) {
  const queryClient = useQueryClient()
  return useMutation<
    boolean,
    Error,
    {
      orderId: string
      serviceLineId: string
      // Null retargets the line to a custom service, named and priced by unitPrice/serviceName.
      posServiceId: string | null
      unitPrice: number
      serviceName: string
    },
    OrderMutationContext
  >({
    mutationFn: ({ orderId, serviceLineId, posServiceId, unitPrice, serviceName }) =>
      unlessOptimisticId(
        serviceLineId,
        () =>
          posCheckoutRepository.updateOrderServiceLine(
            businessId as string,
            orderId,
            serviceLineId,
            posServiceId !== null
              ? { posServiceId }
              : { customServiceName: serviceName, price: unitPrice },
          ),
        false,
      ),
    onMutate: async ({ orderId, serviceLineId, posServiceId, unitPrice, serviceName }) => {
      const context = await snapshotOrderDetail(queryClient, businessId, orderId)
      const previousLine = context.previousOrder?.serviceLines.find((l) => l.id === serviceLineId)
      if (context.previousOrder && previousLine) {
        const lineTotal = roundCurrency(unitPrice * previousLine.quantity)
        queryClient.setQueryData<OrderDetailApiDto>(context.queryKey, {
          ...applyOrderTotalsPatch(context.previousOrder, {
            servicesSubtotal: roundCurrency(
              context.previousOrder.servicesSubtotal - previousLine.lineTotal + lineTotal,
            ),
          }),
          serviceLines: context.previousOrder.serviceLines.map((l) =>
            l.id === serviceLineId ? { ...l, posServiceId, serviceName, unitPrice, lineTotal } : l,
          ),
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

export function useRemoveOrderServiceLine(businessId?: string) {
  const queryClient = useQueryClient()
  return useMutation<boolean, Error, { orderId: string; serviceLineId: string }, OrderMutationContext>({
    mutationFn: ({ orderId, serviceLineId }) =>
      unlessOptimisticId(
        serviceLineId,
        () => posCheckoutRepository.removeOrderServiceLine(businessId as string, orderId, serviceLineId),
        false,
      ),
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

// Not cached across opens: the owner may have retired an add-on between two visits to the same
// ticket, and a stale picker would offer something the command then rejects.
export function useServiceLineAddOnOptions(businessId?: string, orderId?: string, serviceLineId?: string) {
  const { isAuthenticated } = useSessionRole()
  return useQuery<ServiceLineAddOnOptionApiDto[]>({
    queryKey: qk.merchantPosServiceLineAddOnOptions(businessId, orderId, serviceLineId),
    queryFn: () =>
      posCheckoutRepository.getServiceLineAddOnOptions(
        businessId as string,
        orderId as string,
        serviceLineId as string,
      ),
    enabled: isAuthenticated && Boolean(businessId) && Boolean(orderId) && Boolean(serviceLineId),
    staleTime: 0,
    gcTime: 0,
    retry: false,
  })
}

// Each call adds one line — the picker stays open so the front desk can tap again for a second
// one, which is why the optimistic patch appends rather than merges.
export function useAddOrderServiceAddOnLine(businessId?: string) {
  const queryClient = useQueryClient()
  return useMutation<
    string,
    Error,
    { orderId: string; serviceLineId: string; serviceAddOnId: string; unitPrice: number; addOnName: string },
    OrderMutationContext
  >({
    mutationFn: ({ orderId, serviceLineId, serviceAddOnId }) =>
      posCheckoutRepository.addOrderServiceAddOnLine(
        businessId as string,
        orderId,
        serviceLineId,
        serviceAddOnId,
      ),
    onMutate: async ({ orderId, serviceLineId, serviceAddOnId, unitPrice, addOnName }) => {
      const context = await snapshotOrderDetail(queryClient, businessId, orderId)
      if (context.previousOrder) {
        queryClient.setQueryData<OrderDetailApiDto>(context.queryKey, {
          ...applyOrderTotalsPatch(context.previousOrder, {
            servicesSubtotal: roundCurrency(context.previousOrder.servicesSubtotal + unitPrice),
          }),
          serviceLines: context.previousOrder.serviceLines.map((line) =>
            line.id === serviceLineId
              ? {
                  ...line,
                  addOns: [
                    ...line.addOns,
                    {
                      id: `optimistic-${randomUuid()}`,
                      serviceAddOnId,
                      addOnName,
                      unitPrice,
                      lineTotal: unitPrice,
                      discountAmount: 0,
                      staffDiscountShare: 0,
                      lineTotalAfterDiscount: unitPrice,
                      canAssignDiscountToStaff: false,
                    },
                  ],
                }
              : line,
          ),
        })
      }
      return context
    },
    onError: (_err, _vars, context) => rollbackOrderDetail(queryClient, context),
    onSuccess: (_result, { orderId }) => {
      queryClient.invalidateQueries({ queryKey: qk.merchantPosOrderDetail(businessId, orderId) })
      queryClient.invalidateQueries({ queryKey: qk.merchantPosTurnBoard(businessId) })
    },
  })
}

export function useRemoveOrderServiceAddOnLine(businessId?: string) {
  const queryClient = useQueryClient()
  return useMutation<boolean, Error, { orderId: string; addOnLineId: string }, OrderMutationContext>({
    mutationFn: ({ orderId, addOnLineId }) =>
      posCheckoutRepository.removeOrderServiceAddOnLine(businessId as string, orderId, addOnLineId),
    onMutate: async ({ orderId, addOnLineId }) => {
      const context = await snapshotOrderDetail(queryClient, businessId, orderId)
      const removed = context.previousOrder?.serviceLines
        .flatMap((line) => line.addOns)
        .find((addOn) => addOn.id === addOnLineId)
      if (context.previousOrder && removed) {
        queryClient.setQueryData<OrderDetailApiDto>(context.queryKey, {
          ...applyOrderTotalsPatch(context.previousOrder, {
            servicesSubtotal: roundCurrency(context.previousOrder.servicesSubtotal - removed.lineTotal),
            discountAmount: roundCurrency(context.previousOrder.discountAmount - removed.discountAmount),
          }),
          serviceLines: context.previousOrder.serviceLines.map((line) => ({
            ...line,
            addOns: line.addOns.filter((addOn) => addOn.id !== addOnLineId),
          })),
        })
      }
      return context
    },
    onError: (_err, _vars, context) => rollbackOrderDetail(queryClient, context),
    onSuccess: (_result, { orderId }) => {
      queryClient.invalidateQueries({ queryKey: qk.merchantPosOrderDetail(businessId, orderId) })
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
          : context.previousOrder.productLines
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
    onSuccess: (newProductLineId, { orderId, quantity = 1, unitPrice, productName }) => {
      const queryKey = qk.merchantPosOrderDetail(businessId, orderId)
      const current = queryClient.getQueryData<OrderDetailApiDto>(queryKey)
      const lineTotal = roundCurrency(unitPrice * quantity)
      const productLines = current
        ? withPersistedLine(current.productLines, newProductLineId, (id) => ({
            id,
            productName,
            unitPrice,
            quantity,
            lineTotal,
          }))
        : null
      if (current && productLines) {
        queryClient.setQueryData<OrderDetailApiDto>(queryKey, { ...current, productLines })
      }
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
      unlessOptimisticId(
        productLineId,
        () => posCheckoutRepository.updateOrderProductLineQuantity(businessId as string, orderId, productLineId, quantity),
        false,
      ),
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
      unlessOptimisticId(
        productLineId,
        () => posCheckoutRepository.removeOrderProductLine(businessId as string, orderId, productLineId),
        false,
      ),
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

// Live line edit: sets or clears the discount on one service line. No optimistic patch — the
// resolved dollar amount, the technician's share and any bearer fallback are all decided
// server-side, so guessing them here would only flicker the wrong numbers onto the summary.
export function useSetOrderServiceLineDiscount(businessId?: string) {
  const queryClient = useQueryClient()
  return useMutation<
    boolean,
    Error,
    { orderId: string; serviceLineId: string; payload: SetOrderServiceLineDiscountPayload }
  >({
    mutationFn: ({ orderId, serviceLineId, payload }) =>
      unlessOptimisticId(
        serviceLineId,
        () => posCheckoutRepository.setOrderServiceLineDiscount(businessId as string, orderId, serviceLineId, payload),
        false,
      ),
    onSuccess: (_result, { orderId }) => {
      queryClient.invalidateQueries({ queryKey: qk.merchantPosOrderDetail(businessId, orderId) })
    },
  })
}

// The offers this visit qualifies for. Fetched when the discount panel opens and left alone
// afterwards: eligibility is decided by the visit's check-in time, which cannot change, so nothing
// the operator does at the counter can alter this list.
export function useEligiblePromotions(businessId?: string, orderId?: string, enabled = true) {
  return useQuery<EligiblePromotionApiDto[]>({
    queryKey: qk.merchantPosEligiblePromotions(businessId, orderId),
    queryFn: () => posCheckoutRepository.getEligiblePromotions(businessId as string, orderId as string),
    enabled: Boolean(businessId) && Boolean(orderId) && enabled,
  })
}

// Sets, replaces or clears the single order-level discount. The optimistic patch keeps the payment
// summary responsive to a tap; the resolved figure, the cap and any promotion link come back from
// the refetch, which is the only source that can be trusted.
export function useSetOrderDiscount(businessId?: string) {
  const queryClient = useQueryClient()
  return useMutation<boolean, Error, { orderId: string; payload: SetOrderDiscountPayload }, OrderMutationContext>({
    mutationFn: ({ orderId, payload }) =>
      posCheckoutRepository.setOrderDiscount(businessId as string, orderId, payload),
    onMutate: async ({ orderId, payload }) => {
      const context = await snapshotOrderDetail(queryClient, businessId, orderId)
      // A promotion carries its own rate, which only the server knows — no preview for that case.
      if (context.previousOrder && !payload.promotionId) {
        queryClient.setQueryData<OrderDetailApiDto>(
          context.queryKey,
          applyOrderTotalsPatch(context.previousOrder, {
            orderDiscountType: payload.discountType,
            orderDiscountValue: payload.discountValue,
          }),
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

export function useSetOrderNote(businessId?: string) {
  const queryClient = useQueryClient()
  return useMutation<boolean, Error, { orderId: string; note: string | null }, OrderMutationContext>({
    mutationFn: ({ orderId, note }) =>
      posCheckoutRepository.setOrderNote(businessId as string, orderId, note),
    onMutate: async ({ orderId, note }) => {
      const context = await snapshotOrderDetail(queryClient, businessId, orderId)
      if (context.previousOrder) {
        queryClient.setQueryData<OrderDetailApiDto>(context.queryKey, { ...context.previousOrder, note })
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
