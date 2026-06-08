/**
 * dashboardRepository — API integration for Merchant Dashboard metrics.
 */

import httpClient from '../../lib/httpClient'

export function createDashboardRepository(client = httpClient) {
  return {
    /**
     * @param {object} params
     * @param {string} [params.startDate] - ISO date string
     * @param {string} [params.endDate] - ISO date string
     * @returns {Promise<object>}
     */
    async getOverview(params = {}) {
      try {
        // Pass params to query string if needed
        const response = await client.get('/api/v1/merchant/dashboard/overview', { params })
        
        // We don't have the exact DTO from the spec yet, so we map to the exact shape 
        // the existing Overview/Reports components expect.
        // DTO might have totalTipAmount, tipCount, etc. 
        // We fall back to 0 if the field is missing.
        return {
          totalTips: response.totalTipAmount || response.totalTips || 0,
          totalTransactions: response.tipCount || response.totalTransactions || 0,
          averageTip: response.averageTip || 0,
          totalReviews: response.totalReviews || 0,
          
          // Detailed metrics
          scans: response.totalScans || 0,
          conversionRate: response.conversionRate || 0,
          publicReviews: response.publicReviews || 0,
          privateReviews: response.privateReviews || 0,
          averageRating: response.averageRating || 0,
          googleClicks: response.googleClicks || 0,
          yelpClicks: response.yelpClicks || 0,
          
          // Mappings for specific KPIs in Overview bottom section
          googleRating: response.googleRating || response.averageRating || 0,
          googleReviews: response.googleReviews || response.publicReviews || 0,
          yelpRating: response.yelpRating || response.averageRating || 0,
          yelpReviews: response.yelpReviews || 0,
          responseRate: response.responseRate || 0,
          returningCustomers: response.returningCustomers || 0,
          returningCustomersDelta: response.returningCustomersDelta || 0,
        }
      } catch (err) {
        if (err?.status === 404) {
          return null
        }
        throw err
      }
    },

    /**
     * @param {object} params
     * @param {string} [params.startDate]
     * @param {string} [params.endDate]
     * @returns {Promise<Array>}
     */
    async getStaffMetrics(params = {}) {
      const response = await client.get('/api/v1/merchant/dashboard/staff', { params })
      const raw = Array.isArray(response) ? response : (response.data || [])
      return raw.map(s => ({
        id: s.staffId || s.id || '',
        name: s.staffName || s.name || '',
        tips: s.tipsCollected || s.tips || 0,
        rating: s.avgRating || s.rating || 0,
        totalReviews: s.totalReviews || 0,
      }))
    },

    /**
     * @param {object} params
     * @param {string} [params.startDate]
     * @param {string} [params.endDate]
     * @returns {Promise<Array>}
     */
    async getTouchpointMetrics(params = {}) {
      const response = await client.get('/api/v1/merchant/dashboard/touchpoints', { params })
      return Array.isArray(response) ? response : (response.data || [])
    }
  }
}

export const dashboardRepository = createDashboardRepository()
export default dashboardRepository
