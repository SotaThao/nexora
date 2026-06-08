import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createPublicBusinessesRepository } from '../publicBusinesses'

/**
 * publicBusinessesRepository — L2-P0-04
 *
 * Every method must:
 *   1. Validate that businessId is present (throw synchronously when missing).
 *   2. Hit the correct path with encodeURIComponent on dynamic segments.
 *   3. Use { anonymous: true }.
 */
describe('publicBusinessesRepository', () => {
  let mockClient
  let repo

  beforeEach(() => {
    mockClient = {
      get: vi.fn().mockResolvedValue({}),
      post: vi.fn().mockResolvedValue({}),
      put: vi.fn().mockResolvedValue({}),
      patch: vi.fn().mockResolvedValue({}),
      del: vi.fn().mockResolvedValue({}),
      upload: vi.fn().mockResolvedValue({}),
    }
    repo = createPublicBusinessesRepository(mockClient)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  // ─── getPaymentMethods ──────────────────────────────────────────────────
  describe('getPaymentMethods', () => {
    it('calls GET with encoded businessId and anonymous flag', async () => {
      await repo.getPaymentMethods('biz-123')

      expect(mockClient.get).toHaveBeenCalledWith(
        '/api/v1/public/businesses/biz-123/payment-methods',
        { anonymous: true },
      )
    })

    it('encodes special characters in businessId', async () => {
      await repo.getPaymentMethods('biz/special')

      expect(mockClient.get).toHaveBeenCalledWith(
        `/api/v1/public/businesses/${encodeURIComponent('biz/special')}/payment-methods`,
        { anonymous: true },
      )
    })

    it('throws when businessId is falsy (empty string)', async () => {
      await expect(repo.getPaymentMethods('')).rejects.toThrow(
        'publicBusinessesRepository.getPaymentMethods: businessId is required',
      )
      expect(mockClient.get).not.toHaveBeenCalled()
    })

    it('throws when businessId is null', async () => {
      await expect(repo.getPaymentMethods(null)).rejects.toThrow(
        'publicBusinessesRepository.getPaymentMethods: businessId is required',
      )
      expect(mockClient.get).not.toHaveBeenCalled()
    })

    it('throws when businessId is undefined', async () => {
      await expect(repo.getPaymentMethods(undefined)).rejects.toThrow(
        'publicBusinessesRepository.getPaymentMethods: businessId is required',
      )
      expect(mockClient.get).not.toHaveBeenCalled()
    })
  })

  // ─── getPaymentMethodById ───────────────────────────────────────────────
  describe('getPaymentMethodById', () => {
    it('calls GET with encoded businessId and paymentMethodId', async () => {
      await repo.getPaymentMethodById('biz-1', 'pm-99')

      expect(mockClient.get).toHaveBeenCalledWith(
        '/api/v1/public/businesses/biz-1/payment-methods/pm-99',
        { anonymous: true },
      )
    })

    it('encodes special characters in both IDs', async () => {
      await repo.getPaymentMethodById('biz/x', 'pm/y')

      expect(mockClient.get).toHaveBeenCalledWith(
        `/api/v1/public/businesses/${encodeURIComponent('biz/x')}/payment-methods/${encodeURIComponent('pm/y')}`,
        { anonymous: true },
      )
    })

    it('throws when businessId is falsy', async () => {
      await expect(repo.getPaymentMethodById('', 'pm-1')).rejects.toThrow(
        'publicBusinessesRepository.getPaymentMethodById: businessId is required',
      )
      expect(mockClient.get).not.toHaveBeenCalled()
    })
  })

  // ─── createMultiStaffTip ────────────────────────────────────────────────
  describe('createMultiStaffTip', () => {
    const validArgs = {
      businessId: 'biz-1',
      touchPointId: 'tp-1',
      businessPaymentMethodId: 'pm-1',
      tipItems: [
        { staffProfileId: 'sp-1', amount: 10 },
        { staffProfileId: 'sp-2', amount: 15 },
      ],
    }

    it('POSTs to /api/v1/tips/multi-staff with correct payload', async () => {
      await repo.createMultiStaffTip(validArgs)

      expect(mockClient.post).toHaveBeenCalledWith(
        '/api/v1/tips/multi-staff',
        validArgs,
        { anonymous: true },
      )
    })

    it('throws when businessId is missing', async () => {
      await expect(
        repo.createMultiStaffTip({ ...validArgs, businessId: '' }),
      ).rejects.toThrow(
        'publicBusinessesRepository.createMultiStaffTip: businessId is required',
      )
      expect(mockClient.post).not.toHaveBeenCalled()
    })

    it('throws when businessId is null', async () => {
      await expect(
        repo.createMultiStaffTip({ ...validArgs, businessId: null }),
      ).rejects.toThrow(
        'publicBusinessesRepository.createMultiStaffTip: businessId is required',
      )
      expect(mockClient.post).not.toHaveBeenCalled()
    })
  })

  // ─── confirmMultiStaffTip ───────────────────────────────────────────────
  describe('confirmMultiStaffTip', () => {
    it('PATCHes to /api/v1/tips/{tipId}/confirm with empty body and anonymous flag', async () => {
      await repo.confirmMultiStaffTip('tip-55')

      expect(mockClient.patch).toHaveBeenCalledWith(
        '/api/v1/tips/tip-55/confirm',
        {},
        { anonymous: true },
      )
    })

    it('encodes tipId with special characters', async () => {
      await repo.confirmMultiStaffTip('tip/special')

      expect(mockClient.patch).toHaveBeenCalledWith(
        `/api/v1/tips/${encodeURIComponent('tip/special')}/confirm`,
        {},
        { anonymous: true },
      )
    })
  })

  // ─── Error propagation ──────────────────────────────────────────────────
  describe('Error propagation', () => {
    it('propagates client errors from getPaymentMethods', async () => {
      const err = { status: 500, errorCode: 'INTERNAL_ERROR' }
      mockClient.get.mockRejectedValue(err)

      await expect(repo.getPaymentMethods('biz-1')).rejects.toEqual(err)
    })

    it('propagates client errors from createMultiStaffTip', async () => {
      const err = { status: 400, errorCode: 'BAD_REQUEST' }
      mockClient.post.mockRejectedValue(err)

      await expect(
        repo.createMultiStaffTip({
          businessId: 'biz-1',
          touchPointId: 'tp-1',
          businessPaymentMethodId: 'pm-1',
          tipItems: [],
        }),
      ).rejects.toEqual(err)
    })
  })
})
