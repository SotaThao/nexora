import httpClient from '../../lib/httpClient'

export function createMerchantPaymentMethodsRepository(client = httpClient) {
  return {
    /** 
     * @returns {Promise<Array<{ id: string, type: string, accountInfo: string, imageUrl: string, isActive: boolean, isConfigured: boolean, businessKybStatus: string|null }>>}
     */
    async getAll() {
      return client.get('/api/v1/merchant/payment-methods')
    },

    /**
     * @param {string} id
     * @param {object} dto
     * @param {string} [dto.accountInfo]
     * @param {string} [dto.imageUrl]
     */
    async update(id, dto) {
      return client.put(`/api/v1/merchant/payment-methods/${id}`, dto)
    },

    /**
     * @param {string} id
     */
    async toggle(id) {
      return client.patch(`/api/v1/merchant/payment-methods/${id}/toggle`)
    }
  }
}

export const merchantPaymentMethodsRepository = createMerchantPaymentMethodsRepository()
export default merchantPaymentMethodsRepository
