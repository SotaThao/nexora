/**
 * posSelfCheckInRepository — the customer-facing half of the kiosk.
 *
 * Every call goes through posDeviceHttpClient, so the salon is identified by the device token and
 * never by a businessId in the payload. That is why no operation here takes one.
 *
 * The two phone lookups answer with 204 when nothing matches (an unknown number is not an error),
 * which the client turns into `null` — callers treat that as "new customer".
 */
import posDeviceHttpClient from '../../lib/posDeviceHttpClient'
import type {
  SelfCheckInBookingApiDto,
  SelfCheckInContextApiDto,
  SelfCheckInOrderResultApiDto,
  SelfCheckInServiceApiDto,
  SelfCheckInTechnicianApiDto,
} from '../../types/repositories'

type Client = typeof posDeviceHttpClient

const BASE = '/api/v1/pos-device/self-checkin'

export interface SelfCheckInOrderItemPayload {
  posServiceId: string
  // null is "First Available" and stays null through to the database — the front desk assigns it
  // in person. Never resolve it on the client.
  posStaffProfileId: string | null
}

export interface CreateSelfCheckInOrderPayload {
  customerName: string | null
  customerPhone: string
  items: SelfCheckInOrderItemPayload[]
}

export interface CheckInSelfCheckInBookingPayload {
  bookingId: string
  customerName: string | null
  // Replaces the booking's own lines: the guest may have edited them on the overview screen.
  items: SelfCheckInOrderItemPayload[]
}

export function createPosSelfCheckInRepository(client: Client = posDeviceHttpClient) {
  return {
    async getContext(): Promise<SelfCheckInContextApiDto | null> {
      return client.get<SelfCheckInContextApiDto>(`${BASE}/context`)
    },

    async getCatalog(): Promise<SelfCheckInServiceApiDto[]> {
      return (await client.get<SelfCheckInServiceApiDto[]>(`${BASE}/catalog`)) ?? []
    },

    async lookupCustomerName(phone: string): Promise<string | null> {
      const res = await client.get<{ displayName: string }>(`${BASE}/customer-lookup`, {
        params: { phone },
      })
      return res?.displayName ?? null
    },

    // Today's appointment for this number, if the guest booked and has not arrived yet.
    async getTodaysBooking(phone: string): Promise<SelfCheckInBookingApiDto | null> {
      return client.get<SelfCheckInBookingApiDto>(`${BASE}/booking`, { params: { phone } })
    },

    async getActiveVisitOrderNumber(phone: string): Promise<string | null> {
      const res = await client.get<{ orderNumber: string }>(`${BASE}/active-visit`, {
        params: { phone },
      })
      return res?.orderNumber ?? null
    },

    // Every clocked-in technician who can perform at least one service, each carrying the services
    // they are assigned to. Fetched once per visit — the kiosk asks who you would like before it
    // asks what you want, so there is no service to filter by at that point.
    async getTechnicians(): Promise<SelfCheckInTechnicianApiDto[]> {
      return (await client.get<SelfCheckInTechnicianApiDto[]>(`${BASE}/technicians`)) ?? []
    },

    async createOrder(payload: CreateSelfCheckInOrderPayload): Promise<SelfCheckInOrderResultApiDto> {
      const res = await client.post<SelfCheckInOrderResultApiDto>(`${BASE}/orders`, payload)
      if (!res) throw new Error('Check-in returned no order number')
      return res
    },

    // A booked guest converts their appointment rather than creating a second order beside it, so
    // this is a different endpoint, not a flag on createOrder.
    async checkInBooking(payload: CheckInSelfCheckInBookingPayload): Promise<SelfCheckInOrderResultApiDto> {
      const res = await client.post<SelfCheckInOrderResultApiDto>(`${BASE}/bookings/check-in`, payload)
      if (!res) throw new Error('Check-in returned no order number')
      return res
    },
  }
}

const posSelfCheckInRepository = createPosSelfCheckInRepository()
export default posSelfCheckInRepository
