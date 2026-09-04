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

const BOOKING_LIST_COLLECTION_PAGE_SIZE = 200
const MAX_BOOKING_LIST_COLLECTION_PAGES = 100

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
  async function getBookingList(
    businessId: string,
    filters: BookingListFilters,
  ): Promise<BookingListResultApiDto> {
    return await client.get<BookingListResultApiDto>(
      `/api/v1/merchant/pos/${businessId}/bookings?${buildListQuery(filters)}`,
    )
  }

  return {
    async createStaffBooking(businessId: string, payload: CreateBookingPayload): Promise<string> {
      return await client.post<string>(`/api/v1/merchant/pos/${businessId}/bookings`, payload)
    },

    getBookingList,

    async getAllBookingListPages(
      businessId: string,
      filters: Omit<BookingListFilters, 'page' | 'pageSize'>,
    ): Promise<BookingListResultApiDto> {
      const items: BookingListResultApiDto['items'] = []
      let totalCount = 0

      for (let page = 1; page <= MAX_BOOKING_LIST_COLLECTION_PAGES; page += 1) {
        const result = await getBookingList(businessId, {
          ...filters,
          page,
          pageSize: BOOKING_LIST_COLLECTION_PAGE_SIZE,
        })
        totalCount = Math.max(totalCount, result.totalCount)

        if (result.items.length === 0) {
          return { items, totalCount }
        }

        items.push(...result.items)
        if (items.length >= totalCount) {
          return { items, totalCount }
        }
      }

      throw new Error('Booking list pagination exceeded the safety limit')
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
