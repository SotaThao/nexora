/**
 * dashboardRepository — API integration for Merchant Dashboard metrics.
 */

import httpClient from '../../lib/httpClient'
import { isApiError } from '../../types/domain'
import type {
  DashboardOverviewApiDto,
  DashboardOverviewMetrics,
  DashboardStaffMetricApiDto,
  StaffLeaderboardRow,
} from '../../types/repositories'

type HttpClient = typeof httpClient

interface DateRangeParams {
  startDate?: string
  endDate?: string
  [key: string]: string | number | boolean | null | undefined
}

interface ListApiResponse<T> {
  data?: T[]
}

export function createDashboardRepository(client: HttpClient = httpClient) {
  return {
    async getOverview(params: DateRangeParams = {}): Promise<DashboardOverviewMetrics | null> {
      try {
        const response = await client.get<DashboardOverviewApiDto>(
          '/api/v1/merchant/dashboard/overview',
          { params },
        )

        return {
          totalTips: response.totalTipAmount || response.totalTips || 0,
          totalTransactions: response.tipCount || response.totalTransactions || 0,
          averageTip: response.averageTip || 0,
          totalReviews: response.totalReviews || 0,
          scans: response.totalScans || 0,
          conversionRate: response.conversionRate || 0,
          publicReviews: response.publicReviews || 0,
          privateReviews: response.privateReviews || 0,
          averageRating: response.averageRating || 0,
          googleClicks: response.googleClicks || 0,
          yelpClicks: response.yelpClicks || 0,
          googleRating: response.googleRating || response.averageRating || 0,
          googleReviews: response.googleReviews || response.publicReviews || 0,
          yelpRating: response.yelpRating || response.averageRating || 0,
          yelpReviews: response.yelpReviews || 0,
          responseRate: response.responseRate || 0,
          returningCustomers: response.returningCustomers || 0,
          returningCustomersDelta: response.returningCustomersDelta || 0,
        }
      } catch (err: unknown) {
        if (isApiError(err) && err.status === 404) {
          return null
        }
        throw err
      }
    },

    async getStaffMetrics(params: DateRangeParams = {}): Promise<StaffLeaderboardRow[]> {
      const response = await client.get<DashboardStaffMetricApiDto[] | ListApiResponse<DashboardStaffMetricApiDto>>(
        '/api/v1/merchant/dashboard/staff',
        { params },
      )
      const raw = Array.isArray(response) ? response : (response.data || [])
      return raw.map((s) => ({
        id: s.staffId || s.id || '',
        name: s.staffName || s.name || '',
        tips: s.tipsCollected || s.tips || 0,
        rating: s.avgRating || s.rating || 0,
        totalReviews: s.totalReviews || 0,
      }))
    },

    async getTouchpointMetrics(params: DateRangeParams = {}): Promise<LooseObject[]> {
      const response = await client.get<LooseObject[] | ListApiResponse<LooseObject>>(
        '/api/v1/merchant/dashboard/touchpoints',
        { params },
      )
      return Array.isArray(response) ? response : (response.data || [])
    },
  }
}

export const dashboardRepository = createDashboardRepository()
export default dashboardRepository
