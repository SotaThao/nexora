import { useQuery } from '@tanstack/react-query'

import { qk } from '../queryKeys'
import communityJobsRepository from '../repositories/communityJobs'
import type { PostingApplicant } from '../../types/communityJobs'

export function useOwnerPostingApplicants(postingIds: string[]) {
  return useQuery<PostingApplicant[]>({
    queryKey: qk.ownerPostingApplicants(postingIds),
    queryFn: () => communityJobsRepository.listPostingApplicants(postingIds),
    enabled: postingIds.length > 0,
    retry: false,
  })
}
