/**
 * staffAccountsRepository — API-only implementation.
 * TODO: Wire to real staff accounts API endpoints when available.
 */

import profileSettingsRepository from './profileSettings'
import staffPaymentMethodsRepository from './staffPaymentMethods'

export function createStaffAccountsRepository() {
  return {
    /**
     * @returns {Promise<object>} — keyed by staffId, or {} if absent
     */
    async getAll() {
      // TODO: Wire to GET /api/v1/merchant/staff-accounts
      return {}
    },

    /**
     * Composes the staff account view for the Personal dashboard.
     * @param {string} staffId
     * @returns {Promise<object|null>}
     */
    async get(staffId) {
      if (staffId && staffId !== 'self') {
        // TODO: Wire to GET /api/v1/merchant/staff-accounts/:staffId for merchant reading staff
        return null
      }

      // 'self' logic (Personal dashboard)
      const [profile, paymentMethods] = await Promise.all([
        profileSettingsRepository.get(),
        staffPaymentMethodsRepository.getAll()
      ])

      if (!profile) return null

      return {
        id: profile.id,
        profile,
        paymentMethods,
        tips: [],
        staffReviews: [],
        kpis: {
          totalTips: 0,
          averageTip: 0,
          totalTransactions: 0,
          averageRating: 0,
          isPending: true // signals to UI that stats are deferred
        }
      }
    },

    /**
     * @param {string} staffId
     * @param {object} data
     */
    async save(staffId, data) {
      // Keep existing mapping to profile update
      if (staffId === 'self' || !staffId) {
        return profileSettingsRepository.updateStaffProfile(data)
      }
      // TODO: Wire to PUT /api/v1/merchant/staff-accounts/:staffId
    },
  }
}

export const staffAccountsRepository = createStaffAccountsRepository()
export default staffAccountsRepository
