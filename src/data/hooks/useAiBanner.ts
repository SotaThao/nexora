import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { qk } from '../queryKeys'
import marketingAdsRepository, {
  type Banner,
  type BannerStatus,
  type CreateBannerParams,
  type GenerateAdImageRequest,
  type GenerateAdImageResponse,
  type ImageQualityCreditCostDto,
  type MarketingAdsCreditSummary,
  type MarketingAdsImageDto,
  type MarketingAdsImagesFilter,
} from '../repositories/marketingAds'
import type { PaginatedResponse } from '../../types/domain'

const EMPTY_IMAGES_FILTER: MarketingAdsImagesFilter = {}

/**
 * AI Ads credit wallet balance — separate from the Nexora Voice / SMS
 * credit wallets (see useMerchantVoiceSmsCreditSummary). Backed by
 * data/repositories/marketingAds.ts, mock-only in Đợt 0 (US-110).
 */
export function useMarketingAdsCreditSummary({ enabled = true } = {}) {
  return useQuery<MarketingAdsCreditSummary>({
    queryKey: qk.marketingAdsCreditSummary(),
    queryFn: () => marketingAdsRepository.getCreditSummary(),
    enabled,
  })
}

/** Per-quality credit cost table, used to price a generation before submit. */
export function useMarketingAdsImageQualityCosts({ enabled = true } = {}) {
  return useQuery<ImageQualityCreditCostDto[]>({
    queryKey: qk.marketingAdsImageQualityCosts(),
    queryFn: () => marketingAdsRepository.getImageQualityCosts(),
    enabled,
    staleTime: 5 * 60 * 1000,
  })
}

/** Paginated library of previously generated AI images (My Images panel). */
export function useMarketingAdsImages(
  filters: MarketingAdsImagesFilter = EMPTY_IMAGES_FILTER,
  { enabled = true } = {},
) {
  return useQuery<PaginatedResponse<MarketingAdsImageDto>>({
    queryKey: qk.marketingAdsImages(filters),
    queryFn: () => marketingAdsRepository.getImagesGenerated(filters),
    enabled,
  })
}

/**
 * Generates a new AI image. On success, invalidates both the credit summary
 * (balance just changed) and the images library (new item to show).
 */
export function useGenerateMarketingAdImage() {
  const queryClient = useQueryClient()

  return useMutation<GenerateAdImageResponse, Error, GenerateAdImageRequest>({
    mutationFn: (request) => marketingAdsRepository.generateImage(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.marketingAdsCreditSummary() })
      queryClient.invalidateQueries({ queryKey: qk.marketingAdsImagesRoot() })
    },
  })
}

/** List of banners, optionally filtered by status. */
export function useMarketingAdsBanners(status?: BannerStatus, { enabled = true } = {}) {
  return useQuery<Banner[]>({
    queryKey: qk.marketingAdsBanners(status),
    queryFn: () => marketingAdsRepository.getBanners(status),
    enabled,
  })
}

/**
 * Creates a banner (draft or submitted for review based on isSaveDraft).
 * Automatically invalidates credit summary, images library, and banner lists.
 */
export function useCreateMarketingAdBanner() {
  const queryClient = useQueryClient()

  return useMutation<Banner, Error, CreateBannerParams>({
    mutationFn: (params) => marketingAdsRepository.createBanner(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.marketingAdsCreditSummary() })
      queryClient.invalidateQueries({ queryKey: qk.marketingAdsImagesRoot() })
      queryClient.invalidateQueries({ queryKey: qk.marketingAdsBannersRoot() })
    },
  })
}

/**
 * Saves a banner as draft.
 */
export function useSaveMarketingAdDraft() {
  const queryClient = useQueryClient()

  return useMutation<Banner, Error, Omit<CreateBannerParams, 'isSaveDraft'>>({
    mutationFn: (params) => marketingAdsRepository.saveDraftBanner(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.marketingAdsCreditSummary() })
      queryClient.invalidateQueries({ queryKey: qk.marketingAdsImagesRoot() })
      queryClient.invalidateQueries({ queryKey: qk.marketingAdsBannersRoot() })
    },
  })
}

/**
 * Submits a banner for review.
 */
export function useSubmitMarketingAdForReview() {
  const queryClient = useQueryClient()

  return useMutation<Banner, Error, Omit<CreateBannerParams, 'isSaveDraft'>>({
    mutationFn: (params) => marketingAdsRepository.submitBannerForReview(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.marketingAdsCreditSummary() })
      queryClient.invalidateQueries({ queryKey: qk.marketingAdsImagesRoot() })
      queryClient.invalidateQueries({ queryKey: qk.marketingAdsBannersRoot() })
    },
  })
}

