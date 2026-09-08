export interface PublicServiceItem {
  id: string
  name: string
  description: string | null
  durationMinutes: number
  /** A missing or invalid price stays unknown instead of being displayed as free. */
  price: number | null
  displayOrder: number | null
}

export interface PublicServiceCategory {
  categoryId: string | null
  categoryName: string
  displayOrder: number | null
  services: PublicServiceItem[]
}

export interface PublicServiceMenu {
  businessName: string
  categories: PublicServiceCategory[]
}
