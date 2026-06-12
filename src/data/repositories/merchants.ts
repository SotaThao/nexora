/**
 * merchantsRepository — API-only implementation.
 */
import httpClient from '../../lib/httpClient'
import type { MerchantSetup } from '../../types/domain'
import { isApiError } from '../../types/domain'
import type { BusinessApiDto, CreateBusinessResult, ImageUploadResult, SlugCheckResult } from '../../types/repositories'

type HttpClient = typeof httpClient

export function createMerchantsRepository(client: HttpClient = httpClient) {
  return {
    async getSetup(): Promise<MerchantSetup | null> {
      try {
        const res = await client.get<BusinessApiDto>('/api/v1/merchant/business')
        if (!res) return null

        return {
          businessInfo: {
            name: res.name || '',
            industry: res.businessType || 'Nail Salon',
            address: res.address || '',
            phone: res.phone || '',
            website: res.website || '',
            logo: res.logoUrl || null,
            paymentAccounts: {
              venmo: '',
              cashapp: '',
              zelle: '',
              vlinkpay: '',
            },
          },
          reviewLinks: {
            googleReview: res.googleReviewUrl || '',
            yelpReview: res.yelpUrl || '',
            facebookReview: res.facebookUrl || '',
            feedbackEmail: res.feedbackEmail || '',
          },
          staffList: [],
          touchPoints: [],
        }
      } catch (err: unknown) {
        if (
          isApiError(err) &&
          (err.status === 404 || err.status === 403 || err.errorCode === 'BUSINESS_NOT_FOUND')
        ) {
          return null
        }
        throw err
      }
    },

    async saveSetup(_setup: MerchantSetup): Promise<void> {
      // no-op: business data is managed via dedicated endpoints
    },

    async clearSetup(): Promise<void> {
      // no-op
    },

    async getStaffList(): Promise<MerchantSetup['staffList']> {
      const setup = await this.getSetup()
      return setup?.staffList ?? []
    },

    async saveStaffList(_list: MerchantSetup['staffList']): Promise<void> {
      // TODO: Wire to staff management API when available
    },

    async checkSlug(slug: string): Promise<SlugCheckResult> {
      return await client.get<SlugCheckResult>(
        `/api/v1/merchant/business/check-slug?slug=${encodeURIComponent(slug)}`,
      )
    },

    async createBusiness(dto: LooseObject): Promise<CreateBusinessResult> {
      return await client.post<CreateBusinessResult>('/api/v1/merchant/business', dto)
    },

    async uploadImage(file: File): Promise<ImageUploadResult> {
      const formData = new FormData()
      formData.append('file', file)
      return await client.upload<ImageUploadResult>('/api/v1/images/upload', formData, 'POST')
    },

    async uploadLogo(file: File): Promise<string> {
      const res = await this.uploadImage(file)
      return res?.imageUrl || res?.fileUrl || ''
    },

    async updateReviewLinks(dto: LooseObject): Promise<void> {
      await client.put('/api/v1/merchant/business/review-links', dto)
    },

    async completeOnboarding(): Promise<void> {
      await client.post('/api/v1/merchant/business/complete-onboarding')
    },
  }
}

export const merchantsRepository = createMerchantsRepository()
export default merchantsRepository
