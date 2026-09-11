/**
 * posPromotionsRepository — the salon's promotion catalog (POS All-Services Discount).
 * businessId is an explicit param on every call, same as posCheckoutRepository: a Staff caller may
 * be linked to more than one business, and the endpoints are gated per business server-side.
 */
import httpClient from '../../lib/httpClient'
import type { PosPromotionApiDto, PosPromotionPayload } from '../../types/repositories'

type HttpClient = typeof httpClient

function buildFormData(payload: PosPromotionPayload): FormData {
  const formData = new FormData()
  formData.append('name', payload.name)
  if (payload.badgeLabel) formData.append('badgeLabel', payload.badgeLabel)
  if (payload.description) formData.append('description', payload.description)
  if (payload.photo) formData.append('photo', payload.photo)
  formData.append('discountType', payload.discountType)
  formData.append('discountValue', String(payload.discountValue))
  payload.daysOfWeek.forEach((day) => formData.append('daysOfWeek', day))
  formData.append('startTime', payload.startTime)
  formData.append('endTime', payload.endTime)
  formData.append('isActive', String(payload.isActive))
  return formData
}

export function createPosPromotionsRepository(client: HttpClient = httpClient) {
  return {
    // Includes inactive offers: deactivating is how an offer is retired, so the Owner still needs
    // to find it here to bring it back.
    async getPosPromotions(businessId: string): Promise<PosPromotionApiDto[]> {
      const res = await client.get<PosPromotionApiDto[]>(`/api/v1/merchant/pos/${businessId}/promotions`)
      return res ?? []
    },

    async createPosPromotion(businessId: string, payload: PosPromotionPayload): Promise<string> {
      return await client.upload<string>(
        `/api/v1/merchant/pos/${businessId}/promotions`,
        buildFormData(payload),
        'POST',
      )
    },

    async updatePosPromotion(
      businessId: string,
      promotionId: string,
      payload: PosPromotionPayload,
    ): Promise<boolean> {
      return await client.upload<boolean>(
        `/api/v1/merchant/pos/${businessId}/promotions/${promotionId}`,
        buildFormData(payload),
        'PUT',
      )
    },

    // Refused by the backend once a visit has used the offer — deactivate it instead.
    async deletePosPromotion(businessId: string, promotionId: string): Promise<boolean> {
      return await client.del<boolean>(`/api/v1/merchant/pos/${businessId}/promotions/${promotionId}`)
    },
  }
}

export const posPromotionsRepository = createPosPromotionsRepository()
export default posPromotionsRepository
