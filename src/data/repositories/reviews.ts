/**
 * reviewsRepository — API-only implementation.
 */

import httpClient from '../../lib/httpClient'
import { isApiError } from '../../types/domain'
import { formatJoinedDate } from '../../utils/localDate'
import type { ReviewRecord } from '../../types/domain'
import type {
  DashboardReviewApiDto,
  DashboardReviewsPage,
  DashboardReviewsQuery,
} from '../../types/repositories'

type HttpClient = typeof httpClient

interface ReviewsListApiResponse {
  items?: DashboardReviewApiDto[]
  pageNumber?: number
  totalPages?: number
  totalCount?: number
  hasPreviousPage?: boolean
  hasNextPage?: boolean
}

function toReviewsDateParams(query: DashboardReviewsQuery = {}) {
  const startDate = query.startDate || query.dateFrom
  const endDate = query.endDate || query.dateTo
  if (!startDate || !endDate) return {}

  return {
    DateFrom: `${startDate}T00:00:00.000Z`,
    DateTo: `${endDate}T23:59:59.999Z`,
  }
}

function toReviewsQueryParams(query: DashboardReviewsQuery = {}) {
  const pageNumber = query.pageNumber ?? 1
  const pageSize = query.pageSize ?? 20

  return {
    ...toReviewsDateParams(query),
    ...(query.routingType ? { RoutingType: query.routingType } : {}),
    PageNumber: pageNumber,
    PageSize: pageSize,
  }
}

function deriveReviewCategory(item: DashboardReviewApiDto): string {
  if (item.googleClickedAt) return 'google'
  if (item.yelpClickedAt) return 'yelp'

  const routing = String(item.routingType ?? '').toLowerCase()
  if (routing === 'private') return 'private'
  if (routing === 'public') return 'public'
  if (routing === 'skipped') return 'skipped'

  return 'internal'
}

function mapReviewDto(item: DashboardReviewApiDto): ReviewRecord {
  const createdAt = item.createdAt ?? ''

  return {
    id: item.id ?? '',
    rating: item.rating ?? 0,
    comment: item.comment ?? '',
    staffName: item.staffName ?? '',
    touchPointName: item.touchPointName ?? '',
    routingType: item.routingType,
    category: deriveReviewCategory(item),
    date: createdAt ? formatJoinedDate(createdAt) : '',
    createdAt,
    isResolved: item.isResolved ?? false,
    customerEmail: item.customerEmail ?? '',
    customerName: item.customerName ?? '',
    googleClickedAt: item.googleClickedAt ?? null,
    yelpClickedAt: item.yelpClickedAt ?? null,
  }
}

function unwrapReviewsListResponse(
  response: DashboardReviewApiDto[] | ReviewsListApiResponse | { data?: unknown } | null | undefined,
): ReviewsListApiResponse {
  if (!response) return { items: [] }
  if (Array.isArray(response)) return { items: response }
  if (Array.isArray(response.items)) return response

  const nested = response.data
  if (Array.isArray(nested)) return { items: nested }
  if (nested && typeof nested === 'object' && Array.isArray((nested as ReviewsListApiResponse).items)) {
    return nested as ReviewsListApiResponse
  }

  return { items: [] }
}

function normalizeReviewsPage(
  response: DashboardReviewApiDto[] | ReviewsListApiResponse | { data?: unknown } | null | undefined,
  pageNumber: number,
): DashboardReviewsPage {
  const unwrapped = unwrapReviewsListResponse(response)
  const items = (unwrapped.items ?? []).map(mapReviewDto)

  return {
    items,
    pageNumber: unwrapped.pageNumber ?? pageNumber,
    totalPages: unwrapped.totalPages ?? 1,
    totalCount: unwrapped.totalCount ?? items.length,
    hasPreviousPage: unwrapped.hasPreviousPage ?? false,
    hasNextPage: unwrapped.hasNextPage ?? false,
  }
}

export function createReviewsRepository(client: HttpClient = httpClient) {
  return {
    async listPaged(query: DashboardReviewsQuery = {}): Promise<DashboardReviewsPage> {
      const pageNumber = query.pageNumber ?? 1

      try {
        const response = await client.get<DashboardReviewApiDto[] | ReviewsListApiResponse>(
          '/api/v1/merchant/dashboard/reviews',
          { params: toReviewsQueryParams(query) },
        )
        return normalizeReviewsPage(response, pageNumber)
      } catch (err: unknown) {
        if (isApiError(err) && (err.status === 404 || err.status === 403)) {
          return {
            items: [],
            pageNumber,
            totalPages: 0,
            totalCount: 0,
            hasPreviousPage: false,
            hasNextPage: false,
          }
        }
        throw err
      }
    },

    async list(query: DashboardReviewsQuery = {}): Promise<ReviewRecord[]> {
      const page = await this.listPaged(query)
      return page.items
    },

    async resolve(id: string, dto: LooseObject = {}): Promise<LooseObject> {
      return client.put<LooseObject>(`/api/v1/merchant/dashboard/reviews/${id}/resolve`, dto)
    },

    async add(review: ReviewRecord): Promise<ReviewRecord> {
      return review
    },

    async update(_id: string, _patch: LooseObject): Promise<void> {
      // deprecated
    },
  }
}

export const reviewsRepository = createReviewsRepository()
export default reviewsRepository
