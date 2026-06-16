/**
 * staffSelfRepository — staff-side self-service endpoints.
 */

import httpClient from '../../lib/httpClient'
import { isApiError } from '../../types/domain'
import type {
  StaffBusinessLink,
  StaffBusinessTipQr,
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
} from '../../types/domain'
import type { StaffLinkRequestDetailApiDto } from '../../types/repositories'
import { resolveStaffTipQr } from '../../utils/staffTipUrl'

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
  linkStatus?: string | null
  linkStatusLabel?: string | null
  linkedAt?: string | null
  businessSlug?: string | null
  touchPointSlug?: string | null
  masterTouchPointSlug?: string | null
  tipUrl?: string | null
  url?: string | null
  qrImageUrl?: string | null
}

interface StaffBusinessQrApiDto extends StaffBusinessApiDto {
  businessStaffLinkId?: string
}

function normalizeStaffBusinessLink(b: StaffBusinessApiDto): StaffBusinessLink {
  return {
    businessId: b.businessId ?? '',
    businessName: b.businessName ?? '',
    address: b.address ?? null,
    city: b.city ?? null,
    state: b.state ?? null,
    logoUrl: b.logoUrl ?? null,
    role: b.role ?? null,
    roleLabel: b.roleLabel ?? null,
    linkStatus: b.linkStatus ?? null,
    linkStatusLabel: b.linkStatusLabel ?? null,
    linkedAt: b.linkedAt ?? null,
    businessSlug: b.businessSlug ?? null,
    touchPointSlug: b.touchPointSlug ?? b.masterTouchPointSlug ?? null,
    masterTouchPointSlug: b.masterTouchPointSlug ?? b.touchPointSlug ?? null,
    tipUrl: b.tipUrl ?? b.url ?? null,
    qrImageUrl: b.qrImageUrl ?? null,
  }
}

function normalizeStaffBusinessQrItems(
  items: StaffBusinessQrApiDto[],
  staffProfileId?: string | null,
): StaffBusinessTipQr[] {
  const origin = typeof window !== 'undefined' ? window.location.origin : ''

  return items.map((item) => {
    const businessId = item.businessId ?? item.businessStaffLinkId ?? ''
    const resolved = resolveStaffTipQr(item, staffProfileId, origin)

    return {
      businessId,
      businessName: item.businessName ?? '',
      businessSlug: resolved.businessSlug,
      touchPointSlug: resolved.touchPointSlug,
      tipUrl: resolved.tipUrl,
      qrImageUrl: resolved.qrImageUrl ?? item.qrImageUrl ?? null,
      linkStatus: item.linkStatus ?? null,
      linkStatusLabel: item.linkStatusLabel ?? null,
      roleLabel: item.roleLabel ?? null,
      logoUrl: item.logoUrl ?? null,
    }
  })
}

interface StaffBusinessesResponse {
  items?: StaffBusinessApiDto[]
}

interface StaffBusinessQrResponse {
  items?: StaffBusinessQrApiDto[]
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
}

function normalizeTipItem(dto: StaffTipItemApiDto): StaffTipItem {
  return {
    id: dto.id ?? '',
    amount: Number(dto.amount) || 0,
    totalAmount: Number(dto.totalAmount) || 0,
    status: dto.status ?? 'Initiated',
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

    /**
     * Per-business staff tipping QR metadata.
     * Tries dedicated endpoint first; returns null when BE has not shipped it yet.
     */
    async getMyBusinessQrCodes(
      staffProfileId?: string | null,
    ): Promise<StaffBusinessTipQr[] | null> {
      try {
        const res = await client.get<StaffBusinessQrApiDto[] | StaffBusinessQrResponse>(
          '/api/v1/staff/business-qr-codes',
        )
        const items = Array.isArray(res) ? res : (res?.items || [])
        return normalizeStaffBusinessQrItems(items, staffProfileId)
      } catch (err: unknown) {
        if (isApiError(err) && (err.status === 404 || err.status === 501)) {
          return null
        }
        throw err
      }
    },

    async getDashboardSummary(): Promise<StaffDashboardSummary> {
      const res = await client.get<StaffDashboardSummaryApiDto>('/api/v1/staff/dashboard/summary')
      return normalizeDashboardSummary(res)
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

    async getTips({
      pageNumber = 1,
      pageSize = 20,
      dateFrom,
      dateTo,
      status,
    }: StaffTipsListParams = {}): Promise<StaffTipsPage> {
      const params: Record<string, string | number> = {
        PageNumber: pageNumber,
        PageSize: pageSize,
      }
      if (dateFrom) params.DateFrom = dateFrom
      if (dateTo) params.DateTo = dateTo
      if (status) params.Status = status

      const res = await client.get<StaffTipsPageApiDto>('/api/v1/staff/tips', { params })
      return normalizeTipsPage(res)
    },

    async confirmTipsReceipt(tipIds: string[]): Promise<StaffTipsConfirmReceiptResult> {
      const res = await client.post<StaffTipsConfirmReceiptResult>(
        '/api/v1/staff/tips/confirm-receipt',
        { tipIds },
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
