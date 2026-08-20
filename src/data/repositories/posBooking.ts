/**
 * posBookingRepository — POS Booking, Staff/Owner creates/manages bookings (Tickets 3, 7-9).
 * businessId is an explicit param on every call (not inferred server-side), same
 * convention as posOrdersRepository, since a Staff caller may be linked to more than one
 * business.
 */
import httpClient from '../../lib/httpClient'
import type {
  BookingDetailApiDto,
  BookingListFilters,
  BookingListResultApiDto,
  CancelBookingPayload,
  CheckInOrderItemPayload,
  CreateBookingPayload,
  PosCheckInResultApiDto,
  RescheduleBookingPayload,
} from '../../types/repositories'

type HttpClient = typeof httpClient

function buildListQuery(filters: BookingListFilters): string {
  const params = new URLSearchParams()
  if (filters.posStaffProfileId) params.set('posStaffProfileId', filters.posStaffProfileId)
  if (filters.dateFrom) params.set('dateFrom', filters.dateFrom)
  if (filters.dateTo) params.set('dateTo', filters.dateTo)
  if (filters.status) params.set('status', filters.status)
  params.set('page', String(filters.page ?? 1))
  params.set('pageSize', String(filters.pageSize ?? 50))
  return params.toString()
}

export function createPosBookingRepository(client: HttpClient = httpClient) {
  return {
    async createStaffBooking(businessId: string, payload: CreateBookingPayload): Promise<string> {
      return await client.post<string>(`/api/v1/merchant/pos/${businessId}/bookings`, payload)
    },

    async getBookingList(businessId: string, filters: BookingListFilters): Promise<BookingListResultApiDto> {
      return await client.get<BookingListResultApiDto>(
        `/api/v1/merchant/pos/${businessId}/bookings?${buildListQuery(filters)}`,
      )
    },

    async getBookingDetail(businessId: string, bookingId: string): Promise<BookingDetailApiDto> {
      return await client.get<BookingDetailApiDto>(`/api/v1/merchant/pos/${businessId}/bookings/${bookingId}`)
    },

    // `items` replaces the appointment's own lines and is only sent by the Check-in tab, where the
    // operator may have changed them at the counter. The Bookings tab omits it and the booking
    // keeps what was booked.
    async checkInBooking(
      businessId: string,
      bookingId: string,
      draft?: { items: CheckInOrderItemPayload[]; customerName?: string; customerEmail?: string },
    ): Promise<PosCheckInResultApiDto> {
      return await client.post<PosCheckInResultApiDto>(
        `/api/v1/merchant/pos/${businessId}/bookings/${bookingId}/check-in`,
        {
          items: draft?.items ?? null,
          customerName: draft?.customerName ?? null,
          customerEmail: draft?.customerEmail ?? null,
        },
      )
    },

    async cancelBooking(businessId: string, bookingId: string, payload: CancelBookingPayload): Promise<void> {
      await client.post<void>(`/api/v1/merchant/pos/${businessId}/bookings/${bookingId}/cancel`, payload)
    },

    async rescheduleBooking(businessId: string, bookingId: string, payload: RescheduleBookingPayload): Promise<void> {
      await client.post<void>(`/api/v1/merchant/pos/${businessId}/bookings/${bookingId}/reschedule`, payload)
    },
  }
}

export const posBookingRepository = createPosBookingRepository()
export default posBookingRepository
