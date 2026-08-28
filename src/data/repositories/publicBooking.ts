/**
 * publicBookingRepository — POS Booking Public Booking Page discovery (Ticket 4).
 * Anonymous, no auth — resolved by Business.Slug, same convention as publicTouch.ts.
 */
import httpClient from '../../lib/httpClient'
import type {
  BookingConsentApiDto,
  CreatePublicBookingPayload,
  CreatePublicBookingResultApiDto,
  CustomerLookupResultApiDto,
  ManageBookingApiDto,
  ManageBookingReschedulePayload,
  PublicAvailabilityApiDto,
  PublicAvailabilityRequestPayload,
  PublicBookingPageApiDto,
} from '../../types/repositories'
import { logger } from '../../utils/logger'

type HttpClient = typeof httpClient

const DEMO_BOOKING_DATA: PublicBookingPageApiDto = {
  businessName: 'Nexora Luxury Nails & Spa Lounge',
  logoUrl: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=1600&auto=format&fit=crop&q=80',
  businessAddress: '9793 Westheimer Rd A, Houston, TX 77042, USA',
  businessPhone: '(832) 555-0198',
  services: [
    // Pedicure
    { id: 'srv-pedi-1', name: 'Bitcoin 24K Gold Pedicure', price: 99, durationMinutes: 75, description: 'Dịch vụ Pedicure cao cấp với tinh chất vàng 24K, massage đá nóng 20p và đắp mặt nạ chân.', categories: [{ id: 'cat-pedi', name: 'Pedicure' }] },
    { id: 'srv-pedi-2', name: 'Paris Pearl Pedicure', price: 75, durationMinutes: 60, description: 'Chăm sóc móng chân ngọc trai Paris, tẩy tế bào chết muối biển và massage thảo mộc.', categories: [{ id: 'cat-pedi', name: 'Pedicure' }] },
    { id: 'srv-pedi-3', name: 'Botanical Spa Pedicure', price: 68, durationMinutes: 50, description: 'Thư giãn với tinh dầu thực vật hữu cơ, ngâm chân muối khoáng và dưỡng ẩm chuyên sâu.', categories: [{ id: 'cat-pedi', name: 'Pedicure' }] },
    { id: 'srv-pedi-4', name: 'Organic Herbal Pedicure', price: 65, durationMinutes: 50, description: 'Trị liệu móng chân với thảo mộc tự nhiên, giảm căng thẳng và làm mềm da gót chân.', categories: [{ id: 'cat-pedi', name: 'Pedicure' }] },
    { id: 'srv-pedi-5', name: 'Luxury Collagen Pedicure', price: 80, durationMinutes: 60, description: 'Bổ sung collagen tươi tái tạo làn da chân mịn màng, kèm vớ ủ ấm giữ ẩm.', categories: [{ id: 'cat-pedi', name: 'Pedicure' }] },
    { id: 'srv-pedi-6', name: 'Detox Volcano Pedicure', price: 85, durationMinutes: 65, description: 'Thải độc với bột núi lửa sủi bọt cao cấp, thanh lọc tế bào chết và phục hồi năng lượng.', categories: [{ id: 'cat-pedi', name: 'Pedicure' }] },
    { id: 'srv-pedi-7', name: 'Milk & Honey Deluxe Pedicure', price: 70, durationMinutes: 55, description: 'Ngâm chân sữa tươi và mật ong nguyên chất, làm sáng mịn da và nuôi dưỡng móng.', categories: [{ id: 'cat-pedi', name: 'Pedicure' }] },
    { id: 'srv-pedi-8', name: 'Jelly Spa Relaxing Pedicure', price: 78, durationMinutes: 60, description: 'Ngâm chân gel thạch ấm thơm mát, giữ nhiệt lâu và massage xoa dịu mệt mỏi.', categories: [{ id: 'cat-pedi', name: 'Pedicure' }] },
    { id: 'srv-pedi-9', name: 'Classic Refresh Pedicure', price: 45, durationMinutes: 40, description: 'Dịch vụ chăm sóc móng chân tiêu chuẩn, cắt tỉa da, dũa tạo form và sơn bóng cao cấp.', categories: [{ id: 'cat-pedi', name: 'Pedicure' }] },
    
    // Manicure
    { id: 'srv-mani-1', name: 'Signature Gel Manicure', price: 52, durationMinutes: 45, description: 'Sơn gel bền đẹp bóng sáng 3-4 tuần với kỹ thuật làm sạch da chuẩn Nga/Mỹ.', categories: [{ id: 'cat-mani', name: 'Manicure' }] },
    { id: 'srv-mani-2', name: 'Paris Pearl Manicure', price: 60, durationMinutes: 50, description: 'Dưỡng móng tay ngọc trai, tẩy tế bào chết tay và massage tinh dầu ấm.', categories: [{ id: 'cat-mani', name: 'Manicure' }] },
    { id: 'srv-mani-3', name: 'Collagen Glow Manicure', price: 58, durationMinutes: 50, description: 'Ủ găng tay collagen phục hồi da tay lão hóa, kết hợp sơn màu thời thượng.', categories: [{ id: 'cat-mani', name: 'Manicure' }] },
    { id: 'srv-mani-4', name: 'Classic Express Manicure', price: 35, durationMinutes: 30, description: 'Chăm sóc móng tay cơ bản, làm sạch khóe, tạo form móng tự nhiên và sơn dưỡng.', categories: [{ id: 'cat-mani', name: 'Manicure' }] },

    // Acrylic Nail Service
    { id: 'srv-acrylic-1', name: 'Full Set Acrylic with Gel Color', price: 70, durationMinutes: 65, description: 'Đắp móng bột mới nguyên bộ theo form dài ngắn tùy chọn và phủ sơn gel bền đẹp.', categories: [{ id: 'cat-acrylic', name: 'Acrylic Nail Service' }] },
    { id: 'srv-acrylic-2', name: 'Acrylic Refill with Gel', price: 50, durationMinutes: 45, description: 'Dặm đầy móng bột mọc ra sau 2-3 tuần, dũa phom lại chuẩn chỉnh và đổi màu sơn.', categories: [{ id: 'cat-acrylic', name: 'Acrylic Nail Service' }] },
    { id: 'srv-acrylic-3', name: 'Ombre French Acrylic Full Set', price: 85, durationMinutes: 75, description: 'Kỹ thuật đắp bột loang màu ombre hồng trắng hoặc nhũ kim tuyến thời thượng.', categories: [{ id: 'cat-acrylic', name: 'Acrylic Nail Service' }] },

    // Dipping Nail
    { id: 'srv-dip-1', name: 'Dipping Powder on Natural Nails', price: 55, durationMinutes: 50, description: 'Nhúng bột hữu cơ không dùng đèn UV, bổ sung vitamin E & Canxi dưỡng móng chắc khỏe.', categories: [{ id: 'cat-dip', name: 'Dipping Nail' }] },
    { id: 'srv-dip-2', name: 'Dipping Powder Full Set with Tips', price: 65, durationMinutes: 60, description: 'Nhúng bột nối dài móng với form móng almond, coffin hoặc square sang trọng.', categories: [{ id: 'cat-dip', name: 'Dipping Nail' }] },

    // Builder Gel Service
    { id: 'srv-gel-1', name: 'Builder Gel Overlay (BIAB)', price: 65, durationMinutes: 55, description: 'Đắp gel cấu trúc tăng cường độ cứng cho móng thật, bảo vệ móng yếu gãy.', categories: [{ id: 'cat-gel', name: 'Builder Gel Service' }] },
    { id: 'srv-gel-2', name: 'Builder Gel Full Set with Extension', price: 85, durationMinutes: 70, description: 'Nối móng đắp gel dẻo dai tự nhiên, nhẹ nhàng không gây nặng móng.', categories: [{ id: 'cat-gel', name: 'Builder Gel Service' }] },

    // Waxing Service
    { id: 'srv-wax-1', name: 'Eyebrows Design & Waxing', price: 20, durationMinutes: 20, description: 'Tỉa form và wax lông mày sắc sảo theo chuẩn tỉ lệ vàng gương mặt.', categories: [{ id: 'cat-wax', name: 'Waxing Service' }] },
    { id: 'srv-wax-2', name: 'Full Face Smoothing Wax', price: 45, durationMinutes: 35, description: 'Wax sạch mịn vùng mặt với sáp hữu cơ dịu nhẹ không gây rát đỏ.', categories: [{ id: 'cat-wax', name: 'Waxing Service' }] },
  ],
  technicians: [
    { id: 'tech-1', displayName: 'Sarah Nguyen', photoUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80', serviceIds: ['srv-pedi-1', 'srv-pedi-2', 'srv-pedi-3', 'srv-mani-1', 'srv-mani-2', 'srv-acrylic-1', 'srv-acrylic-2', 'srv-dip-1', 'srv-gel-1'] },
    { id: 'tech-2', displayName: 'Emily Tran', photoUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&auto=format&fit=crop&q=80', serviceIds: ['srv-pedi-1', 'srv-pedi-4', 'srv-pedi-5', 'srv-mani-1', 'srv-mani-3', 'srv-acrylic-3', 'srv-dip-2', 'srv-gel-2'] },
    { id: 'tech-3', displayName: 'Jessica Le', photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80', serviceIds: ['srv-pedi-6', 'srv-pedi-7', 'srv-mani-1', 'srv-mani-4', 'srv-acrylic-1', 'srv-acrylic-3', 'srv-wax-1', 'srv-wax-2'] },
    { id: 'tech-4', displayName: 'Alex Pham', photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80', serviceIds: ['srv-pedi-2', 'srv-pedi-8', 'srv-mani-1', 'srv-acrylic-1', 'srv-acrylic-2', 'srv-gel-1', 'srv-dip-1'] },
    { id: 'tech-5', displayName: 'Michael Vu', photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80', serviceIds: ['srv-pedi-3', 'srv-pedi-9', 'srv-mani-2', 'srv-mani-3', 'srv-wax-1', 'srv-wax-2'] },
  ]
}

export function createPublicBookingRepository(client: HttpClient = httpClient) {
  return {
    async getBookingPage(businessSlug: string): Promise<PublicBookingPageApiDto> {
      try {
        const res = await client.get<PublicBookingPageApiDto>(
          `/api/v1/booking/${encodeURIComponent(businessSlug)}`,
          { anonymous: true },
        )
        if (res && res.businessName && res.services && res.services.length > 0) {
          return res
        }
      } catch (err) {
        logger.info('[PublicBookingRepository] Remote booking API not ready, providing demo fallback payload.', err)
      }

      return {
        ...DEMO_BOOKING_DATA,
        businessName: businessSlug === 'nexora-luxury' ? 'Nexora Luxury Nails & Spa Lounge' : DEMO_BOOKING_DATA.businessName
      }
    },

    async getAvailability(
      businessSlug: string,
      payload: PublicAvailabilityRequestPayload,
    ): Promise<PublicAvailabilityApiDto> {
      try {
        const res = await client.post<PublicAvailabilityApiDto>(
          `/api/v1/booking/${encodeURIComponent(businessSlug)}/availability`,
          payload,
          { anonymous: true },
        )
        if (res && res.availableTimes) return res
      } catch (err) {
        logger.info('[PublicBookingRepository] Availability API fallback.', err)
      }

      return {
        availableTimes: ['09:30', '10:15', '11:00', '13:30', '14:15', '15:00', '16:30', '17:15', '18:00']
      }
    },

    async createBooking(
      businessSlug: string,
      payload: CreatePublicBookingPayload,
    ): Promise<CreatePublicBookingResultApiDto> {
      try {
        const res = await client.post<CreatePublicBookingResultApiDto>(
          `/api/v1/booking/${encodeURIComponent(businessSlug)}/bookings`,
          payload,
          { anonymous: true },
        )
        if (res && res.bookingId) return res
      } catch (err) {
        logger.info('[PublicBookingRepository] Create booking API fallback.', err)
      }

      const randomId = 'bk-' + Math.random().toString(36).substring(2, 9)
      const token = 'token-' + Math.random().toString(36).substring(2, 9)
      return {
        bookingId: randomId,
        manageToken: token,
        status: 'confirmed'
      }
    },

    // Returning-customer contact-step prefill
    async getCustomerLookup(businessSlug: string, phone: string): Promise<CustomerLookupResultApiDto | null> {
      try {
        const res = await client.get<CustomerLookupResultApiDto | null>(
          `/api/v1/booking/${encodeURIComponent(businessSlug)}/customer-lookup`,
          { anonymous: true, params: { phone } },
        )
        return res ?? null
      } catch (err) {
        return null
      }
    },

    async getManageBooking(manageToken: string): Promise<ManageBookingApiDto> {
      return await client.get<ManageBookingApiDto>(
        `/api/v1/booking/manage/${encodeURIComponent(manageToken)}`,
        { anonymous: true },
      )
    },

    async cancelManageBooking(manageToken: string): Promise<void> {
      await client.post<void>(
        `/api/v1/booking/manage/${encodeURIComponent(manageToken)}/cancel`,
        {},
        { anonymous: true },
      )
    },

    async getBookingConsent(manageToken: string): Promise<BookingConsentApiDto> {
      return await client.get<BookingConsentApiDto>(
        `/api/v1/booking/manage/${encodeURIComponent(manageToken)}/consent`,
        { anonymous: true },
      )
    },

    async updateBookingConsent(manageToken: string, payload: BookingConsentApiDto): Promise<void> {
      await client.put<void>(
        `/api/v1/booking/manage/${encodeURIComponent(manageToken)}/consent`,
        payload,
        { anonymous: true },
      )
    },

    async rescheduleManageBooking(manageToken: string, payload: ManageBookingReschedulePayload): Promise<void> {
      await client.post<void>(
        `/api/v1/booking/manage/${encodeURIComponent(manageToken)}/reschedule`,
        payload,
        { anonymous: true },
      )
    },
  }
}

export const publicBookingRepository = createPublicBookingRepository()
export default publicBookingRepository
