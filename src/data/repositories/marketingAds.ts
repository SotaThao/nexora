/**
 * marketingAdsRepository — AI Design (Marketing) image generation, AI Ads
 * credit wallet, and generated-image library.
 *
 * US-110 Đợt 0: this is a PORT of the presentation layer only. The real
 * backend proxy (vlink-group/merchant-ai-ads) is not wired into NEXORA yet —
 * 4 integration blockers are still open there — so every method below is
 * backed by an in-memory mock, never `httpClient`.
 *
 * The exported types are derived 1:1 from the real API contract so that
 * swapping the mock for a real implementation later only requires rewriting
 * the body of `createMockMarketingAdsRepository` (or adding a sibling
 * `createHttpMarketingAdsRepository`) — no caller in this app needs to
 * change. Sources (read-only, in vlink-group/merchant-ai-ads):
 *   - docs/api-docs/merchant-ads-merchant-api.md
 *       (POST .../ads/generate-image, GET .../credits/summary,
 *        GET .../ai/image-quality-costs, GET .../images-generated)
 *   - frontend/src/models/admin/merchantAds.ts (AdType, ImageQuality enums)
 *   - frontend/src/models/merchant/merchantAds.ts
 *       (GenerateMerchantAdImageRequest/Response, ImageQualityCreditCostDto,
 *        MerchantImageGeneratedDto, MerchantCreditSummary)
 *
 * This is a SEPARATE credit wallet from the Nexora Voice / SMS credit
 * wallets already in this repo (merchantVoiceSmsCampaigns.ts) — do not
 * merge or reuse that balance.
 */

import type { PaginatedResponse } from '../../types/domain'
import { logger } from '../../utils/logger'
import {
  ADV_BANNER_POOL,
  AI_HISTORY_LIST,
  AI_QUALITY_COST,
  INITIAL_BANNERS,
  type AIQuality,
  type Banner,
  type BannerSource,
  type BannerStatus,
} from './marketingAdsMockData'

export type { AIQuality, Banner, BannerSource, BannerStatus }

/** Matches backend `AdType` enum — only these two values exist. */
export enum AdType {
  Banner = 0,
  Sticker = 1,
}

/** Matches backend `ImageQuality` enum. */
export enum ImageQuality {
  Low = 1,
  Medium = 2,
  High = 3,
}

/** Body of `POST /api/v1/merchant-ads/ads/generate-image`. */
export interface GenerateAdImageRequest {
  adType?: AdType
  prompt: string
  referenceImageUrl?: string | null
  modelCode?: string | null
  imageQuality?: ImageQuality
}

/** Response of `POST /api/v1/merchant-ads/ads/generate-image`. */
export interface GenerateAdImageResponse {
  imageUrl: string
  modelCode: string
  creditCost: number
}

/** Item shape of `GET /api/v1/merchant-ads/ai/image-quality-costs`. */
export interface ImageQualityCreditCostDto {
  imageQuality: ImageQuality
  qualityLabel: string
  creditCost: number
}

/** `GET /api/v1/merchant-ads/credits/summary` response. */
export interface MarketingAdsCreditSummary {
  packageCredits: number
  bonusCredits: number
  usedCredits: number
  totalAvailable: number
}

/** Item shape of `GET /api/v1/merchant-ads/images-generated`. */
export interface MarketingAdsImageDto {
  id: string
  adType: AdType
  imageUrl: string
  referenceImageUrl: string | null
  prompt: string
  modelCode: string
  creditCost: number
  createdAt: string
}

export interface MarketingAdsImagesFilter {
  pageNumber?: number
  pageSize?: number
}

export interface CreateBannerParams {
  name: string
  imageUrl: string
  targetUrl?: string
  startDate?: string
  endDate?: string
  isSaveDraft: boolean
  source?: BannerSource
}

/**
 * Thrown when the wallet doesn't have enough credits. `errorCode` mirrors
 * the real API's `INSUFFICIENT_CREDITS` domain error (403) so callers can
 * branch on it the same way regardless of which implementation is wired in.
 */
export class InsufficientCreditsError extends Error {
  readonly errorCode = 'INSUFFICIENT_CREDITS'

  constructor(message = 'Insufficient credits to generate an image.') {
    super(message)
    this.name = 'InsufficientCreditsError'
  }
}

export interface MarketingAdsRepository {
  generateImage(request: GenerateAdImageRequest): Promise<GenerateAdImageResponse>
  getImageQualityCosts(): Promise<ImageQualityCreditCostDto[]>
  getCreditSummary(): Promise<MarketingAdsCreditSummary>
  getImagesGenerated(filter?: MarketingAdsImagesFilter): Promise<PaginatedResponse<MarketingAdsImageDto>>
  getBanners(status?: BannerStatus): Promise<Banner[]>
  createBanner(params: CreateBannerParams): Promise<Banner>
  saveDraftBanner(params: Omit<CreateBannerParams, 'isSaveDraft'>): Promise<Banner>
  submitBannerForReview(params: Omit<CreateBannerParams, 'isSaveDraft'>): Promise<Banner>
}

// ---------------------------------------------------------------------------
// Mock implementation (Đợt 0). No httpClient import anywhere in this file.
// ---------------------------------------------------------------------------

const MOCK_GENERATION_DELAY_MS = 1400
const MOCK_DEFAULT_PAGE_SIZE = 8
const MOCK_STARTING_CREDITS = 420

export const MOCK_QUALITY_COSTS: ImageQualityCreditCostDto[] = [
  { imageQuality: ImageQuality.Low, qualityLabel: 'Low', creditCost: AI_QUALITY_COST.low },
  { imageQuality: ImageQuality.Medium, qualityLabel: 'Medium', creditCost: AI_QUALITY_COST.medium },
  { imageQuality: ImageQuality.High, qualityLabel: 'High', creditCost: AI_QUALITY_COST.high },
]

/** Static sample renders seeded from ADV_BANNER_POOL. */
const MOCK_SAMPLE_IMAGE_URLS = ADV_BANNER_POOL.length > 0 ? ADV_BANNER_POOL : [
  '/assets/images/marketing/nail/nail_art_luxury.jpg',
  '/assets/images/marketing/nail/nail_zen_minimalist.jpg',
  '/assets/images/marketing/nail/nail_glam_french.jpg',
  '/assets/images/marketing/nail/nail_summer_pop.jpg',
  '/assets/images/marketing/nail/nail_spa_treatment.jpg',
  '/assets/images/marketing/nail/nail_rose_quartz.jpg',
]

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function createMockImageId(): string {
  return `mock-img-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function resolveQualityCost(imageQuality: ImageQuality | undefined): number {
  const quality = imageQuality ?? ImageQuality.Medium
  return (
    MOCK_QUALITY_COSTS.find((item) => item.imageQuality === quality)?.creditCost ??
    AI_QUALITY_COST.medium
  )
}

/**
 * In-memory mock — starts with an image library seeded from AI_HISTORY_LIST,
 * banners seeded from INITIAL_BANNERS, and 420 starting credits.
 * State lives for the lifetime of the page load, same as any other
 * dev-only mock in this repo.
 */
export function createMockMarketingAdsRepository(): MarketingAdsRepository {
  let creditSummary: MarketingAdsCreditSummary = {
    packageCredits: MOCK_STARTING_CREDITS,
    bonusCredits: 0,
    usedCredits: 0,
    totalAvailable: MOCK_STARTING_CREDITS,
  }

  const generatedImages: MarketingAdsImageDto[] = AI_HISTORY_LIST.map((item, index) => ({
    id: item.id,
    adType: AdType.Banner,
    imageUrl: item.url,
    referenceImageUrl: null,
    prompt: 'AI Generated Banner',
    modelCode: 'mock-provider-v1',
    creditCost: AI_QUALITY_COST.medium,
    createdAt: new Date(Date.now() - (index + 1) * 3600000).toISOString(),
  }))

  const banners: Banner[] = INITIAL_BANNERS.map((banner) => ({ ...banner }))

  const repo: MarketingAdsRepository = {
    async generateImage(request) {
      logger.debug('[marketingAds:mock] generateImage', request)
      await delay(MOCK_GENERATION_DELAY_MS)

      const cost = resolveQualityCost(request.imageQuality)
      if (creditSummary.totalAvailable < cost) {
        throw new InsufficientCreditsError()
      }

      const imageUrl = MOCK_SAMPLE_IMAGE_URLS[generatedImages.length % MOCK_SAMPLE_IMAGE_URLS.length]
      const modelCode = 'mock-provider-v1'

      creditSummary = {
        ...creditSummary,
        usedCredits: creditSummary.usedCredits + cost,
        totalAvailable: creditSummary.totalAvailable - cost,
      }

      generatedImages.unshift({
        id: createMockImageId(),
        adType: request.adType ?? AdType.Banner,
        imageUrl,
        referenceImageUrl: request.referenceImageUrl ?? null,
        prompt: request.prompt,
        modelCode,
        creditCost: cost,
        createdAt: new Date().toISOString(),
      })

      return { imageUrl, modelCode, creditCost: cost }
    },

    async getImageQualityCosts() {
      return MOCK_QUALITY_COSTS
    },

    async getCreditSummary() {
      return creditSummary
    },

    async getImagesGenerated(filter = {}) {
      const pageNumber = filter.pageNumber && filter.pageNumber > 0 ? filter.pageNumber : 1
      const pageSize = filter.pageSize && filter.pageSize > 0 ? filter.pageSize : MOCK_DEFAULT_PAGE_SIZE
      const totalCount = generatedImages.length
      const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))
      const start = (pageNumber - 1) * pageSize
      const items = generatedImages.slice(start, start + pageSize)

      return {
        items,
        pageNumber,
        totalPages,
        totalCount,
        hasNextPage: pageNumber < totalPages,
        hasPreviousPage: pageNumber > 1,
      }
    },

    async getBanners(status) {
      await delay(150)
      if (status) {
        return banners.filter((b) => b.status === status)
      }
      return [...banners]
    },

    async createBanner(params: CreateBannerParams) {
      logger.debug('[marketingAds:mock] createBanner', params)
      await delay(300)

      const newBanner: Banner = {
        id: `banner-${Date.now()}`,
        name: params.name,
        imageUrl: params.imageUrl,
        source: params.source ?? 'ai_generated',
        targetUrl: params.targetUrl,
        startDate: params.startDate,
        endDate: params.endDate,
        status: params.isSaveDraft ? 'draft' : 'pending_review',
        createdAt: new Date().toISOString().split('T')[0],
      }

      banners.unshift(newBanner)
      return newBanner
    },

    async saveDraftBanner(params: Omit<CreateBannerParams, 'isSaveDraft'>) {
      return repo.createBanner({ ...params, isSaveDraft: true })
    },

    async submitBannerForReview(params: Omit<CreateBannerParams, 'isSaveDraft'>) {
      return repo.createBanner({ ...params, isSaveDraft: false })
    },
  }

  return repo
}

export const marketingAdsRepository: MarketingAdsRepository = createMockMarketingAdsRepository()
export default marketingAdsRepository
