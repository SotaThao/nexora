/**
 * staffAccountsRepository — API-only implementation.
 */

import profileSettingsRepository from './profileSettings'
import staffPaymentMethodsRepository from './staffPaymentMethods'
import type { StaffAccountView } from '../../types/domain'
import type { UpdateStaffProfileDto } from '../../types/repositories'

export function createStaffAccountsRepository() {
  return {
    async getAll(): Promise<Record<string, StaffAccountView>> {
      // TODO: Wire to GET /api/v1/merchant/staff-accounts
      return {}
    },

    async get(staffId?: string | null): Promise<StaffAccountView | null> {
      if (staffId && staffId !== 'self') {
        // TODO: Wire to GET /api/v1/merchant/staff-accounts/:staffId
        return null
      }

      const [profile, paymentMethods] = await Promise.all([
        profileSettingsRepository.get(),
        staffPaymentMethodsRepository.getAll(),
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
          isPending: true,
        },
      }
    },

    async save(staffId: string | null | undefined, data: UpdateStaffProfileDto | LooseObject): Promise<void> {
      if (staffId === 'self' || !staffId) {
        await profileSettingsRepository.updateStaffProfile(data as UpdateStaffProfileDto)
        return
      }
      // TODO: Wire to PUT /api/v1/merchant/staff-accounts/:staffId
    },
  }
}

export const staffAccountsRepository = createStaffAccountsRepository()
export default staffAccountsRepository
