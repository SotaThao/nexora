import { useQuery } from '@tanstack/react-query'
import { dashboardRepository } from '../repositories/dashboard'
import { qk } from '../queryKeys'
import type { DashboardOverviewMetrics, StaffLeaderboardRow, TipsChartDayMetric } from '../../types/repositories'

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

export function useDashboardTipsChart(params: DateRangeParams = EMPTY_PARAMS) {
  const enabled = Boolean(params.startDate && params.endDate)

  return useQuery<TipsChartDayMetric[]>({
    queryKey: [...qk.dashboardTipsChart(), params],
    queryFn: () => dashboardRepository.getTipsChart(params),
    enabled,
    retry: false,
  })
}
