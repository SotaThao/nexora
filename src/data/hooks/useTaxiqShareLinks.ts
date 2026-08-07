/**
 * TanStack Query hooks for Share Links (mục 23) owner-side management.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { qk } from '../queryKeys'
import taxiqShareLinksRepository from '../repositories/taxiqShareLinks'
import type { CreateShareLinkParams, ShareLink, ShareLinkListItem } from '../repositories/taxiqShareLinks'

export function useShareLinks() {
  return useQuery<ShareLinkListItem[]>({
    queryKey: qk.taxiqShareLinks(),
    queryFn: () => taxiqShareLinksRepository.list(),
  })
}

export function useCreateShareLink() {
  const queryClient = useQueryClient()
  return useMutation<ShareLink, Error, CreateShareLinkParams>({
    mutationFn: (params) => taxiqShareLinksRepository.create(params),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qk.taxiqShareLinks() }),
  })
}

export function usePublishShareLink() {
  const queryClient = useQueryClient()
  return useMutation<void, Error, string>({
    mutationFn: (id) => taxiqShareLinksRepository.publish(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qk.taxiqShareLinks() }),
  })
}

export function useRevokeShareLink() {
  const queryClient = useQueryClient()
  return useMutation<void, Error, { id: string; revokeReason?: string }>({
    mutationFn: ({ id, revokeReason }) => taxiqShareLinksRepository.revoke(id, revokeReason),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qk.taxiqShareLinks() }),
  })
}
