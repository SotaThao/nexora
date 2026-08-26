// Merchant Site Enums & Interfaces — US-107
// Enforce strict enums across repositories, hooks, and components (no string literals).

export enum MerchantSiteStatus {
  Draft = 'Draft',
  Published = 'Published',
  Archived = 'Archived',
}

export enum MerchantSiteTemplateId {
  Classic = 'classic',
  Modern = 'modern',
  Bold = 'bold',
  Minimal = 'minimal',
}

export enum MerchantSitePaletteId {
  Gold = 'gold',
  RoseGold = 'rosegold',
  Emerald = 'emerald',
  Neon = 'neon',
  Slate = 'slate',
  Ruby = 'ruby',
  Amethyst = 'amethyst',
  Ocean = 'ocean',
  Coral = 'coral',
  Matcha = 'matcha',
  Mocha = 'mocha',
  Custom = 'custom',
}

export interface SiteHighlightDto {
  id: string
  titleEn: string
  titleVi: string
  descriptionEn?: string
  descriptionVi?: string
  icon?: string
}

export interface SitePromotionDto {
  id: string
  titleEn: string
  titleVi: string
  descriptionEn?: string
  descriptionVi?: string
  code?: string
  discountPercent?: number
  imageUrl?: string
  startDate?: string
  endDate?: string
}

export interface SiteContentDto {
  taglineEn: string
  taglineVi: string
  aboutEn: string
  aboutVi: string
  heroImageUrl?: string
  galleryImageUrls: string[]
  highlights: SiteHighlightDto[]
  promotions: SitePromotionDto[]
  customDomain?: string
}

export interface MerchantSiteDto {
  businessId: string
  templateId: MerchantSiteTemplateId
  paletteId: MerchantSitePaletteId
  customColor?: string
  status: MerchantSiteStatus
  publishedAt?: string | null
  content: SiteContentDto
  siteEnabled?: boolean
}

export interface PublicSiteRatingSummaryDto {
  averageRating: number
  totalReviews: number
}

export interface PublicServiceItemDto {
  id: string
  name: string
  price: number | string
  durationMinutes?: number
  description?: string
  categoryName?: string
}

export interface PublicStaffMemberDto {
  id: string
  name: string
  role?: string
  exp?: string
  rating?: number
  specialties?: string
  avatarUrl?: string | null
}

export interface PublicBusinessHourDto {
  dayOfWeek: string
  isOpen: boolean
  openTime?: string | null
  closeTime?: string | null
}

export interface PublicReviewDto {
  id: string
  name: string
  rating: number
  date?: string
  comment: string
}

export interface PublicSiteDto {
  businessSlug: string
  businessName: string
  phone?: string
  address?: string
  templateId: MerchantSiteTemplateId
  paletteId: MerchantSitePaletteId
  customColor?: string
  status: MerchantSiteStatus
  publishedAt?: string | null
  content: SiteContentDto
  ratingSummary?: PublicSiteRatingSummaryDto
  services?: PublicServiceItemDto[]
  staffList?: PublicStaffMemberDto[]
  businessHours?: PublicBusinessHourDto[]
  reviews?: PublicReviewDto[]
}

/**
 * Public-site identity and authored content returned by the site repository.
 * Live POS facts are deliberately excluded: the public booking response owns
 * services and staff, while no public business-hours source exists yet.
 */
export type PublicSiteRepositoryDto = Omit<
  PublicSiteDto,
  'ratingSummary' | 'services' | 'staffList' | 'businessHours' | 'reviews'
>

export const DEFAULT_MERCHANT_SITE_CONTENT: SiteContentDto = {
  taglineEn: 'Elevating beauty & luxury nail spa experience in your neighborhood',
  taglineVi: 'Nâng tầm vẻ đẹp móng nghệ thuật và trải nghiệm chăm sóc spa đẳng cấp',
  aboutEn: 'We deliver five-star salon care with organic, non-toxic products and top certified nail technicians.',
  aboutVi: 'Chúng tôi mang đến dịch vụ chăm sóc móng chuẩn 5 sao với sản phẩm lành tính organic và đội ngũ thợ lành nghề.',
  heroImageUrl: '',
  galleryImageUrls: [],
  highlights: [
    {
      id: 'h1',
      titleEn: '100% Sanitized & Organic Products',
      titleVi: 'Sản phẩm Organic & Tiệt trùng 100%',
      descriptionEn: 'Hospital-grade autoclaves and organic nail care essentials',
      descriptionVi: 'Quy trình tiệt trùng chuẩn y tế và dưỡng móng thuần tự nhiên'
    },
    {
      id: 'h2',
      titleEn: 'Top Master Nail Artists',
      titleVi: 'Nghệ Nhân Móng Đẳng Cấp',
      descriptionEn: 'Over 10+ years of creative nail art & precision shaping',
      descriptionVi: 'Hơn 10 năm kinh nghiệm tạo mẫu móng nghệ thuật tinh xảo'
    },
    {
      id: 'h3',
      titleEn: 'Realtime POS & Booking Sync',
      titleVi: 'Đồng Bộ Lịch & Bảng Giá POS Trực Tuyến',
      descriptionEn: 'Instant confirmation with your preferred technician & live menu prices',
      descriptionVi: 'Xác nhận lịch hẹn tức thì với thợ yêu thích và giá niêm yết chuẩn xác'
    }
  ],
  promotions: [
    {
      id: 'promo-1',
      titleEn: 'Welcome Special: 15% OFF Online Booking',
      titleVi: 'Ưu Đãi Chào Mừng: Giảm 15% Khi Đặt Hẹn Online',
      descriptionEn: 'Applicable for all nail & spa services on your first visit',
      descriptionVi: 'Áp dụng cho toàn bộ dịch vụ làm móng & spa cho lần đầu ghé tiệm',
      code: 'WELCOME15',
      discountPercent: 15
    }
  ],
  customDomain: ''
}

export const DEFAULT_MERCHANT_SITE: MerchantSiteDto = {
  businessId: '',
  templateId: MerchantSiteTemplateId.Classic,
  paletteId: MerchantSitePaletteId.Gold,
  status: MerchantSiteStatus.Draft,
  publishedAt: null,
  content: DEFAULT_MERCHANT_SITE_CONTENT,
  siteEnabled: true
}
