/**
 * merchantTouchpointsRepository — API-only implementation.
 * Calls the Nexora REST API for merchant touchpoint operations.
 */
import httpClient from '../../lib/httpClient'

export function createMerchantTouchpointsRepository(client = httpClient) {
  return {
    /**
     * Get paginated active touch points
     * @param {object} params
     * @param {number} [params.PageNumber]
     * @param {number} [params.PageSize]
     * @param {string} [params.Name]
     * @returns {Promise<{items: Array, pageNumber: number, totalPages: number, totalCount: number, hasNextPage: boolean, hasPreviousPage: boolean}>}
     */
    async getTouchpoints(params = {}) {
      const queryParams = new URLSearchParams()
      if (params.PageNumber) queryParams.append('PageNumber', params.PageNumber)
      if (params.PageSize) queryParams.append('PageSize', params.PageSize)
      if (params.Name) queryParams.append('Name', params.Name)
      
      const queryString = queryParams.toString()
      const url = `/api/v1/merchant/touchpoints${queryString ? `?${queryString}` : ''}`

      let res
      try {
        res = await client.get(url)
      } catch (err) {
        // Treat 404 as "no touchpoints yet" and return an empty page
        if (err?.status === 404) {
          return { items: [], pageNumber: 1, totalPages: 0, totalCount: 0, hasNextPage: false, hasPreviousPage: false }
        }
        throw err
      }

      // Fallback for empty response
      if (!res) {
        return { items: [], pageNumber: 1, totalPages: 0, totalCount: 0, hasNextPage: false, hasPreviousPage: false }
      }
      
      // If the API returns a direct array, wrap it in a pagination object
      if (Array.isArray(res)) {
        return { items: res, pageNumber: 1, totalPages: 1, totalCount: res.length, hasNextPage: false, hasPreviousPage: false }
      }
      
      return res
    },

    /**
     * Create a new touch point
     * @param {object} dto
     * @param {string} dto.name - 2-100 chars
     * @param {string} dto.type - "Table" | "FrontDesk" | "Receipt" | "StaffCard"
     * @param {string} [dto.assignedStaffProfileId] - Required if type is "StaffCard"
     * @returns {Promise<{touchPointId: string, qrImageUrl: string}>}
     */
    async createTouchpoint(dto) {
      return await client.post('/api/v1/merchant/touchpoints', dto)
    },

    /**
     * Soft-delete a touch point
     * @param {string} id
     * @returns {Promise<void>}
     */
    async deleteTouchpoint(id) {
      return await client.del(`/api/v1/merchant/touchpoints/${id}`)
    },

    /**
     * Get the download URL or trigger download
     * @param {string} id
     * @param {string} format - "png" | "pdf"
     * @returns {Promise<Blob>}
     */
    async downloadQr(id, format = 'png') {
      return await client.getBlob(`/api/v1/merchant/touchpoints/${id}/download?format=${format}`)
    }
  }
}

export const merchantTouchpointsRepository = createMerchantTouchpointsRepository()
export default merchantTouchpointsRepository
