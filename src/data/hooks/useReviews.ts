/**
 * useReviews — TanStack Query hooks for the reviews domain.
 */
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { qk } from '../queryKeys'
import reviewsRepository from '../repositories/reviews'
import { useSessionRole } from '../../auth/useSessionRole'
import type { ReviewRecord } from '../../types/domain'
import type { DashboardReviewsPage, DashboardReviewsQuery } from '../../types/repositories'
import type { ResolveReviewVars } from '../../types/hooks'

const EMPTY_QUERY: DashboardReviewsQuery = {}

export const DASHBOARD_REVIEWS_LIST_QUERY: DashboardReviewsQuery = {
  pageNumber: 1,
  pageSize: 20,
}

export function useDashboardReviews(
  query: DashboardReviewsQuery = DASHBOARD_REVIEWS_LIST_QUERY,
  { enabled: callerEnabled = true } = {},
) {
  const { isOwner } = useSessionRole()

  return useQuery<DashboardReviewsPage>({
    queryKey: qk.dashboardReviews(query),
    queryFn: () => reviewsRepository.listPaged(query),
    enabled: isOwner && callerEnabled,
    retry: false,
    refetchOnMount: true,
    placeholderData: keepPreviousData,
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

/** @deprecated Prefer useDashboardReviews */
export function useReviews(
  query: DashboardReviewsQuery = EMPTY_QUERY,
  { enabled: callerEnabled = true } = {},
) {
  const { isOwner } = useSessionRole()
  return useQuery<ReviewRecord[]>({
    queryKey: qk.reviews(),
    queryFn: () => reviewsRepository.list(query),
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
