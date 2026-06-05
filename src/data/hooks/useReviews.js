/**
 * useReviews — TanStack Query hooks for the reviews domain.
 *
 * Hooks:
 *   useReviews()        → useQuery list of all reviews
 *   useAddReview()      → useMutation to append a review
 *   useUpdateReview()   → useMutation to patch a review by id
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { qk } from '../queryKeys'
import reviewsRepository from '../repositories/reviews'

export function useReviews() {
  return useQuery({
    queryKey: qk.reviews(),
    queryFn: () => reviewsRepository.list(),
  })
}

export function useAddReview() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (review) => reviewsRepository.add(review),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.reviews() })
    },
  })
}

export function useUpdateReview() {
  const queryClient = useQueryClient()
  return useMutation({
    /**
     * @param {{ id: string, patch: object }} args
     */
    mutationFn: ({ id, patch }) => reviewsRepository.update(id, patch),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.reviews() })
    },
  })
}
