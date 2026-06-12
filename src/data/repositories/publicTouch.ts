/**
 * publicTouchRepository — Public customer touch API integration.
 *
 * All endpoints are anonymous (no auth token) because they are
 * accessed by end-customers scanning a QR code / tipping link.
 *
 * Endpoints:
 *   GET  /api/v1/touch/{businessSlug}/{touchPointSlug}?sessionId=
 *   GET  /api/v1/touch/payment-link?staffId=&method=&amount=
 *   POST /api/v1/touch/tip
 *   POST /api/v1/touch/tip/{tipId}/confirm
 *   POST /api/v1/touch/tip/skip
 *   POST /api/v1/touch/review
 *   POST /api/v1/touch/review/{reviewId}/track-google
 *   POST /api/v1/touch/review/{reviewId}/track-yelp
 */

import httpClient from '../../lib/httpClient'

/**
 * PaymentMethod mapping: UI display names → wire format (string enum from Swagger).
 * Keeps the mapping in one place so components can use friendly names.
 * @type {Record<string, string>}
 */
const PAYMENT_METHOD_MAP = {
  CashApp: 'CashApp',
  Venmo: 'Venmo',
  Zelle: 'Zelle',
  PayPal: 'PayPal',
  AppleCash: 'AppleCash',
}

/**
 * Convert a UI-friendly payment method name to the wire format.
 * Falls back to the original value when no mapping exists.
 *
 * @param {string} uiMethod - Payment method name from the UI
 * @returns {string} Wire-format payment method string
 */
function toWireMethod(uiMethod) {
  return PAYMENT_METHOD_MAP[uiMethod] ?? uiMethod
}

/**
 * Factory that creates a public-touch repository bound to the given HTTP client.
 *
 * @param {typeof httpClient} client - HTTP client instance (defaults to the singleton)
 * @returns {object} Repository methods
 */
export function createPublicTouchRepository(client = httpClient) {
  return {
    /**
     * Fetch the touch-point landing page data for a business.
     *
     * @param {object} args
     * @param {string} args.businessSlug   - URL-safe business identifier
     * @param {string} args.touchPointSlug - URL-safe touch-point identifier
     * @param {string} args.sessionId      - Unique session UUID
     * @returns {Promise<object>} Touch page payload
     */
    async getTouchPage({ businessSlug, touchPointSlug, sessionId }) {
      return client.get(
        `/api/v1/touch/${encodeURIComponent(businessSlug)}/${encodeURIComponent(touchPointSlug)}`,
        { anonymous: true, params: { sessionId } },
      )
    },

    /**
     * Generate a deep-link / redirect URL for a specific payment method.
     *
     * @param {object} args
     * @param {string} args.staffId - Staff profile ID
     * @param {string} args.method  - Payment method (UI name)
     * @param {number} args.amount  - Tip amount in cents or dollars (per API contract)
     * @returns {Promise<object>} Payment link response
     */
    async getPaymentLink({ staffId, method, amount }) {
      return client.get('/api/v1/touch/payment-link', {
        anonymous: true,
        params: { staffId, method: toWireMethod(method), amount },
      })
    },

    /**
     * Create a new tip record.
     *
     * @param {object} args
     * @param {string} args.touchPointId    - Touch-point ID
     * @param {string} args.staffProfileId  - Staff profile receiving the tip
     * @param {number} args.amount          - Tip amount
     * @param {string} args.paymentMethod   - Payment method (UI name)
     * @param {string} args.sessionId       - Session UUID
     * @returns {Promise<object>} Created tip record
     */
    async createTip({ touchPointId, staffProfileId, amount, paymentMethod, sessionId }) {
      return client.post(
        '/api/v1/touch/tip',
        {
          touchPointId,
          staffProfileId,
          amount,
          paymentMethod: toWireMethod(paymentMethod),
          sessionId,
        },
        { anonymous: true },
      )
    },

    /**
     * Confirm a previously-created tip.
     *
     * @param {string} tipId - ID of the tip to confirm
     * @returns {Promise<object>} Confirmation response
     */
    async confirmTip(tipId) {
      return client.post(
        `/api/v1/touch/tip/${encodeURIComponent(tipId)}/confirm`,
        {},
        { anonymous: true },
      )
    },

    /**
     * Skip tipping entirely for the current session.
     *
     * @param {object} args
     * @param {string} args.touchPointId   - Touch-point ID
     * @param {string} args.staffProfileId - Staff profile ID
     * @param {string} args.sessionId      - Session UUID
     * @returns {Promise<object>} Skip response
     */
    async skipTip({ touchPointId, staffProfileId, sessionId }) {
      return client.post(
        '/api/v1/touch/tip/skip',
        { touchPointId, staffProfileId, sessionId },
        { anonymous: true },
      )
    },

    /**
     * Submit a customer review after tipping.
     *
     * @param {object} args
     * @param {string}  args.touchPointId   - Touch-point ID
     * @param {string}  [args.tipId]        - Optional related tip ID
     * @param {string}  args.staffProfileId - Staff profile ID
     * @param {number}  args.rating         - Star rating (1–5)
     * @param {string}  [args.comment]      - Free-text comment
     * @param {string}  [args.customerEmail]- Customer email (optional)
     * @param {string}  [args.customerName] - Customer name (optional)
     * @returns {Promise<object>} Created review record
     */
    async createReview({ touchPointId, tipId, staffProfileId, rating, comment, customerEmail, customerName }) {
      return client.post(
        '/api/v1/touch/review',
        { touchPointId, tipId, staffProfileId, rating, comment, customerEmail, customerName },
        { anonymous: true },
      )
    },

    /**
     * Track that the customer clicked through to Google Reviews.
     *
     * @param {string} reviewId - Review ID to track
     * @returns {Promise<object>} Tracking response
     */
    async trackGoogle(reviewId) {
      return client.post(
        `/api/v1/touch/review/${encodeURIComponent(reviewId)}/track-google`,
        {},
        { anonymous: true },
      )
    },

    /**
     * Track that the customer clicked through to Yelp Reviews.
     *
     * @param {string} reviewId - Review ID to track
     * @returns {Promise<object>} Tracking response
     */
    async trackYelp(reviewId) {
      return client.post(
        `/api/v1/touch/review/${encodeURIComponent(reviewId)}/track-yelp`,
        {},
        { anonymous: true },
      )
    },
  }
}

/** Default singleton instance */
export const publicTouchRepository = createPublicTouchRepository()
export default publicTouchRepository
