/**
 * merchantsRepository — API-only implementation.
 * Calls the Nexora REST API for all merchant operations.
 */
import httpClient from '../../lib/httpClient'

interface MerchantSetup {
  businessInfo: {
    name: string
    industry: string
    address: string
    phone: string
    website: string
    logo: string | null
    paymentAccounts: Record<string, string>
  }
  reviewLinks: {
    googleReview: string
    yelpReview: string
    facebookReview: string
    feedbackEmail: string
  }
  staffList: unknown[]
  touchPoints: unknown[]
}

interface BusinessApiResponse {
  name?: string
  businessType?: string
  address?: string
  phone?: string
  website?: string
  logoUrl?: string
  googleReviewUrl?: string
  yelpUrl?: string
  facebookUrl?: string
  feedbackEmail?: string
  [key: string]: unknown
}

export function createMerchantsRepository(client = httpClient) {
  return {
    /** @returns {Promise<MerchantSetup|null>} full setup blob or null */
    async getSetup(): Promise<MerchantSetup | null> {
      try {
        const res = await client.get<BusinessApiResponse>('/api/v1/merchant/business')
        if (!res) return null
        
        return {
          businessInfo: {
            name: res.name || '',
            industry: res.businessType || 'Nail Salon',
            address: res.address || '',
            phone: res.phone || '',
            website: res.website || '',
            logo: res.logoUrl || null,
            // Payment accounts are NOT part of GET /api/v1/merchant/business —
            // they live in GET /api/v1/merchant/payment-methods (see merchantPaymentMethods repo).
            paymentAccounts: {
              venmo: '',
              cashapp: '',
              zelle: '',
              vlinkpay: ''
            }
          },
          // Review link fields are flat on the business response, not nested.
          reviewLinks: {
            googleReview: res.googleReviewUrl || '',
            yelpReview: res.yelpUrl || '',
            facebookReview: res.facebookUrl || '',
            feedbackEmail: res.feedbackEmail || ''
          },
          staffList: [],
          touchPoints: []
        }
      } catch (err) {
        if (
          (err as any)?.status === 404 ||
          (err as any)?.status === 403 ||
          (err as any)?.errorCode === 'BUSINESS_NOT_FOUND'
        ) {
          return null
        }
        throw err
      }
    },

    /** @param {object} _setup — no-op in api mode */
    async saveSetup(_setup: unknown): Promise<void> {
      // no-op: business data is managed via dedicated endpoints
    },

    async clearSetup(): Promise<void> {
      // no-op: business data is managed server-side
    },

    /** @returns {Promise<unknown[]>} */
    async getStaffList(): Promise<unknown[]> {
      const setup = await this.getSetup()
      return setup?.staffList ?? []
    },

    /** @param {unknown[]} _list */
    async saveStaffList(_list: unknown[]): Promise<void> {
      // TODO: Wire to staff management API when available
    },

    /**
     * Check slug availability
     * @param {string} slug
     * @returns {Promise<{ isAvailable: boolean, suggestion: string|null }>}
     */
    async checkSlug(slug: string): Promise<{ isAvailable: boolean; suggestion: string | null }> {
      return await client.get<{ isAvailable: boolean; suggestion: string | null }>(`/api/v1/merchant/business/check-slug?slug=${encodeURIComponent(slug)}`)
    },

    /**
     * Create a business profile
     * @param {object} dto
     * @returns {Promise<{ businessId: string, slug: string }>}
     */
    async createBusiness(dto: unknown): Promise<{ businessId: string; slug: string }> {
      return await client.post<{ businessId: string; slug: string }>('/api/v1/merchant/business', dto)
    },

    /**
     * Upload an image (generic endpoint)
     * @param {File} file
     * @returns {Promise<{ fileUrl?: string, imageUrl?: string }>}
     */
    async uploadImage(file: File): Promise<{ fileUrl?: string; imageUrl?: string }> {
      const formData = new FormData()
      formData.append('file', file)
      return await client.upload<{ fileUrl?: string; imageUrl?: string }>('/api/v1/images/upload', formData, 'POST')
    },

    /**
     * Upload business logo (convenience wrapper)
     * @param {File} file
     * @returns {Promise<string>} fileUrl
     */
    async uploadLogo(file: File): Promise<string> {
      const res = await this.uploadImage(file)
      return res?.imageUrl || res?.fileUrl || ''
    },

    /**
     * Update external review links
     * @param {object} dto
     * @returns {Promise<void>}
     */
    async updateReviewLinks(dto: unknown): Promise<void> {
      return await client.put('/api/v1/merchant/business/review-links', dto)
    },

    /**
     * Complete merchant onboarding
     * @returns {Promise<void>}
     */
    async completeOnboarding(): Promise<void> {
      return await client.post('/api/v1/merchant/business/complete-onboarding')
    }
  }
}

export const merchantsRepository = createMerchantsRepository()
export default merchantsRepository
