import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { qk } from '../queryKeys'
import posRecruitmentRepository from '../repositories/posRecruitment'
import type { MerchantBusinessInfo, PaginatedResponse } from '../../types/domain'
import type { PosJobPosting, PosJobPostingUpsertInput } from '../../types/posRecruitment'

export { POS_RECRUITMENT_IS_SIMULATED } from '../repositories/posRecruitmentMockClient'

const POS_JOB_POSTINGS_PREFIX = ['merchantSettings', 'posJobPostings'] as const

interface WriteVariables {
  input: PosJobPostingUpsertInput
  id?: string | null
}

export function usePosJobPostings(
  businessId?: string,
  businessInfo?: MerchantBusinessInfo,
  { enabled = true } = {},
) {
  return useQuery<PaginatedResponse<PosJobPosting>>({
    queryKey: qk.merchantPosJobPostings(businessId),
    queryFn: () => posRecruitmentRepository.listMyPostings(businessInfo, businessId),
    enabled: enabled && Boolean(businessId) && Boolean(businessInfo),
    retry: false,
  })
}

export function useSavePosJobPostingDraft() {
  const queryClient = useQueryClient()
  return useMutation<PosJobPosting, Error, WriteVariables>({
    mutationFn: ({ input, id }) => posRecruitmentRepository.saveDraft(input, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: POS_JOB_POSTINGS_PREFIX })
    },
  })
}

export function usePublishPosJobPosting() {
  const queryClient = useQueryClient()
  return useMutation<PosJobPosting, Error, WriteVariables>({
    mutationFn: ({ input, id }) => posRecruitmentRepository.publish(input, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: POS_JOB_POSTINGS_PREFIX })
    },
  })
}

export function useClosePosJobPosting() {
  const queryClient = useQueryClient()
  return useMutation<PosJobPosting, Error, string>({
    mutationFn: (id) => posRecruitmentRepository.closePosting(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: POS_JOB_POSTINGS_PREFIX })
    },
  })
}
