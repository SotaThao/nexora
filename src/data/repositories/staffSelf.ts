/**
 * staffSelfRepository — staff-side self-service endpoints.
 */

import httpClient from '../../lib/httpClient'
import { normalizeTipStatus } from '../../constants/tipStatus'
import { isApiError } from '../../types/domain'
import type {
  StaffBusinessLink,
  StaffDashboardStatistics,
  StaffDashboardSummary,
  StaffProfile,
  StaffReviewDistribution,
  StaffReviewItem,
  StaffReviewsPage,
  StaffReviewsSummary,
  StaffLinkRequestDetail,
  StaffTipItem,
  StaffTipsConfirmReceiptResult,
  StaffTipsPage,
  TipCountAmount,
  TransactionRecord,
} from '../../types/domain'
import type { TransactionsListPage, TransactionsListQuery } from './transactions'
import type { StaffLinkRequestDetailApiDto } from '../../types/repositories'

type HttpClient = typeof httpClient

interface StaffBusinessApiDto {
  businessId?: string
  businessName?: string
  address?: string | null
  city?: string | null
  state?: string | null
  logoUrl?: string | null
  role?: string | null
  roleLabel?: string | null
  roleAtBusiness?: string | null
  linkStatus?: string | null
  linkStatusLabel?: string | null
  linkedAt?: string | null
  businessSlug?: string | null
  touchPointSlug?: string | null
  masterTouchPointSlug?: string | null
  tipUrl?: string | null
  url?: string | null
  qrImageUrl?: string | null
  touchPoints?: StaffBusinessTouchPointApiDto[] | null
}

interface StaffBusinessTouchPointApiDto {
  id?: string
  name?: string
  slug?: string | null
  type?: number | string | null
  typeLabel?: string | null
  url?: string | null
  qrImageUrl?: string | null
  isActive?: boolean | null
}

function pickPreferredTouchPoint(
  touchPoints?: StaffBusinessTouchPointApiDto[] | null,
): StaffBusinessTouchPointApiDto | null {
  if (!Array.isArray(touchPoints) || touchPoints.length === 0) return null

  const active = touchPoints.find(
    (tp) => tp?.isActive && (Boolean(tp?.slug?.trim()) || Boolean(tp?.url?.trim())),
  )
  if (active) return active

  return (
    touchPoints.find((tp) => Boolean(tp?.slug?.trim()) || Boolean(tp?.url?.trim())) || touchPoints[0]
  )
}

function normalizeStaffBusinessLink(b: StaffBusinessApiDto): StaffBusinessLink {
  const preferredTouchPoint = pickPreferredTouchPoint(b.touchPoints)
  const touchPointSlug =
    b.touchPointSlug ??
    b.masterTouchPointSlug ??
    preferredTouchPoint?.slug ??
    null
  const tipUrl = b.tipUrl ?? b.url ?? preferredTouchPoint?.url ?? null
  const qrImageUrl = b.qrImageUrl ?? preferredTouchPoint?.qrImageUrl ?? null
  const touchPointsMissing =
    Array.isArray(b.touchPoints) &&
    b.touchPoints.length === 0 &&
    !touchPointSlug?.trim() &&
    !tipUrl?.trim()

  return {
    businessId: b.businessId ?? '',
    businessName: b.businessName ?? '',
    address: b.address ?? null,
    city: b.city ?? null,
    state: b.state ?? null,
    logoUrl: b.logoUrl ?? null,
    role: b.role ?? null,
    roleLabel: b.roleLabel ?? null,
    roleAtBusiness: b.roleAtBusiness ?? null,
    linkStatus: b.linkStatus ?? null,
    linkStatusLabel: b.linkStatusLabel ?? null,
    linkedAt: b.linkedAt ?? null,
    businessSlug: b.businessSlug ?? null,
    touchPointSlug,
    masterTouchPointSlug: b.masterTouchPointSlug ?? touchPointSlug,
    tipUrl,
    qrImageUrl,
    touchPointsMissing,
  }
}

interface StaffBusinessesResponse {
  items?: StaffBusinessApiDto[]
}

interface TipCountAmountApiDto {
  count?: number
  totalAmount?: number
}

interface StaffDashboardSummaryApiDto {
  todayTips?: TipCountAmountApiDto
  thisMonthTips?: TipCountAmountApiDto
  pendingTips?: TipCountAmountApiDto
  averageRating?: number
  totalReviews?: number
}

function normalizeTipCountAmount(dto?: TipCountAmountApiDto | null): TipCountAmount {
  return {
    count: Number(dto?.count) || 0,
    totalAmount: Number(dto?.totalAmount) || 0,
  }
}

function normalizeDashboardSummary(dto: StaffDashboardSummaryApiDto): StaffDashboardSummary {
  return {
    todayTips: normalizeTipCountAmount(dto.todayTips),
    thisMonthTips: normalizeTipCountAmount(dto.thisMonthTips),
    pendingTips: normalizeTipCountAmount(dto.pendingTips),
    averageRating: Number(dto.averageRating) || 0,
    totalReviews: Number(dto.totalReviews) || 0,
  }
}

interface StatisticsOverviewCategoryApiDto {
  category?: string
  amount?: number
  percentageOfTotal?: number
}

interface StatisticsOverviewApiDto {
  availableBalance?: number
  pending?: number
  lifetimeEarnings?: number
  categories?: StatisticsOverviewCategoryApiDto[]
}

function normalizeStaffDashboardStatistics(dto: StatisticsOverviewApiDto): StaffDashboardStatistics {
  return {
    availableBalance: Number(dto.availableBalance) || 0,
    pending: Number(dto.pending) || 0,
    lifetimeEarnings: Number(dto.lifetimeEarnings) || 0,
    categories: Array.isArray(dto.categories)
      ? dto.categories.map((c) => ({
          category: c.category ?? '',
          amount: Number(c.amount) || 0,
          percentageOfTotal: Number(c.percentageOfTotal) || 0,
        }))
      : [],
  }
}

interface StaffReviewDistributionApiDto {
  star1?: number
  star2?: number
  star3?: number
  star4?: number
  star5?: number
}

interface StaffReviewsSummaryApiDto {
  totalReviews?: number
  averageRating?: number
  distribution?: StaffReviewDistributionApiDto
}

interface StaffReviewItemApiDto {
  id?: string
  rating?: number
  comment?: string | null
  customerName?: string | null
  businessName?: string | null
  createdAt?: string | null
}

interface StaffReviewsPageApiDto {
  summary?: StaffReviewsSummaryApiDto
  items?: StaffReviewItemApiDto[]
  pageNumber?: number
  totalPages?: number
  totalCount?: number
}

function normalizeReviewDistribution(dto?: StaffReviewDistributionApiDto | null): StaffReviewDistribution {
  return {
    star1: Number(dto?.star1) || 0,
    star2: Number(dto?.star2) || 0,
    star3: Number(dto?.star3) || 0,
    star4: Number(dto?.star4) || 0,
    star5: Number(dto?.star5) || 0,
  }
}

function normalizeReviewsSummary(dto?: StaffReviewsSummaryApiDto | null): StaffReviewsSummary {
  return {
    totalReviews: Number(dto?.totalReviews) || 0,
    averageRating: Number(dto?.averageRating) || 0,
    distribution: normalizeReviewDistribution(dto?.distribution),
  }
}

function normalizeReviewItem(dto: StaffReviewItemApiDto): StaffReviewItem {
  return {
    id: dto.id ?? '',
    rating: Number(dto.rating) || 0,
    comment: dto.comment ?? null,
    customerName: dto.customerName ?? null,
    businessName: dto.businessName ?? null,
    createdAt: dto.createdAt ?? null,
  }
}

function normalizeReviewsPage(dto: StaffReviewsPageApiDto): StaffReviewsPage {
  return {
    summary: normalizeReviewsSummary(dto.summary),
    items: Array.isArray(dto.items) ? dto.items.map(normalizeReviewItem) : [],
    pageNumber: Number(dto.pageNumber) || 1,
    totalPages: Number(dto.totalPages) || 0,
    totalCount: Number(dto.totalCount) || 0,
  }
}

interface StaffTipItemApiDto {
  id?: string
  amount?: number
  totalAmount?: number
  status?: string
  statusLabel?: string | null
  paymentMethod?: string | null
  isMultiStaff?: boolean
  touchPointName?: string | null
  businessName?: string | null
  createdAt?: string | null
  confirmedAt?: string | null
  staffConfirmedAt?: string | null
  merchantConfirmedAt?: string | null
}

interface StaffTipsPageApiDto {
  items?: StaffTipItemApiDto[]
  pageNumber?: number
  totalPages?: number
  totalCount?: number
  hasPreviousPage?: boolean
  hasNextPage?: boolean
}

export interface StaffTipsListParams {
  pageNumber?: number
  pageSize?: number
  dateFrom?: string
  dateTo?: string
  status?: string
  paymentMethod?: string
  touchPointId?: string
  staffSearch?: string
}

function staffTipToTransactionRecord(
  tip: StaffTipItem,
  staffDisplayName = '',
): TransactionRecord {
  return {
    id: tip.id,
    amount: tip.amount > 0 ? tip.amount : tip.totalAmount,
    status: tip.status,
    statusLabel: tip.statusLabel,
    paymentMethod: tip.paymentMethod ?? '',
    staffName: staffDisplayName,
    touchpoint: tip.touchPointName ?? '',
    dateTime: tip.createdAt ?? '',
    confirmedAt: tip.confirmedAt,
    staffConfirmedAt: tip.staffConfirmedAt,
    merchantConfirmedAt: tip.merchantConfirmedAt,
    isMultiStaff: tip.isMultiStaff,
    businessName: tip.businessName ?? '',
    tipItems: [],
  }
}

function buildStaffTipsParams(query: StaffTipsListParams = {}) {
  const params: Record<string, string | number> = {}
  if (query.pageNumber != null) params.PageNumber = query.pageNumber
  if (query.pageSize != null) params.PageSize = query.pageSize
  if (query.dateFrom) params.DateFrom = query.dateFrom
  if (query.dateTo) params.DateTo = query.dateTo
  if (query.status) params.Status = query.status
  if (query.paymentMethod) params.PaymentMethod = query.paymentMethod
  if (query.touchPointId) params.TouchPointId = query.touchPointId
  if (query.staffSearch) params.StaffSearch = query.staffSearch
  return params
}

function normalizeTipItem(dto: StaffTipItemApiDto): StaffTipItem {
  return {
    id: dto.id ?? '',
    amount: Number(dto.amount) || 0,
    totalAmount: Number(dto.totalAmount) || 0,
    status: normalizeTipStatus(dto.status),
    statusLabel: dto.statusLabel ?? null,
    paymentMethod: dto.paymentMethod ?? null,
    isMultiStaff: Boolean(dto.isMultiStaff),
    touchPointName: dto.touchPointName ?? null,
    businessName: dto.businessName ?? null,
    createdAt: dto.createdAt ?? null,
    confirmedAt: dto.confirmedAt ?? null,
    staffConfirmedAt: dto.staffConfirmedAt ?? null,
    merchantConfirmedAt: dto.merchantConfirmedAt ?? null,
  }
}

function normalizeTipsPage(dto: StaffTipsPageApiDto): StaffTipsPage {
  return {
    items: Array.isArray(dto.items) ? dto.items.map(normalizeTipItem) : [],
    pageNumber: Number(dto.pageNumber) || 1,
    totalPages: Number(dto.totalPages) || 0,
    totalCount: Number(dto.totalCount) || 0,
    hasPreviousPage: Boolean(dto.hasPreviousPage),
    hasNextPage: Boolean(dto.hasNextPage),
  }
}

export function normalizeStaffLinkRequestDetail(dto: StaffLinkRequestDetailApiDto): StaffLinkRequestDetail {
  return {
    id: dto.id ?? '',
    businessName: dto.businessName ?? '',
    businessLogoUrl: dto.businessLogoUrl ?? null,
    businessRole: dto.businessRole ?? null,
    requestedAt: dto.requestedAt ?? null,
    status: dto.status ?? null,
    roleAtBusiness: dto.roleAtBusiness ?? null,
  }
}

export function createStaffSelfRepository(client: HttpClient = httpClient) {
  return {
    async getMyProfile(): Promise<StaffProfile | null> {
      try {
        return await client.get<StaffProfile>('/api/v1/staff/profile')
      } catch (err: unknown) {
        if (isApiError(err) && err.status === 404) return null
        throw err
      }
    },

    async getMyBusinesses(): Promise<StaffBusinessLink[]> {
      const res = await client.get<StaffBusinessApiDto[] | StaffBusinessesResponse>('/api/v1/staff/businesses')
      const items = Array.isArray(res) ? res : (res?.items || [])
      return items.map(normalizeStaffBusinessLink)
    },

    async getDashboardSummary(): Promise<StaffDashboardSummary> {
      const res = await client.get<StaffDashboardSummaryApiDto>('/api/v1/staff/dashboard/summary')
      return normalizeDashboardSummary(res)
    },

    async getDashboardStatistics(): Promise<StaffDashboardStatistics> {
      const res = await client.get<StatisticsOverviewApiDto>('/api/v1/staff/dashboard/statistics')
      return normalizeStaffDashboardStatistics(res)
    },

    async getReviews({
      pageNumber = 1,
      pageSize = 20,
    }: { pageNumber?: number; pageSize?: number } = {}): Promise<StaffReviewsPage> {
      const res = await client.get<StaffReviewsPageApiDto>('/api/v1/staff/reviews', {
        params: { PageNumber: pageNumber, PageSize: pageSize },
      })
      return normalizeReviewsPage(res)
    },

    async getTips(params: StaffTipsListParams = {}): Promise<StaffTipsPage> {
      const res = await client.get<StaffTipsPageApiDto>('/api/v1/staff/tips', {
        params: buildStaffTipsParams({
          pageNumber: params.pageNumber ?? 1,
          pageSize: params.pageSize ?? 20,
          ...params,
        }),
      })
      return normalizeTipsPage(res)
    },

    async listTransactionsPaginated(
      query: TransactionsListQuery = {},
      staffDisplayName = '',
    ): Promise<TransactionsListPage> {
      const page = await this.getTips({
        pageNumber: query.pageNumber,
        pageSize: query.pageSize,
        dateFrom: query.dateFrom,
        dateTo: query.dateTo,
        status: query.status,
        paymentMethod: query.paymentMethod,
        touchPointId: query.touchPointId,
        staffSearch: query.staffSearch,
      })

      return {
        items: page.items.map((tip) => staffTipToTransactionRecord(tip, staffDisplayName)),
        pageNumber: page.pageNumber,
        totalPages: page.totalPages,
        totalCount: page.totalCount,
        hasNextPage: page.hasNextPage,
        hasPreviousPage: page.hasPreviousPage,
      }
    },

    async confirmTipsReceipt(
      tipIds: string[],
      options?: { isForce?: boolean },
    ): Promise<StaffTipsConfirmReceiptResult> {
      const body: { tipIds: string[]; isForce?: boolean } = { tipIds }
      if (options?.isForce) body.isForce = true
      const res = await client.post<StaffTipsConfirmReceiptResult>(
        '/api/v1/staff/tips/confirm-receipt',
        body,
      )
      return {
        confirmedCount: Number(res?.confirmedCount) || 0,
        failedIds: Array.isArray(res?.failedIds) ? res.failedIds : [],
      }
    },

    async getLinkRequest(linkId: string): Promise<StaffLinkRequestDetail> {
      const data = await client.get<StaffLinkRequestDetailApiDto>(
        `/api/v1/staff/link-requests/${encodeURIComponent(linkId)}`,
      )
      return normalizeStaffLinkRequestDetail(data)
    },

    async acceptLinkRequest(linkId: string): Promise<void> {
      await client.put(`/api/v1/staff/link-requests/${encodeURIComponent(linkId)}/accept`)
    },

    async rejectLinkRequest(linkId: string): Promise<void> {
      await client.put(`/api/v1/staff/link-requests/${encodeURIComponent(linkId)}/reject`)
    },
  }
}

export const staffSelfRepository = createStaffSelfRepository()
export default staffSelfRepository
