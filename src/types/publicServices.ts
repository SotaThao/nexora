export interface PublicServiceItem {
  id: string
  name: string
  imageUrl?: string | null
  description: string | null
  durationMinutes: number
  /** A missing or invalid price stays unknown instead of being displayed as free. */
  price: number | null
}

export interface PublicServiceCategory {
  categoryId: string | null
  categoryName: string
  services: PublicServiceItem[]
}

export interface PublicServiceMenu {
  businessName: string
  categories: PublicServiceCategory[]
}
