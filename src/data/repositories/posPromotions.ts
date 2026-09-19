/**
 * posPromotionsRepository — the salon's promotion catalog (POS All-Services Discount).
 * businessId is an explicit param on every call, same as posCheckoutRepository: a Staff caller may
 * be linked to more than one business, and the endpoints are gated per business server-side.
 */
import httpClient from '../../lib/httpClient'
import type {
  PosPromotionApiDto,
  PosPromotionBannerApiDto,
  PosPromotionDetailApiDto,
  PosPromotionPayload,
  PosPromotionStudioMetadataApiDto,
  PosPromotionTemplateApiDto,
} from '../../types/repositories'

type HttpClient = typeof httpClient

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {}
}

function readString(raw: Record<string, unknown>, ...keys: string[]): string | null {
  for (const key of keys) {
    const value = raw[key]
    if (typeof value === 'string' && value.trim()) return value
  }
  return null
}

function readBoolean(raw: Record<string, unknown>, key: string, fallback: boolean): boolean {
  const value = raw[key]
  return typeof value === 'boolean' ? value : fallback
}

function readNumber(raw: Record<string, unknown>, ...keys: string[]): number {
  for (const key of keys) {
    const value = raw[key]
    const n = typeof value === 'number' ? value : Number(value)
    if (Number.isFinite(n)) return n
  }
  return 0
}

function readDays(raw: Record<string, unknown>): string[] {
  const value = raw.daysOfWeek ?? raw.DaysOfWeek
  return Array.isArray(value) ? value.map(String) : []
}

function normalizeBanner(value: unknown, index: number): PosPromotionBannerApiDto {
  const raw = asRecord(value)
  return {
    colorHex: readString(raw, 'colorHex', 'ColorHex'),
    imageUrl: readString(raw, 'imageUrl', 'ImageUrl'),
    sortOrder: readNumber(raw, 'sortOrder', 'SortOrder') || index,
  }
}

export function normalizePosPromotion(value: unknown): PosPromotionApiDto {
  const raw = asRecord(value)
  const primaryBannerImageUrl = readString(
    raw,
    'primaryBannerImageUrl',
    'PrimaryBannerImageUrl',
    'photoUrl',
    'PhotoUrl',
  )
  return {
    id: String(raw.id ?? raw.Id ?? ''),
    name: String(raw.name ?? raw.Name ?? ''),
    badgeLabel: readString(raw, 'badgeLabel', 'BadgeLabel'),
    description: readString(raw, 'description', 'Description'),
    templateCode: readString(raw, 'templateCode', 'TemplateCode'),
    primaryBannerColorHex: readString(raw, 'primaryBannerColorHex', 'PrimaryBannerColorHex'),
    primaryBannerImageUrl,
    photoUrl: readString(raw, 'photoUrl', 'PhotoUrl') ?? primaryBannerImageUrl,
    discountType: String(raw.discountType ?? raw.DiscountType ?? ''),
    discountValue: readNumber(raw, 'discountValue', 'DiscountValue'),
    daysOfWeek: readDays(raw),
    startTime: String(raw.startTime ?? raw.StartTime ?? ''),
    endTime: String(raw.endTime ?? raw.EndTime ?? ''),
    isActive: readBoolean(raw, 'isActive', readBoolean(raw, 'IsActive', false)),
    canDelete: readBoolean(raw, 'canDelete', readBoolean(raw, 'CanDelete', false)),
  }
}

export function normalizePosPromotionDetail(value: unknown): PosPromotionDetailApiDto {
  const list = normalizePosPromotion(value)
  const raw = asRecord(value)
  const bannersRaw = raw.banners ?? raw.Banners
  const banners = Array.isArray(bannersRaw)
    ? bannersRaw.map((banner, index) => normalizeBanner(banner, index))
    : []

  return {
    id: list.id,
    name: list.name,
    badgeLabel: list.badgeLabel,
    description: list.description,
    templateCode: list.templateCode,
    discountType: list.discountType,
    discountValue: list.discountValue,
    daysOfWeek: list.daysOfWeek,
    startTime: list.startTime,
    endTime: list.endTime,
    isActive: list.isActive,
    canDelete: list.canDelete,
    banners,
  }
}

function normalizeTemplate(value: unknown): PosPromotionTemplateApiDto {
  const raw = asRecord(value)
  return {
    code: String(raw.code ?? raw.Code ?? ''),
    name: String(raw.name ?? raw.Name ?? ''),
    badgeLabel: String(raw.badgeLabel ?? raw.BadgeLabel ?? ''),
    description: String(raw.description ?? raw.Description ?? ''),
    discountType: String(raw.discountType ?? raw.DiscountType ?? ''),
    discountValue: readNumber(raw, 'discountValue', 'DiscountValue'),
    daysOfWeek: readDays(raw),
    startTime: String(raw.startTime ?? raw.StartTime ?? '').slice(0, 5),
    endTime: String(raw.endTime ?? raw.EndTime ?? '').slice(0, 5),
  }
}

function buildFormData(payload: PosPromotionPayload): FormData {
  const formData = new FormData()
  formData.append('name', payload.name)
  if (payload.badgeLabel) formData.append('badgeLabel', payload.badgeLabel)
  if (payload.description) formData.append('description', payload.description)
  if (payload.templateCode) formData.append('templateCode', payload.templateCode)
  if (payload.photo) formData.append('photo', payload.photo)

  const banners = payload.banners ?? []

  banners.forEach((banner, index) => {
    if (banner.colorHex) {
      formData.append(`banners[${index}].colorHex`, banner.colorHex)
    }
    if (banner.image) {
      formData.append(`banners[${index}].image`, banner.image)
    }
  })

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
      const res = await client.get<unknown[]>(`/api/v1/merchant/pos/${businessId}/promotions`)
      return (res ?? []).map(normalizePosPromotion)
    },

    async getPosPromotion(
      businessId: string,
      promotionId: string,
    ): Promise<PosPromotionDetailApiDto> {
      const res = await client.get<unknown>(
        `/api/v1/merchant/pos/${businessId}/promotions/${promotionId}`,
      )
      return normalizePosPromotionDetail(res)
    },

    async getPosPromotionTemplates(): Promise<PosPromotionStudioMetadataApiDto> {
      const res = await client.get<unknown>('/api/v1/merchant/pos/promotion-templates')
      const raw = asRecord(res)
      const templatesRaw = raw.templates ?? raw.Templates
      return {
        templates: Array.isArray(templatesRaw) ? templatesRaw.map(normalizeTemplate) : [],
      }
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
