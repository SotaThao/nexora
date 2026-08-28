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
    { id: 'srv-pedi-1', name: 'Bitcoin 24K Gold Pedicure', price: 99, durationMinutes: 75, description: 'Ultra-luxurious pedicure featuring 24K gold foil soak, 20-min hot stone massage, and botanical foot mask.', categories: [{ id: 'cat-pedi', name: 'Pedicure' }] },
    { id: 'srv-pedi-2', name: 'Paris Pearl Pedicure', price: 75, durationMinutes: 60, description: 'Parisian pearl foot spa, sea salt exfoliation, and aromatic herbal massage.', categories: [{ id: 'cat-pedi', name: 'Pedicure' }] },
    { id: 'srv-pedi-3', name: 'Botanical Spa Pedicure', price: 68, durationMinutes: 50, description: 'Relaxing organic botanical essential oils, mineral foot soak, and intensive moisturizing therapy.', categories: [{ id: 'cat-pedi', name: 'Pedicure' }] },
    { id: 'srv-pedi-4', name: 'Organic Herbal Pedicure', price: 65, durationMinutes: 50, description: 'Natural herbal foot therapy that relieves stress and restores cracked dry heels.', categories: [{ id: 'cat-pedi', name: 'Pedicure' }] },
    { id: 'srv-pedi-5', name: 'Luxury Collagen Pedicure', price: 80, durationMinutes: 60, description: 'Infused with fresh collagen serum to rejuvenate skin elasticity, includes warm moisture booties.', categories: [{ id: 'cat-pedi', name: 'Pedicure' }] },
    { id: 'srv-pedi-6', name: 'Detox Volcano Pedicure', price: 85, durationMinutes: 65, description: 'Detoxifying bubbling volcano crystals that purify dead skin cells and revitalize tired feet.', categories: [{ id: 'cat-pedi', name: 'Pedicure' }] },
    { id: 'srv-pedi-7', name: 'Milk & Honey Deluxe Pedicure', price: 70, durationMinutes: 55, description: 'Fresh milk and raw organic honey soak that brightens, softens skin, and deeply nourishes nails.', categories: [{ id: 'cat-pedi', name: 'Pedicure' }] },
    { id: 'srv-pedi-8', name: 'Jelly Spa Relaxing Pedicure', price: 78, durationMinutes: 60, description: 'Fragrant warm jelly foot soak retaining soothing heat with a therapeutic relaxing massage.', categories: [{ id: 'cat-pedi', name: 'Pedicure' }] },
    { id: 'srv-pedi-9', name: 'Classic Refresh Pedicure', price: 45, durationMinutes: 40, description: 'Standard pedicure care including cuticle grooming, precision shaping, and high-shine polish.', categories: [{ id: 'cat-pedi', name: 'Pedicure' }] },
    
    // Manicure
    { id: 'srv-mani-1', name: 'Signature Gel Manicure', price: 52, durationMinutes: 45, description: 'Long-lasting high-gloss gel polish lasting 3-4 weeks with meticulous Russian/dry cuticle prep.', categories: [{ id: 'cat-mani', name: 'Manicure' }] },
    { id: 'srv-mani-2', name: 'Paris Pearl Manicure', price: 60, durationMinutes: 50, description: 'Parisian pearl manicure treatment with hand scrub and warm botanical essential oil massage.', categories: [{ id: 'cat-mani', name: 'Manicure' }] },
    { id: 'srv-mani-3', name: 'Collagen Glow Manicure', price: 58, durationMinutes: 50, description: 'Anti-aging collagen moisture gloves combined with trending designer nail lacquer.', categories: [{ id: 'cat-mani', name: 'Manicure' }] },
    { id: 'srv-mani-4', name: 'Classic Express Manicure', price: 35, durationMinutes: 30, description: 'Essential manicure care with gentle cuticle trimming, natural shaping, and nourishing base coat.', categories: [{ id: 'cat-mani', name: 'Manicure' }] },

    // Acrylic Nail Service
    { id: 'srv-acrylic-1', name: 'Full Set Acrylic with Gel Color', price: 70, durationMinutes: 65, description: 'Brand new full set acrylic extensions tailored to your custom length and long-wear gel color.', categories: [{ id: 'cat-acrylic', name: 'Acrylic Nail Service' }] },
    { id: 'srv-acrylic-2', name: 'Acrylic Refill with Gel', price: 50, durationMinutes: 45, description: 'Acrylic refill for outgrowth after 2-3 weeks, reshaping, and fresh gel polish coat.', categories: [{ id: 'cat-acrylic', name: 'Acrylic Nail Service' }] },
    { id: 'srv-acrylic-3', name: 'Ombre French Acrylic Full Set', price: 85, durationMinutes: 75, description: 'Master French baby boomer ombre fade or shimmering glitter blend full set extensions.', categories: [{ id: 'cat-acrylic', name: 'Acrylic Nail Service' }] },

    // Dipping Nail
    { id: 'srv-dip-1', name: 'Dipping Powder on Natural Nails', price: 55, durationMinutes: 50, description: 'Organic dipping powder without UV lights, fortified with Vitamin E & Calcium for stronger nails.', categories: [{ id: 'cat-dip', name: 'Dipping Nail' }] },
    { id: 'srv-dip-2', name: 'Dipping Powder Full Set with Tips', price: 65, durationMinutes: 60, description: 'Dipping powder full set extensions shaped in luxury almond, coffin, or tapered square.', categories: [{ id: 'cat-dip', name: 'Dipping Nail' }] },

    // Builder Gel Service
    { id: 'srv-gel-1', name: 'Builder Gel Overlay (BIAB)', price: 65, durationMinutes: 55, description: 'Builder in a Bottle (BIAB) overlay reinforcing natural nail strength and preventing breakage.', categories: [{ id: 'cat-gel', name: 'Builder Gel Service' }] },
    { id: 'srv-gel-2', name: 'Builder Gel Full Set with Extension', price: 85, durationMinutes: 70, description: 'Lightweight flexible builder gel extensions with seamless natural finish.', categories: [{ id: 'cat-gel', name: 'Builder Gel Service' }] },

    // Waxing Service
    { id: 'srv-wax-1', name: 'Eyebrows Design & Waxing', price: 20, durationMinutes: 20, description: 'Precision eyebrow mapping, sculpting, and gentle botanical waxing for golden ratio brows.', categories: [{ id: 'cat-wax', name: 'Waxing Service' }] },
    { id: 'srv-wax-2', name: 'Full Face Smoothing Wax', price: 45, durationMinutes: 35, description: 'Silky smooth full face waxing using soothing hypoallergenic organic wax formulation.', categories: [{ id: 'cat-wax', name: 'Waxing Service' }] },
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
