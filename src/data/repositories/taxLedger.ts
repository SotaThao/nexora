/**
 * taxLedgerRepository — API implementation for US-035 (TaxIQ Tax Ledger, mục 16).
 * Backend: TaxLedgerController (BE US-27/28/29), route `api/v1/taxiq/owner/tax-ledger`.
 * Hash chain is scoped per Employer — EntryCode/PreviousHash only ever chain against other
 * rows with the same EmployerId, so this list is always filtered by employerId.
 */
import httpClient from '../../lib/httpClient'

type HttpClient = typeof httpClient

export interface TaxLedgerListEntry {
  id: string
  entryCode: string
  payrollRunId: string
  runCode: string
  employeeName: string
  jurisdiction: string
  type: string
  taxableAmount: number
  employeeAmount: number
  employerAmount: number
  hashValue: string
  postedAt: string
  lastVerifiedAt?: string | null
  lastVerificationResult?: string | null
}

export interface TaxLedgerListPage {
  items: TaxLedgerListEntry[]
  pageNumber: number
  totalPages: number
  totalCount: number
  hasPreviousPage: boolean
  hasNextPage: boolean
}

export interface TaxLedgerListQuery {
  employerId?: string
  jurisdiction?: string
  type?: string
  payrollRunId?: string
  pageNumber?: number
  pageSize?: number
}

export interface VerifyTaxLedgerEntryResult {
  taxLedgerEntryId: string
  entryCode: string
  result: string
  verifiedAt: string
}

interface TaxLedgerListApiPage {
  items: TaxLedgerListEntry[]
  pageNumber: number
  totalPages: number
  totalCount: number
  hasPreviousPage: boolean
  hasNextPage: boolean
}

function normalizeListPage(data: TaxLedgerListApiPage | undefined | null): TaxLedgerListPage {
  return {
    items: data?.items ?? [],
    pageNumber: data?.pageNumber ?? 1,
    totalPages: data?.totalPages ?? 1,
    totalCount: data?.totalCount ?? 0,
    hasPreviousPage: data?.hasPreviousPage ?? false,
    hasNextPage: data?.hasNextPage ?? false,
  }
}

function buildListParams(query: TaxLedgerListQuery): Record<string, string | number> {
  const params: Record<string, string | number> = {}
  if (query.employerId) params.employerId = query.employerId
  if (query.jurisdiction) params.jurisdiction = query.jurisdiction
  if (query.type) params.type = query.type
  if (query.payrollRunId) params.payrollRunId = query.payrollRunId
  if (query.pageNumber) params.pageNumber = query.pageNumber
  if (query.pageSize) params.pageSize = query.pageSize
  return params
}

export function createTaxLedgerRepository(client: HttpClient = httpClient) {
  return {
    async listTaxLedger(query: TaxLedgerListQuery = {}): Promise<TaxLedgerListPage> {
      const data = await client.get<TaxLedgerListApiPage>('/api/v1/taxiq/owner/tax-ledger', {
        params: buildListParams(query),
      })
      return normalizeListPage(data)
    },

    async verifyEntry(id: string): Promise<VerifyTaxLedgerEntryResult> {
      return await client.post<VerifyTaxLedgerEntryResult>(`/api/v1/taxiq/owner/tax-ledger/${encodeURIComponent(id)}/verify`)
    },
  }
}

export const taxLedgerRepository = createTaxLedgerRepository()
export default taxLedgerRepository
