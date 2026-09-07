/**
 * TanStack Query hooks for POS Front Desk "Customer" tab (US-043). Read-only — no mutations,
 * no cache invalidation. Usable by both Owner and Staff sessions (gated server-side via
 * IPosOperationsAccessService, same as the rest of POS Merchant Ops).
 */
import { useQuery } from '@tanstack/react-query'
import { qk } from '../queryKeys'
import posCustomersRepository from '../repositories/posCustomers'
import type {
  PosCustomerDetailApiDto,
  PosCustomerListPage,
  PosCustomerListQuery,
  PosCustomerOrderHistoryPage,
  PosCustomerOrderHistoryQuery,
} from '../../types/repositories'

export function usePosCustomerList(businessId?: string, filters: PosCustomerListQuery = {}) {
  return useQuery<PosCustomerListPage>({
    queryKey: qk.merchantPosCustomerList(businessId, filters),
    queryFn: () => posCustomersRepository.getCustomerList(businessId as string, filters),
    enabled: Boolean(businessId),
  })
}

export function usePosCustomerDetail(businessId?: string, customerId?: string) {
  return useQuery<PosCustomerDetailApiDto | null>({
    queryKey: qk.merchantPosCustomerDetail(businessId, customerId),
    queryFn: () => posCustomersRepository.getCustomerDetail(businessId as string, customerId as string),
    enabled: Boolean(businessId) && Boolean(customerId),
  })
}

export function usePosCustomerOrderHistory(
  businessId?: string,
  customerId?: string,
  filters: PosCustomerOrderHistoryQuery = {},
) {
  return useQuery<PosCustomerOrderHistoryPage>({
    queryKey: qk.merchantPosCustomerOrders(businessId, customerId, filters),
    queryFn: () =>
      posCustomersRepository.getCustomerOrderHistory(businessId as string, customerId as string, filters),
    enabled: Boolean(businessId) && Boolean(customerId),
  })
}
