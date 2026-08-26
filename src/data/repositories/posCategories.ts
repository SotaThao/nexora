/**
 * posCategoriesRepository — POS Owner Setup: Categories (Zero-Backend & LocalStorage Mock Supported)
 */
import type { PosCategoryApiDto } from '../../types/repositories'
import { DEMO_CATEGORIES } from '../seedPosDemoMenu'

const STORAGE_KEY = 'nexora:pos:categories:v1'

export interface CategoryOrderItem {
  categoryId: string
  sortOrder: number
}

function getInitialCategories(): PosCategoryApiDto[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length > 0) return parsed
    }
  } catch {}

  // Seed default demo categories
  const initial: PosCategoryApiDto[] = DEMO_CATEGORIES.map((c, idx) => ({
    id: 'cat_' + (idx + 1) + '_' + c.name.toLowerCase().replace(/[^a-z0-9]/g, '_'),
    name: c.name,
    displayOrder: idx,
    description: null,
  }))

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initial))
  } catch {}

  return initial
}

function saveCategories(cats: PosCategoryApiDto[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cats))
  } catch {}
}

export const posCategoriesRepository = {
  async getPosCategories(): Promise<PosCategoryApiDto[]> {
    return getInitialCategories()
  },

  async createPosCategory(name: string): Promise<string> {
    const cats = getInitialCategories()
    const newId = 'cat_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6)
    const newCat: PosCategoryApiDto = {
      id: newId,
      name,
      displayOrder: cats.length,
      description: null,
    }
    cats.push(newCat)
    saveCategories(cats)
    return newId
  },

  async updatePosCategory(categoryId: string, name: string): Promise<boolean> {
    const cats = getInitialCategories()
    const found = cats.find((c) => c.id === categoryId)
    if (found) {
      found.name = name
      saveCategories(cats)
      return true
    }
    return false
  },

  async reorderPosCategories(items: CategoryOrderItem[]): Promise<void> {
    const cats = getInitialCategories()
    items.forEach((item) => {
      const cat = cats.find((c) => c.id === item.categoryId)
      if (cat) cat.displayOrder = item.sortOrder
    })
    cats.sort((a, b) => a.displayOrder - b.displayOrder)
    saveCategories(cats)
  },

  async deletePosCategory(categoryId: string): Promise<boolean> {
    let cats = getInitialCategories()
    cats = cats.filter((c) => c.id !== categoryId)
    saveCategories(cats)
    return true
  },
}

export default posCategoriesRepository