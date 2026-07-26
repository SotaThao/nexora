/**
 * publicBookingRepository — POS Booking Public Booking Page discovery (Ticket 4).
 * Anonymous, no auth — resolved by Business.Slug, same convention as publicTouch.ts.
 */
import httpClient from '../../lib/httpClient'
import type {
  CreatePublicBookingPayload,
  CreatePublicBookingResultApiDto,
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
