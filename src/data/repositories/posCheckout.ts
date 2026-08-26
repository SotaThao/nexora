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
  ServiceLineAddOnOptionApiDto,
  SetOrderServiceLineDiscountPayload,
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

    // Swaps which service a line is for, keeping the line's technician, note and position.
    async updateOrderServiceLine(
      businessId: string,
      orderId: string,
      serviceLineId: string,
      posServiceId: string,
    ): Promise<boolean> {
      return await client.put<boolean>(
        `/api/v1/merchant/pos/${businessId}/checkout/${orderId}/services/${serviceLineId}`,
        { posServiceId },
      )
    },

    async removeOrderServiceLine(businessId: string, orderId: string, serviceLineId: string): Promise<boolean> {
      return await client.del<boolean>(
        `/api/v1/merchant/pos/${businessId}/checkout/${orderId}/services/${serviceLineId}`,
      )
    },

    // Scoped to the line, not the service: the picker may only ever offer the add-ons of the
    // service line it was opened from.
    async getServiceLineAddOnOptions(
      businessId: string,
      orderId: string,
      serviceLineId: string,
    ): Promise<ServiceLineAddOnOptionApiDto[]> {
      const res = await client.get<ServiceLineAddOnOptionApiDto[]>(
        `/api/v1/merchant/pos/${businessId}/checkout/${orderId}/services/${serviceLineId}/add-on-options`,
      )
      return res ?? []
    },

    // One call adds one line — tapping the same add-on twice is two lines, not a quantity of two.
    async addOrderServiceAddOnLine(
      businessId: string,
      orderId: string,
      serviceLineId: string,
      serviceAddOnId: string,
    ): Promise<string> {
      return await client.post<string>(
        `/api/v1/merchant/pos/${businessId}/checkout/${orderId}/services/${serviceLineId}/add-ons`,
        { serviceAddOnId },
      )
    },

    // An add-on line is removed through the service-line route — it is a service item too.
    async removeOrderServiceAddOnLine(
      businessId: string,
      orderId: string,
      addOnLineId: string,
    ): Promise<boolean> {
      return await client.del<boolean>(
        `/api/v1/merchant/pos/${businessId}/checkout/${orderId}/services/${addOnLineId}`,
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

    // Sets or clears the discount on one service line. A null discountType clears it.
    async setOrderServiceLineDiscount(
      businessId: string,
      orderId: string,
      serviceLineId: string,
      payload: SetOrderServiceLineDiscountPayload,
    ): Promise<boolean> {
      return await client.put<boolean>(
        `/api/v1/merchant/pos/${businessId}/checkout/${orderId}/services/${serviceLineId}/discount`,
        payload,
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
