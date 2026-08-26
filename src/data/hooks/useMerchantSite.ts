// TanStack Query Hooks for Merchant Site — US-107
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  MerchantSiteStatus,
} from '../../constants/merchantSiteStatus'
import type { MerchantSiteDto } from '../../constants/merchantSiteStatus'
import { merchantSiteRepository } from '../repositories/merchantSite'
import type {
  MerchantSiteIdentity,
  UpdateMerchantSitePayload,
} from '../repositories/merchantSite'
import { qk } from '../queryKeys'

export function useMerchantSiteQuery(
  businessSlug: string = '',
  identity?: MerchantSiteIdentity,
) {
  return useQuery<MerchantSiteDto>({
    queryKey: qk.merchantSite(businessSlug),
    queryFn: () => merchantSiteRepository.getMerchantSite(businessSlug, identity),
    staleTime: 30_000,
  })
}

export function useUpdateMerchantSiteMutation(businessSlug: string = '') {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: UpdateMerchantSitePayload) =>
      merchantSiteRepository.updateMerchantSite(businessSlug, payload),
    onSuccess: (updated) => {
      queryClient.setQueryData(qk.merchantSite(businessSlug), updated)
      void queryClient.invalidateQueries({ queryKey: qk.merchantSite(businessSlug) })
    },
  })
}

export function useUpdateMerchantSiteStatusMutation(
  businessSlug: string = '',
  identity?: MerchantSiteIdentity,
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (status: MerchantSiteStatus) =>
      merchantSiteRepository.updateMerchantSiteStatus(businessSlug, status, identity),
    onSuccess: (updated) => {
      queryClient.setQueryData(qk.merchantSite(businessSlug), updated)
      void queryClient.invalidateQueries({ queryKey: qk.merchantSite(businessSlug) })
    },
  })
}
