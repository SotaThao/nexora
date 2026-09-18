import { useRef } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { qk } from '../queryKeys'
import { checkInEstimate, type EstimateCheckInDraft, type EstimateCheckInProgress } from '../repositories/posEstimate'

export function useEstimateCheckIn(businessId: string) {
  const queryClient = useQueryClient()
  const progress = useRef<EstimateCheckInProgress>({})
  const mutation = useMutation({
    mutationFn: (draft: EstimateCheckInDraft) => checkInEstimate(businessId, draft, progress.current),
    retry: false,
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: qk.merchantPosOrderList(businessId) })
      queryClient.invalidateQueries({ queryKey: qk.merchantPosWaitlist(businessId) })
      if (progress.current.result) {
        queryClient.invalidateQueries({ queryKey: qk.merchantPosOrderDetail(businessId, progress.current.result.orderId) })
      }
    },
  })
  return {
    ...mutation,
    progress: progress.current,
    reset: () => { progress.current = {}; mutation.reset() },
  }
}
