/**
 * TanStack Query hooks for the TaxIQ Staff Year-End Export (US-15).
 */
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { qk } from '../queryKeys'
import taxiqStaffExportRepository from '../repositories/taxiqStaffExport'
import type { CpaPackageType, ExportPackage } from '../repositories/taxiqStaffExport'

export function useGenerateStaffDraftExport() {
  return useMutation<ExportPackage, Error, { staffTaxYearId: string; packageType: CpaPackageType }>({
    mutationFn: ({ staffTaxYearId, packageType }) =>
      taxiqStaffExportRepository.generateDraft(staffTaxYearId, packageType),
  })
}

export interface StaffFinalExportResult extends ExportPackage {
  // No BE flag signals "idempotent re-issue, no new lock" — derived here by comparing
  // `version` against the last result cached for this staffTaxYearId, mirroring
  // useTaxiqOwnerExport.ts. BE handler is confirmed idempotent while already Locked
  // (GenerateFinalExportCommand.cs GenerateStaffFinalAsync).
  isNoChangeReexport: boolean
}

export function useGenerateStaffFinalExport() {
  const queryClient = useQueryClient()
  return useMutation<
    StaffFinalExportResult,
    Error,
    { staffTaxYearId: string; consentConfirmed: boolean; packageType: CpaPackageType }
  >({
    mutationFn: async ({ staffTaxYearId, consentConfirmed, packageType }) => {
      const previous = queryClient.getQueryData<ExportPackage>(qk.taxiqStaffExport(staffTaxYearId))
      const result = await taxiqStaffExportRepository.generateFinal(staffTaxYearId, consentConfirmed, packageType)
      queryClient.setQueryData(qk.taxiqStaffExport(staffTaxYearId), result)
      const isNoChangeReexport = !!previous && previous.version === result.version
      // Successful Final Export flips StaffTaxYear.Status Active -> Locked server-side
      // (GenerateFinalExportCommand.cs) — refresh so US-12/US-13 screens go read-only immediately.
      if (!isNoChangeReexport) {
        queryClient.invalidateQueries({ queryKey: qk.taxiqStaffTaxYear() })
        queryClient.invalidateQueries({ queryKey: qk.taxiqStaffTaxYearById(staffTaxYearId) })
      }
      return { ...result, isNoChangeReexport }
    },
  })
}

export function useDownloadStaffExportPackage() {
  return useMutation<ExportPackage, Error, string>({
    mutationFn: (packageId) => taxiqStaffExportRepository.download(packageId),
  })
}
