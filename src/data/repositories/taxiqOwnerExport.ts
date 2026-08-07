/**
 * taxiqOwnerExportRepository — Owner Year-End Export Center (US-06).
 * See docs/plan/tasks/taxiq/fe-tasks/US-06-taxiq-fe-owner-year-end-export-lock-tax-year.md.
 */
import httpClient from '../../lib/httpClient'

type HttpClient = typeof httpClient

export type CpaPackageType = 'Basic' | 'Full' | 'CPAReview'
export type ExportType = 'Draft' | 'Final' | 'Amended'

// Ticket does not surface a package-type picker in the UI (open question — not
// specified). "Full" is the closest match to the user story's "đủ mọi thứ cần
// thiết trong một bộ hồ sơ" (CPA needs everything) — flagged in assumptions doc.
export const DEFAULT_CPA_PACKAGE_TYPE: CpaPackageType = 'Full'

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

export function createTaxiqOwnerExportRepository(client: HttpClient = httpClient) {
  return {
    async generateDraft(ownerTaxYearId: string, packageType: CpaPackageType = DEFAULT_CPA_PACKAGE_TYPE): Promise<ExportPackage> {
      const params = new URLSearchParams({ ownerTaxYearId, packageType })
      const dto = await client.post<ExportPackageApiDto>(
        `/api/v1/taxiq/owner/export/draft?${params.toString()}`,
      )
      return normalizeExportPackage(dto)
    },

    async generateFinal(
      ownerTaxYearId: string,
      consentConfirmed: boolean,
      packageType: CpaPackageType = DEFAULT_CPA_PACKAGE_TYPE,
    ): Promise<ExportPackage> {
      const params = new URLSearchParams({
        ownerTaxYearId,
        packageType,
        consentConfirmed: String(consentConfirmed),
      })
      const dto = await client.post<ExportPackageApiDto>(
        `/api/v1/taxiq/owner/export/final?${params.toString()}`,
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

export const taxiqOwnerExportRepository = createTaxiqOwnerExportRepository()
export default taxiqOwnerExportRepository
