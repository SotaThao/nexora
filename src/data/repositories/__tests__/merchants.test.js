import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createMerchantsRepository } from '../merchants'

describe('merchantsRepository', () => {
  let mockAdapter
  let mockClient

  beforeEach(() => {
    mockAdapter = {
      get: vi.fn(),
      set: vi.fn(),
      remove: vi.fn(),
    }
    mockClient = {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      upload: vi.fn(),
    }
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
  })

  describe('Storage Mode (VITE_DATA_SOURCE=storage)', () => {
    beforeEach(() => {
      vi.stubEnv('VITE_DATA_SOURCE', 'storage')
    })

    it('should get setup from storage adapter', async () => {
      const repo = createMerchantsRepository(mockAdapter, mockClient)
      const mockSetup = { businessInfo: { name: 'Storage Business' } }
      mockAdapter.get.mockResolvedValue(mockSetup)

      const res = await repo.getSetup()
      expect(mockAdapter.get).toHaveBeenCalledWith('nexora_merchant_setup')
      expect(res).toEqual(mockSetup)
    })

    it('should save setup to storage adapter', async () => {
      const repo = createMerchantsRepository(mockAdapter, mockClient)
      const mockSetup = { businessInfo: { name: 'Storage Business' } }

      await repo.saveSetup(mockSetup)
      expect(mockAdapter.set).toHaveBeenCalledWith('nexora_merchant_setup', mockSetup)
    })

    it('should clear setup from storage adapter', async () => {
      const repo = createMerchantsRepository(mockAdapter, mockClient)

      await repo.clearSetup()
      expect(mockAdapter.remove).toHaveBeenCalledWith('nexora_merchant_setup')
    })

    it('should get staff list from storage setup', async () => {
      const repo = createMerchantsRepository(mockAdapter, mockClient)
      mockAdapter.get.mockResolvedValue({ staffList: [{ id: 1, name: 'Alice' }] })

      const res = await repo.getStaffList()
      expect(res).toEqual([{ id: 1, name: 'Alice' }])
    })

    it('should save staff list to storage setup', async () => {
      const repo = createMerchantsRepository(mockAdapter, mockClient)
      mockAdapter.get.mockResolvedValue({ businessInfo: { name: 'Biz' } })

      await repo.saveStaffList([{ id: 1, name: 'Alice' }])
      expect(mockAdapter.set).toHaveBeenCalledWith('nexora_merchant_setup', {
        businessInfo: { name: 'Biz' },
        staffList: [{ id: 1, name: 'Alice' }],
      })
    })
  })

  describe('API Mode (VITE_DATA_SOURCE=api)', () => {
    beforeEach(() => {
      vi.stubEnv('VITE_DATA_SOURCE', 'api')
    })

    it('should fetch setup and map to domain shape in getSetup', async () => {
      const repo = createMerchantsRepository(mockAdapter, mockClient)
      const mockApiResponse = {
        name: 'API Business',
        businessType: 'Cafe',
        address: '123 Coffee St',
        phone: '555-1234',
        website: 'cafe.com',
        logoUrl: 'http://cdn/logo.png',
        paymentAccounts: { venmo: 'cafe-venmo' },
        reviewLinks: {
          googleReviewUrl: 'google-url',
          yelpUrl: 'yelp-url',
          facebookUrl: 'fb-url',
          feedbackEmail: 'feedback@cafe.com',
        },
      }
      mockClient.get.mockResolvedValue(mockApiResponse)

      const res = await repo.getSetup()
      expect(mockClient.get).toHaveBeenCalledWith('/api/v1/merchant/business')
      expect(res).toEqual({
        businessInfo: {
          name: 'API Business',
          industry: 'Cafe',
          address: '123 Coffee St',
          phone: '555-1234',
          website: 'cafe.com',
          logo: 'http://cdn/logo.png',
          paymentAccounts: { venmo: 'cafe-venmo' },
        },
        reviewLinks: {
          googleReview: 'google-url',
          yelpReview: 'yelp-url',
          facebookReview: 'fb-url',
          feedbackEmail: 'feedback@cafe.com',
        },
        staffList: [],
        touchPoints: [],
      })
    })

    it('should return null when getSetup returns 404 or BUSINESS_NOT_FOUND', async () => {
      const repo = createMerchantsRepository(mockAdapter, mockClient)
      
      // Test status 404
      mockClient.get.mockRejectedValueOnce({ status: 404 })
      let res = await repo.getSetup()
      expect(res).toBeNull()

      // Test errorCode BUSINESS_NOT_FOUND
      mockClient.get.mockRejectedValueOnce({ errorCode: 'BUSINESS_NOT_FOUND' })
      res = await repo.getSetup()
      expect(res).toBeNull()
    })

    it('should propagate other errors in getSetup', async () => {
      const repo = createMerchantsRepository(mockAdapter, mockClient)
      const mockError = { status: 500, errorCode: 'INTERNAL_ERROR' }
      mockClient.get.mockRejectedValue(mockError)

      await expect(repo.getSetup()).rejects.toEqual(mockError)
    })

    it('should check slug availability', async () => {
      const repo = createMerchantsRepository(mockAdapter, mockClient)
      mockClient.get.mockResolvedValue({ isAvailable: true, suggestion: null })

      const res = await repo.checkSlug('my-slug')
      expect(mockClient.get).toHaveBeenCalledWith('/api/v1/merchant/business/check-slug?slug=my-slug')
      expect(res).toEqual({ isAvailable: true, suggestion: null })
    })

    it('should create business profile', async () => {
      const repo = createMerchantsRepository(mockAdapter, mockClient)
      const dto = { name: 'New Biz', customSlug: 'new-biz' }
      mockClient.post.mockResolvedValue({ businessId: '123', slug: 'new-biz' })

      const res = await repo.createBusiness(dto)
      expect(mockClient.post).toHaveBeenCalledWith('/api/v1/merchant/business', dto)
      expect(res).toEqual({ businessId: '123', slug: 'new-biz' })
    })

    it('should upload logo using PUT and FormData', async () => {
      const repo = createMerchantsRepository(mockAdapter, mockClient)
      const fakeFile = new File([''], 'logo.png', { type: 'image/png' })
      mockClient.upload.mockResolvedValue({ logoUrl: 'http://cdn/logo.png' })

      const res = await repo.uploadLogo(fakeFile)
      expect(mockClient.upload).toHaveBeenCalledWith(
        '/api/v1/merchant/business/logo',
        expect.any(FormData),
        'PUT'
      )
      expect(res).toEqual({ logoUrl: 'http://cdn/logo.png' })
    })

    it('should update review links', async () => {
      const repo = createMerchantsRepository(mockAdapter, mockClient)
      const dto = { googleReviewUrl: 'url' }
      mockClient.put.mockResolvedValue(undefined)

      await repo.updateReviewLinks(dto)
      expect(mockClient.put).toHaveBeenCalledWith('/api/v1/merchant/business/review-links', dto)
    })

    it('should complete onboarding', async () => {
      const repo = createMerchantsRepository(mockAdapter, mockClient)
      mockClient.post.mockResolvedValue(undefined)

      await repo.completeOnboarding()
      expect(mockClient.post).toHaveBeenCalledWith('/api/v1/merchant/business/complete-onboarding')
    })
  })
})
