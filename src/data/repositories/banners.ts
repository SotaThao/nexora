/**
 * bannersRepository — public active banners for homepage carousel.
 *
 * GET /api/v1/banners/active
 */

import httpClient from '../../lib/httpClient'
import type { Banner } from '../../types/domain'

interface BannerDto {
  id?: string
  title?: string
  webActionUrl?: string | null
  androidActionUrl?: string | null
  iosActionUrl?: string | null
  target?: string
  ordering?: number
  status?: string
  translations?: Array<{
    languageCode?: string
    webUrl?: string | null
    mobileUrl?: string | null
    tabletUrl?: string | null
  }>
}

function normalizeBanner(raw: BannerDto): Banner | null {
  const id = raw.id?.trim()
  const title = raw.title?.trim()
  if (!id || !title) return null

  const translations = Array.isArray(raw.translations)
    ? raw.translations
        .map((item) => {
          const languageCode = item.languageCode?.trim()
          if (!languageCode) return null
          return {
            languageCode,
            webUrl: item.webUrl?.trim() ?? null,
            mobileUrl: item.mobileUrl?.trim() ?? null,
            tabletUrl: item.tabletUrl?.trim() ?? null,
          }
        })
        .filter((item): item is NonNullable<typeof item> => item !== null)
    : []

  return {
    id,
    title,
    webActionUrl: raw.webActionUrl?.trim() ?? null,
    androidActionUrl: raw.androidActionUrl?.trim() ?? null,
    iosActionUrl: raw.iosActionUrl?.trim() ?? null,
    target: raw.target?.trim() ?? 'Redirect',
    ordering: typeof raw.ordering === 'number' ? raw.ordering : 0,
    status: raw.status?.trim() ?? '',
    translations,
  }
}

export function createBannersRepository(client = httpClient) {
  return {
    async listActive(): Promise<Banner[]> {
      const response = await client.get<BannerDto[]>('/api/v1/banners/active', {
        anonymous: true,
      })
      if (!Array.isArray(response)) return []
      return response
        .map(normalizeBanner)
        .filter((item): item is Banner => item !== null)
        .sort((a, b) => a.ordering - b.ordering)
    },
  }
}

const bannersRepository = createBannersRepository()
export default bannersRepository
