import { useQuery } from '@tanstack/react-query'
import { dashboardRepository } from '../repositories/dashboard'
import { qk } from '../queryKeys'
import type { DashboardOverviewMetrics, StaffLeaderboardRow } from '../../types/repositories'

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
    staleTime: 5 * 60 * 1000,
  })
}

export function useDashboardStaff(params: DateRangeParams = EMPTY_PARAMS) {
  return useQuery<StaffLeaderboardRow[]>({
    queryKey: [...qk.dashboardStaff(), params],
    queryFn: () => dashboardRepository.getStaffMetrics(params),
    staleTime: 5 * 60 * 1000,
  })
}

export function useDashboardTouchpoints(params: DateRangeParams = EMPTY_PARAMS) {
  return useQuery<LooseObject[]>({
    queryKey: [...qk.dashboardTouchpoints(), params],
    queryFn: () => dashboardRepository.getTouchpointMetrics(params),
    staleTime: 5 * 60 * 1000,
  })
}
