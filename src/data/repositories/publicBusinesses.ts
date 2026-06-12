/**
 * publicBusinessesRepository — Public business API integration.
 *
 * All endpoints are anonymous (no auth token) because they are
 * accessed by end-customers in the guest tipping / review flow.
 *
 * Endpoints:
 *   GET   /api/v1/public/businesses/{businessId}/payment-methods
 *   GET   /api/v1/public/businesses/{businessId}/payment-methods/{id}
 *   POST  /api/v1/tips/multi-staff
 *   PATCH /api/v1/tips/{id}/confirm
 */

import httpClient from '../../lib/httpClient'

/**
 * Factory that creates a public-businesses repository bound to the given HTTP client.
 *
 * @param {typeof httpClient} client - HTTP client instance (defaults to the singleton)
 * @returns {object} Repository methods
 */
export function createPublicBusinessesRepository(client = httpClient) {
  return {
    /**
     * List all active payment methods configured for a business.
     *
     * @param {string} businessId - Business UUID
     * @returns {Promise<Array>} List of payment method records
     * @throws {Error} If businessId is falsy
     */
    async getPaymentMethods(businessId) {
      if (!businessId) {
        throw new Error('publicBusinessesRepository.getPaymentMethods: businessId is required')
      }
      return client.get(
        `/api/v1/public/businesses/${encodeURIComponent(businessId)}/payment-methods`,
        { anonymous: true },
      )
    },

    /**
     * Fetch a single payment method by ID.
     *
     * @param {string} businessId       - Business UUID
     * @param {string} paymentMethodId  - Payment method UUID
     * @returns {Promise<object>} Payment method record
     * @throws {Error} If businessId is falsy
     */
    async getPaymentMethodById(businessId, paymentMethodId) {
      if (!businessId) {
        throw new Error('publicBusinessesRepository.getPaymentMethodById: businessId is required')
      }
      return client.get(
        `/api/v1/public/businesses/${encodeURIComponent(businessId)}/payment-methods/${encodeURIComponent(paymentMethodId)}`,
        { anonymous: true },
      )
    },

    /**
     * Create a multi-staff tip (single payment split across several staff members).
     *
     * @param {object} args
     * @param {string} args.businessId              - Business UUID
     * @param {string} args.touchPointId            - Touch-point UUID
     * @param {string} args.businessPaymentMethodId - Payment method UUID to charge
     * @param {Array<{staffProfileId: string, amount: number}>} args.tipItems - Per-staff amounts
     * @returns {Promise<object>} Created multi-staff tip record
     * @throws {Error} If businessId is falsy
     */
    async createMultiStaffTip({ businessId, touchPointId, businessPaymentMethodId, tipItems }) {
      if (!businessId) {
        throw new Error('publicBusinessesRepository.createMultiStaffTip: businessId is required')
      }
      return client.post(
        '/api/v1/tips/multi-staff',
        { businessId, touchPointId, businessPaymentMethodId, tipItems },
        { anonymous: true },
      )
    },

    /**
     * Confirm a multi-staff tip by ID.
     *
     * @param {string} tipId - Tip UUID to confirm
     * @returns {Promise<object>} Confirmation response
     */
    async confirmMultiStaffTip(tipId) {
      return client.patch(
        `/api/v1/tips/${encodeURIComponent(tipId)}/confirm`,
        {},
        { anonymous: true },
      )
    },
  }
}

/** Default singleton instance */
export const publicBusinessesRepository = createPublicBusinessesRepository()
export default publicBusinessesRepository
