import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { qk } from '../queryKeys'
import posServiceIncomeReportRepository, {
  type PosServiceIncomeLinePage,
  type PosServiceIncomeLinesParams,
  type PosServiceIncomeReport,
  type PosServiceIncomeReportParams,
} from '../repositories/posServiceIncomeReport'

export function serializePosServiceIncomeSelection(params: PosServiceIncomeReportParams): string {
  return [params.mode, params.date ?? '', params.from ?? '', params.to ?? ''].join(':')
}

function serializePosServiceIncomeLinesSelection(params: PosServiceIncomeLinesParams): string {
  return [
    serializePosServiceIncomeSelection(params),
    params.rowType,
    params.rowId ?? '',
    params.pageNumber ?? 1,
    params.pageSize ?? '',
  ].join(':')
}

export function usePosServiceIncomeReport(
  params: PosServiceIncomeReportParams | null,
  options?: { enabled?: boolean },
) {
  return useQuery<PosServiceIncomeReport>({
    queryKey: qk.merchantPosServiceIncomeReport(
      params?.businessId,
      params ? serializePosServiceIncomeSelection(params) : undefined,
    ),
    queryFn: () => posServiceIncomeReportRepository.getReport(params as PosServiceIncomeReportParams),
    enabled: Boolean(params?.businessId) && (options?.enabled ?? true),
    placeholderData: keepPreviousData,
    staleTime: 0,
  })
}

export function usePosServiceIncomeLines(
  params: PosServiceIncomeLinesParams | null,
  options?: { enabled?: boolean },
) {
  return useQuery<PosServiceIncomeLinePage>({
    queryKey: qk.merchantPosServiceIncomeLines(
      params?.businessId,
      params ? serializePosServiceIncomeLinesSelection(params) : undefined,
    ),
    queryFn: () => posServiceIncomeReportRepository.getLines(params as PosServiceIncomeLinesParams),
    enabled: Boolean(params?.businessId) && (options?.enabled ?? true),
    placeholderData: keepPreviousData,
    staleTime: 0,
  })
}
