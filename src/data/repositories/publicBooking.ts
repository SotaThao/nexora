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

type HttpClient = typeof httpClient

export function createPublicBookingRepository(client: HttpClient = httpClient) {
  return {
    async getBookingPage(businessSlug: string): Promise<PublicBookingPageApiDto> {
      return await client.get<PublicBookingPageApiDto>(
        `/api/v1/booking/${encodeURIComponent(businessSlug)}`,
        { anonymous: true },
      )
    },

    async getAvailability(
      businessSlug: string,
      payload: PublicAvailabilityRequestPayload,
    ): Promise<PublicAvailabilityApiDto> {
      return await client.post<PublicAvailabilityApiDto>(
        `/api/v1/booking/${encodeURIComponent(businessSlug)}/availability`,
        payload,
        { anonymous: true },
      )
    },

    async createBooking(
      businessSlug: string,
      payload: CreatePublicBookingPayload,
    ): Promise<CreatePublicBookingResultApiDto> {
      return await client.post<CreatePublicBookingResultApiDto>(
        `/api/v1/booking/${encodeURIComponent(businessSlug)}/bookings`,
        payload,
        { anonymous: true },
      )
    },

    // Returning-customer contact-step prefill — same "returning customer" suggestion as the
    // POS Merchant check-in lookup, resolved by BusinessSlug since this page is anonymous.
    async getCustomerLookup(businessSlug: string, phone: string): Promise<CustomerLookupResultApiDto | null> {
      const res = await client.get<CustomerLookupResultApiDto | null>(
        `/api/v1/booking/${encodeURIComponent(businessSlug)}/customer-lookup`,
        { anonymous: true, params: { phone } },
      )
      return res ?? null
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
