import { useQuery } from '@tanstack/react-query'
import { dashboardRepository } from '../repositories/dashboard'
import { qk } from '../queryKeys'

export function useDashboardOverview(params = {}) {
  return useQuery({
    queryKey: [...qk.dashboardOverview(), params],
    queryFn: () => dashboardRepository.getOverview(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export function useDashboardStaff(params = {}) {
  return useQuery({
    queryKey: [...qk.dashboardStaff(), params],
    queryFn: () => dashboardRepository.getStaffMetrics(params),
    staleTime: 5 * 60 * 1000,
  })
}

export function useDashboardTouchpoints(params = {}) {
  return useQuery({
    queryKey: [...qk.dashboardTouchpoints(), params],
    queryFn: () => dashboardRepository.getTouchpointMetrics(params),
    staleTime: 5 * 60 * 1000,
  })
}
