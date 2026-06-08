/**
 * merchantsRepository — API-only implementation.
 * Calls the Nexora REST API for all merchant operations.
 */
import httpClient from '../../lib/httpClient'

export function createMerchantsRepository(client = httpClient) {
  return {
    /** @returns {Promise<object|null>} full setup blob or null */
    async getSetup() {
      try {
        const res = await client.get('/api/v1/merchant/business')
        if (!res) return null
        
        return {
          businessInfo: {
            name: res.name || '',
            industry: res.businessType || 'Nail Salon',
            address: res.address || '',
            phone: res.phone || '',
            website: res.website || '',
            logo: res.logoUrl || null,
            paymentAccounts: res.paymentAccounts || {
              venmo: '',
              cashapp: '',
              zelle: '',
              vlinkpay: ''
            }
          },
          reviewLinks: {
            googleReview: res.reviewLinks?.googleReviewUrl || '',
            yelpReview: res.reviewLinks?.yelpUrl || '',
            facebookReview: res.reviewLinks?.facebookUrl || '',
            feedbackEmail: res.reviewLinks?.feedbackEmail || ''
          },
          staffList: [],
          touchPoints: []
        }
      } catch (err) {
        if (
          err?.status === 404 ||
          err?.status === 403 ||
          err?.errorCode === 'BUSINESS_NOT_FOUND'
        ) {
          return null
        }
        throw err
      }
    },

    /** @param {object} _setup — no-op in api mode */
    async saveSetup(_setup) {
      // no-op: business data is managed via dedicated endpoints
    },

    async clearSetup() {
      // no-op: business data is managed server-side
    },

    /** @returns {Promise<Array>} */
    async getStaffList() {
      const setup = await this.getSetup()
      return setup?.staffList ?? []
    },

    /** @param {Array} _list */
    async saveStaffList(_list) {
      // TODO: Wire to staff management API when available
    },

    /**
     * Check slug availability
     * @param {string} slug
     * @returns {Promise<{ isAvailable: boolean, suggestion: string|null }>}
     */
    async checkSlug(slug) {
      return await client.get(`/api/v1/merchant/business/check-slug?slug=${encodeURIComponent(slug)}`)
    },

    /**
     * Create a business profile
     * @param {object} dto
     * @returns {Promise<{ businessId: string, slug: string }>}
     */
    async createBusiness(dto) {
      return await client.post('/api/v1/merchant/business', dto)
    },

    /**
     * Upload an image (generic endpoint)
     * @param {File} file
     * @returns {Promise<{ fileUrl: string }>}
     */
    async uploadImage(file) {
      const formData = new FormData()
      formData.append('file', file)
      return await client.upload('/api/v1/images/upload', formData, 'POST')
    },

    /**
     * Upload business logo (convenience wrapper)
     * @param {File} file
     * @returns {Promise<string>} fileUrl
     */
    async uploadLogo(file) {
      const res = await this.uploadImage(file)
      return res.fileUrl
    },

    /**
     * Update external review links
     * @param {object} dto
     * @returns {Promise<void>}
     */
    async updateReviewLinks(dto) {
      return await client.put('/api/v1/merchant/business/review-links', dto)
    },

    /**
     * Complete merchant onboarding
     * @returns {Promise<void>}
     */
    async completeOnboarding() {
      return await client.post('/api/v1/merchant/business/complete-onboarding')
    }
  }
}

export const merchantsRepository = createMerchantsRepository()
export default merchantsRepository
