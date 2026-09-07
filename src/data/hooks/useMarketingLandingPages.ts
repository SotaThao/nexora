import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { qk } from '../queryKeys'
import marketingLandingPagesRepository from '../repositories/marketingLandingPages'

export function useMarketingLandingPages() {
  return useQuery({
    queryKey: qk.marketingLandingPages(),
    queryFn: marketingLandingPagesRepository.list,
  })
}

export function useSaveMarketingLandingPage() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: marketingLandingPagesRepository.save,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qk.marketingLandingPages() }),
  })
}

export function useMarketingCampaignDrafts() {
  return useQuery({
    queryKey: qk.marketingCampaignDrafts(),
    queryFn: marketingLandingPagesRepository.listCampaigns,
  })
}

export function useSaveMarketingCampaignDraft() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: marketingLandingPagesRepository.saveCampaign,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qk.marketingCampaignDrafts() }),
  })
}
