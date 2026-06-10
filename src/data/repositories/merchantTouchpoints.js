/**
 * merchantTouchpointsRepository — API-only implementation.
 * Calls the Nexora REST API for merchant touchpoint operations.
 */
import httpClient from "../../lib/httpClient";

export function createMerchantTouchpointsRepository(client = httpClient) {
  return {
    /**
     * Get all touch points (flat array, no pagination)
     * @returns {Promise<Array<{touchPointId: string, name: string, type: string, scanCount: number, tipCount: number, tipTotal: number, ctr: number, avgRating: number}>>}
     */
    async getTouchpoints() {
      const res = await client.get('/api/v1/merchant/dashboard/touchpoints');

      const arr = Array.isArray(res) ? res : [];

      return arr.map((item) => ({
        touchPointId: item.touchPointId || '',
        name: item.name || '',
        type: item.type || 'Table',
        scanCount: item.scanCount ?? 0,
        tipCount: item.tipCount ?? 0,
        tipTotal: item.tipTotal ?? 0,
        ctr: item.ctr ?? 0,
        avgRating: item.avgRating ?? 0,
      }));
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
      return await client.post("/api/v1/merchant/touchpoints", dto);
    },

    /**
     * Soft-delete a touch point
     * @param {string} id
     * @returns {Promise<void>}
     */
    async deleteTouchpoint(id) {
      return await client.delete(`/api/v1/merchant/touchpoints/${id}`);
    },

    /**
     * Get the download URL or trigger download
     * @param {string} id
     * @param {string} format - "png" | "pdf"
     * @returns {Promise<Blob>}
     */
    async downloadQr(id, format = "png") {
      return await client.getBlob(
        `/api/v1/merchant/touchpoints/${id}/download?format=${format}`,
      );
    },
  };
}

export const merchantTouchpointsRepository =
  createMerchantTouchpointsRepository();
export default merchantTouchpointsRepository;
