/**
 * posCheckoutRepository — POS Merchant Ops: Checkout (US-14 / US-025, refactored to
 * Order + multi-staff service lines + product lines + tip split in US-026).
 * businessId is an explicit param on every call, same as posOrdersRepository/
 * posTurnBoardRepository — a Staff caller may be linked to more than one business.
 */
import httpClient from '../../lib/httpClient'
import type { PosCheckoutPaymentMethodType } from '../../constants/posCheckoutPaymentMethod'
import { unlessOptimisticId } from '../../utils/uuid'
import type {
  AddOrderCustomServiceLinePayload,
  CheckoutProductCatalogItemApiDto,
  CheckoutServiceCatalogItemApiDto,
  CompleteOrderPayload,
  CompleteOrderResultApiDto,
  EligiblePromotionApiDto,
  InServiceOrderApiDto,
  OrderDetailApiDto,
  ServiceLineAddOnOptionApiDto,
  SetOrderDiscountPayload,
  SetOrderServiceLineDiscountPayload,
  SetOrderPaymentAllocationsPayload,
  SetOrderStaffTipSplitPayload,
  UpdateOrderServiceLineTarget,
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

    // A service the menu does not carry, typed at the counter. Never written back to the catalog.
    async addOrderCustomServiceLine(
      businessId: string,
      orderId: string,
      payload: AddOrderCustomServiceLinePayload,
    ): Promise<string> {
      return await client.post<string>(
        `/api/v1/merchant/pos/${businessId}/checkout/${orderId}/custom-services`,
        payload,
      )
    },

    // Retargets a line, keeping its technician, note and position. Exactly one target: a catalog
    // service id, or a custom name + price — the backend rejects both or neither.
    async updateOrderServiceLine(
      businessId: string,
      orderId: string,
      serviceLineId: string,
      target: UpdateOrderServiceLineTarget,
    ): Promise<boolean> {
      return unlessOptimisticId(
        serviceLineId,
        () =>
          client.put<boolean>(
            `/api/v1/merchant/pos/${businessId}/checkout/${orderId}/services/${serviceLineId}`,
            target,
          ),
        false,
      )
    },

    async removeOrderServiceLine(businessId: string, orderId: string, serviceLineId: string): Promise<boolean> {
      return unlessOptimisticId(
        serviceLineId,
        () =>
          client.del<boolean>(
            `/api/v1/merchant/pos/${businessId}/checkout/${orderId}/services/${serviceLineId}`,
          ),
        false,
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
      return unlessOptimisticId(
        productLineId,
        () =>
          client.del<boolean>(
            `/api/v1/merchant/pos/${businessId}/checkout/${orderId}/products/${productLineId}`,
          ),
        false,
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
      return unlessOptimisticId(
        productLineId,
        () =>
          client.put<boolean>(
            `/api/v1/merchant/pos/${businessId}/checkout/${orderId}/products/${productLineId}/quantity`,
            { quantity },
          ),
        false,
      )
    },

    // Sets or clears the discount on one service line. A null discountType clears it.
    async setOrderServiceLineDiscount(
      businessId: string,
      orderId: string,
      serviceLineId: string,
      payload: SetOrderServiceLineDiscountPayload,
    ): Promise<boolean> {
      return unlessOptimisticId(
        serviceLineId,
        () =>
          client.put<boolean>(
            `/api/v1/merchant/pos/${businessId}/checkout/${orderId}/services/${serviceLineId}/discount`,
            payload,
          ),
        false,
      )
    },

    // Sets, replaces or clears the one order-level discount on this visit.
    async setOrderDiscount(
      businessId: string,
      orderId: string,
      payload: SetOrderDiscountPayload,
    ): Promise<boolean> {
      return await client.put<boolean>(
        `/api/v1/merchant/pos/${businessId}/checkout/${orderId}/discount`,
        payload,
      )
    },

    // Only the offers THIS visit qualifies for, judged on its check-in time.
    async getEligiblePromotions(businessId: string, orderId: string): Promise<EligiblePromotionApiDto[]> {
      const res = await client.get<EligiblePromotionApiDto[]>(
        `/api/v1/merchant/pos/${businessId}/checkout/${orderId}/eligible-promotions`,
      )
      return res ?? []
    },

    async setOrderTip(businessId: string, orderId: string, tipAmount: number): Promise<boolean> {
      return await client.put<boolean>(
        `/api/v1/merchant/pos/${businessId}/checkout/${orderId}/tip`,
        { tipAmount },
      )
    },

    async setOrderPaymentMethod(
      businessId: string,
      orderId: string,
      paymentMethodType: PosCheckoutPaymentMethodType,
    ): Promise<boolean> {
      return await client.put<boolean>(
        `/api/v1/merchant/pos/${businessId}/checkout/${orderId}/payment-method`,
        { paymentMethodType },
      )
    },

    async setOrderNote(businessId: string, orderId: string, note: string | null): Promise<boolean> {
      return await client.put<boolean>(
        `/api/v1/merchant/pos/${businessId}/checkout/${orderId}/note`,
        { note },
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

    async setOrderPaymentAllocations(
      businessId: string,
      orderId: string,
      payload: SetOrderPaymentAllocationsPayload,
    ): Promise<boolean> {
      return await client.put<boolean>(
        `/api/v1/merchant/pos/${businessId}/checkout/${orderId}/payment-allocations`,
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
