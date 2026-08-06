/**
 * exceptionsRepository — API implementation for US-036 (TaxIQ Exceptions Queue, mục 17).
 * Backend: ExceptionController, route `api/v1/taxiq/owner/exceptions`.
 */
import httpClient from '../../lib/httpClient'

type HttpClient = typeof httpClient

export interface ExceptionListItem {
  id: string
  type: string
  severity: string
  owner: string
  status: string
  periodLabel: string
  memberCount: number
  createdAt: string
  resolutionType?: string | null
  resolvedAt?: string | null
}

export interface ExceptionListPage {
  items: ExceptionListItem[]
  pageNumber: number
  totalPages: number
  totalCount: number
  hasPreviousPage: boolean
  hasNextPage: boolean
}

export interface ExceptionListQuery {
  employerId?: string
  status?: string
  severity?: string
  owner?: string
  pageNumber?: number
  pageSize?: number
}

export interface ExceptionMember {
  id: string
  userId?: string | null
  businessStaffLinkId?: string | null
  displayName: string
}

export interface ExceptionDetail {
  id: string
  employerId: string
  type: string
  severity: string
  owner: string
  status: string
  periodLabel: string
  members: ExceptionMember[]
  resolutionType?: string | null
  resolvedCorrectedValue?: string | null
  resolvedReference?: string | null
  justificationNote?: string | null
  latestNote?: string | null
  resolvedAt?: string | null
  createdAt: string
}

export interface ScanExceptionsResult {
  created: number
  updated: number
}

export interface ResolveExceptionParams {
  resolutionType: string
  correctedValue?: string
  reference?: string
  justificationNote: string
}

function normalizeListPage(data: ExceptionListPage | undefined | null): ExceptionListPage {
  return {
    items: data?.items ?? [],
    pageNumber: data?.pageNumber ?? 1,
    totalPages: data?.totalPages ?? 1,
    totalCount: data?.totalCount ?? 0,
    hasPreviousPage: data?.hasPreviousPage ?? false,
    hasNextPage: data?.hasNextPage ?? false,
  }
}

function buildListParams(query: ExceptionListQuery): Record<string, string | number> {
  const params: Record<string, string | number> = {}
  if (query.employerId) params.employerId = query.employerId
  if (query.status) params.status = query.status
  if (query.severity) params.severity = query.severity
  if (query.owner) params.owner = query.owner
  if (query.pageNumber) params.pageNumber = query.pageNumber
  if (query.pageSize) params.pageSize = query.pageSize
  return params
}

export function createExceptionsRepository(client: HttpClient = httpClient) {
  return {
    async listExceptions(query: ExceptionListQuery = {}): Promise<ExceptionListPage> {
      const data = await client.get<ExceptionListPage>('/api/v1/taxiq/owner/exceptions', {
        params: buildListParams(query),
      })
      return normalizeListPage(data)
    },

    async getExceptionDetail(id: string): Promise<ExceptionDetail> {
      return await client.get<ExceptionDetail>(`/api/v1/taxiq/owner/exceptions/${encodeURIComponent(id)}`)
    },

    async scanExceptions(employerId: string): Promise<ScanExceptionsResult> {
      return await client.post<ScanExceptionsResult>('/api/v1/taxiq/owner/exceptions/scan', { employerId })
    },

    async resolveException(id: string, params: ResolveExceptionParams): Promise<void> {
      await client.post(`/api/v1/taxiq/owner/exceptions/${encodeURIComponent(id)}/resolve`, params)
    },

    async assignException(id: string, newOwner: string): Promise<void> {
      await client.post(`/api/v1/taxiq/owner/exceptions/${encodeURIComponent(id)}/assign`, { newOwner })
    },

    async addExceptionNote(id: string, note: string): Promise<void> {
      await client.post(`/api/v1/taxiq/owner/exceptions/${encodeURIComponent(id)}/notes`, { note })
    },
  }
}

export const exceptionsRepository = createExceptionsRepository()
export default exceptionsRepository
