import { OTHER_SERVICES_CATEGORY_ID } from './domain'
import type {
  MerchantVoiceServiceCategoryDto,
  MerchantVoiceServiceDto,
} from '../repositories/merchantVoice'

/** Fallback label when API omits the built-in Other category name. */
export const OTHER_SERVICES_CATEGORY_FALLBACK_NAME = 'Other services'

export type MerchantVoiceServiceSection = {
  id: string
  name: string
  isSystem: boolean
  services: MerchantVoiceServiceDto[]
}

function isBookableService(service: MerchantVoiceServiceDto | null | undefined): service is MerchantVoiceServiceDto {
  return Boolean(service?.id) && service?.isActive !== false
}

function normalizeCategoryIds(
  categoryIds: string[] | undefined,
  fallbackId: string,
): string[] {
  const cleaned = [
    ...new Set(
      (categoryIds || [])
        .map((id) => String(id || '').trim())
        .filter(Boolean),
    ),
  ]
  return cleaned.length > 0 ? cleaned : [fallbackId]
}

/**
 * Group active services for create-appointment (same APIs as Settings):
 * prefer nested `service-categories` services; fall back to flat `/services` + `categoryIds`.
 * A service linked to multiple categories appears under each group.
 */
export function buildMerchantVoiceServiceSections(
  categoriesData: MerchantVoiceServiceCategoryDto[] | null | undefined,
  flatServicesData: MerchantVoiceServiceDto[] | null | undefined,
): MerchantVoiceServiceSection[] {
  const categories = [...(categoriesData || [])].sort(
    (left, right) => left.sortOrder - right.sortOrder,
  )
  const otherFromApi = categories.find(
    (category) =>
      category.isSystem || category.id === OTHER_SERVICES_CATEGORY_ID,
  )
  const otherId = otherFromApi?.id || OTHER_SERVICES_CATEGORY_ID
  const otherName = otherFromApi?.name || OTHER_SERVICES_CATEGORY_FALLBACK_NAME

  const sectionById = new Map<string, MerchantVoiceServiceSection>()
  categories.forEach((category) => {
    if (!category.id) return
    sectionById.set(category.id, {
      id: category.id,
      name: category.name || OTHER_SERVICES_CATEGORY_FALLBACK_NAME,
      isSystem:
        category.isSystem || category.id === OTHER_SERVICES_CATEGORY_ID,
      services: [],
    })
  })

  const ensureSection = (id: string, name?: string) => {
    const existing = sectionById.get(id)
    if (existing) return existing
    const created: MerchantVoiceServiceSection = {
      id,
      name:
        name
        || (id === otherId || id === OTHER_SERVICES_CATEGORY_ID
          ? otherName
          : OTHER_SERVICES_CATEGORY_FALLBACK_NAME),
      isSystem: id === otherId || id === OTHER_SERVICES_CATEGORY_ID,
      services: [],
    }
    sectionById.set(id, created)
    return created
  }

  const pushService = (
    section: MerchantVoiceServiceSection,
    service: MerchantVoiceServiceDto,
  ) => {
    if (!isBookableService(service)) return
    if (section.services.some((row) => row.id === service.id)) return
    section.services.push(service)
  }

  const placeService = (service: MerchantVoiceServiceDto, nestCategoryId?: string) => {
    if (!isBookableService(service)) return
    const categoryIds = normalizeCategoryIds(
      service.categoryIds?.length
        ? service.categoryIds
        : nestCategoryId
          ? [nestCategoryId]
          : undefined,
      otherId,
    )
    categoryIds.forEach((categoryId) => {
      pushService(ensureSection(categoryId), service)
    })
  }

  const nestedCount = categories.reduce(
    (count, category) => count + (category.services?.length || 0),
    0,
  )

  if (nestedCount > 0) {
    categories.forEach((category) => {
      ;(category.services || []).forEach((service) => {
        placeService(service, category.id)
      })
    })
  } else {
    ;(flatServicesData || []).forEach((service) => {
      placeService(service)
    })
  }

  const orderedIds = categories.map((category) => category.id).filter(Boolean)
  const extraIds = [...sectionById.keys()].filter((id) => !orderedIds.includes(id))
  // System / Other first when it was appended as orphan.
  extraIds.sort((left, right) => {
    const leftSystem = left === otherId || left === OTHER_SERVICES_CATEGORY_ID
    const rightSystem = right === otherId || right === OTHER_SERVICES_CATEGORY_ID
    if (leftSystem !== rightSystem) return leftSystem ? -1 : 1
    return left.localeCompare(right)
  })

  return [...orderedIds, ...extraIds]
    .map((id) => sectionById.get(id))
    .filter((section): section is MerchantVoiceServiceSection =>
      Boolean(section && section.services.length > 0),
    )
}

/** Unique services across grouped sections (for totals / validation). */
export function flattenMerchantVoiceServiceSections(
  sections: MerchantVoiceServiceSection[],
): MerchantVoiceServiceDto[] {
  const byId = new Map<string, MerchantVoiceServiceDto>()
  sections.forEach((section) => {
    section.services.forEach((service) => {
      if (!byId.has(service.id)) byId.set(service.id, service)
    })
  })
  return [...byId.values()]
}
