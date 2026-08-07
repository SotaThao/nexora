/**
 * TanStack Query hooks for the TaxIQ Owner Year-End Export Center (US-06).
 */
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { qk } from '../queryKeys'
import taxiqOwnerExportRepository from '../repositories/taxiqOwnerExport'
import type { CpaPackageType, ExportPackage } from '../repositories/taxiqOwnerExport'

export function useGenerateDraftExport() {
  return useMutation<ExportPackage, Error, { ownerTaxYearId: string; packageType?: CpaPackageType }>({
    mutationFn: ({ ownerTaxYearId, packageType }) =>
      taxiqOwnerExportRepository.generateDraft(ownerTaxYearId, packageType),
  })
}

export interface FinalExportResult extends ExportPackage {
  // No BE flag signals "idempotent re-issue, no new adjustments" (see
  // GenerateFinalExportCommand.cs) — derived here by comparing `version`
  // against the last result cached for this ownerTaxYearId.
  isNoChangeReexport: boolean
}

export function useGenerateFinalExport() {
  const queryClient = useQueryClient()
  return useMutation<
    FinalExportResult,
    Error,
    { ownerTaxYearId: string; consentConfirmed: boolean; packageType?: CpaPackageType }
  >({
    mutationFn: async ({ ownerTaxYearId, consentConfirmed, packageType }) => {
      const previous = queryClient.getQueryData<ExportPackage>(qk.taxiqOwnerExport(ownerTaxYearId))
      const result = await taxiqOwnerExportRepository.generateFinal(ownerTaxYearId, consentConfirmed, packageType)
      queryClient.setQueryData(qk.taxiqOwnerExport(ownerTaxYearId), result)
      const isNoChangeReexport = !!previous && previous.version === result.version
      // First successful Final Export flips OwnerTaxYear.Status Locked -> Exported
      // server-side (GenerateFinalExportCommand.cs) — refresh so every screen sees it.
      if (!isNoChangeReexport) {
        queryClient.invalidateQueries({ queryKey: qk.taxiqOwnerTaxYear() })
        queryClient.invalidateQueries({ queryKey: qk.taxiqOwnerTaxYearById(ownerTaxYearId) })
      }
      return { ...result, isNoChangeReexport }
    },
  })
}

export function useDownloadExportPackage() {
  return useMutation<ExportPackage, Error, string>({
    mutationFn: (packageId) => taxiqOwnerExportRepository.download(packageId),
  })
}
