import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { useCommunityAuth } from '../../components/community/CommunityAuth'
import { logger } from '../../utils/logger'
import { qk } from '../queryKeys'
import { jobContactsRepository } from '../repositories/community'
import type {
  JobContactDto,
  JobContactsRepositoryError,
} from '../repositories/community'

export type { JobContactDto } from '../repositories/community'

interface MyJobContactsOptions {
  enabled: boolean
}

interface RecordJobContactInput {
  jobId: string
  channelId: string
}

export function useMyJobContacts({ enabled }: MyJobContactsOptions) {
  const { authReady, isAnonymous } = useCommunityAuth()
  return useQuery<JobContactDto[], JobContactsRepositoryError>({
    queryKey: qk.communityJobContacts(),
    queryFn: () => jobContactsRepository.listMyJobContacts(),
    enabled: enabled && authReady && !isAnonymous,
    retry: false,
  })
}

export function useRecordJobContact() {
  const queryClient = useQueryClient()
  return useMutation<void, JobContactsRepositoryError, RecordJobContactInput>({
    mutationFn: ({ jobId, channelId }) => jobContactsRepository.recordJobContact(jobId, channelId),
    onError: (error) => {
      logger.warn('[CommunityJobs] Failed to record job contact', error)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.communityJobContacts() })
    },
  })
}
