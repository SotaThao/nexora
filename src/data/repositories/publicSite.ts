// Public Site Repository — US-107
// Interacts with GET /api/v1/public/site/:slug
import {
  MerchantSiteStatus,
} from '../../constants/merchantSiteStatus'
import type { PublicSiteRepositoryDto } from '../../constants/merchantSiteStatus'
import httpClient from '../../lib/httpClient'
import { logger } from '../../utils/logger'

const LOCAL_STORAGE_KEY = 'nexora_merchant_site_data'

type StoredPublicSite = Partial<PublicSiteRepositoryDto> & { businessId?: string }

export const publicSiteRepository = {
  async getPublicSite(slug: string): Promise<PublicSiteRepositoryDto | null> {
    try {
      const response = await httpClient.get<PublicSiteRepositoryDto>(`/api/v1/public/site/${encodeURIComponent(slug)}`)
      if (response) {
        return response
      }
    } catch (error) {
      logger.info('[PublicSiteRepository] Public API not ready, looking up local published state.', error)
    }

    try {
      const normalizedSlug = slug.trim()
      const raw = normalizedSlug
        ? localStorage.getItem(`${LOCAL_STORAGE_KEY}_${normalizedSlug}`)
        : null
      if (raw) {
        const parsed = JSON.parse(raw) as StoredPublicSite
        const businessName = parsed.businessName?.trim()
        if (
          parsed.status === MerchantSiteStatus.Published
          && parsed.businessSlug === normalizedSlug
          && businessName
          && parsed.templateId
          && parsed.paletteId
          && parsed.content
        ) {
          return {
            businessSlug: normalizedSlug,
            businessName,
            phone: parsed.phone?.trim() || undefined,
            address: parsed.address?.trim() || undefined,
            templateId: parsed.templateId,
            paletteId: parsed.paletteId,
            customColor: parsed.customColor,
            status: MerchantSiteStatus.Published,
            publishedAt: parsed.publishedAt,
            content: parsed.content,
          }
        }
      }

      // Zero-backend / preview fallback for demo slugs
      if (!normalizedSlug || normalizedSlug === 'nexora-luxury' || normalizedSlug === 'demo-salon' || normalizedSlug === 'nexora') {
        return {
          businessSlug: normalizedSlug || 'nexora-luxury',
          businessName: 'Nexora Luxury Nails & Spa Lounge',
          phone: '(832) 555-0198',
          address: '10882 Westheimer Rd, Houston, TX 77042',
          templateId: 'classic' as any,
          paletteId: 'gold' as any,
          status: MerchantSiteStatus.Published,
          publishedAt: new Date().toISOString(),
          content: {
            taglineEn: 'The Pinnacle of Luxury Nail Artistry & Organic Care',
            taglineVi: 'Đỉnh Cao Nghệ Thuật Móng & Chăm Sóc Sức Khỏe Thuần Tự Nhiên',
            aboutEn: 'Founded with a dedication to timeless elegance, Nexora Luxury Nails & Spa Lounge redefines the self-care experience. We combine hospital-grade sanitation, master craftsmanship, and premium organic botanicals to ensure every visit is a restorative journey.',
            aboutVi: 'Được sáng lập với tâm huyết mang lại vẻ đẹp vượt thời gian, Nexora Luxury Nails & Spa Lounge nâng tầm trải nghiệm chăm sóc sắc đẹp. Chúng tôi kết hợp quy trình tiệt trùng chuẩn y tế, nghệ nhân tài hoa và thảo mộc tự nhiên cao cấp mang lại sự thư thái tuyệt đối.',
            heroImageUrl: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=1600&auto=format&fit=crop&q=80',
            galleryImageUrls: [
              'https://images.unsplash.com/photo-1632345031435-8727f6897d53?w=800&auto=format&fit=crop&q=80',
              'https://images.unsplash.com/photo-1519014816548-bf5fe059798b?w=800&auto=format&fit=crop&q=80',
              'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&auto=format&fit=crop&q=80',
              'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&auto=format&fit=crop&q=80'
            ],
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
            ]
          }
        }
      }
    } catch (error) {
      logger.warn('[PublicSiteRepository] Failed to read local published state.', error)
    }

    return null
  },
}
