/**
 * TanStack Query hook for Front Desk -> Report.
 * Unlike useWeeklyPayroll this is NOT owner-gated: a staff member whose PosRole has the
 * `view_pos_report` permission can read it too, which the caller checks via PosAccess.canViewReport.
 */
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { qk } from '../queryKeys'
import posReportRepository, { type PosReportParams, type PosStaffReport } from '../repositories/posReport'
import { PosReportMode } from '../../constants/posReportMode'
import { todayIso } from '../../components/dashboard/views/pos/report/posReportPeriod'

/** Today's numbers change as the front desk works, so that selection must never be served stale. */
function includesToday(params: PosReportParams): boolean {
  return params.mode === PosReportMode.Daily && (params.dates ?? []).includes(todayIso())
}

export function usePosReport(
  params: PosReportParams | null,
  options?: { enabled?: boolean },
) {
  const isLive = params ? includesToday(params) : false
  return useQuery<PosStaffReport>({
    queryKey: qk.merchantPosReport(params?.businessId, params ? serializeSelection(params) : undefined),
    queryFn: () => posReportRepository.getStaffReport(params as PosReportParams),
    enabled: Boolean(params?.businessId) && (options?.enabled ?? true),
    // Changing period keeps the previous table on screen instead of flashing an empty one.
    placeholderData: keepPreviousData,
    staleTime: isLive ? 0 : 30_000,
  })
}

/**
 * The cache key must describe the exact selection, sorted — two different sets of days are two
 * different reports, and an unsorted key would cache the same selection twice.
 */
export function serializeSelection(params: PosReportParams): string {
  if (params.mode === PosReportMode.Daily) {
    return `${params.mode}:${[...(params.dates ?? [])].sort().join(',')}`
  }
  if (params.mode === PosReportMode.Weekly) {
    return `${params.mode}:${[...(params.weeks ?? [])].sort().join(',')}`
  }
  return `${params.mode}:${params.month ?? ''}`
}
