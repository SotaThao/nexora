import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { qk } from '../queryKeys'
import {
  merchantVoiceSmsCampaignsRepository,
  type AnalyzeSmsTextRequest,
  type CreateSmsCampaignRequest,
  type CreateSmsCreditPurchaseRequest,
  type EstimateSmsCampaignRequest,
  type MerchantSmsCampaignRecipientsFilter,
  type MerchantSmsCampaignsFilter,
  type MerchantSmsCreditHistoryFilter,
  type SmsCampaignAudienceSummaryDto,
  type SmsCampaignCostEstimateDto,
  type SmsCampaignDashboardDto,
  type SmsCampaignDto,
  type SmsCampaignsPage,
  type SmsCampaignRecipientsPage,
  type SmsCreditHistoryPage,
  type SmsCreditSummaryDto,
  type SmsTextEstimateDto,
  type UpdateSmsCampaignRequest,
} from '../repositories/merchantVoiceSmsCampaigns'
import type { SmsCampaignStatus } from '../merchantVoice/domain'

const EMPTY_CAMPAIGN_FILTERS: MerchantSmsCampaignsFilter = {}
const EMPTY_RECIPIENT_FILTERS: MerchantSmsCampaignRecipientsFilter = {}
const EMPTY_CREDIT_HISTORY_FILTERS: MerchantSmsCreditHistoryFilter = {}

function invalidateSmsCampaignQueries(queryClient: ReturnType<typeof useQueryClient>, id?: string) {
  // Invalidate specific scopes only — a broad ['merchantVoice', 'smsCampaigns'] prefix also
  // matches detail/{id} and refetches GET .../sms-campaigns/{id} (often more than once) while
  // the edit dialog is still mounted (mutation onSuccess runs before the modal closes).
  queryClient.invalidateQueries({ queryKey: qk.merchantVoiceSmsCampaignDashboard() })
  queryClient.invalidateQueries({ queryKey: qk.merchantVoiceSmsCampaignAudienceSummary() })
  queryClient.invalidateQueries({ queryKey: ['merchantVoice', 'smsCampaigns', 'list'] })
  queryClient.invalidateQueries({ queryKey: ['merchantVoice', 'smsCredits'] })
  if (id) {
    queryClient.invalidateQueries({
      queryKey: qk.merchantVoiceSmsCampaignById(id),
      refetchType: 'none',
    })
    queryClient.invalidateQueries({
      queryKey: ['merchantVoice', 'smsCampaigns', id, 'recipients'],
    })
  }
}

export function useMerchantVoiceSmsCampaignDashboard({ enabled = true } = {}) {
  return useQuery<SmsCampaignDashboardDto>({
    queryKey: qk.merchantVoiceSmsCampaignDashboard(),
    queryFn: () => merchantVoiceSmsCampaignsRepository.getDashboard(),
    enabled,
  })
}

export function useMerchantVoiceSmsCampaignAudienceSummary({ enabled = true } = {}) {
  return useQuery<SmsCampaignAudienceSummaryDto>({
    queryKey: qk.merchantVoiceSmsCampaignAudienceSummary(),
    queryFn: () => merchantVoiceSmsCampaignsRepository.getAudienceSummary(),
    enabled,
  })
}

export function useMerchantVoiceSmsCampaigns(
  filters: MerchantSmsCampaignsFilter = EMPTY_CAMPAIGN_FILTERS,
  { enabled = true, refetchInterval = false as number | false } = {},
) {
  return useQuery<SmsCampaignsPage>({
    queryKey: qk.merchantVoiceSmsCampaigns(filters),
    queryFn: () => merchantVoiceSmsCampaignsRepository.getCampaigns(filters),
    enabled,
    refetchInterval,
    refetchIntervalInBackground: false,
  })
}

export function useMerchantVoiceSmsCampaign(
  id?: string | null,
  { enabled = true } = {},
) {
  return useQuery<SmsCampaignDto>({
    queryKey: qk.merchantVoiceSmsCampaignById(id),
    queryFn: () => merchantVoiceSmsCampaignsRepository.getCampaignById(id as string),
    enabled: enabled && !!id,
  })
}

export function useMerchantVoiceSmsCampaignRecipients(
  id?: string | null,
  filters: MerchantSmsCampaignRecipientsFilter = EMPTY_RECIPIENT_FILTERS,
  { enabled = true } = {},
) {
  return useQuery<SmsCampaignRecipientsPage>({
    queryKey: qk.merchantVoiceSmsCampaignRecipients(id, filters),
    queryFn: () => merchantVoiceSmsCampaignsRepository.getCampaignRecipients(id as string, filters),
    enabled: enabled && !!id,
  })
}

export function useMerchantVoiceSmsCreditSummary({ enabled = true } = {}) {
  return useQuery<SmsCreditSummaryDto>({
    queryKey: qk.merchantVoiceSmsCreditSummary(),
    queryFn: () => merchantVoiceSmsCampaignsRepository.getCreditSummary(),
    enabled,
  })
}

export function useMerchantVoiceSmsCreditHistory(
  filters: MerchantSmsCreditHistoryFilter = EMPTY_CREDIT_HISTORY_FILTERS,
  { enabled = true } = {},
) {
  return useQuery<SmsCreditHistoryPage>({
    queryKey: qk.merchantVoiceSmsCreditHistory(filters),
    queryFn: () => merchantVoiceSmsCampaignsRepository.getCreditHistory(filters),
    enabled,
  })
}

export function useEstimateMerchantVoiceSmsCampaign() {
  return useMutation<SmsCampaignCostEstimateDto, Error, EstimateSmsCampaignRequest>({
    mutationFn: (body) => merchantVoiceSmsCampaignsRepository.estimateCampaign(body),
  })
}

export function useAnalyzeMerchantVoiceSmsText() {
  return useMutation<SmsTextEstimateDto, Error, AnalyzeSmsTextRequest>({
    mutationFn: (body) => merchantVoiceSmsCampaignsRepository.analyzeSmsText(body),
  })
}

export function useCreateMerchantVoiceSmsCampaign() {
  const queryClient = useQueryClient()

  return useMutation<string, Error, CreateSmsCampaignRequest>({
    mutationFn: (body) => merchantVoiceSmsCampaignsRepository.createCampaign(body),
    onSuccess: () => {
      invalidateSmsCampaignQueries(queryClient)
    },
  })
}

export function useUpdateMerchantVoiceSmsCampaign() {
  const queryClient = useQueryClient()

  return useMutation<void, Error, { id: string; body: UpdateSmsCampaignRequest }>({
    mutationFn: ({ id, body }) => merchantVoiceSmsCampaignsRepository.updateCampaign(id, body),
    onSuccess: (_data, { id }) => {
      invalidateSmsCampaignQueries(queryClient, id)
    },
  })
}

export function useSendMerchantVoiceSmsCampaignNow() {
  const queryClient = useQueryClient()

  return useMutation<void, Error, string>({
    mutationFn: (id) => merchantVoiceSmsCampaignsRepository.sendCampaignNow(id),
    onSuccess: (_data, id) => {
      invalidateSmsCampaignQueries(queryClient, id)
    },
  })
}

export function useCancelMerchantVoiceSmsCampaign() {
  const queryClient = useQueryClient()

  return useMutation<void, Error, string>({
    mutationFn: (id) => merchantVoiceSmsCampaignsRepository.cancelCampaign(id),
    onSuccess: (_data, id) => {
      invalidateSmsCampaignQueries(queryClient, id)
    },
  })
}

export function useToggleMerchantVoiceSmsCampaignActive() {
  const queryClient = useQueryClient()

  return useMutation<SmsCampaignStatus, Error, string>({
    mutationFn: (id) => merchantVoiceSmsCampaignsRepository.toggleCampaignActive(id),
    onSuccess: (_data, id) => {
      invalidateSmsCampaignQueries(queryClient, id)
    },
  })
}

export function useDeleteMerchantVoiceSmsCampaign() {
  const queryClient = useQueryClient()

  return useMutation<void, Error, string>({
    mutationFn: (id) => merchantVoiceSmsCampaignsRepository.deleteCampaign(id),
    onSuccess: () => {
      invalidateSmsCampaignQueries(queryClient)
    },
  })
}

export function useCreateMerchantVoiceSmsCreditPurchase() {
  const queryClient = useQueryClient()

  return useMutation<string, Error, CreateSmsCreditPurchaseRequest>({
    mutationFn: (body) => merchantVoiceSmsCampaignsRepository.createCreditPurchase(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['merchantVoice', 'smsCredits'] })
      queryClient.invalidateQueries({ queryKey: qk.merchantVoiceSmsCampaignDashboard() })
    },
  })
}
