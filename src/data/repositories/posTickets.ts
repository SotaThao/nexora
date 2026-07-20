/**
 * posTicketsRepository — POS Merchant Ops: Check-in & Waitlist (US-12).
 * Unlike the POS Owner Setup repositories, businessId is an explicit param on
 * every call (not inferred server-side from the caller) because a Staff caller
 * may be linked to more than one business.
 */
import httpClient from '../../lib/httpClient'
import type { CheckInTicketPayload, PosWaitlistTicketApiDto } from '../../types/repositories'

type HttpClient = typeof httpClient

export function createPosTicketsRepository(client: HttpClient = httpClient) {
  return {
    async getWaitlist(businessId: string): Promise<PosWaitlistTicketApiDto[]> {
      const res = await client.get<PosWaitlistTicketApiDto[]>(
        `/api/v1/merchant/pos/${businessId}/tickets/waitlist`,
      )
      return res ?? []
    },

    async checkInTicket(businessId: string, payload: CheckInTicketPayload): Promise<string> {
      return await client.post<string>(`/api/v1/merchant/pos/${businessId}/tickets`, payload)
    },

    async cancelTicket(businessId: string, ticketId: string): Promise<boolean> {
      return await client.post<boolean>(`/api/v1/merchant/pos/${businessId}/tickets/${ticketId}/cancel`)
    },
  }
}

export const posTicketsRepository = createPosTicketsRepository()
export default posTicketsRepository
