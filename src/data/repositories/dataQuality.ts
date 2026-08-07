/**
 * dataQualityRepository — API implementation for US-036 (TaxIQ Data Quality Center, mục 18).
 * Backend: DataQualityController, route `api/v1/taxiq/owner/data-quality`. No new aggregator
 * entity on the backend — "Employees" issues are open TaxIqException rows, "Jurisdictions"
 * issues are EmployerRegistration rows with RegistrationStatus = MissingSetup.
 */
import httpClient from '../../lib/httpClient'

type HttpClient = typeof httpClient

export interface DataQualityIssue {
  source: string
  issueType: string
  severity: string
  owner: string
  sourceRecordType: string
  sourceRecordId: string
  description: string
}

export interface DataQuality {
  issues: DataQualityIssue[]
  blockingIssues: number
  evidenceGaps: number
  integrationGaps: number
  isCpaReadyScoreAvailable: boolean
  cpaReadyScore?: number | null
}

export interface CleanupTask {
  id: string
  employerId: string
  issueType: string
  severity: string
  owner: string
  dueDate?: string | null
  sourceRecordType: string
  sourceRecordId: string
  blocksRelatedWorkflow: boolean
  status: string
  reviewerNote?: string | null
  closedAt?: string | null
  createdAt: string
}

export interface CleanupTaskListPage {
  items: CleanupTask[]
  pageNumber: number
  totalPages: number
  totalCount: number
  hasPreviousPage: boolean
  hasNextPage: boolean
}

export interface CleanupTaskListQuery {
  employerId?: string
  status?: string
  pageNumber?: number
  pageSize?: number
}

export interface CreateCleanupTaskParams {
  employerId: string
  issueType: string
  severity: string
  owner: string
  dueDate?: string
  sourceRecordType: string
  sourceRecordId: string
  blocksRelatedWorkflow: boolean
}

function normalizeCleanupTaskListPage(data: CleanupTaskListPage | undefined | null): CleanupTaskListPage {
  return {
    items: data?.items ?? [],
    pageNumber: data?.pageNumber ?? 1,
    totalPages: data?.totalPages ?? 1,
    totalCount: data?.totalCount ?? 0,
    hasPreviousPage: data?.hasPreviousPage ?? false,
    hasNextPage: data?.hasNextPage ?? false,
  }
}

function buildCleanupTaskListParams(query: CleanupTaskListQuery): Record<string, string | number> {
  const params: Record<string, string | number> = {}
  if (query.employerId) params.employerId = query.employerId
  if (query.status) params.status = query.status
  if (query.pageNumber) params.pageNumber = query.pageNumber
  if (query.pageSize) params.pageSize = query.pageSize
  return params
}

export function createDataQualityRepository(client: HttpClient = httpClient) {
  return {
    async getDataQuality(employerId: string): Promise<DataQuality> {
      return await client.get<DataQuality>('/api/v1/taxiq/owner/data-quality', { params: { employerId } })
    },

    async listCleanupTasks(query: CleanupTaskListQuery = {}): Promise<CleanupTaskListPage> {
      const data = await client.get<CleanupTaskListPage>('/api/v1/taxiq/owner/data-quality/cleanup-tasks', {
        params: buildCleanupTaskListParams(query),
      })
      return normalizeCleanupTaskListPage(data)
    },

    async createCleanupTask(params: CreateCleanupTaskParams): Promise<string> {
      return await client.post<string>('/api/v1/taxiq/owner/data-quality/cleanup-tasks', params)
    },

    async closeCleanupTask(id: string, reviewerNote: string): Promise<void> {
      await client.post(`/api/v1/taxiq/owner/data-quality/cleanup-tasks/${encodeURIComponent(id)}/close`, { reviewerNote })
    },
  }
}

export const dataQualityRepository = createDataQualityRepository()
export default dataQualityRepository
