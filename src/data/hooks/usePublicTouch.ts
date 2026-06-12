/**
 * usePublicTouch — TanStack Query hooks for the public customer touch domain.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

import { qk } from '../queryKeys'
import publicTouchRepository from '../repositories/publicTouch'
import publicBusinessesRepository from '../repositories/publicBusinesses'
import type { PaymentMethodDto } from '../../types/domain'
import type {
  CreateMultiStaffTipVars,
  CreateReviewVars,
  CreateTipVars,
  CustomerTouchPageVars,
  SkipTipVars,
} from '../../types/hooks'

export function useCustomerTouchPage({ businessSlug, touchPointSlug, sessionId }: CustomerTouchPageVars) {
  return useQuery<LooseObject>({
    queryKey: qk.customerTouch(businessSlug, touchPointSlug, sessionId),
    queryFn: () =>
      publicTouchRepository.getTouchPage({ businessSlug, touchPointSlug, sessionId }),
    enabled: Boolean(businessSlug && touchPointSlug && sessionId),
  })
}

export function usePublicBusinessPaymentMethods(businessId?: string | null) {
  return useQuery<PaymentMethodDto[]>({
    queryKey: qk.publicBusinessPaymentMethods(businessId ?? ''),
    queryFn: () => publicBusinessesRepository.getPaymentMethods(businessId!),
    enabled: Boolean(businessId),
  })
}

export function useCreateTip() {
  return useMutation<LooseObject, Error, CreateTipVars>({
    mutationFn: (args) => publicTouchRepository.createTip(args),
  })
}

export function useConfirmTip() {
  const queryClient = useQueryClient()
  return useMutation<LooseObject, Error, string>({
    mutationFn: (tipId) => publicTouchRepository.confirmTip(tipId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customerTouch'] })
    },
  })
}

export function useSkipTip() {
  return useMutation<LooseObject, Error, SkipTipVars>({
    mutationFn: (args) => publicTouchRepository.skipTip(args),
  })
}

export function useCreateReview() {
  return useMutation<LooseObject, Error, CreateReviewVars>({
    mutationFn: (args) => publicTouchRepository.createReview(args),
  })
}

export function useTrackGoogle() {
  return useMutation<LooseObject, Error, string>({
    mutationFn: (reviewId) => publicTouchRepository.trackGoogle(reviewId),
  })
}

export function useTrackYelp() {
  return useMutation<LooseObject, Error, string>({
    mutationFn: (reviewId) => publicTouchRepository.trackYelp(reviewId),
  })
}

export function useCreateMultiStaffTip() {
  return useMutation<LooseObject, Error, CreateMultiStaffTipVars>({
    mutationFn: (args) => publicBusinessesRepository.createMultiStaffTip(args),
  })
}

export function useConfirmMultiStaffTip() {
  const queryClient = useQueryClient()
  return useMutation<LooseObject, Error, string>({
    mutationFn: (tipId) => publicBusinessesRepository.confirmMultiStaffTip(tipId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customerTouch'] })
    },
  })
}
