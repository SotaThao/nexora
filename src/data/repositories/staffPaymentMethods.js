import httpClient from '../../lib/httpClient'

export function createStaffPaymentMethodsRepository(client = httpClient) {
  return {
    /** 
     * @returns {Promise<Array<{ id: string, type: string, accountInfo: string, imageUrl: string, isActive: boolean, isConfigured: boolean }>>}
     */
    async getAll() {
      return client.get('/api/v1/staff/payment-methods')
    },

    /**
     * @param {string} id
     * @param {object} dto
     * @param {string} [dto.accountInfo]
     * @param {string} [dto.imageUrl]
     */
    async update(id, dto) {
      return client.put(`/api/v1/staff/payment-methods/${id}`, dto)
    },

    /**
     * @param {string} id
     */
    async toggle(id) {
      return client.patch(`/api/v1/staff/payment-methods/${id}/toggle`)
    }
  }
}

export const staffPaymentMethodsRepository = createStaffPaymentMethodsRepository()
export default staffPaymentMethodsRepository
