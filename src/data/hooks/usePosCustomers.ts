/**
 * TanStack Query hooks for POS Front Desk "Customer" tab (US-043 / US-112).
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { qk } from '../queryKeys'
import posCustomersRepository from '../repositories/posCustomers'
import type {
  PosCustomerDetailApiDto,
  PosCustomerImportPreviewDto,
  PosCustomerImportPreviewRequest,
  PosCustomerImportRequest,
  PosCustomerImportResultDto,
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

export function usePosOrderCustomerId(
  businessId?: string,
  orderId?: string,
  phoneE164?: string,
  enabled = false,
) {
  return useQuery<string | null>({
    queryKey: qk.merchantPosOrderCustomerId(businessId, orderId, phoneE164),
    queryFn: () => posCustomersRepository.getCustomerIdForOrder(
      businessId as string,
      orderId as string,
      phoneE164 as string,
    ),
    enabled: enabled && Boolean(businessId) && Boolean(orderId) && Boolean(phoneE164),
    retry: false,
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

export function usePosCustomerImportPreview(businessId?: string) {
  return useMutation<PosCustomerImportPreviewDto, Error, PosCustomerImportPreviewRequest>({
    mutationFn: (input) => posCustomersRepository.previewCustomerImport(businessId as string, input),
  })
}

export function usePosCustomerImport(businessId?: string) {
  const queryClient = useQueryClient()
  return useMutation<PosCustomerImportResultDto, Error, PosCustomerImportRequest>({
    mutationFn: (input) => posCustomersRepository.importCustomers(businessId as string, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: qk.merchantPosCustomerListRoot() })
    },
  })
}
