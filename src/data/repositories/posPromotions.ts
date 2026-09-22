/**
 * posPromotionsRepository — the salon's promotion catalog (POS All-Services Discount).
 * Contract: docs mirror `pos-promotion-studio-api.md` (Swagger live).
 * businessId is an explicit param on every call, same as posCheckoutRepository: a Staff caller may
 * be linked to more than one business, and the endpoints are gated per business server-side.
 */
import httpClient from '../../lib/httpClient'
import { PosServiceDiscountType } from '../../constants/posDiscount'
import { normalizeAllowedImageFile } from '../../utils/imageFile'
import type {
  PosPromotionApiDto,
  PosPromotionBannerApiDto,
  PosPromotionBannerPayload,
  PosPromotionDetailApiDto,
  PosPromotionPayload,
  PosPromotionStudioMetadataApiDto,
  PosPromotionTemplateApiDto,
} from '../../types/repositories'

type HttpClient = typeof httpClient

/** System.DayOfWeek order — 0 Sunday … 6 Saturday (matches studio API guide). */
const WEEK_DAYS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const

type WeekDay = (typeof WEEK_DAYS)[number]

const DAY_NAME_TO_INDEX: Record<string, number> = Object.fromEntries(
  WEEK_DAYS.map((day, index) => [day, index]),
)

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

/** API may return DayOfWeek as 0–6 or as English names — UI always uses names. */
function normalizeDay(value: unknown): WeekDay | null {
  if (typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 6) {
    return WEEK_DAYS[value]
  }
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (trimmed in DAY_NAME_TO_INDEX) return trimmed as WeekDay
    const asNum = Number(trimmed)
    if (Number.isInteger(asNum) && asNum >= 0 && asNum <= 6) return WEEK_DAYS[asNum]
  }
  return null
}

function readDays(raw: Record<string, unknown>): string[] {
  const value = raw.daysOfWeek ?? raw.DaysOfWeek
  if (!Array.isArray(value)) return []
  const days: string[] = []
  for (const item of value) {
    const day = normalizeDay(item)
    if (day && !days.includes(day)) days.push(day)
  }
  return days
}

/** API may return DiscountType as 0|1 or as Percent|Amount — UI always uses string enum. */
function normalizeDiscountType(value: unknown): string {
  if (value === 0 || value === '0' || value === PosServiceDiscountType.Percent) {
    return PosServiceDiscountType.Percent
  }
  if (value === 1 || value === '1' || value === PosServiceDiscountType.Amount) {
    return PosServiceDiscountType.Amount
  }
  return String(value ?? PosServiceDiscountType.Percent)
}

function discountTypeToApi(value: string): 0 | 1 {
  return value === PosServiceDiscountType.Amount ? 1 : 0
}

function dayNameToApi(day: string): number {
  return DAY_NAME_TO_INDEX[day] ?? 0
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
    discountType: normalizeDiscountType(raw.discountType ?? raw.DiscountType),
    discountValue: readNumber(raw, 'discountValue', 'DiscountValue'),
    daysOfWeek: readDays(raw),
    startTime: String(raw.startTime ?? raw.StartTime ?? ''),
    endTime: String(raw.endTime ?? raw.EndTime ?? ''),
    isActive: readBoolean(raw, 'isActive', readBoolean(raw, 'IsActive', false)),
    showOnOneQrHero: readBoolean(
      raw,
      'showOnOneQrHero',
      readBoolean(raw, 'ShowOnOneQrHero', false),
    ),
    submitToSearchDeals: readBoolean(
      raw,
      'submitToSearchDeals',
      readBoolean(raw, 'SubmitToSearchDeals', false),
    ),
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
    showOnOneQrHero: list.showOnOneQrHero,
    submitToSearchDeals: list.submitToSearchDeals,
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
    discountType: normalizeDiscountType(raw.discountType ?? raw.DiscountType),
    discountValue: readNumber(raw, 'discountValue', 'DiscountValue'),
    daysOfWeek: readDays(raw),
    startTime: String(raw.startTime ?? raw.StartTime ?? '').slice(0, 5),
    endTime: String(raw.endTime ?? raw.EndTime ?? '').slice(0, 5),
  }
}

/** Fetch a remote banner so create/duplicate can re-upload it as a new file. */
async function fileFromImageUrl(url: string): Promise<File> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to load promotion banner image (${response.status})`)
  }
  const blob = await response.blob()
  const pathName = url.split('?')[0] ?? url
  const extMatch = pathName.match(/\.([a-zA-Z0-9]+)$/)
  const ext = extMatch?.[1]?.toLowerCase() || 'jpg'
  const mime =
    blob.type ||
    (ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg')
  const raw = new File([blob], `banner.${ext === 'jpeg' ? 'jpeg' : ext}`, { type: mime })
  const normalized = normalizeAllowedImageFile(raw)
  if (!normalized) {
    throw new Error('Promotion banner image type is not supported')
  }
  return normalized
}

async function resolveBanners(
  banners: PosPromotionBannerPayload[],
  keepRemoteImages: boolean,
): Promise<Array<{ colorHex: string | null; image: File | null; imageUrl: string | null }>> {
  return Promise.all(
    banners.map(async (banner) => {
      if (banner.image) {
        const normalized = normalizeAllowedImageFile(banner.image)
        if (!normalized) {
          throw Object.assign(new Error('Promotion banner image type is not supported'), {
            errorCode: 'POS_PROMOTION_BANNER_IMAGE_INVALID_TYPE',
          })
        }
        return { colorHex: null, image: normalized, imageUrl: null }
      }
      if (banner.imageUrl) {
        if (keepRemoteImages) {
          // Update full-replace: keep the existing URL without re-download.
          return { colorHex: null, image: null, imageUrl: banner.imageUrl }
        }
        // Create/duplicate: re-upload so the new promotion owns its own file.
        return { colorHex: null, image: await fileFromImageUrl(banner.imageUrl), imageUrl: null }
      }
      const colorHex = banner.colorHex?.trim() || null
      return { colorHex, image: null, imageUrl: null }
    }),
  )
}

/**
 * Multipart body per studio API guide — PascalCase keys, DiscountType 0|1, DaysOfWeek 0–6.
 * Each banner sends exactly one of ColorHex / Image / ImageUrl (never more than one).
 */
async function buildFormData(
  payload: PosPromotionPayload,
  options: { keepRemoteImages?: boolean } = {},
): Promise<FormData> {
  const formData = new FormData()
  formData.append('Name', payload.name)
  if (payload.badgeLabel) formData.append('BadgeLabel', payload.badgeLabel)
  if (payload.description) formData.append('Description', payload.description)
  if (payload.templateCode) formData.append('TemplateCode', payload.templateCode)

  const resolved = await resolveBanners(payload.banners ?? [], Boolean(options.keepRemoteImages))
  const primaryImage =
    resolved.find((banner) => banner.image)?.image ??
    (payload.photo ? normalizeAllowedImageFile(payload.photo) : null)

  // Legacy Photo: used when Banners is empty OR as a safety net for cover-image create.
  if (primaryImage) {
    formData.append('Photo', primaryImage, primaryImage.name)
  }

  resolved.forEach((banner, index) => {
    if (banner.image) {
      // Explicit filename keeps ASP.NET ContentType + extension aligned with the File.
      formData.append(`Banners[${index}].Image`, banner.image, banner.image.name)
      return
    }
    if (banner.imageUrl) {
      formData.append(`Banners[${index}].ImageUrl`, banner.imageUrl)
      return
    }
    if (banner.colorHex) {
      formData.append(`Banners[${index}].ColorHex`, banner.colorHex)
    }
  })

  // If nested banner files were the only content and somehow produced an empty list, Photo alone
  // still creates one image banner via the create/update handlers.
  if (resolved.length === 0 && payload.photo && !primaryImage) {
    const photo = normalizeAllowedImageFile(payload.photo)
    if (photo) formData.append('Photo', photo, photo.name)
  }

  formData.append('DiscountType', String(discountTypeToApi(payload.discountType)))
  formData.append('DiscountValue', String(payload.discountValue))
  payload.daysOfWeek.forEach((day) => formData.append('DaysOfWeek', String(dayNameToApi(day))))
  formData.append('StartTime', payload.startTime)
  formData.append('EndTime', payload.endTime)
  formData.append('IsActive', String(payload.isActive))
  formData.append('ShowOnOneQrHero', String(Boolean(payload.showOnOneQrHero)))
  formData.append('SubmitToSearchDeals', String(Boolean(payload.submitToSearchDeals)))
  return formData
}

/** Build banner payloads for a full-replace update from list/detail primary fields. */
export function bannersPayloadFromPromotion(
  promotion: Partial<
    Pick<PosPromotionApiDto, 'primaryBannerColorHex' | 'primaryBannerImageUrl' | 'photoUrl'>
  > & { banners?: PosPromotionBannerApiDto[] },
): PosPromotionBannerPayload[] {
  if (promotion.banners && promotion.banners.length > 0) {
    return [...promotion.banners]
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((banner) =>
        banner.imageUrl
          ? { colorHex: null, image: null, imageUrl: banner.imageUrl }
          : { colorHex: banner.colorHex ?? null, image: null },
      )
  }

  const imageUrl = promotion.primaryBannerImageUrl || promotion.photoUrl || null
  if (imageUrl) return [{ colorHex: null, image: null, imageUrl }]
  if (promotion.primaryBannerColorHex) {
    return [{ colorHex: promotion.primaryBannerColorHex, image: null }]
  }
  return []
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
        await buildFormData(payload, { keepRemoteImages: false }),
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
        await buildFormData(payload, { keepRemoteImages: true }),
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
