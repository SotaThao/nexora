import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { qk } from '../queryKeys'
import communityJobsRepository from '../repositories/communityJobs'
import type { PaginatedResponse } from '../../types/domain'
import type {
  HiringFeedFilters,
  JobApplication,
  JobApplicationInput,
  SeekingPost,
  SeekingPostUpsertInput,
} from '../../types/communityJobs'
import type { PosJobPosting } from '../../types/posRecruitment'

export { COMMUNITY_JOBS_IS_SIMULATED } from '../repositories/communityJobsMockClient'

interface SeekingPostWriteVariables {
  input: SeekingPostUpsertInput
  id?: string
}

export function useStaffHiringFeed(filters: HiringFeedFilters, options: { enabled?: boolean } = {}) {
  const { enabled = true } = options
  return useQuery<PaginatedResponse<PosJobPosting>>({
    queryKey: qk.staffCommunityJobFeed(filters),
    queryFn: () => communityJobsRepository.listHiringFeed(filters),
    enabled,
    retry: false,
    placeholderData: (previousData) => previousData,
  })
}

export function useStaffSeekingPosts(staffKey: string | undefined) {
  return useQuery<PaginatedResponse<SeekingPost>>({
    queryKey: qk.staffCommunitySeekingPosts(staffKey),
    queryFn: () => communityJobsRepository.listMySeekingPosts(staffKey as string),
    enabled: Boolean(staffKey),
    retry: false,
  })
}

export function useSaveStaffSeekingDraft(staffKey: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation<SeekingPost, Error, SeekingPostWriteVariables>({
    mutationFn: ({ input, id }) => communityJobsRepository.saveSeekingDraft(staffKey as string, input, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staffCommunityJobs', 'mySeekingPosts'] })
    },
  })
}

export function usePublishStaffSeekingPost(staffKey: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation<SeekingPost, Error, SeekingPostWriteVariables>({
    mutationFn: ({ input, id }) => communityJobsRepository.publishSeekingPost(staffKey as string, input, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staffCommunityJobs', 'mySeekingPosts'] })
    },
  })
}

export function useCloseStaffSeekingPost(staffKey: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation<SeekingPost, Error, string>({
    mutationFn: (id) => communityJobsRepository.closeSeekingPost(staffKey as string, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staffCommunityJobs', 'mySeekingPosts'] })
    },
  })
}

export function useStaffJobApplications(staffKey: string | undefined) {
  return useQuery<PaginatedResponse<JobApplication>>({
    queryKey: qk.staffCommunityJobApplications(staffKey),
    queryFn: () => communityJobsRepository.listMyApplications(staffKey as string),
    enabled: Boolean(staffKey),
    retry: false,
  })
}

export function useApplyToHiringPosting(staffKey: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation<JobApplication, Error, JobApplicationInput>({
    mutationFn: (input) => communityJobsRepository.applyToPosting(staffKey as string, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staffCommunityJobs', 'myApplications'] })
      queryClient.invalidateQueries({ queryKey: ['staffCommunityJobs', 'feed'] })
    },
  })
}
