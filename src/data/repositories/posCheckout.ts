/**
 * posCheckoutRepository — POS Merchant Ops: Checkout (US-14 / US-025).
 * businessId is an explicit param on every call, same as posTicketsRepository/
 * posTurnBoardRepository — a Staff caller may be linked to more than one business.
 */
import httpClient from '../../lib/httpClient'
import type {
  CheckoutServiceCatalogItemApiDto,
  ChargeTicketPayload,
  ChargeTicketResultApiDto,
  ReadyTicketApiDto,
  TicketDetailApiDto,
} from '../../types/repositories'

type HttpClient = typeof httpClient

export function createPosCheckoutRepository(client: HttpClient = httpClient) {
  return {
    async getReadyTickets(businessId: string): Promise<ReadyTicketApiDto[]> {
      const res = await client.get<ReadyTicketApiDto[]>(
        `/api/v1/merchant/pos/${businessId}/checkout/ready`,
      )
      return res ?? []
    },

    async getTicketDetail(businessId: string, ticketId: string): Promise<TicketDetailApiDto> {
      return await client.get<TicketDetailApiDto>(
        `/api/v1/merchant/pos/${businessId}/checkout/${ticketId}`,
      )
    },

    async getServiceCatalog(businessId: string): Promise<CheckoutServiceCatalogItemApiDto[]> {
      const res = await client.get<CheckoutServiceCatalogItemApiDto[]>(
        `/api/v1/merchant/pos/${businessId}/checkout/services`,
      )
      return res ?? []
    },

    async addTicketServiceLine(
      businessId: string,
      ticketId: string,
      posServiceId: string,
      quantity = 1,
    ): Promise<string> {
      return await client.post<string>(
        `/api/v1/merchant/pos/${businessId}/checkout/${ticketId}/services`,
        { posServiceId, quantity },
      )
    },

    async markTicketReady(businessId: string, ticketId: string): Promise<boolean> {
      return await client.post<boolean>(
        `/api/v1/merchant/pos/${businessId}/checkout/${ticketId}/ready`,
      )
    },

    async setTicketTip(businessId: string, ticketId: string, tipAmount: number): Promise<boolean> {
      return await client.put<boolean>(
        `/api/v1/merchant/pos/${businessId}/checkout/${ticketId}/tip`,
        { tipAmount },
      )
    },

    async chargeTicket(
      businessId: string,
      ticketId: string,
      payload: ChargeTicketPayload,
    ): Promise<ChargeTicketResultApiDto> {
      return await client.post<ChargeTicketResultApiDto>(
        `/api/v1/merchant/pos/${businessId}/checkout/${ticketId}/charge`,
        payload,
      )
    },
  }
}

export const posCheckoutRepository = createPosCheckoutRepository()
export default posCheckoutRepository
