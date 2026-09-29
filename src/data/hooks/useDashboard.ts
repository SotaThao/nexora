import { useQuery } from '@tanstack/react-query'
import { dashboardRepository } from '../repositories/dashboard'
import { qk } from '../queryKeys'
import type {
  DashboardOverviewMetrics,
  DashboardReviewsSummary,
  MerchantDashboardAnalytics,
  StaffLeaderboardRow,
  TipsChartDayMetric,
} from '../../types/repositories'

const EMPTY_PARAMS = {}

interface DateRangeParams {
  startDate?: string
  endDate?: string
  [key: string]: string | number | boolean | null | undefined
}

export function useDashboardOverview(params: DateRangeParams = EMPTY_PARAMS) {
  return useQuery<DashboardOverviewMetrics | null>({
    queryKey: [...qk.dashboardOverview(), params],
    queryFn: () => dashboardRepository.getOverview(params),
  })
}

/**
 * All-time review summary for the Reviews tab KPI cards.
 * Overview API defaults to the last 30 days when DateFrom/DateTo are omitted,
 * so we pass an explicit wide range to match the unscoped reviews list.
 */
export function reviewsSummaryAllTimeRange(): { dateFrom: string; dateTo: string } {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return { dateFrom: '2000-01-01', dateTo: `${y}-${m}-${d}` }
}

export function useDashboardReviewsSummary({ enabled = true } = {}) {
  const range = reviewsSummaryAllTimeRange()
  return useQuery<DashboardReviewsSummary | null>({
    queryKey: [...qk.dashboardOverview(), 'reviews-summary', range.dateFrom, range.dateTo],
    queryFn: () => dashboardRepository.getReviewsSummary(range),
    enabled,
    staleTime: 30_000,
  })
}

export function useDashboardStaff(params: DateRangeParams = EMPTY_PARAMS) {
  return useQuery<StaffLeaderboardRow[]>({
    queryKey: [...qk.dashboardStaff(), params],
    queryFn: () => dashboardRepository.getStaffMetrics(params),
    retry: false,
  })
}

export function useDashboardTouchpoints(params: DateRangeParams = EMPTY_PARAMS) {
  return useQuery<LooseObject[]>({
    queryKey: [...qk.dashboardTouchpoints(), params],
    queryFn: () => dashboardRepository.getTouchpointMetrics(params),
  })
}

export function useDashboardAnalytics(params: DateRangeParams = EMPTY_PARAMS) {
  return useQuery<MerchantDashboardAnalytics>({
    queryKey: [...qk.dashboardAnalytics(), params],
    queryFn: () => dashboardRepository.getAnalytics(params),
    retry: false,
  })
}

export function useDashboardTipsChart(params: DateRangeParams = EMPTY_PARAMS) {
  const enabled = Boolean(params.startDate && params.endDate)

  return useQuery<TipsChartDayMetric[]>({
    queryKey: [...qk.dashboardTipsChart(), params],
    queryFn: () => dashboardRepository.getTipsChart(params),
    enabled,
    retry: false,
  })
}

/** Returns the current calendar month's boundary as ISO date strings. */
export function currentMonthRange(): { dateFrom: string; dateTo: string } {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const lastDay = new Date(y, now.getMonth() + 1, 0).getDate()
  return { dateFrom: `${y}-${m}-01`, dateTo: `${y}-${m}-${String(lastDay).padStart(2, '0')}` }
}

/** Returns the current calendar year's boundary as ISO date strings. */
function currentYearRange(): { dateFrom: string; dateTo: string } {
  const y = new Date().getFullYear()
  return { dateFrom: `${y}-01-01`, dateTo: `${y}-12-31` }
}

/** Overview metrics scoped to the current calendar month. */
export function useDashboardOverviewCurrentMonth() {
  const params = currentMonthRange()
  return useQuery<DashboardOverviewMetrics | null>({
    queryKey: [...qk.dashboardOverview(), 'current-month', params.dateFrom],
    queryFn: () => dashboardRepository.getOverview(params),
    staleTime: 5 * 60 * 1000,
  })
}

/** Overview metrics scoped to the current calendar year. */
export function useDashboardOverviewCurrentYear() {
  const params = currentYearRange()
  return useQuery<DashboardOverviewMetrics | null>({
    queryKey: [...qk.dashboardOverview(), 'current-year', params.dateFrom.slice(0, 4)],
    queryFn: () => dashboardRepository.getOverview(params),
    staleTime: 5 * 60 * 1000,
  })
}
