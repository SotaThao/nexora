import httpClient from '../../lib/httpClient'
import type { PublicServiceCategory, PublicServiceItem, PublicServiceMenu } from '../../types/publicServices'

type HttpClient = typeof httpClient
type Raw = Record<string, unknown>

function asRecord(value: unknown): Raw {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Invalid public service menu')
  }
  return value as Raw
}

function nonNegativeNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : null
}

function normalizeService(value: unknown): PublicServiceItem {
  const service = asRecord(value)
  if (typeof service.id !== 'string' || typeof service.name !== 'string') {
    throw new Error('Invalid public service menu')
  }

  return {
    id: service.id,
    name: service.name,
    description: typeof service.description === 'string' ? service.description : null,
    durationMinutes: nonNegativeNumber(service.durationMinutes) ?? 0,
    price: nonNegativeNumber(service.price),
  }
}

function normalizeCategory(value: unknown): PublicServiceCategory {
  const category = asRecord(value)
  if (!Array.isArray(category.services)) throw new Error('Invalid public service menu')
  const categoryId = typeof category.categoryId === 'string' ? category.categoryId : null

  return {
    categoryId,
    categoryName: typeof category.categoryName === 'string' ? category.categoryName : '',
    services: category.services.map(normalizeService),
  }
}

/** The API owns category and service ordering; preserve its response order exactly. */
export function normalizePublicServiceMenu(value: unknown): PublicServiceMenu {
  const menu = asRecord(value)
  if (typeof menu.businessName !== 'string' || !Array.isArray(menu.categories)) {
    throw new Error('Invalid public service menu')
  }

  return {
    businessName: menu.businessName,
    categories: menu.categories.map(normalizeCategory),
  }
}

export function createPublicServicesRepository(client: HttpClient = httpClient) {
  return {
    async getMenu(businessSlug: string): Promise<PublicServiceMenu> {
      // PublicServices_GetServiceMenu: the full active catalog, independent of booking setup.
      const response = await client.get<unknown>(
        `/api/v1/services/${encodeURIComponent(businessSlug)}`,
        { anonymous: true },
      )
      return normalizePublicServiceMenu(response)
    },
  }
}

export const publicServicesRepository = createPublicServicesRepository()
export default publicServicesRepository
