/**
 * TanStack Query hooks for the POS promotion catalog (All-Services Discount).
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { qk } from '../queryKeys'
import posPromotionsRepository from '../repositories/posPromotions'
import type { PosPromotionApiDto, PosPromotionPayload } from '../../types/repositories'

export function usePosPromotions(businessId?: string) {
  return useQuery<PosPromotionApiDto[]>({
    queryKey: qk.merchantPosPromotions(businessId),
    queryFn: () => posPromotionsRepository.getPosPromotions(businessId as string),
    enabled: Boolean(businessId),
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.merchantPosPromotions(businessId) })
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
