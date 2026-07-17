/**
 * dashboardRepository — API integration for Merchant Dashboard metrics.
 */

import httpClient from '../../lib/httpClient'
import { isApiError } from '../../types/domain'
import type {
  DashboardAnalyticsApiDto,
  DashboardAnalyticsLeaderboardItemApiDto,
  DashboardAnalyticsTipsMethodApiDto,
  DashboardAnalyticsTouchPointApiDto,
  DashboardOverviewApiDto,
  DashboardOverviewMetrics,
  DashboardReviewsSummary,
  DashboardStaffMetricApiDto,
  DashboardTipsChartApiDto,
  MerchantDashboardAnalytics,
  MerchantDashboardAnalyticsLeaderboardItem,
  MerchantDashboardAnalyticsTipsMethod,
  MerchantDashboardAnalyticsTouchPoint,
  StaffLeaderboardRow,
  TipsChartDayMetric,
} from '../../types/repositories'

type HttpClient = typeof httpClient

interface DateRangeParams {
  startDate?: string
  endDate?: string
  dateFrom?: string
  dateTo?: string
  [key: string]: string | number | boolean | null | undefined
}

function toDashboardDateParams(params: DateRangeParams = {}) {
  const dateFrom = params.dateFrom || params.startDate
  const dateTo = params.dateTo || params.endDate
  return {
    ...(dateFrom ? { dateFrom } : {}),
    ...(dateTo ? { dateTo } : {}),
  }
}

function toTipsChartDateParams(params: DateRangeParams = {}) {
  const startDate = params.startDate || params.dateFrom
  const endDate = params.endDate || params.dateTo
  if (!startDate || !endDate) return {}

  return {
    DateFrom: `${startDate}T00:00:00.000Z`,
    DateTo: `${endDate}T23:59:59.999Z`,
  }
}

interface ListApiResponse<T> {
  data?: T[]
}

const EMPTY_ANALYTICS: MerchantDashboardAnalytics = {
  overview: {
    totalVolume: 0,
    totalTransactionCount: 0,
    feeSaved: 0,
    averageTipAmount: 0,
  },
  leaderboard: [],
  touchPoints: [],
  tipsMethods: [],
  directPayout: {
    totalAmount: 0,
    totalCount: 0,
  },
}

function normalizeAnalyticsLeaderboardItem(
  dto: DashboardAnalyticsLeaderboardItemApiDto,
): MerchantDashboardAnalyticsLeaderboardItem {
  return {
    staffProfileId: dto.staffProfileId ?? '',
    displayName: dto.displayName ?? '',
    nicknameAtBusiness: dto.nicknameAtBusiness ?? null,
    photoUrl: dto.photoUrl ?? null,
    position: dto.position ?? null,
    tipTotal: Number(dto.tipTotal) || 0,
    tipCount: Number(dto.tipCount) || 0,
    avgTip: Number(dto.avgTip) || 0,
    avgRating: Number(dto.avgRating) || 0,
    reviewCount: Number(dto.reviewCount) || 0,
    selectionCount: Number(dto.selectionCount) || 0,
  }
}

function normalizeAnalyticsTouchPoint(
  dto: DashboardAnalyticsTouchPointApiDto,
): MerchantDashboardAnalyticsTouchPoint {
  return {
    touchPointId: dto.touchPointId ?? '',
    name: dto.name ?? '',
    type: dto.type ?? '',
    scanCount: Number(dto.scanCount) || 0,
    tipCount: Number(dto.tipCount) || 0,
    tipTotal: Number(dto.tipTotal) || 0,
    ctr: Number(dto.ctr) || 0,
    avgRating: Number(dto.avgRating) || 0,
  }
}

function normalizeAnalyticsTipsMethod(
  dto: DashboardAnalyticsTipsMethodApiDto,
): MerchantDashboardAnalyticsTipsMethod {
  return {
    method: dto.method ?? 'Other',
    amount: Number(dto.amount) || 0,
    count: Number(dto.count) || 0,
  }
}

function resolveAnalyticsTipsMethods(
  dto: DashboardAnalyticsApiDto,
): DashboardAnalyticsTipsMethodApiDto[] {
  if (Array.isArray(dto.tipsMethods) && dto.tipsMethods.length > 0) {
    return dto.tipsMethods
  }
  if (Array.isArray(dto.payoutMethods)) {
    return dto.payoutMethods
  }
  return []
}

function normalizeDashboardAnalytics(dto: DashboardAnalyticsApiDto): MerchantDashboardAnalytics {
  const overview = dto.overview ?? {}

  return {
    overview: {
      totalVolume: Number(overview.totalVolume) || 0,
      totalTransactionCount: Number(overview.totalTransactionCount) || 0,
      feeSaved: Number(overview.feeSaved) || 0,
      averageTipAmount: Number(overview.averageTipAmount) || 0,
    },
    leaderboard: Array.isArray(dto.leaderboard)
      ? dto.leaderboard.map(normalizeAnalyticsLeaderboardItem)
      : [],
    touchPoints: Array.isArray(dto.touchPoints)
      ? dto.touchPoints.map(normalizeAnalyticsTouchPoint)
      : [],
    tipsMethods: resolveAnalyticsTipsMethods(dto).map(normalizeAnalyticsTipsMethod),
    directPayout: {
      totalAmount: Number(dto.directPayout?.totalAmount) || 0,
      totalCount: Number(dto.directPayout?.totalCount) || 0,
    },
  }
}

export function createDashboardRepository(client: HttpClient = httpClient) {
  return {
    async getOverview(params: DateRangeParams = {}): Promise<DashboardOverviewMetrics | null> {
      try {
        const response = await client.get<DashboardOverviewApiDto>(
          '/api/v1/merchant/dashboard/overview',
          { params: toDashboardDateParams(params) },
        )

        const tips = response.tipsSummary
        const scans = response.scansSummary
        const reviews = response.reviewsSummary
        const platformReviews = response.platformReviews
        const customers = response.customersSummary

        return {
          totalTips: tips?.totalAmount ?? 0,
          totalTransactions: tips?.totalCount ?? 0,
          averageTip: tips?.avgAmount ?? 0,
          totalReviews: reviews?.totalCount ?? 0,
          scans: scans?.totalPageViews ?? 0,
          conversionRate: scans?.conversionRate ?? 0,
          averageRating: reviews?.avgRating ?? 0,
          googleClicks: reviews?.googleClickCount ?? 0,
          yelpClicks: reviews?.yelpClickCount ?? 0,
          count4To5Stars: reviews?.count4To5Stars ?? 0,
          count1To3Stars: reviews?.count1To3Stars ?? 0,
          responseRate: reviews?.responseRate ?? 0,
          responseRateLabel: reviews?.responseRateLabel ?? null,
          googleAvgRating: platformReviews?.googleAvgRating ?? null,
          googleReviewCount: platformReviews?.googleReviewCount ?? null,
          yelpAvgRating: platformReviews?.yelpAvgRating ?? null,
          yelpReviewCount: platformReviews?.yelpReviewCount ?? null,
          returningCustomerRate: customers?.returningCustomerRate ?? 0,
          returningCustomerRateChangeVsLastWeek: customers?.returningCustomerRateChangeVsLastWeek ?? 0,
          previousPeriodComparison: tips?.previousPeriodComparison ?? null,
        }
      } catch (err: unknown) {
        if (isApiError(err) && err.status === 404) {
          return null
        }
        throw err
      }
    },

    async getReviewsSummary(params: DateRangeParams = {}): Promise<DashboardReviewsSummary | null> {
      try {
        const response = await client.get<DashboardOverviewApiDto>(
          '/api/v1/merchant/dashboard/overview',
          { params: toDashboardDateParams(params) },
        )
        const reviews = response.reviewsSummary
        if (!reviews) return null

        return {
          totalReviews: reviews.totalCount ?? 0,
          averageRating: reviews.avgRating ?? 0,
          googleClicks: reviews.googleClickCount ?? 0,
          yelpClicks: reviews.yelpClickCount ?? 0,
          count4To5Stars: reviews.count4To5Stars ?? 0,
          count1To3Stars: reviews.count1To3Stars ?? 0,
        }
      } catch (err: unknown) {
        if (isApiError(err) && (err.status === 404 || err.status === 403)) {
          return null
        }
        throw err
      }
    },

    async getStaffMetrics(params: DateRangeParams = {}): Promise<StaffLeaderboardRow[]> {
      try {
        const response = await client.get<DashboardStaffMetricApiDto[] | ListApiResponse<DashboardStaffMetricApiDto>>(
          '/api/v1/merchant/dashboard/staff',
          { params: toDashboardDateParams(params) },
        )
        const raw = Array.isArray(response) ? response : (response.data || [])
        return raw.map((s) => ({
          id: s.staffProfileId || s.staffId || s.id || '',
          name: s.displayName || s.staffName || s.name || '',
          tips: s.tipTotal ?? s.tipsCollected ?? s.tips ?? 0,
          rating: s.avgRating ?? s.rating ?? 0,
          totalReviews: s.reviewCount ?? s.totalReviews ?? 0,
        }))
      } catch (err: unknown) {
        if (isApiError(err) && (err.status === 404 || err.status === 403)) {
          return []
        }
        throw err
      }
    },

    async getTouchpointMetrics(params: DateRangeParams = {}): Promise<LooseObject[]> {
      const response = await client.get<LooseObject[] | ListApiResponse<LooseObject>>(
        '/api/v1/merchant/dashboard/touchpoints',
        { params: toDashboardDateParams(params) },
      )
      return Array.isArray(response) ? response : (response.data || [])
    },

    async getAnalytics(params: DateRangeParams = {}): Promise<MerchantDashboardAnalytics> {
      try {
        const response = await client.get<DashboardAnalyticsApiDto>(
          '/api/v1/merchant/dashboard/analytics',
          { params: toDashboardDateParams(params) },
        )
        return normalizeDashboardAnalytics(response)
      } catch (err: unknown) {
        if (isApiError(err) && (err.status === 404 || err.status === 403)) {
          return EMPTY_ANALYTICS
        }
        throw err
      }
    },

    async getTipsChart(params: DateRangeParams = {}): Promise<TipsChartDayMetric[]> {
      try {
        const response = await client.get<
          DashboardTipsChartApiDto[] | ListApiResponse<DashboardTipsChartApiDto>
        >(
          '/api/v1/merchant/dashboard/tips-chart',
          { params: toTipsChartDateParams(params) },
        )
        const raw = Array.isArray(response) ? response : (response.data || [])
        return raw.map((point) => ({
          date: point.date,
          totalAmount: point.totalAmount ?? 0,
          tipCount: point.tipCount ?? 0,
          avgAmount: point.avgAmount ?? 0,
        }))
      } catch (err: unknown) {
        if (isApiError(err) && (err.status === 404 || err.status === 403)) {
          return []
        }
        throw err
      }
    },
  }
}

export const dashboardRepository = createDashboardRepository()
export default dashboardRepository
