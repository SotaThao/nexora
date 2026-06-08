import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createMerchantsRepository } from '../merchants'

describe('merchantsRepository', () => {
  let mockClient
  let repo

  beforeEach(() => {
    mockClient = {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      upload: vi.fn(),
    }
    repo = createMerchantsRepository(mockClient)
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
  })

  describe('API Mode', () => {
    it('should fetch setup and map to domain shape in getSetup', async () => {
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
      // Test status 404
      mockClient.get.mockRejectedValueOnce({ status: 404 })
      let res = await repo.getSetup()
      expect(res).toBeNull()

      // Test errorCode BUSINESS_NOT_FOUND
      mockClient.get.mockRejectedValueOnce({ errorCode: 'BUSINESS_NOT_FOUND' })
      res = await repo.getSetup()
      expect(res).toBeNull()
    })

    it('should return null when getSetup returns 403 (business-level)', async () => {
      // 403 is also handled in getSetup as a valid "not found" scenario
      mockClient.get.mockRejectedValueOnce({ status: 403 })
      const res = await repo.getSetup()
      expect(res).toBeNull()
    })

    it('should propagate other errors in getSetup', async () => {
      const mockError = { status: 500, errorCode: 'INTERNAL_ERROR' }
      mockClient.get.mockRejectedValue(mockError)

      await expect(repo.getSetup()).rejects.toEqual(mockError)
    })

    it('should check slug availability', async () => {
      mockClient.get.mockResolvedValue({ isAvailable: true, suggestion: null })

      const res = await repo.checkSlug('my-slug')
      expect(mockClient.get).toHaveBeenCalledWith('/api/v1/merchant/business/check-slug?slug=my-slug')
      expect(res).toEqual({ isAvailable: true, suggestion: null })
    })

    it('should create business profile', async () => {
      const dto = { name: 'New Biz', customSlug: 'new-biz' }
      mockClient.post.mockResolvedValue({ businessId: '123', slug: 'new-biz' })

      const res = await repo.createBusiness(dto)
      expect(mockClient.post).toHaveBeenCalledWith('/api/v1/merchant/business', dto)
      expect(res).toEqual({ businessId: '123', slug: 'new-biz' })
    })

    it('should upload logo using PUT and FormData', async () => {
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
      const dto = { googleReviewUrl: 'url' }
      mockClient.put.mockResolvedValue(undefined)

      await repo.updateReviewLinks(dto)
      expect(mockClient.put).toHaveBeenCalledWith('/api/v1/merchant/business/review-links', dto)
    })

    it('should complete onboarding', async () => {
      mockClient.post.mockResolvedValue(undefined)

      await repo.completeOnboarding()
      expect(mockClient.post).toHaveBeenCalledWith('/api/v1/merchant/business/complete-onboarding')
    })
  })

  describe('Error propagation (no DEV workarounds)', () => {
    it('checkSlug propagates 403/USER_NOT_MERCHANT errors', async () => {
      const err = { status: 403, errorCode: 'USER_NOT_MERCHANT' }
      mockClient.get.mockRejectedValue(err)

      await expect(repo.checkSlug('test-slug')).rejects.toEqual(err)
    })

    it('createBusiness propagates 403/USER_NOT_MERCHANT errors', async () => {
      const err = { status: 403, errorCode: 'USER_NOT_MERCHANT' }
      mockClient.post.mockRejectedValue(err)

      await expect(repo.createBusiness({ name: 'Biz' })).rejects.toEqual(err)
    })

    it('uploadLogo propagates 403/USER_NOT_MERCHANT errors', async () => {
      const err = { status: 403, errorCode: 'USER_NOT_MERCHANT' }
      mockClient.upload.mockRejectedValue(err)

      const fakeFile = new File([''], 'logo.png', { type: 'image/png' })
      await expect(repo.uploadLogo(fakeFile)).rejects.toEqual(err)
    })

    it('updateReviewLinks propagates 403/USER_NOT_MERCHANT errors', async () => {
      const err = { status: 403, errorCode: 'USER_NOT_MERCHANT' }
      mockClient.put.mockRejectedValue(err)

      await expect(repo.updateReviewLinks({ googleReviewUrl: 'url' })).rejects.toEqual(err)
    })

    it('completeOnboarding propagates 403/USER_NOT_MERCHANT errors', async () => {
      const err = { status: 403, errorCode: 'USER_NOT_MERCHANT' }
      mockClient.post.mockRejectedValue(err)

      await expect(repo.completeOnboarding()).rejects.toEqual(err)
    })

    it('checkSlug propagates 500 server errors', async () => {
      const err = { status: 500, errorCode: 'INTERNAL_ERROR' }
      mockClient.get.mockRejectedValue(err)

      await expect(repo.checkSlug('test-slug')).rejects.toEqual(err)
    })

    it('createBusiness propagates 500 server errors', async () => {
      const err = { status: 500, errorCode: 'INTERNAL_ERROR' }
      mockClient.post.mockRejectedValue(err)

      await expect(repo.createBusiness({ name: 'Biz' })).rejects.toEqual(err)
    })
  })
})
