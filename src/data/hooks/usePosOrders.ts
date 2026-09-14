/**
 * TanStack Query hooks for POS Merchant Ops: Check-in & Waitlist (US-12, refactored
 * to Order in US-026). Usable by both Owner and Staff sessions (gated server-side via
 * IPosOperationsAccessService) — see usePosAccess for the FE show/hide check.
 */
import { useQuery, useMutation, useQueryClient, keepPreviousData, type QueryKey } from '@tanstack/react-query'
import { qk } from '../queryKeys'
import { useSessionRole } from '../../auth/useSessionRole'
import posOrdersRepository from '../repositories/posOrders'
import { isPersistedLineId, unlessOptimisticId } from '../../utils/uuid'
import type {
  AssignableStaffApiDto,
  CheckInOrderPayload,
  CheckInOverviewApiDto,
  CheckInOverviewDetailApiDto,
  CheckInOverviewQuery,
  CompletedOrdersListQuery,
  CompletedOrdersPage,
  CustomerLookupResultApiDto,
  OrderDetailApiDto,
  OrderListItemApiDto,
  PosCheckInResultApiDto,
  PosWaitlistOrderApiDto,
  ReassignableStaffApiDto,
  ReassignPayrollWarningApiDto,
  ServiceLineReassignmentApiDto,
} from '../../types/repositories'

// A US phone number needs at least this many digits before a lookup round-trip is worth
// firing — avoids querying on every keystroke of a partial number.
const CUSTOMER_LOOKUP_MIN_DIGITS = 10

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
  return useMutation<PosCheckInResultApiDto, Error, CheckInOrderPayload>({
    mutationFn: (payload) => posOrdersRepository.checkInOrder(businessId as string, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.merchantPosWaitlist(businessId) })
      queryClient.invalidateQueries({ queryKey: qk.merchantPosOrderList(businessId) })
      queryClient.invalidateQueries({ queryKey: qk.merchantPosCheckInOverview(businessId) })
    },
  })
}

// Check-in "returning customer" suggestion (Ticket 2) — only fires once `phone` has
// enough digits to plausibly be a real number; the caller is responsible for debouncing
// keystrokes before this becomes enabled.
export function useCustomerLookupByPhone(businessId?: string, phone?: string) {
  const { isAuthenticated } = useSessionRole()
  const digitCount = (phone ?? '').replace(/\D/g, '').length
  return useQuery<CustomerLookupResultApiDto | null>({
    queryKey: qk.merchantPosCustomerLookup(businessId, phone),
    queryFn: () => posOrdersRepository.getCustomerLookupByPhone(businessId as string, phone as string),
    enabled: isAuthenticated && Boolean(businessId) && digitCount >= CUSTOMER_LOOKUP_MIN_DIGITS,
    retry: false,
    // Never cached beyond the visit it belongs to. The key already includes the full phone, so a
    // staleTime deduped nothing across guests — it only served a stale answer back for the same
    // number, which is how a guest who checked in minutes ago came back as "no name on file".
    gcTime: 0,
    staleTime: 0,
  })
}

// Order List tab (US-17) — Waiting + InService combined.
export function useOrderList(
  businessId?: string,
  options?: { enabled?: boolean; refetchInterval?: number | false },
) {
  const { isAuthenticated } = useSessionRole()
  return useQuery<OrderListItemApiDto[]>({
    queryKey: qk.merchantPosOrderList(businessId),
    queryFn: () => posOrdersRepository.getOrderList(businessId as string),
    enabled: isAuthenticated && Boolean(businessId) && (options?.enabled ?? true),
    retry: false,
    refetchInterval: options?.refetchInterval ?? 15000,
  })
}

export function useCheckInOverview(
  businessId: string | undefined,
  filters: CheckInOverviewQuery,
  options?: { enabled?: boolean },
) {
  const { isAuthenticated } = useSessionRole()
  return useQuery<CheckInOverviewApiDto>({
    queryKey: qk.merchantPosCheckInOverview(businessId, filters),
    queryFn: () => posOrdersRepository.getCheckInOverview(businessId as string, filters),
    enabled: isAuthenticated && Boolean(businessId) && (options?.enabled ?? true),
    placeholderData: keepPreviousData,
    retry: false,
  })
}

export function useCheckInOverviewDetail(businessId: string | undefined, orderId: string | undefined) {
  const { isAuthenticated } = useSessionRole()
  return useQuery<CheckInOverviewDetailApiDto>({
    queryKey: qk.merchantPosCheckInOverviewDetail(businessId, orderId),
    queryFn: () => posOrdersRepository.getCheckInOverviewDetail(businessId as string, orderId as string),
    enabled: isAuthenticated && Boolean(businessId) && Boolean(orderId),
    retry: false,
  })
}

// Completed Orders panel (US-17 follow-up) — paginated + filterable by date range/
// customer name/phone. keepPreviousData avoids a flicker back to an empty list while the
// user is paging or adjusting filters.
export function useCompletedOrders(
  businessId: string | undefined,
  filters: CompletedOrdersListQuery,
  options?: { enabled?: boolean; refetchInterval?: number | false },
) {
  const { isAuthenticated } = useSessionRole()
  return useQuery<CompletedOrdersPage>({
    queryKey: qk.merchantPosCompletedOrders(businessId, filters),
    queryFn: () => posOrdersRepository.getCompletedOrders(businessId as string, filters),
    enabled: isAuthenticated && Boolean(businessId) && (options?.enabled ?? true),
    placeholderData: keepPreviousData,
    retry: false,
    refetchInterval: options?.refetchInterval,
  })
}

export function useCancelOrder(businessId?: string) {
  const queryClient = useQueryClient()
  return useMutation<boolean, Error, string>({
    mutationFn: (orderId) => posOrdersRepository.cancelOrder(businessId as string, orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.merchantPosWaitlist(businessId) })
      queryClient.invalidateQueries({ queryKey: qk.merchantPosOrderList(businessId) })
      queryClient.invalidateQueries({ queryKey: qk.merchantPosCheckInOverview(businessId) })
    },
  })
}

// US-026 — assigns one staff member to one service line (not the whole order).
// Does not by itself flip the order to InService — see useStartOrderService.
// `technicianName` is UI-only: it patches the ticket line immediately so the desk never
// flashes the previous technician while GetOrderDetailQuery round-trips.
export function useAssignStaffToServiceLine(businessId?: string) {
  const queryClient = useQueryClient()
  return useMutation<
    boolean,
    Error,
    {
      orderId: string
      serviceLineId: string
      posStaffProfileId?: string
      technicianName?: string | null
      note?: string
    },
    { previousOrder?: OrderDetailApiDto; queryKey: QueryKey }
  >({
    mutationFn: ({ orderId, serviceLineId, posStaffProfileId, note }) =>
      unlessOptimisticId(
        serviceLineId,
        () =>
          posOrdersRepository.assignStaffToServiceLine(
            businessId as string,
            orderId,
            serviceLineId,
            posStaffProfileId,
            note,
          ),
        false,
      ),
    onMutate: async ({ orderId, serviceLineId, posStaffProfileId, technicianName, note }) => {
      if (!isPersistedLineId(serviceLineId)) return
      const queryKey = qk.merchantPosOrderDetail(businessId, orderId)
      await queryClient.cancelQueries({ queryKey })
      const previousOrder = queryClient.getQueryData<OrderDetailApiDto>(queryKey)
      if (previousOrder) {
        queryClient.setQueryData<OrderDetailApiDto>(queryKey, {
          ...previousOrder,
          serviceLines: previousOrder.serviceLines.map((line) =>
            line.id === serviceLineId
              ? {
                  ...line,
                  assignedPosStaffProfileId: posStaffProfileId ?? null,
                  technicianName: technicianName ?? null,
                  note: note ?? line.note,
                }
              : line,
          ),
        })
      }
      return { previousOrder, queryKey }
    },
    onError: (_err, _vars, context) => {
      if (context?.previousOrder) {
        queryClient.setQueryData(context.queryKey, context.previousOrder)
      }
    },
    onSuccess: async (_result, { orderId }) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: qk.merchantPosWaitlist(businessId) }),
        queryClient.invalidateQueries({ queryKey: qk.merchantPosOrderList(businessId) }),
        queryClient.invalidateQueries({ queryKey: qk.merchantPosTurnBoard(businessId) }),
        queryClient.invalidateQueries({ queryKey: qk.merchantPosOrderDetail(businessId, orderId) }),
        queryClient.invalidateQueries({ queryKey: qk.merchantPosCheckInOverview(businessId) }),
      ])
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
      queryClient.invalidateQueries({ queryKey: qk.merchantPosCheckInOverview(businessId) })
    },
  })
}

// Technician picker filtered by skill for one service — includes busy staff (isBusy flag)
// so the manager can still assign them as an explicit override.
export function useAssignableStaffForService(
  businessId?: string,
  posServiceId?: string,
  scheduledAt?: string,
) {
  const { isAuthenticated } = useSessionRole()
  return useQuery<AssignableStaffApiDto[]>({
    queryKey: qk.merchantPosAssignableStaff(businessId, posServiceId, scheduledAt),
    queryFn: () => posOrdersRepository.getAssignableStaffForService(
      businessId as string,
      posServiceId as string,
      scheduledAt,
    ),
    enabled: isAuthenticated && Boolean(businessId) && Boolean(posServiceId),
    retry: false,
  })
}

// Accept / decline / start one service line. All three invalidate the same boards: declining
// hands the line back to the floor, and starting can flip the whole ticket to In Service.
function useServiceLineAction(
  businessId: string | undefined,
  action: (businessId: string, orderId: string, serviceLineId: string) => Promise<boolean>,
) {
  const queryClient = useQueryClient()
  return useMutation<boolean, Error, { orderId: string; serviceLineId: string }>({
    mutationFn: ({ orderId, serviceLineId }) =>
      unlessOptimisticId(
        serviceLineId,
        () => action(businessId as string, orderId, serviceLineId),
        false,
      ),
    onSuccess: (_result, { orderId }) => {
      queryClient.invalidateQueries({ queryKey: qk.merchantPosOrderDetail(businessId, orderId) })
      queryClient.invalidateQueries({ queryKey: qk.merchantPosOrderList(businessId) })
      queryClient.invalidateQueries({ queryKey: qk.merchantPosWaitlist(businessId) })
      queryClient.invalidateQueries({ queryKey: qk.merchantPosTurnBoard(businessId) })
      queryClient.invalidateQueries({ queryKey: qk.merchantPosCheckInOverview(businessId) })
    },
  })
}

export function useAcceptServiceLine(businessId?: string) {
  return useServiceLineAction(businessId, posOrdersRepository.acceptServiceLine)
}

export function useRejectServiceLine(businessId?: string) {
  return useServiceLineAction(businessId, posOrdersRepository.rejectServiceLine)
}

export function useStartServiceLine(businessId?: string) {
  return useServiceLineAction(businessId, posOrdersRepository.startServiceLine)
}

// US-026 — frees the assigned staff on this line immediately, independent of the
// rest of the order.
export function useMarkServiceLineDone(businessId?: string) {
  const queryClient = useQueryClient()
  return useMutation<boolean, Error, { orderId: string; serviceLineId: string }>({
    mutationFn: ({ orderId, serviceLineId }) =>
      unlessOptimisticId(
        serviceLineId,
        () => posOrdersRepository.markServiceLineDone(businessId as string, orderId, serviceLineId),
        false,
      ),
    onSuccess: (_result, { orderId }) => {
      queryClient.invalidateQueries({ queryKey: qk.merchantPosTurnBoard(businessId) })
      queryClient.invalidateQueries({ queryKey: qk.merchantPosOrderDetail(businessId, orderId) })
      queryClient.invalidateQueries({ queryKey: qk.merchantPosOrderList(businessId) })
      queryClient.invalidateQueries({ queryKey: qk.merchantPosWaitlist(businessId) })
      queryClient.invalidateQueries({ queryKey: qk.merchantPosCheckInOverview(businessId) })
    },
  })
}

// Reassigning the technician on a COMPLETED ticket (Reassign Technician on Completed Visits).
// Only offered when usePosAccess reports canReassignCompletedOrderStaff.
export function useReassignableStaff(businessId?: string, orderId?: string, serviceLineId?: string) {
  const { isAuthenticated } = useSessionRole()
  return useQuery<ReassignableStaffApiDto[]>({
    queryKey: qk.merchantPosReassignableStaff(businessId, orderId, serviceLineId),
    queryFn: () => posOrdersRepository.getReassignableStaff(
      businessId as string,
      orderId as string,
      serviceLineId as string,
    ),
    enabled: isAuthenticated && Boolean(businessId) && Boolean(orderId) && Boolean(serviceLineId),
    retry: false,
  })
}

// Asked when the dialog opens and again after a technician is picked. Never cached across visits:
// a payout made since the dialog was last open would otherwise go unmentioned.
export function useReassignPayrollWarning(
  businessId?: string,
  orderId?: string,
  serviceLineId?: string,
  newPosStaffProfileId?: string,
) {
  const { isAuthenticated } = useSessionRole()
  return useQuery<ReassignPayrollWarningApiDto | null>({
    queryKey: qk.merchantPosReassignPayrollWarning(businessId, orderId, serviceLineId, newPosStaffProfileId),
    queryFn: () => posOrdersRepository.getReassignPayrollWarning(
      businessId as string,
      orderId as string,
      serviceLineId as string,
      newPosStaffProfileId,
    ),
    enabled: isAuthenticated && Boolean(businessId) && Boolean(orderId) && Boolean(serviceLineId),
    staleTime: 0,
    gcTime: 0,
    retry: false,
  })
}

export function useServiceLineReassignmentHistory(
  businessId?: string,
  orderId?: string,
  serviceLineId?: string,
) {
  const { isAuthenticated } = useSessionRole()
  return useQuery<ServiceLineReassignmentApiDto[]>({
    queryKey: qk.merchantPosServiceLineReassignments(businessId, orderId, serviceLineId),
    queryFn: () => posOrdersRepository.getServiceLineReassignmentHistory(
      businessId as string,
      orderId as string,
      serviceLineId as string,
    ),
    enabled: isAuthenticated && Boolean(businessId) && Boolean(orderId) && Boolean(serviceLineId),
    retry: false,
  })
}

export function useReassignCompletedOrderServiceLineStaff(businessId?: string) {
  const queryClient = useQueryClient()
  return useMutation<
    boolean,
    Error,
    { orderId: string; serviceLineId: string; newPosStaffProfileId: string; reason: string }
  >({
    mutationFn: ({ orderId, serviceLineId, newPosStaffProfileId, reason }) =>
      posOrdersRepository.reassignCompletedOrderServiceLineStaff(
        businessId as string,
        orderId,
        serviceLineId,
        newPosStaffProfileId,
        reason,
      ),
    onSuccess: (_result, { orderId, serviceLineId }) => {
      // Pay and reports are derived from the line's assignment, so everything that reads earnings
      // for that week is now stale — including screens the manager may already have open.
      queryClient.invalidateQueries({ queryKey: qk.merchantPosOrderDetail(businessId, orderId) })
      queryClient.invalidateQueries({ queryKey: qk.merchantPosCompletedOrders(businessId) })
      queryClient.invalidateQueries({
        queryKey: qk.merchantPosServiceLineReassignments(businessId, orderId, serviceLineId),
      })
      queryClient.invalidateQueries({
        queryKey: qk.merchantPosReassignableStaff(businessId, orderId, serviceLineId),
      })
      queryClient.invalidateQueries({ queryKey: qk.merchantPosWeeklyPayroll(businessId) })
      queryClient.invalidateQueries({ queryKey: qk.merchantPosReport(businessId) })
      queryClient.invalidateQueries({ queryKey: qk.merchantPosStoreIncomeReport(businessId) })
    },
  })
}
