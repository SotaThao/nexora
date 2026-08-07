/**
 * payrollRunsRepository — API implementation for US-033 (TaxIQ Payroll Runs, mục 12).
 * Backend: PayrollRunController (BE US-26), route `api/v1/taxiq/owner/payroll-runs`.
 * A run's 8-step doc lifecycle collapses to 6 persisted statuses on the backend
 * (ValidationFailed/ReviewRequired/Approved/LedgerPosted/Reported/Cancelled) — Create does
 * Draft+Import+Validate atomically, Finalize does Approved+Finalized+LedgerPosted atomically.
 */
import httpClient from '../../lib/httpClient'

type HttpClient = typeof httpClient

export interface PayrollRun {
  id: string
  runCode: string
  employerId: string
  employerName: string
  paySchedule: string
  periodStart: string
  periodEnd: string
  payDate: string
  depositDue: string
  employeeCount: number
  totalGross: number
  totalEmployeeTax: number
  totalEmployerTax: number
  status: string
  runType: string
  correctionOfRunId?: string | null
}

export interface PayrollRunLineItem {
  id: string
  posStaffProfileId: string
  employeeName: string
  gross: number
  taxable: number
  preTax: number
  employeeTax: number
  employerTax: number
  net: number
  status: string
  needsReviewReason?: string | null
}

export interface TaxLedgerEntry {
  entryCode: string
  employeeName: string
  jurisdiction: string
  type: string
  taxableAmount: number
  employeeAmount: number
  employerAmount: number
}

export interface PayrollRunAuditEntry {
  at: string
  action: string
  userName?: string | null
  notes?: string | null
}

export interface PayrollRunDetail extends PayrollRun {
  schemaIntegrityPassed: boolean
  schemaIntegrityDetail?: string | null
  taxProfileReadinessPassed: boolean
  taxProfileReadinessDetail?: string | null
  ledgerReconciliationPassed: boolean
  ledgerReconciliationDetail?: string | null
  approvalNote?: string | null
  cancelReason?: string | null
  employerStrictFinalization: boolean
  correctionRunIds: string[]
  lineItems: PayrollRunLineItem[]
  taxBreakdown: TaxLedgerEntry[]
  auditTrail: PayrollRunAuditEntry[]
}

export interface PayrollRunListQuery {
  employerId?: string
  status?: string
  pageNumber?: number
  pageSize?: number
}

export interface PayrollRunListPage {
  items: PayrollRun[]
  pageNumber: number
  totalPages: number
  totalCount: number
  hasPreviousPage: boolean
  hasNextPage: boolean
}

interface PayrollRunListApiPage {
  items: PayrollRun[]
  pageNumber: number
  totalPages: number
  totalCount: number
  hasPreviousPage: boolean
  hasNextPage: boolean
}

function normalizeListPage(data: PayrollRunListApiPage | undefined | null): PayrollRunListPage {
  return {
    items: data?.items ?? [],
    pageNumber: data?.pageNumber ?? 1,
    totalPages: data?.totalPages ?? 1,
    totalCount: data?.totalCount ?? 0,
    hasPreviousPage: data?.hasPreviousPage ?? false,
    hasNextPage: data?.hasNextPage ?? false,
  }
}

function buildListParams(query: PayrollRunListQuery): Record<string, string | number> {
  const params: Record<string, string | number> = {}
  if (query.employerId) params.employerId = query.employerId
  if (query.status) params.status = query.status
  if (query.pageNumber) params.pageNumber = query.pageNumber
  if (query.pageSize) params.pageSize = query.pageSize
  return params
}

export interface CreatePayrollRunParams {
  employerId: string
  paySchedule: string
  periodStart: string
  periodEnd: string
  payDate: string
  depositDue: string
  runType?: string
  correctionOfRunId?: string
}

export interface FinalizePayrollRunResult {
  payoutIds: string[]
  totalGross: number
  totalEmployeeTax: number
  totalEmployerTax: number
}

export function createPayrollRunsRepository(client: HttpClient = httpClient) {
  return {
    async listPayrollRuns(query: PayrollRunListQuery = {}): Promise<PayrollRunListPage> {
      const data = await client.get<PayrollRunListApiPage>('/api/v1/taxiq/owner/payroll-runs', {
        params: buildListParams(query),
      })
      return normalizeListPage(data)
    },

    async getPayrollRun(id: string): Promise<PayrollRunDetail> {
      return await client.get<PayrollRunDetail>(`/api/v1/taxiq/owner/payroll-runs/${encodeURIComponent(id)}`)
    },

    async createPayrollRun(params: CreatePayrollRunParams): Promise<string> {
      return await client.post<string>('/api/v1/taxiq/owner/payroll-runs', params)
    },

    async rerunValidation(id: string): Promise<void> {
      await client.post<void>(`/api/v1/taxiq/owner/payroll-runs/${encodeURIComponent(id)}/rerun-validation`)
    },

    async finalize(id: string, approvalNote: string): Promise<FinalizePayrollRunResult> {
      return await client.post<FinalizePayrollRunResult>(`/api/v1/taxiq/owner/payroll-runs/${encodeURIComponent(id)}/finalize`, {
        approvalNote,
      })
    },

    async cancel(id: string, cancelReason: string): Promise<void> {
      await client.post<void>(`/api/v1/taxiq/owner/payroll-runs/${encodeURIComponent(id)}/cancel`, { cancelReason })
    },

    async report(id: string): Promise<Blob> {
      return await client.getBlob(`/api/v1/taxiq/owner/payroll-runs/${encodeURIComponent(id)}/report`)
    },
  }
}

export const payrollRunsRepository = createPayrollRunsRepository()
export default payrollRunsRepository
