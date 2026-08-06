/**
 * taxiqFormsReportsRepository — Forms & Reports (mục 20). List/Preview are read-only live
 * aggregations from Payroll/Tax Ledger (backend never snapshots numbers). Share reuses the
 * Share Link infra (mục 23, same ShareLink shape as taxiqTipLedger.ts/taxiqForm1099Nec.ts).
 * Generate Package reuses the existing ExportPackage draft endpoint
 * (`/owner/export/draft`, already used by taxiqOwnerExport.ts for the CPA year-end flow) but
 * with its own 4 report-scoped package types + PiiMode — kept as a separate repository rather
 * than extending taxiqOwnerExport.ts to avoid touching that unrelated, already-shipped flow.
 */
import httpClient from '../../lib/httpClient'
import type { ShareLink, ShareLinkApiDto } from './taxiqShareLinks'

type HttpClient = typeof httpClient

export const FORMS_REPORT_TYPES = ['W2', 'Form941', 'Form940', 'Suta', 'Nec1099'] as const
export type FormsReportType = (typeof FORMS_REPORT_TYPES)[number]

export const FORMS_REPORT_STATUSES = ['Draft', 'NeedsReview', 'Ready', 'Archived'] as const
export type FormsReportStatus = (typeof FORMS_REPORT_STATUSES)[number]

// Only the 4 report-scoped package types are offered by this screen — Basic/Full/CPAReview
// belong to the separate CPA year-end export flow (taxiqOwnerExport.ts) and are not shown here.
export const FORMS_REPORT_PACKAGE_TYPES = [
  'PayrollRunPackage',
  'OneNinetyNineSupportPackage',
  'MileagePackage',
  'TipLedgerPackage',
] as const
export type FormsReportPackageType = (typeof FORMS_REPORT_PACKAGE_TYPES)[number]

export const PII_MODES = ['Masked', 'Full'] as const
export type PiiMode = (typeof PII_MODES)[number]

export interface FormsReportListItemApiDto {
  formsReportId: string | null
  reportType: FormsReportType
  reportName: string
  taxYear: number
  quarter: number | null
  periodLabel: string
  records: number
  source: string
  due: string | null
  dueLabel: string
  status: FormsReportStatus
}

export type FormsReportListItem = FormsReportListItemApiDto

export interface W2EmployeeLine {
  posStaffProfileId: string
  staffName: string
  wages: number
  federalIncomeTaxWithheld: number
  socialSecurityWages: number
  socialSecurityTaxWithheld: number
  medicareWages: number
  medicareTaxWithheld: number
}

export interface Form941Preview {
  line1TotalWages: number
  line2FederalIncomeTaxWithheld: number
  line5aTaxableSocialSecurityWages: number
  line5aSocialSecurityTax: number
  line5cTaxableMedicareWages: number
  line5cMedicareTax: number
  line13TotalDeposits: number
}

export interface Form940Preview {
  totalFutaTaxableWages: number
  futaTaxDue: number
}

export interface SutaJurisdictionLine {
  jurisdiction: string
  taxableWages: number
  wageBaseCap: number
  sutaTaxDue: number
}

export interface FormsReportPreviewApiDto {
  reportType: FormsReportType
  periodLabel: string
  status: FormsReportStatus
  source: string
  due: string | null
  records: number
  w2Lines?: W2EmployeeLine[] | null
  form941?: Form941Preview | null
  form940?: Form940Preview | null
  sutaLines?: SutaJurisdictionLine[] | null
}

export interface FormsReportPreview {
  reportType: FormsReportType
  periodLabel: string
  status: FormsReportStatus
  source: string
  due: string | null
  records: number
  w2Lines: W2EmployeeLine[] | null
  form941: Form941Preview | null
  form940: Form940Preview | null
  sutaLines: SutaJurisdictionLine[] | null
}

function normalizePreview(dto: FormsReportPreviewApiDto): FormsReportPreview {
  return {
    reportType: dto.reportType,
    periodLabel: dto.periodLabel,
    status: dto.status,
    source: dto.source,
    due: dto.due ?? null,
    records: dto.records,
    w2Lines: dto.w2Lines ?? null,
    form941: dto.form941 ?? null,
    form940: dto.form940 ?? null,
    sutaLines: dto.sutaLines ?? null,
  }
}

export interface ShareFormsReportParams {
  ownerTaxYearId: string
  recipientName: string
  recipientType: string
  cpaEmail?: string | null
  accessMode: string
  downloadPermission: string
  passcode?: string | null
  expiryDays?: 7 | 15 | 30 | null
}

function normalizeShareLink(dto: ShareLinkApiDto): ShareLink {
  return {
    id: dto.id,
    accessToken: dto.accessToken,
    recipientName: dto.recipientName,
    recipientType: dto.recipientType,
    cpaEmail: dto.cpaEmail ?? null,
    accessMode: dto.accessMode,
    sharedDataBlocks: dto.sharedDataBlocks ?? [],
    downloadPermission: dto.downloadPermission,
    hasPasscode: dto.hasPasscode,
    status: dto.status,
    expiresAt: dto.expiresAt ?? null,
  }
}

export interface ExportPackageApiDto {
  id: string
  exportType: string
  version: number
  signedUrl: string
  exportedAt?: string | null
}

export interface ExportPackage {
  id: string
  exportType: string
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

export function createTaxiqFormsReportsRepository(client: HttpClient = httpClient) {
  return {
    async getList(ownerTaxYearId: string): Promise<FormsReportListItem[]> {
      const data = await client.get<FormsReportListItemApiDto[]>(
        `/api/v1/taxiq/owner/forms-reports?ownerTaxYearId=${encodeURIComponent(ownerTaxYearId)}`,
      )
      return data ?? []
    },

    async getPreview(formsReportId: string): Promise<FormsReportPreview> {
      const data = await client.get<FormsReportPreviewApiDto>(
        `/api/v1/taxiq/owner/forms-reports/${encodeURIComponent(formsReportId)}/preview`,
      )
      return normalizePreview(data as FormsReportPreviewApiDto)
    },

    async confirmReady(formsReportId: string): Promise<void> {
      await client.post(`/api/v1/taxiq/owner/forms-reports/${encodeURIComponent(formsReportId)}/confirm-ready`)
    },

    async archive(formsReportId: string): Promise<void> {
      await client.post(`/api/v1/taxiq/owner/forms-reports/${encodeURIComponent(formsReportId)}/archive`)
    },

    async share(formsReportId: string, params: ShareFormsReportParams): Promise<ShareLink> {
      const data = await client.post<ShareLinkApiDto>(
        `/api/v1/taxiq/owner/forms-reports/${encodeURIComponent(formsReportId)}/share`,
        {
          ownerTaxYearId: params.ownerTaxYearId,
          recipientName: params.recipientName,
          recipientType: params.recipientType,
          cpaEmail: params.cpaEmail ?? null,
          accessMode: params.accessMode,
          downloadPermission: params.downloadPermission,
          passcode: params.passcode ?? null,
          expiryDays: params.expiryDays ?? null,
        },
      )
      return normalizeShareLink(data as ShareLinkApiDto)
    },

    async generatePackage(
      ownerTaxYearId: string,
      packageType: FormsReportPackageType,
      piiMode: PiiMode,
    ): Promise<ExportPackage> {
      const query = new URLSearchParams({ ownerTaxYearId, packageType, piiMode })
      const data = await client.post<ExportPackageApiDto>(`/api/v1/taxiq/owner/export/draft?${query.toString()}`)
      return normalizeExportPackage(data as ExportPackageApiDto)
    },
  }
}

export const taxiqFormsReportsRepository = createTaxiqFormsReportsRepository()
export default taxiqFormsReportsRepository
