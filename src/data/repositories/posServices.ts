/**
 * posServicesRepository — POS Owner Setup: Services (US-017).
 */
import httpClient from '../../lib/httpClient'
import type {
  PosServiceApiDto,
  PosServiceStatus,
  ServiceAddOnApiDto,
  ServiceAddOnInput,
  UpdateServiceAddOnInput,
} from '../../types/repositories'

type HttpClient = typeof httpClient

export interface ServiceOrderItem {
  serviceId: string
  sortOrder: number
}

export interface PosServiceInput {
  name: string
  price: number
  durationMinutes: number
  description?: string
  categoryIds: string[]
  tags: string[]
  status: PosServiceStatus
  photo?: File | null
}

function buildFormData(input: PosServiceInput): FormData {
  const formData = new FormData()
  formData.append('name', input.name)
  formData.append('price', String(input.price))
  formData.append('durationMinutes', String(input.durationMinutes))
  if (input.description) formData.append('description', input.description)
  input.categoryIds.forEach((categoryId) => formData.append('categoryIds', categoryId))
  input.tags.forEach((tag) => formData.append('tags', tag))
  formData.append('status', input.status)
  if (input.photo) formData.append('photo', input.photo)
  return formData
}

export function createPosServicesRepository(client: HttpClient = httpClient) {
  return {
    async getPosServices(): Promise<PosServiceApiDto[]> {
      const res = await client.get<PosServiceApiDto[]>('/api/v1/merchant/services')
      return res ?? []
    },

    async createPosService(input: PosServiceInput): Promise<string> {
      return await client.upload<string>('/api/v1/merchant/services', buildFormData(input), 'POST')
    },

    async updatePosService(serviceId: string, input: PosServiceInput): Promise<boolean> {
      return await client.upload<boolean>(
        `/api/v1/merchant/services/${serviceId}`,
        buildFormData(input),
        'PUT',
      )
    },

    async reorderPosServices(items: ServiceOrderItem[]): Promise<void> {
      await client.put<void>('/api/v1/merchant/services/reorder', { items })
    },

    // Add-ons belong to one service — every route is nested under it.
    async getServiceAddOns(serviceId: string): Promise<ServiceAddOnApiDto[]> {
      const res = await client.get<ServiceAddOnApiDto[]>(
        `/api/v1/merchant/services/${serviceId}/add-ons`,
      )
      return res ?? []
    },

    async createServiceAddOn(serviceId: string, input: ServiceAddOnInput): Promise<string> {
      return await client.post<string>(`/api/v1/merchant/services/${serviceId}/add-ons`, input)
    },

    async updateServiceAddOn(
      serviceId: string,
      addOnId: string,
      input: UpdateServiceAddOnInput,
    ): Promise<boolean> {
      return await client.put<boolean>(
        `/api/v1/merchant/services/${serviceId}/add-ons/${addOnId}`,
        input,
      )
    },

    async deleteServiceAddOn(serviceId: string, addOnId: string): Promise<boolean> {
      return await client.del<boolean>(`/api/v1/merchant/services/${serviceId}/add-ons/${addOnId}`)
    },

    // A one-time duplication, not a link: edits on either service afterwards stay independent.
    async copyServiceAddOns(serviceId: string, sourceServiceId: string): Promise<number> {
      return await client.post<number>(`/api/v1/merchant/services/${serviceId}/add-ons/copy`, {
        sourceServiceId,
      })
    },
  }
}

export const posServicesRepository = createPosServicesRepository()
export default posServicesRepository
