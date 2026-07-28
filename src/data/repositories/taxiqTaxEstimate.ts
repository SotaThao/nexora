/**
 * taxiqTaxEstimateRepository — Tax Estimate (mục 27). Everything here is a read-only live
 * aggregation from Payroll/Tax Ledger/EmployerRegistration (backend never snapshots numbers,
 * same convention as taxiqFormsReports.ts). Deposit Schedule Export is a plain authenticated
 * CSV download (getBlob), not routed through ExportPackage/S3.
 */
import httpClient from '../../lib/httpClient'

type HttpClient = typeof httpClient

export const TAX_RISK_LEVELS = ['High', 'Medium', 'Low'] as const
export type TaxRiskLevel = (typeof TAX_RISK_LEVELS)[number]

export const TAX_READINESS_STATUSES = ['Ready', 'NeedsAttention', 'NotStarted'] as const
export type TaxReadinessStatus = (typeof TAX_READINESS_STATUSES)[number]

export const TAX_READINESS_GROUPS = [
  'BusinessIdentity',
  'WorkerSetup',
  'FederalPayrollTaxes',
  'StatePayrollSetup',
  'EvidenceVault',
  'CpaFilingPackage',
] as const
export type TaxReadinessGroup = (typeof TAX_READINESS_GROUPS)[number]

export interface TaxEstimateQuarter {
  quarter: number
  dueDate: string
  totalGrossWages: number
  estTax: number
  withheld: number
  balance: number
}

export interface JurisdictionEstimate {
  jurisdiction: string
  estTax: number
  deposited: number
  balance: number
  riskLevel: TaxRiskLevel
}

export interface TaxEstimateApiDto {
  ownerTaxYearId: string
  taxYear: number
  selectedQuarter: number
  quarters: TaxEstimateQuarter[]
  byJurisdiction: JurisdictionEstimate[]
}

export type TaxEstimate = TaxEstimateApiDto

export interface DepositScheduleAlertApiDto {
  jurisdiction: string
  nextDue: string | null
  depositSchedule: string
  daysUntilDue: number | null
  riskLevel: TaxRiskLevel
}

export type DepositScheduleAlert = DepositScheduleAlertApiDto

export interface ChecklistGroupApiDto {
  groupName: TaxReadinessGroup
  status: TaxReadinessStatus
}

export interface TaxReadinessChecklistApiDto {
  ownerTaxYearId: string
  groups: ChecklistGroupApiDto[]
}

export type TaxReadinessChecklist = TaxReadinessChecklistApiDto

export function createTaxiqTaxEstimateRepository(client: HttpClient = httpClient) {
  return {
    async getEstimate(ownerTaxYearId: string, quarter?: number): Promise<TaxEstimate> {
      const query = new URLSearchParams({ ownerTaxYearId })
      if (quarter !== undefined) query.set('quarter', String(quarter))
      const data = await client.get<TaxEstimateApiDto>(
        `/api/v1/taxiq/owner/tax-estimate?${query.toString()}`,
      )
      return data as TaxEstimateApiDto
    },

    async getDepositScheduleAlerts(ownerTaxYearId: string): Promise<DepositScheduleAlert[]> {
      const data = await client.get<DepositScheduleAlertApiDto[]>(
        `/api/v1/taxiq/owner/tax-estimate/deposit-schedule-alerts?ownerTaxYearId=${encodeURIComponent(ownerTaxYearId)}`,
      )
      return data ?? []
    },

    async exportDepositScheduleCsv(ownerTaxYearId: string): Promise<Blob> {
      return await client.getBlob(
        `/api/v1/taxiq/owner/tax-estimate/deposit-schedule/export?ownerTaxYearId=${encodeURIComponent(ownerTaxYearId)}`,
      )
    },

    async getReadinessChecklist(ownerTaxYearId: string): Promise<TaxReadinessChecklist> {
      const data = await client.get<TaxReadinessChecklistApiDto>(
        `/api/v1/taxiq/owner/tax-estimate/readiness-checklist?ownerTaxYearId=${encodeURIComponent(ownerTaxYearId)}`,
      )
      return data as TaxReadinessChecklistApiDto
    },
  }
}

export const taxiqTaxEstimateRepository = createTaxiqTaxEstimateRepository()
export default taxiqTaxEstimateRepository
