/**
 * posCategoriesRepository — POS Owner Setup: Categories (US-016).
 */
import httpClient from '../../lib/httpClient'
import type { PosCategoryApiDto } from '../../types/repositories'

type HttpClient = typeof httpClient

export interface CategoryOrderItem {
  categoryId: string
  sortOrder: number
}

export function createPosCategoriesRepository(client: HttpClient = httpClient) {
  return {
    async getPosCategories(): Promise<PosCategoryApiDto[]> {
      const res = await client.get<PosCategoryApiDto[]>('/api/v1/merchant/pos/categories')
      return res ?? []
    },

    async createPosCategory(name: string): Promise<string> {
      return await client.post<string>('/api/v1/merchant/pos/categories', { name })
    },

    async updatePosCategory(categoryId: string, name: string): Promise<boolean> {
      return await client.put<boolean>(`/api/v1/merchant/pos/categories/${categoryId}`, { name })
    },

    async reorderPosCategories(items: CategoryOrderItem[]): Promise<void> {
      await client.put<void>('/api/v1/merchant/pos/categories/reorder', { items })
    },

    async deletePosCategory(categoryId: string): Promise<boolean> {
      return await client.del<boolean>(`/api/v1/merchant/pos/categories/${categoryId}`)
    },
  }
}

export const posCategoriesRepository = createPosCategoriesRepository()
export default posCategoriesRepository
