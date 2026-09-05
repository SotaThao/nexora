import { keepPreviousData, useMutation, useQuery } from '@tanstack/react-query'
import { qk } from '../queryKeys'
import posStoreIncomeReportRepository, {
  type PosStoreIncomeReport,
  type PosStoreIncomeReportParams,
} from '../repositories/posStoreIncomeReport'

export function serializePosStoreIncomeSelection(params: PosStoreIncomeReportParams): string {
  return [params.mode, params.date ?? '', params.year ?? '', params.from ?? '', params.to ?? ''].join(':')
}

export function usePosStoreIncomeReport(
  params: PosStoreIncomeReportParams | null,
  options?: { enabled?: boolean },
) {
  return useQuery<PosStoreIncomeReport>({
    queryKey: qk.merchantPosStoreIncomeReport(
      params?.businessId,
      params ? serializePosStoreIncomeSelection(params) : undefined,
    ),
    queryFn: () => posStoreIncomeReportRepository.getReport(params as PosStoreIncomeReportParams),
    enabled: Boolean(params?.businessId) && (options?.enabled ?? true),
    placeholderData: keepPreviousData,
    staleTime: 0,
  })
}

export function useExportPosStoreIncomeReport() {
  return useMutation<Blob, Error, PosStoreIncomeReportParams>({
    mutationFn: (params) => posStoreIncomeReportRepository.exportPdf(params),
  })
}

export function useEmailPosStoreIncomeReport() {
  return useMutation<boolean, Error, { params: PosStoreIncomeReportParams; toEmails: string[] }>({
    mutationFn: ({ params, toEmails }) =>
      posStoreIncomeReportRepository.emailReport(params, toEmails),
  })
}
