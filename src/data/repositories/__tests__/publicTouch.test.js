import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createPublicTouchRepository } from '../publicTouch'

/**
 * publicTouchRepository — L2-P0-03
 *
 * Every method must:
 *   1. Hit the correct path (with encodeURIComponent where applicable).
 *   2. Use { anonymous: true } so the token interceptor is skipped.
 *   3. Send the expected body/params shape.
 */
describe('publicTouchRepository', () => {
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
    repo = createPublicTouchRepository(mockClient)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  // ─── getTouchPage ───────────────────────────────────────────────────────
  describe('getTouchPage', () => {
    it('calls GET with encoded slugs and sessionId param', async () => {
      await repo.getTouchPage({
        businessSlug: 'nail-spa',
        touchPointSlug: 'station-1',
        sessionId: 'sess-abc',
      })

      expect(mockClient.get).toHaveBeenCalledWith(
        '/api/v1/touch/nail-spa/station-1',
        { anonymous: true, params: { sessionId: 'sess-abc' } },
      )
    })

    it('encodes special characters in slugs', async () => {
      await repo.getTouchPage({
        businessSlug: 'biz/special',
        touchPointSlug: 'tp with space',
        sessionId: 's1',
      })

      expect(mockClient.get).toHaveBeenCalledWith(
        `/api/v1/touch/${encodeURIComponent('biz/special')}/${encodeURIComponent('tp with space')}`,
        { anonymous: true, params: { sessionId: 's1' } },
      )
    })
  })

  // ─── getPaymentLink ─────────────────────────────────────────────────────
  describe('getPaymentLink', () => {
    it('calls GET with staffId, wire-format method, and amount params', async () => {
      await repo.getPaymentLink({ staffId: 'staff-1', method: 'Venmo', amount: 25 })

      expect(mockClient.get).toHaveBeenCalledWith(
        '/api/v1/touch/payment-link',
        { anonymous: true, params: { staffId: 'staff-1', method: 'Venmo', amount: 25 } },
      )
    })

    it('maps CashApp method through toWireMethod', async () => {
      await repo.getPaymentLink({ staffId: 's2', method: 'CashApp', amount: 10 })

      expect(mockClient.get).toHaveBeenCalledWith(
        '/api/v1/touch/payment-link',
        { anonymous: true, params: { staffId: 's2', method: 'CashApp', amount: 10 } },
      )
    })

    it('passes through an unknown method as-is', async () => {
      await repo.getPaymentLink({ staffId: 's3', method: 'Bitcoin', amount: 5 })

      expect(mockClient.get).toHaveBeenCalledWith(
        '/api/v1/touch/payment-link',
        { anonymous: true, params: { staffId: 's3', method: 'Bitcoin', amount: 5 } },
      )
    })
  })

  // ─── createTip ──────────────────────────────────────────────────────────
  describe('createTip', () => {
    it('POSTs to /api/v1/touch/tip with correct payload and anonymous flag', async () => {
      await repo.createTip({
        touchPointId: 'tp-1',
        staffProfileId: 'sp-1',
        amount: 20,
        paymentMethod: 'Venmo',
        sessionId: 'sess-1',
      })

      expect(mockClient.post).toHaveBeenCalledWith(
        '/api/v1/touch/tip',
        {
          touchPointId: 'tp-1',
          staffProfileId: 'sp-1',
          amount: 20,
          paymentMethod: 'Venmo',
          sessionId: 'sess-1',
        },
        { anonymous: true },
      )
    })

    it('maps AppleCash payment method via toWireMethod', async () => {
      await repo.createTip({
        touchPointId: 'tp-2',
        staffProfileId: 'sp-2',
        amount: 15,
        paymentMethod: 'AppleCash',
        sessionId: 'sess-2',
      })

      expect(mockClient.post).toHaveBeenCalledWith(
        '/api/v1/touch/tip',
        expect.objectContaining({ paymentMethod: 'AppleCash' }),
        { anonymous: true },
      )
    })
  })

  // ─── confirmTip ─────────────────────────────────────────────────────────
  describe('confirmTip', () => {
    it('POSTs to /api/v1/touch/tip/{tipId}/confirm with empty body', async () => {
      await repo.confirmTip('tip-42')

      expect(mockClient.post).toHaveBeenCalledWith(
        '/api/v1/touch/tip/tip-42/confirm',
        {},
        { anonymous: true },
      )
    })

    it('encodes tipId with special characters', async () => {
      await repo.confirmTip('tip/special')

      expect(mockClient.post).toHaveBeenCalledWith(
        `/api/v1/touch/tip/${encodeURIComponent('tip/special')}/confirm`,
        {},
        { anonymous: true },
      )
    })
  })

  // ─── skipTip ────────────────────────────────────────────────────────────
  describe('skipTip', () => {
    it('POSTs to /api/v1/touch/tip/skip with correct payload', async () => {
      await repo.skipTip({
        touchPointId: 'tp-1',
        staffProfileId: 'sp-1',
        sessionId: 'sess-1',
      })

      expect(mockClient.post).toHaveBeenCalledWith(
        '/api/v1/touch/tip/skip',
        { touchPointId: 'tp-1', staffProfileId: 'sp-1', sessionId: 'sess-1' },
        { anonymous: true },
      )
    })
  })

  // ─── createReview ───────────────────────────────────────────────────────
  describe('createReview', () => {
    it('POSTs to /api/v1/touch/review with all fields', async () => {
      await repo.createReview({
        touchPointId: 'tp-1',
        tipId: 'tip-1',
        staffProfileId: 'sp-1',
        rating: 5,
        comment: 'Great service',
        customerEmail: 'test@example.com',
        customerName: 'John',
      })

      expect(mockClient.post).toHaveBeenCalledWith(
        '/api/v1/touch/review',
        {
          touchPointId: 'tp-1',
          tipId: 'tip-1',
          staffProfileId: 'sp-1',
          rating: 5,
          comment: 'Great service',
          customerEmail: 'test@example.com',
          customerName: 'John',
        },
        { anonymous: true },
      )
    })

    it('sends optional fields as undefined when not provided', async () => {
      await repo.createReview({
        touchPointId: 'tp-1',
        staffProfileId: 'sp-1',
        rating: 3,
      })

      expect(mockClient.post).toHaveBeenCalledWith(
        '/api/v1/touch/review',
        expect.objectContaining({
          touchPointId: 'tp-1',
          staffProfileId: 'sp-1',
          rating: 3,
        }),
        { anonymous: true },
      )
    })
  })

  // ─── trackGoogle ────────────────────────────────────────────────────────
  describe('trackGoogle', () => {
    it('POSTs to /api/v1/touch/review/{reviewId}/track-google', async () => {
      await repo.trackGoogle('rev-1')

      expect(mockClient.post).toHaveBeenCalledWith(
        '/api/v1/touch/review/rev-1/track-google',
        {},
        { anonymous: true },
      )
    })

    it('encodes reviewId', async () => {
      await repo.trackGoogle('rev/special')

      expect(mockClient.post).toHaveBeenCalledWith(
        `/api/v1/touch/review/${encodeURIComponent('rev/special')}/track-google`,
        {},
        { anonymous: true },
      )
    })
  })

  // ─── trackYelp ──────────────────────────────────────────────────────────
  describe('trackYelp', () => {
    it('POSTs to /api/v1/touch/review/{reviewId}/track-yelp', async () => {
      await repo.trackYelp('rev-2')

      expect(mockClient.post).toHaveBeenCalledWith(
        '/api/v1/touch/review/rev-2/track-yelp',
        {},
        { anonymous: true },
      )
    })

    it('encodes reviewId', async () => {
      await repo.trackYelp('rev/special')

      expect(mockClient.post).toHaveBeenCalledWith(
        `/api/v1/touch/review/${encodeURIComponent('rev/special')}/track-yelp`,
        {},
        { anonymous: true },
      )
    })
  })

  // ─── Error propagation ──────────────────────────────────────────────────
  describe('Error propagation', () => {
    it('propagates client errors unmodified', async () => {
      const err = { status: 500, errorCode: 'INTERNAL_ERROR' }
      mockClient.get.mockRejectedValue(err)

      await expect(repo.getTouchPage({
        businessSlug: 'b', touchPointSlug: 't', sessionId: 's',
      })).rejects.toEqual(err)
    })

    it('propagates 404 errors', async () => {
      const err = { status: 404, errorCode: 'NOT_FOUND' }
      mockClient.get.mockRejectedValue(err)

      await expect(repo.getPaymentLink({
        staffId: 's', method: 'Venmo', amount: 5,
      })).rejects.toEqual(err)
    })
  })
})
