/**
 * useReviews — TanStack Query hooks for the reviews domain.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { qk } from '../queryKeys'
import reviewsRepository from '../repositories/reviews'

// Shared stable default so omitted-filter calls reuse one reference.
const EMPTY_FILTERS = {}

export function useDashboardReviews(filters = EMPTY_FILTERS) {
  return useQuery({
    queryKey: qk.dashboardReviews(filters),
    queryFn: () => reviewsRepository.list(filters),
  })
}

export function useResolveReview() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dto }: LooseObject) => reviewsRepository.resolve(id, dto),
    onSuccess: () => {
      // Invalidate all dashboardReviews queries regardless of filters
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'reviews'] })
    },
  })
}

/** @deprecated */
export function useReviews() {
  return useQuery({
    queryKey: qk.reviews(),
    queryFn: () => reviewsRepository.list(),
  })
}

/** @deprecated */
export function useAddReview() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (review: LooseObject) => reviewsRepository.add(review),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.reviews() })
    },
  })
}

/** @deprecated */
export function useUpdateReview() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, patch }: LooseObject) => reviewsRepository.update(id, patch),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.reviews() })
    },
  })
}
