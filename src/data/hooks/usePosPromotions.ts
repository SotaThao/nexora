/**
 * TanStack Query hooks for the POS promotion catalog (All-Services Discount).
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { qk } from '../queryKeys'
import posPromotionsRepository from '../repositories/posPromotions'
import type {
  PosPromotionApiDto,
  PosPromotionDetailApiDto,
  PosPromotionPayload,
  PosPromotionStudioMetadataApiDto,
} from '../../types/repositories'

export function usePosPromotions(businessId?: string) {
  return useQuery<PosPromotionApiDto[]>({
    queryKey: qk.merchantPosPromotions(businessId),
    queryFn: () => posPromotionsRepository.getPosPromotions(businessId as string),
    enabled: Boolean(businessId),
  })
}

export function usePosPromotionDetail(businessId?: string, promotionId?: string) {
  return useQuery<PosPromotionDetailApiDto>({
    queryKey: qk.merchantPosPromotionDetail(businessId, promotionId),
    queryFn: () =>
      posPromotionsRepository.getPosPromotion(businessId as string, promotionId as string),
    enabled: Boolean(businessId && promotionId),
  })
}

export function usePosPromotionTemplates() {
  return useQuery<PosPromotionStudioMetadataApiDto>({
    queryKey: qk.merchantPosPromotionTemplates(),
    queryFn: () => posPromotionsRepository.getPosPromotionTemplates(),
    staleTime: 5 * 60 * 1000,
  })
}

export function useCreatePosPromotion(businessId?: string) {
  const queryClient = useQueryClient()
  return useMutation<string, Error, PosPromotionPayload>({
    mutationFn: (payload) => posPromotionsRepository.createPosPromotion(businessId as string, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.merchantPosPromotions(businessId) })
    },
  })
}

export function useUpdatePosPromotion(businessId?: string) {
  const queryClient = useQueryClient()
  return useMutation<boolean, Error, { promotionId: string; payload: PosPromotionPayload }>({
    mutationFn: ({ promotionId, payload }) =>
      posPromotionsRepository.updatePosPromotion(businessId as string, promotionId, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: qk.merchantPosPromotions(businessId) })
      queryClient.invalidateQueries({
        queryKey: qk.merchantPosPromotionDetail(businessId, variables.promotionId),
      })
    },
  })
}

export function useDeletePosPromotion(businessId?: string) {
  const queryClient = useQueryClient()
  return useMutation<boolean, Error, string>({
    mutationFn: (promotionId) =>
      posPromotionsRepository.deletePosPromotion(businessId as string, promotionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.merchantPosPromotions(businessId) })
    },
  })
}
