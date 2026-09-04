/**
 * TanStack Query hooks for the tech's own Work Orders.
 *
 * Not polled: fetch on open / date-status change / window focus.
 * Salon picker uses `useStaffBusinesses` so it shares the existing businesses cache.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { qk } from '../queryKeys'
import { useSessionRole } from '../../auth/useSessionRole'
import staffWorkOrdersRepository, {
  type StaffWorkOrderCatalogItem,
  type StaffWorkOrderDetail,
  type StaffWorkOrderListItem,
} from '../repositories/staffWorkOrders'
import type { SaveStaffWorkOrderServiceLinesPayload } from '../../types/repositories'
import type { PosOrderStatus } from '../../constants/posOrderStatus'

const ALL_STATUS_FILTER_KEY = 'all'

function listFilterKey(status: PosOrderStatus[] | undefined): string {
  return status?.length ? status.join(',') : ALL_STATUS_FILTER_KEY
}

export function useStaffWorkOrders(
  businessId: string | undefined,
  date: string,
  status: PosOrderStatus[] | undefined,
) {
  const { isStaff } = useSessionRole()
  const canLoad = isStaff && Boolean(businessId) && Boolean(date)

  return useQuery<StaffWorkOrderListItem[]>({
    queryKey: qk.staffWorkOrders(businessId, date, listFilterKey(status)),
    queryFn: () => staffWorkOrdersRepository.listWorkOrders({
      businessId: businessId ?? '',
      date,
      status,
    }),
    enabled: canLoad,
    retry: false,
  })
}

export function useStaffWorkOrderDetail(orderId: string | undefined) {
  const { isStaff } = useSessionRole()
  const canLoad = isStaff && Boolean(orderId)

  return useQuery<StaffWorkOrderDetail | null>({
    queryKey: qk.staffWorkOrderDetail(orderId),
    queryFn: () => staffWorkOrdersRepository.getWorkOrderDetail(orderId ?? ''),
    enabled: canLoad,
    retry: false,
  })
}

export function useStaffWorkOrderServiceCatalog(orderId: string | undefined) {
  const { isStaff } = useSessionRole()

  return useQuery<StaffWorkOrderCatalogItem[]>({
    queryKey: qk.staffWorkOrderServiceCatalog(orderId),
    queryFn: () => staffWorkOrdersRepository.getMyServiceCatalog(orderId ?? ''),
    enabled: isStaff && Boolean(orderId),
    retry: false,
  })
}

// Returns the saved ticket so the screen can re-seed from it instead of rendering the basket it
// just sent — the server is the one that resolved prices, ids and line statuses.
export function useSaveMyWorkOrderServiceLines(orderId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: SaveStaffWorkOrderServiceLinesPayload) =>
      staffWorkOrdersRepository.saveMyServiceLines(orderId ?? '', payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: qk.staffWorkOrdersRoot() })
    },
  })
}

function useStaffWorkOrderStatusMutation(
  orderId: string | undefined,
  mutate: (id: string) => Promise<boolean>,
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => mutate(orderId ?? ''),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: qk.staffWorkOrdersRoot() })
    },
  })
}

export function useStartStaffWorkOrderService(orderId: string | undefined) {
  return useStaffWorkOrderStatusMutation(orderId, (id) =>
    staffWorkOrdersRepository.startWorkOrderService(id),
  )
}

export function useCompleteStaffWorkOrderService(orderId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (note?: string | null) =>
      staffWorkOrdersRepository.completeWorkOrderService(orderId ?? '', note),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: qk.staffWorkOrdersRoot() })
    },
  })
}
