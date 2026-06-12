/**
 * useReviews — TanStack Query hooks for the reviews domain.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { qk } from '../queryKeys'
import reviewsRepository from '../repositories/reviews'
import { useSessionRole } from '../../auth/useSessionRole'
import type { ReviewRecord } from '../../types/domain'
import type { ResolveReviewVars } from '../../types/hooks'

const EMPTY_FILTERS = {}

export function useDashboardReviews(filters: LooseObject = EMPTY_FILTERS, { enabled: callerEnabled = true } = {}) {
  const { isOwner } = useSessionRole()
  return useQuery<ReviewRecord[]>({
    queryKey: qk.dashboardReviews(filters),
    queryFn: () => reviewsRepository.list(filters),
    enabled: isOwner && callerEnabled,
    retry: false,
  })
}

export function useResolveReview() {
  const queryClient = useQueryClient()
  return useMutation<LooseObject, Error, ResolveReviewVars>({
    mutationFn: ({ id, dto }) => reviewsRepository.resolve(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'reviews'] })
    },
  })
}

/** @deprecated */
export function useReviews({ enabled: callerEnabled = true } = {}) {
  const { isOwner } = useSessionRole()
  return useQuery<ReviewRecord[]>({
    queryKey: qk.reviews(),
    queryFn: () => reviewsRepository.list(),
    enabled: isOwner && callerEnabled,
    retry: false,
  })
}

/** @deprecated */
export function useAddReview() {
  const queryClient = useQueryClient()
  return useMutation<ReviewRecord, Error, ReviewRecord>({
    mutationFn: (review) => reviewsRepository.add(review),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.reviews() })
    },
  })
}

/** @deprecated */
export function useUpdateReview() {
  const queryClient = useQueryClient()
  return useMutation<void, Error, ResolveReviewVars & { patch: LooseObject }>({
    mutationFn: ({ id, patch }) => reviewsRepository.update(id, patch),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.reviews() })
    },
  })
}
