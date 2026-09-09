/**
 * TanStack Query hook for Front Desk -> Report.
 * Unlike useWeeklyPayroll this is NOT owner-gated: a staff member whose PosRole has the
 * `view_pos_report` permission can read it too, which the caller checks via PosAccess.canViewReport.
 */
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { qk } from '../queryKeys'
import posReportRepository, {
  type PosReportDetailParams,
  type PosReportParams,
  type PosStaffReport,
  type PosStaffReportDetail,
  type PosStaffReportEmailBulkParams,
  type PosStaffReportEmailBulkResultItem,
  type PosStaffReportEmailParams,
} from '../repositories/posReport'
import { PosReportMode } from '../../constants/posReportMode'
import { todayIso } from '../../components/dashboard/views/pos/report/posReportPeriod'
import posCheckoutRepository from '../repositories/posCheckout'
import type { OrderDetailApiDto } from '../../types/repositories'
import { PosOrderStatus } from '../../constants/posOrderStatus'

/** Today's numbers change as the front desk works, so that selection must never be served stale. */
function includesToday(params: PosReportParams): boolean {
  return params.mode === PosReportMode.Daily
    && (params.dates ?? []).includes(todayIso(params.timeZone))
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

export function usePosReportDetail(
  params: PosReportDetailParams | null,
  options?: { enabled?: boolean },
) {
  const queryClient = useQueryClient()
  const selection = params
    ? `${params.mode}:${params.periodStart}:${params.periodEnd}:${params.timeZone}`
    : ''

  return useQuery<PosStaffReportDetail>({
    queryKey: qk.merchantPosReportDetail(
      params?.businessId,
      params?.posStaffProfileId,
      selection,
    ),
    queryFn: () => posReportRepository.getStaffReportDetail(
      params as PosReportDetailParams,
      (businessId, orderId) => {
        const queryKey = qk.merchantPosOrderDetail(businessId, orderId)
        const cached = queryClient.getQueryData<OrderDetailApiDto>(queryKey)
        return queryClient.fetchQuery({
          queryKey,
          queryFn: () => posCheckoutRepository.getOrderDetail(businessId, orderId),
          // A cross-device checkout can leave a recent InService response in this shared cache.
          // Only a completed snapshot is immutable and safe to reuse for five minutes.
          staleTime: cached?.status === PosOrderStatus.Completed ? 5 * 60 * 1000 : 0,
        })
      },
    ),
    enabled: Boolean(params?.businessId && params?.posStaffProfileId) && (options?.enabled ?? true),
    // The summary refetches whenever the Report tab is revisited. Reopening a detail modal must
    // do the same so a newly completed checkout cannot leave the row and modal out of sync.
    staleTime: 0,
    refetchOnMount: 'always',
  })
}

export function useSendPosStaffReportEmail() {
  return useMutation<void, Error, PosStaffReportEmailParams>({
    mutationFn: (params) => posReportRepository.sendStaffReportEmail(params),
  })
}

export function useSendPosStaffReportEmailBulk() {
  return useMutation<PosStaffReportEmailBulkResultItem[], Error, PosStaffReportEmailBulkParams>({
    mutationFn: (params) => posReportRepository.sendStaffReportEmailBulk(params),
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
