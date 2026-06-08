/**
 * useReviews — TanStack Query hooks for the reviews domain.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { qk } from '../queryKeys'
import reviewsRepository from '../repositories/reviews'

export function useDashboardReviews(filters = {}) {
  return useQuery({
    queryKey: qk.dashboardReviews(filters),
    queryFn: () => reviewsRepository.list(filters),
  })
}

export function useResolveReview() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dto }) => reviewsRepository.resolve(id, dto),
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
    mutationFn: (review) => reviewsRepository.add(review),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.reviews() })
    },
  })
}

/** @deprecated */
export function useUpdateReview() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, patch }) => reviewsRepository.update(id, patch),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.reviews() })
    },
  })
}
