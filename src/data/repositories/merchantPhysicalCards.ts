/**
 * merchantPhysicalCardsRepository — list / link / unlink physical QR-NFC cards.
 */
import httpClient from '../../lib/httpClient'
import { isApiError } from '../../types/domain'
import type { PhysicalCardPage, PhysicalCardRecord, PhysicalCardDetail } from '../../types/domain'
import type {
  LinkPhysicalCardResult,
  PhysicalCardApiDto,
  PhysicalCardDetailApiDto,
  SendPhysicalCardSupportResult,
  UnlinkPhysicalCardResult,
} from '../../types/repositories'

type HttpClient = typeof httpClient

interface PhysicalCardQueryParams {
  PageNumber?: number
  PageSize?: number
}

const EMPTY_PAGE: PhysicalCardPage = {
  items: [],
  pageNumber: 1,
  totalPages: 0,
  totalCount: 0,
  hasNextPage: false,
  hasPreviousPage: false,
}

function readField<T>(dto: Record<string, unknown>, camel: string, pascal: string): T | undefined {
  return (dto[camel] ?? dto[pascal]) as T | undefined
}

function isLinkedTouchPointId(value: unknown): boolean {
  if (value == null || value === '') return false
  const id = String(value).trim()
  if (!id || id === '00000000-0000-0000-0000-000000000000') return false
  return true
}

function normalizePhysicalCard(dto: PhysicalCardApiDto): PhysicalCardRecord {
  const raw = dto as PhysicalCardApiDto & Record<string, unknown>
  return {
    id: readField<string>(raw, 'id', 'Id') ?? '',
    cardCode: readField<string>(raw, 'cardCode', 'CardCode') ?? '',
    helpCode: readField<string | null>(raw, 'helpCode', 'HelpCode') ?? null,
    linkedTouchPointId: readField<string | null>(raw, 'linkedTouchPointId', 'LinkedTouchPointId') ?? null,
    touchPointName: readField<string | null>(raw, 'touchPointName', 'TouchPointName') ?? null,
    linkedAt: readField<string | null>(raw, 'linkedAt', 'LinkedAt') ?? null,
  }
}

function normalizePhysicalCardPage(
  res: PhysicalCardPage | PhysicalCardApiDto[] | Record<string, unknown> | null | undefined,
): PhysicalCardPage {
  if (!res) return EMPTY_PAGE

  if (Array.isArray(res)) {
    const items = res.map((item) => normalizePhysicalCard(item as PhysicalCardApiDto))
    return {
      items,
      pageNumber: 1,
      totalPages: items.length > 0 ? 1 : 0,
      totalCount: items.length,
      hasNextPage: false,
      hasPreviousPage: false,
    }
  }

  const raw = res as PhysicalCardPage & Record<string, unknown>
  const nested = raw.data ?? raw.Data
  if (nested && typeof nested === 'object' && !Array.isArray(nested)) {
    return normalizePhysicalCardPage(nested as Record<string, unknown>)
  }

  const itemsSource = raw.items ?? raw.Items
  const items = (Array.isArray(itemsSource) ? itemsSource : []).map((item) =>
    normalizePhysicalCard(item as PhysicalCardApiDto),
  )

  return {
    items,
    pageNumber: readField<number>(raw, 'pageNumber', 'PageNumber') ?? 1,
    totalPages: readField<number>(raw, 'totalPages', 'TotalPages') ?? 0,
    totalCount: readField<number>(raw, 'totalCount', 'TotalCount') ?? items.length,
    hasNextPage: readField<boolean>(raw, 'hasNextPage', 'HasNextPage') ?? false,
    hasPreviousPage: readField<boolean>(raw, 'hasPreviousPage', 'HasPreviousPage') ?? false,
  }
}

function normalizePhysicalCardDetail(dto: PhysicalCardDetailApiDto): PhysicalCardDetail {
  return {
    id: dto.id ?? '',
    cardCode: dto.cardCode ?? '',
    helpCode: dto.helpCode ?? '',
    isActive: dto.isActive ?? false,
    linkedTouchPointId: dto.linkedTouchPointId ?? null,
    touchPointName: dto.touchPointName ?? null,
    touchPointUrl: dto.touchPointUrl ?? null,
    linkedAt: dto.linkedAt ?? null,
  }
}

export function createMerchantPhysicalCardsRepository(client: HttpClient = httpClient) {
  return {
    async getPhysicalCards(params: PhysicalCardQueryParams = {}): Promise<PhysicalCardPage> {
      const queryParams = new URLSearchParams()
      if (params.PageNumber) queryParams.append('PageNumber', String(params.PageNumber))
      if (params.PageSize) queryParams.append('PageSize', String(params.PageSize))

      const queryString = queryParams.toString()
      const url = `/api/v1/merchant/physical-cards${queryString ? `?${queryString}` : ''}`

      try {
        const res = await client.get<PhysicalCardPage | PhysicalCardApiDto[]>(url)
        return normalizePhysicalCardPage(res)
      } catch (err: unknown) {
        if (isApiError(err) && err.status === 404) {
          return EMPTY_PAGE
        }
        throw err
      }
    },

    async linkPhysicalCard(
      cardCode: string,
      touchPointId: string,
    ): Promise<LinkPhysicalCardResult> {
      return await client.post<LinkPhysicalCardResult>(
        `/api/v1/merchant/physical-cards/${encodeURIComponent(cardCode)}/link`,
        { touchPointId },
      )
    },

    async unlinkPhysicalCard(cardCode: string): Promise<UnlinkPhysicalCardResult> {
      return await client.post<UnlinkPhysicalCardResult>(
        `/api/v1/merchant/physical-cards/${encodeURIComponent(cardCode)}/unlink`,
      )
    },

    async getPhysicalCardDetail(
      helpCode: string,
      { anonymous = false }: { anonymous?: boolean } = {},
    ): Promise<PhysicalCardDetail> {
      const res = await client.get<PhysicalCardDetailApiDto>(
        `/api/v1/merchant/physical-cards/manage/${encodeURIComponent(helpCode)}`,
        anonymous ? { anonymous: true } : {},
      )
      return normalizePhysicalCardDetail(res)
    },

    async sendPhysicalCardSupport(
      helpCode: string,
      message: string,
      { anonymous = false }: { anonymous?: boolean } = {},
    ): Promise<SendPhysicalCardSupportResult> {
      return await client.post<SendPhysicalCardSupportResult>(
        `/api/v1/merchant/physical-cards/support/${encodeURIComponent(helpCode)}`,
        { message },
        anonymous ? { anonymous: true } : {},
      )
    },
  }
}

export const merchantPhysicalCardsRepository = createMerchantPhysicalCardsRepository()
export default merchantPhysicalCardsRepository
