/**
 * posCheckoutRepository — POS Merchant Ops: Checkout (US-14 / US-025, refactored to
 * Order + multi-staff service lines + product lines + tip split in US-026).
 * businessId is an explicit param on every call, same as posOrdersRepository/
 * posTurnBoardRepository — a Staff caller may be linked to more than one business.
 */
import httpClient from '../../lib/httpClient'
import type {
  CheckoutProductCatalogItemApiDto,
  CheckoutServiceCatalogItemApiDto,
  CompleteOrderPayload,
  CompleteOrderResultApiDto,
  InServiceOrderApiDto,
  OrderDetailApiDto,
  SetOrderStaffTipSplitPayload,
} from '../../types/repositories'

type HttpClient = typeof httpClient

export function createPosCheckoutRepository(client: HttpClient = httpClient) {
  return {
    async getInServiceOrders(businessId: string): Promise<InServiceOrderApiDto[]> {
      const res = await client.get<InServiceOrderApiDto[]>(
        `/api/v1/merchant/pos/${businessId}/checkout/in-service`,
      )
      return res ?? []
    },

    async getOrderDetail(businessId: string, orderId: string): Promise<OrderDetailApiDto> {
      return await client.get<OrderDetailApiDto>(
        `/api/v1/merchant/pos/${businessId}/checkout/${orderId}`,
      )
    },

    async getServiceCatalog(businessId: string): Promise<CheckoutServiceCatalogItemApiDto[]> {
      const res = await client.get<CheckoutServiceCatalogItemApiDto[]>(
        `/api/v1/merchant/pos/${businessId}/checkout/services`,
      )
      return res ?? []
    },

    async getProductCatalog(businessId: string): Promise<CheckoutProductCatalogItemApiDto[]> {
      const res = await client.get<CheckoutProductCatalogItemApiDto[]>(
        `/api/v1/merchant/pos/${businessId}/checkout/products`,
      )
      return res ?? []
    },

    async addOrderServiceLine(
      businessId: string,
      orderId: string,
      posServiceId: string,
      quantity = 1,
    ): Promise<string> {
      return await client.post<string>(
        `/api/v1/merchant/pos/${businessId}/checkout/${orderId}/services`,
        { posServiceId, quantity },
      )
    },

    async removeOrderServiceLine(businessId: string, orderId: string, serviceLineId: string): Promise<boolean> {
      return await client.del<boolean>(
        `/api/v1/merchant/pos/${businessId}/checkout/${orderId}/services/${serviceLineId}`,
      )
    },

    async addOrderProductLine(
      businessId: string,
      orderId: string,
      posProductId: string,
      quantity = 1,
    ): Promise<string> {
      return await client.post<string>(
        `/api/v1/merchant/pos/${businessId}/checkout/${orderId}/products`,
        { posProductId, quantity },
      )
    },

    async removeOrderProductLine(businessId: string, orderId: string, productLineId: string): Promise<boolean> {
      return await client.del<boolean>(
        `/api/v1/merchant/pos/${businessId}/checkout/${orderId}/products/${productLineId}`,
      )
    },

    // Product-only (US-17) — a Service line is always Quantity = 1, so there is no
    // equivalent for services.
    async updateOrderProductLineQuantity(
      businessId: string,
      orderId: string,
      productLineId: string,
      quantity: number,
    ): Promise<boolean> {
      return await client.put<boolean>(
        `/api/v1/merchant/pos/${businessId}/checkout/${orderId}/products/${productLineId}/quantity`,
        { quantity },
      )
    },

    async setOrderTip(businessId: string, orderId: string, tipAmount: number): Promise<boolean> {
      return await client.put<boolean>(
        `/api/v1/merchant/pos/${businessId}/checkout/${orderId}/tip`,
        { tipAmount },
      )
    },

    async setOrderStaffTipSplit(
      businessId: string,
      orderId: string,
      payload: SetOrderStaffTipSplitPayload,
    ): Promise<boolean> {
      return await client.put<boolean>(
        `/api/v1/merchant/pos/${businessId}/checkout/${orderId}/tip-split`,
        payload,
      )
    },

    async completeOrder(
      businessId: string,
      orderId: string,
      payload: CompleteOrderPayload,
    ): Promise<CompleteOrderResultApiDto> {
      return await client.post<CompleteOrderResultApiDto>(
        `/api/v1/merchant/pos/${businessId}/checkout/${orderId}/complete`,
        payload,
      )
    },
  }
}

export const posCheckoutRepository = createPosCheckoutRepository()
export default posCheckoutRepository
