// Merchant Site Repository — US-107
// Interacts with /api/v1/merchant/site endpoints with fallback local persistence for offline / pre-BE.
import {
  DEFAULT_MERCHANT_SITE,
  MerchantSitePaletteId,
  MerchantSiteStatus,
  MerchantSiteTemplateId,
} from '../../constants/merchantSiteStatus'
import type { MerchantSiteDto, SiteContentDto } from '../../constants/merchantSiteStatus'
import httpClient from '../../lib/httpClient'
import { logger } from '../../utils/logger'

const LOCAL_STORAGE_KEY = 'nexora_merchant_site_data'

export interface MerchantSiteIdentity {
  businessId: string
  businessName: string
  businessSlug: string
  phone: string
  address: string
}

export type StoredMerchantSiteDto = MerchantSiteDto & MerchantSiteIdentity

type MerchantSiteWithOptionalIdentity = MerchantSiteDto & Partial<MerchantSiteIdentity>

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isTemplateId(value: unknown): value is MerchantSiteTemplateId {
  return typeof value === 'string'
    && Object.values<string>(MerchantSiteTemplateId).includes(value)
}

function isPaletteId(value: unknown): value is MerchantSitePaletteId {
  return typeof value === 'string'
    && Object.values<string>(MerchantSitePaletteId).includes(value)
}

function isStatus(value: unknown): value is MerchantSiteStatus {
  return typeof value === 'string'
    && Object.values<string>(MerchantSiteStatus).includes(value)
}

function isSiteContent(value: unknown): value is SiteContentDto {
  return isRecord(value)
    && typeof value.taglineEn === 'string'
    && typeof value.taglineVi === 'string'
    && typeof value.aboutEn === 'string'
    && typeof value.aboutVi === 'string'
    && Array.isArray(value.galleryImageUrls)
    && Array.isArray(value.highlights)
    && Array.isArray(value.promotions)
}

function isMerchantSite(value: unknown): value is MerchantSiteDto {
  return isRecord(value)
    && typeof value.businessId === 'string'
    && value.businessId.trim().length > 0
    && isTemplateId(value.templateId)
    && isPaletteId(value.paletteId)
    && isStatus(value.status)
    && isSiteContent(value.content)
}

function normalizeIdentity(
  identity: Partial<MerchantSiteIdentity> | undefined,
  fallbackBusinessId = '',
): MerchantSiteIdentity | undefined {
  const businessName = identity?.businessName?.trim()
  const businessSlug = identity?.businessSlug?.trim()
  if (!businessName || !businessSlug) return undefined

  return {
    businessId: identity?.businessId?.trim() || fallbackBusinessId,
    businessName,
    businessSlug,
    phone: identity?.phone?.trim() || '',
    address: identity?.address?.trim() || '',
  }
}

function mergeIdentity(
  site: MerchantSiteWithOptionalIdentity,
  identity: Partial<MerchantSiteIdentity> | undefined,
): MerchantSiteWithOptionalIdentity {
  const normalizedIdentity = normalizeIdentity(identity, site.businessId)
  return normalizedIdentity ? { ...site, ...normalizedIdentity } : site
}

function isStoredMerchantSite(value: unknown): value is StoredMerchantSiteDto {
  return isMerchantSite(value) && normalizeIdentity(value, value.businessId) !== undefined
}

function storageKey(businessSlug: string): string {
  return `${LOCAL_STORAGE_KEY}_${businessSlug}`
}

function loadFromLocal(businessSlug: string): MerchantSiteWithOptionalIdentity {
  const normalizedSlug = businessSlug.trim()
  if (!normalizedSlug) return { ...DEFAULT_MERCHANT_SITE }

  try {
    const raw = localStorage.getItem(storageKey(normalizedSlug))
    if (raw) {
      const parsed: unknown = JSON.parse(raw)
      if (isStoredMerchantSite(parsed) && parsed.businessSlug === normalizedSlug) {
        return parsed
      }
    }
  } catch (error) {
    logger.warn('[MerchantSiteRepository] Failed to read from localStorage:', error)
  }

  return { ...DEFAULT_MERCHANT_SITE }
}

function saveToLocal(businessSlug: string, site: MerchantSiteWithOptionalIdentity): void {
  const normalizedSlug = businessSlug.trim()
  if (!normalizedSlug || !isStoredMerchantSite(site) || site.businessSlug !== normalizedSlug) {
    return
  }

  try {
    localStorage.setItem(storageKey(normalizedSlug), JSON.stringify(site))
  } catch (error) {
    logger.warn('[MerchantSiteRepository] Failed to save to localStorage:', error)
  }
}

export interface UpdateMerchantSitePayload extends Partial<MerchantSiteIdentity> {
  templateId?: MerchantSiteTemplateId
  paletteId?: MerchantSitePaletteId
  customColor?: string
  content?: Partial<SiteContentDto>
}

export const merchantSiteRepository = {
  async getMerchantSite(
    businessSlug: string = '',
    identity?: MerchantSiteIdentity,
  ): Promise<MerchantSiteDto> {
    const localSite = loadFromLocal(businessSlug)
    const knownIdentity = normalizeIdentity(identity, localSite.businessId)
      ?? normalizeIdentity(localSite, localSite.businessId)

    try {
      const response = await httpClient.get<MerchantSiteDto>('/api/v1/merchant/site')
      if (isMerchantSite(response)) {
        const site = mergeIdentity(response, knownIdentity)
        saveToLocal(businessSlug, site)
        return site
      }
      logger.warn('[MerchantSiteRepository] API returned an invalid site, using local store.')
    } catch (error) {
      // Graceful fallback for pre-BE integration / offline mode
      logger.info('[MerchantSiteRepository] API unavailable, using local store.', error)
    }

    const site = mergeIdentity(localSite, knownIdentity)
    saveToLocal(businessSlug, site)
    return site
  },

  async updateMerchantSite(
    businessSlug: string = '',
    payload: UpdateMerchantSitePayload,
  ): Promise<MerchantSiteDto> {
    const current = loadFromLocal(businessSlug)
    const updated = mergeIdentity({
      ...current,
      templateId: payload.templateId ?? current.templateId,
      paletteId: payload.paletteId ?? current.paletteId,
      customColor: payload.customColor !== undefined ? payload.customColor : current.customColor,
      content: {
        ...current.content,
        ...(payload.content ?? {}),
      },
    }, payload)

    // Content edits are cached before the request so a failed sync cannot discard typed work.
    saveToLocal(businessSlug, updated)
    await httpClient.put('/api/v1/merchant/site', {
      templateId: updated.templateId,
      paletteId: updated.paletteId,
      customColor: updated.customColor,
      content: updated.content,
    })
    return updated
  },

  async updateMerchantSiteStatus(
    businessSlug: string = '',
    status: MerchantSiteStatus,
    identity?: MerchantSiteIdentity,
  ): Promise<MerchantSiteDto> {
    const current = loadFromLocal(businessSlug)
    const updated = mergeIdentity({
      ...current,
      status,
      publishedAt: status === MerchantSiteStatus.Published
        ? new Date().toISOString()
        : current.publishedAt,
    }, identity)

    // A status is authoritative only after the backend accepts it.
    await httpClient.put('/api/v1/merchant/site/status', { status })
    saveToLocal(businessSlug, updated)
    return updated
  },
}
