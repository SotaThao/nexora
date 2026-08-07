/**
 * taxiqStaffExportRepository — Staff Year-End Export / Tax Package (US-15).
 * See docs/plan/tasks/taxiq/fe-tasks/US-15-taxiq-fe-staff-year-end-export.md.
 * Shares the ExportController/ExportPackageDto contract with Owner Export (US-06) —
 * see taxiqOwnerExport.ts for the Owner-side counterpart.
 */
import httpClient from '../../lib/httpClient'

type HttpClient = typeof httpClient

export type CpaPackageType = 'Basic' | 'Full' | 'CPAReview'
export type ExportType = 'Draft' | 'Final' | 'Amended'

export interface ExportPackageApiDto {
  id: string
  exportType: ExportType
  version: number
  signedUrl: string
  exportedAt?: string | null
}

export interface ExportPackage {
  id: string
  exportType: ExportType
  version: number
  signedUrl: string
  exportedAt: string | null
}

function normalizeExportPackage(dto: ExportPackageApiDto): ExportPackage {
  return {
    id: dto.id,
    exportType: dto.exportType,
    version: dto.version,
    signedUrl: dto.signedUrl,
    exportedAt: dto.exportedAt ?? null,
  }
}

export function createTaxiqStaffExportRepository(client: HttpClient = httpClient) {
  return {
    async generateDraft(staffTaxYearId: string, packageType: CpaPackageType): Promise<ExportPackage> {
      const params = new URLSearchParams({ staffTaxYearId, packageType })
      const dto = await client.post<ExportPackageApiDto>(
        `/api/v1/taxiq/staff/export/draft?${params.toString()}`,
      )
      return normalizeExportPackage(dto)
    },

    async generateFinal(
      staffTaxYearId: string,
      consentConfirmed: boolean,
      packageType: CpaPackageType,
    ): Promise<ExportPackage> {
      const params = new URLSearchParams({
        staffTaxYearId,
        packageType,
        consentConfirmed: String(consentConfirmed),
      })
      const dto = await client.post<ExportPackageApiDto>(
        `/api/v1/taxiq/staff/export/final?${params.toString()}`,
      )
      return normalizeExportPackage(dto)
    },

    async download(packageId: string): Promise<ExportPackage> {
      const dto = await client.get<ExportPackageApiDto>(
        `/api/v1/taxiq/export/${encodeURIComponent(packageId)}/download`,
      )
      return normalizeExportPackage(dto)
    },
  }
}

export const taxiqStaffExportRepository = createTaxiqStaffExportRepository()
export default taxiqStaffExportRepository
