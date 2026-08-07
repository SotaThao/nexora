/**
 * posProductsRepository — POS Owner Setup: Products (US-018).
 */
import httpClient from '../../lib/httpClient'
import type { PosProductApiDto, PosServiceStatus } from '../../types/repositories'

type HttpClient = typeof httpClient

export interface ProductOrderItem {
  productId: string
  sortOrder: number
}

export interface PosProductInput {
  name: string
  price: number
  description?: string
  categoryIds: string[]
  tags: string[]
  status: PosServiceStatus
  photo?: File | null
}

function buildFormData(input: PosProductInput): FormData {
  const formData = new FormData()
  formData.append('name', input.name)
  formData.append('price', String(input.price))
  if (input.description) formData.append('description', input.description)
  input.categoryIds.forEach((categoryId) => formData.append('categoryIds', categoryId))
  input.tags.forEach((tag) => formData.append('tags', tag))
  formData.append('status', input.status)
  if (input.photo) formData.append('photo', input.photo)
  return formData
}

export function createPosProductsRepository(client: HttpClient = httpClient) {
  return {
    async getPosProducts(): Promise<PosProductApiDto[]> {
      const res = await client.get<PosProductApiDto[]>('/api/v1/merchant/pos/products')
      return res ?? []
    },

    async createPosProduct(input: PosProductInput): Promise<string> {
      return await client.upload<string>('/api/v1/merchant/pos/products', buildFormData(input), 'POST')
    },

    async updatePosProduct(productId: string, input: PosProductInput): Promise<boolean> {
      return await client.upload<boolean>(
        `/api/v1/merchant/pos/products/${productId}`,
        buildFormData(input),
        'PUT',
      )
    },

    async reorderPosProducts(items: ProductOrderItem[]): Promise<void> {
      await client.put<void>('/api/v1/merchant/pos/products/reorder', { items })
    },
  }
}

export const posProductsRepository = createPosProductsRepository()
export default posProductsRepository
