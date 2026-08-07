/**
 * TanStack Query hooks for Forms & Reports (mục 20).
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { qk } from '../queryKeys'
import taxiqFormsReportsRepository from '../repositories/taxiqFormsReports'
import type {
  ExportPackage,
  FormsReportListItem,
  FormsReportPackageType,
  FormsReportPreview,
  PiiMode,
  ShareFormsReportParams,
} from '../repositories/taxiqFormsReports'
import type { ShareLink } from '../repositories/taxiqShareLinks'

export function useFormsReports(ownerTaxYearId?: string) {
  return useQuery<FormsReportListItem[]>({
    queryKey: qk.taxiqFormsReports(ownerTaxYearId),
    queryFn: () => taxiqFormsReportsRepository.getList(ownerTaxYearId as string),
    enabled: !!ownerTaxYearId,
  })
}

export function useFormsReportPreview(formsReportId?: string) {
  return useQuery<FormsReportPreview>({
    queryKey: qk.taxiqFormsReportPreview(formsReportId),
    queryFn: () => taxiqFormsReportsRepository.getPreview(formsReportId as string),
    enabled: !!formsReportId,
  })
}

export function useConfirmFormsReportReady(ownerTaxYearId?: string) {
  const queryClient = useQueryClient()
  return useMutation<void, Error, string>({
    mutationFn: (formsReportId) => taxiqFormsReportsRepository.confirmReady(formsReportId),
    onSuccess: (_data, formsReportId) => {
      queryClient.invalidateQueries({ queryKey: qk.taxiqFormsReports(ownerTaxYearId) })
      queryClient.invalidateQueries({ queryKey: qk.taxiqFormsReportPreview(formsReportId) })
    },
  })
}

export function useArchiveFormsReport(ownerTaxYearId?: string) {
  const queryClient = useQueryClient()
  return useMutation<void, Error, string>({
    mutationFn: (formsReportId) => taxiqFormsReportsRepository.archive(formsReportId),
    onSuccess: (_data, formsReportId) => {
      queryClient.invalidateQueries({ queryKey: qk.taxiqFormsReports(ownerTaxYearId) })
      queryClient.invalidateQueries({ queryKey: qk.taxiqFormsReportPreview(formsReportId) })
    },
  })
}

export function useShareFormsReport() {
  return useMutation<ShareLink, Error, { formsReportId: string; params: ShareFormsReportParams }>({
    mutationFn: ({ formsReportId, params }) => taxiqFormsReportsRepository.share(formsReportId, params),
  })
}

export function useGenerateFormsReportPackage() {
  return useMutation<ExportPackage, Error, { ownerTaxYearId: string; packageType: FormsReportPackageType; piiMode: PiiMode }>({
    mutationFn: ({ ownerTaxYearId, packageType, piiMode }) =>
      taxiqFormsReportsRepository.generatePackage(ownerTaxYearId, packageType, piiMode),
  })
}
