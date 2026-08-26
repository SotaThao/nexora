/**
 * posServicesRepository — POS Owner Setup: Services (Zero-Backend & LocalStorage Mock Supported)
 */
import type { PosServiceApiDto } from '../../types/repositories'
import { DEMO_SERVICES } from '../seedPosDemoMenu'
import posCategoriesRepository from './posCategories'

const STORAGE_KEY = 'nexora:pos:services:v1'

export interface PosServiceInput {
  name: string
  price: number
  durationMinutes: number
  description?: string | null
  icon?: string | null
  photoUrl?: string | null
  status?: 'Active' | 'Inactive'
  categoryIds?: string[]
  tags?: string[]
  displayOrder?: number
}

export interface ServiceOrderItem {
  serviceId: string
  sortOrder: number
}

async function getInitialServices(): Promise<PosServiceApiDto[]> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length > 0) return parsed
    }
  } catch {}

  const categories = await posCategoriesRepository.getPosCategories()

  // Seed default demo services
  const initial: PosServiceApiDto[] = DEMO_SERVICES.map((s, idx) => {
    // Map categoryNames to categoryIds
    const matchedCategoryIds = s.categoryNames
      .map((catName) => categories.find((c) => c.name.toLowerCase() === catName.toLowerCase())?.id)
      .filter((id): id is string => Boolean(id))

    // Encode memberPrice and addons into description if present
    let desc = s.description || ''
    if (s.memberPrice && !desc.includes('[MEMBER:')) {
      desc = `[MEMBER:$${s.memberPrice.toFixed(2)}] ${desc}`
    }

    return {
      id: 'srv_' + (idx + 1) + '_' + s.name.toLowerCase().replace(/[^a-z0-9]/g, '_'),
      name: s.name,
      price: s.price,
      durationMinutes: s.durationMinutes,
      description: desc,
      icon: null,
      photoUrl: null,
      status: 'Active',
      displayOrder: idx,
      categoryIds: matchedCategoryIds.length > 0 ? matchedCategoryIds : [categories[0]?.id || 'cat_1'],
      tags: s.tags || [],
    }
  })

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initial))
  } catch {}

  return initial
}

function saveServices(srvs: PosServiceApiDto[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(srvs))
  } catch {}
}

export const posServicesRepository = {
  async getPosServices(): Promise<PosServiceApiDto[]> {
    return await getInitialServices()
  },

  async createPosService(input: PosServiceInput): Promise<string> {
    const srvs = await getInitialServices()
    const newId = 'srv_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6)
    const newService: PosServiceApiDto = {
      id: newId,
      name: input.name,
      price: input.price,
      durationMinutes: input.durationMinutes,
      description: input.description ?? null,
      icon: input.icon ?? null,
      photoUrl: input.photoUrl ?? null,
      status: input.status ?? 'Active',
      displayOrder: input.displayOrder ?? srvs.length,
      categoryIds: input.categoryIds ?? [],
      tags: input.tags ?? [],
    }
    srvs.push(newService)
    saveServices(srvs)
    return newId
  },

  async updatePosService(serviceId: string, input: Partial<PosServiceInput>): Promise<boolean> {
    const srvs = await getInitialServices()
    const found = srvs.find((s) => s.id === serviceId)
    if (found) {
      if (input.name !== undefined) found.name = input.name
      if (input.price !== undefined) found.price = input.price
      if (input.durationMinutes !== undefined) found.durationMinutes = input.durationMinutes
      if (input.description !== undefined) found.description = input.description
      if (input.icon !== undefined) found.icon = input.icon
      if (input.photoUrl !== undefined) found.photoUrl = input.photoUrl
      if (input.status !== undefined) found.status = input.status
      if (input.categoryIds !== undefined) found.categoryIds = input.categoryIds
      if (input.tags !== undefined) found.tags = input.tags
      if (input.displayOrder !== undefined) found.displayOrder = input.displayOrder
      saveServices(srvs)
      return true
    }
    return false
  },

  async reorderPosServices(items: ServiceOrderItem[]): Promise<void> {
    const srvs = await getInitialServices()
    items.forEach((item) => {
      const s = srvs.find((srv) => srv.id === item.serviceId)
      if (s) s.displayOrder = item.sortOrder
    })
    srvs.sort((a, b) => a.displayOrder - b.displayOrder)
    saveServices(srvs)
  },

  async deletePosService(serviceId: string): Promise<boolean> {
    let srvs = await getInitialServices()
    srvs = srvs.filter((s) => s.id !== serviceId)
    saveServices(srvs)
    return true
  },
}

export default posServicesRepository