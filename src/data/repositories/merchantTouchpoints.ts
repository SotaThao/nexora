/**
 * merchantTouchpointsRepository — API-only implementation.
 */
import httpClient from '../../lib/httpClient'
import { isApiError } from '../../types/domain'
import type { TouchpointPage, TouchpointRecord } from '../../types/domain'
import type { TouchpointCreateResult } from '../../types/repositories'

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

export function createMerchantTouchpointsRepository(client: HttpClient = httpClient) {
  return {
    async getTouchpoints(params: TouchpointQueryParams = {}): Promise<TouchpointPage> {
      const queryParams = new URLSearchParams()
      if (params.PageNumber) queryParams.append('PageNumber', String(params.PageNumber))
      if (params.PageSize) queryParams.append('PageSize', String(params.PageSize))
      if (params.Name) queryParams.append('Name', params.Name)

      const queryString = queryParams.toString()
      const url = `/api/v1/merchant/touchpoints${queryString ? `?${queryString}` : ''}`

      let res: TouchpointPage | TouchpointRecord[] | null
      try {
        res = await client.get<TouchpointPage | TouchpointRecord[]>(url)
      } catch (err: unknown) {
        if (isApiError(err) && err.status === 404) {
          return EMPTY_PAGE
        }
        throw err
      }

      if (!res) return EMPTY_PAGE

      if (Array.isArray(res)) {
        return {
          items: res,
          pageNumber: 1,
          totalPages: 1,
          totalCount: res.length,
          hasNextPage: false,
          hasPreviousPage: false,
        }
      }

      return res
    },

    async createTouchpoint(dto: CreateTouchpointDto): Promise<TouchpointCreateResult> {
      return await client.post<TouchpointCreateResult>('/api/v1/merchant/touchpoints', dto)
    },

    async deleteTouchpoint(id: string): Promise<void> {
      await client.del(`/api/v1/merchant/touchpoints/${id}`)
    },

    async downloadQr(id: string, format: 'png' | 'pdf' = 'png'): Promise<Blob> {
      return await client.getBlob(`/api/v1/merchant/touchpoints/${id}/download?format=${format}`)
    },
  }
}

export const merchantTouchpointsRepository = createMerchantTouchpointsRepository()
export default merchantTouchpointsRepository
