/**
 * merchantTouchpointsRepository — API-only implementation.
 */
import httpClient from '../../lib/httpClient'
import { isApiError } from '../../types/domain'
import type { TouchpointPage, TouchpointRecord } from '../../types/domain'
import type { TouchpointApiDto, TouchpointCreateResult } from '../../types/repositories'

type HttpClient = typeof httpClient

interface TouchpointQueryParams {
  PageNumber?: number
  PageSize?: number
  Name?: string
}

interface CreateTouchpointDto {
  name: string
  type: string
  assignedStaffProfileId?: string
}

const EMPTY_PAGE: TouchpointPage = {
  items: [],
  pageNumber: 1,
  totalPages: 0,
  totalCount: 0,
  hasNextPage: false,
  hasPreviousPage: false,
}

function normalizeTouchpoint(dto: TouchpointApiDto): TouchpointRecord {
  return {
    id: dto.id,
    name: dto.name ?? '',
    slug: dto.slug ?? null,
    type: dto.type ?? '',
    url: dto.url ?? null,
    qrImageUrl: dto.qrImageUrl ?? null,
    isActive: dto.isActive ?? true,
    assignedStaffProfileId: dto.assignedStaffProfileId ?? null,
    createdAt: dto.createdAt ?? null,
    scans: dto.totalScans ?? 0,
    revenue: dto.totalRevenue ?? 0,
    deviceId: dto.deviceId ?? null,
  }
}

function normalizeTouchpointPage(
  res: TouchpointPage | TouchpointApiDto[] | null | undefined,
): TouchpointPage {
  if (!res) return EMPTY_PAGE

  if (Array.isArray(res)) {
    const items = res.map(normalizeTouchpoint)
    return {
      items,
      pageNumber: 1,
      totalPages: items.length > 0 ? 1 : 0,
      totalCount: items.length,
      hasNextPage: false,
      hasPreviousPage: false,
    }
  }

  const items = (res.items ?? []).map((item) =>
    normalizeTouchpoint(item as TouchpointApiDto),
  )

  return {
    items,
    pageNumber: res.pageNumber ?? 1,
    totalPages: res.totalPages ?? 0,
    totalCount: res.totalCount ?? items.length,
    hasNextPage: res.hasNextPage ?? false,
    hasPreviousPage: res.hasPreviousPage ?? false,
  }
}

export function createMerchantTouchpointsRepository(client: HttpClient = httpClient) {
  return {
    async getTouchpoints(params: TouchpointQueryParams = {}): Promise<TouchpointPage> {
      const queryParams = new URLSearchParams()
      if (params.PageNumber) queryParams.append('PageNumber', String(params.PageNumber))
      if (params.PageSize) queryParams.append('PageSize', String(params.PageSize))
      if (params.Name) queryParams.append('Name', params.Name)

      const queryString = queryParams.toString()
      const url = `/api/v1/merchant/touchpoints${queryString ? `?${queryString}` : ''}`

      try {
        const res = await client.get<TouchpointPage | TouchpointApiDto[]>(url)
        return normalizeTouchpointPage(res)
      } catch (err: unknown) {
        if (isApiError(err) && err.status === 404) {
          return EMPTY_PAGE
        }
        throw err
      }
    },

    async createTouchpoint(dto: CreateTouchpointDto): Promise<TouchpointCreateResult> {
      return await client.post<TouchpointCreateResult>('/api/v1/merchant/touchpoints', dto)
    },

    async deleteTouchpoint(id: string): Promise<void> {
      await client.del(`/api/v1/merchant/touchpoints/${id}`)
    },

    async toggleTouchpoint(id: string): Promise<void> {
      await client.put(`/api/v1/merchant/touchpoints/toggle/${id}`)
    },

    async downloadQr(id: string, format: 'png' | 'pdf' = 'png'): Promise<Blob> {
      return await client.getBlob(`/api/v1/merchant/touchpoints/${id}/download?format=${format}`)
    },
  }
}

export const merchantTouchpointsRepository = createMerchantTouchpointsRepository()
export default merchantTouchpointsRepository
