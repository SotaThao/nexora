/**
 * taxiqStaffPayoutsRepository — API implementation for US-14 (Staff Payout Confirmation
 * & Dispute). Backend: StaffPayoutController (BE US-11). Field shape intentionally
 * differs from the Owner-side taxiqOwnerPayouts.ts — StaffPendingPayoutDto only exposes
 * the fields the Staff is allowed to see (no staffName/ownerTaxYearId/status/other
 * Owner financial fields), scoped to the caller via JWT.
 */
import httpClient from '../../lib/httpClient'

type HttpClient = typeof httpClient

export interface StaffPendingPayoutApiDto {
  id: string
  payPeriod: string
  periodStart: string
  periodEnd: string
  servicePayout: number
  tip: number
  bonus: number
  reimbursement: number
  paymentMethod: string
}

export interface StaffPendingPayout {
  id: string
  payPeriod: string
  periodStart: string
  periodEnd: string
  servicePayout: number
  tip: number
  bonus: number
  reimbursement: number
  paymentMethod: string
}

function normalizeStaffPendingPayout(dto: StaffPendingPayoutApiDto): StaffPendingPayout {
  return {
    id: dto.id,
    payPeriod: dto.payPeriod,
    periodStart: dto.periodStart,
    periodEnd: dto.periodEnd,
    servicePayout: dto.servicePayout,
    tip: dto.tip,
    bonus: dto.bonus,
    reimbursement: dto.reimbursement,
    paymentMethod: dto.paymentMethod,
  }
}

export interface DisputeStaffPayoutParams {
  payoutRecordId: string
  staffDisputeAmount: number
  staffDisputeNote: string
}

// BUG-03 fix: history statuses for a Staff's own payouts (Pending is covered by
// listPending() above — this endpoint is history-only, see StaffPayoutController).
export const STAFF_PAYOUT_HISTORY_STATUSES = ['Confirmed', 'DisputeReported', 'CPAReviewRequired'] as const
export type StaffPayoutHistoryStatus = (typeof STAFF_PAYOUT_HISTORY_STATUSES)[number]

export interface StaffPayoutHistoryApiDto {
  id: string
  payPeriod: string
  periodStart: string
  periodEnd: string
  servicePayout: number
  tip: number
  bonus: number
  reimbursement: number
  paymentMethod: string
  status: string
  staffDisputeAmount?: number | null
  staffDisputeNote?: string | null
  ownerResolutionNote?: string | null
  resolvedAt?: string | null
}

export interface StaffPayoutHistory {
  id: string
  payPeriod: string
  periodStart: string
  periodEnd: string
  servicePayout: number
  tip: number
  bonus: number
  reimbursement: number
  paymentMethod: string
  status: string
  staffDisputeAmount?: number | null
  staffDisputeNote?: string | null
  ownerResolutionNote?: string | null
  resolvedAt?: string | null
}

function normalizeStaffPayoutHistory(dto: StaffPayoutHistoryApiDto): StaffPayoutHistory {
  return {
    id: dto.id,
    payPeriod: dto.payPeriod,
    periodStart: dto.periodStart,
    periodEnd: dto.periodEnd,
    servicePayout: dto.servicePayout,
    tip: dto.tip,
    bonus: dto.bonus,
    reimbursement: dto.reimbursement,
    paymentMethod: dto.paymentMethod,
    status: dto.status,
    staffDisputeAmount: dto.staffDisputeAmount,
    staffDisputeNote: dto.staffDisputeNote,
    ownerResolutionNote: dto.ownerResolutionNote,
    resolvedAt: dto.resolvedAt,
  }
}

export interface StaffPayoutHistoryQuery {
  status?: StaffPayoutHistoryStatus
  pageNumber?: number
  pageSize?: number
}

export interface StaffPayoutHistoryApiPage {
  items: StaffPayoutHistoryApiDto[]
  pageNumber: number
  totalPages: number
  totalCount: number
  hasPreviousPage: boolean
  hasNextPage: boolean
}

export interface StaffPayoutHistoryPage {
  items: StaffPayoutHistory[]
  pageNumber: number
  totalPages: number
  totalCount: number
  hasPreviousPage: boolean
  hasNextPage: boolean
}

function normalizeStaffPayoutHistoryPage(data: StaffPayoutHistoryApiPage | undefined | null): StaffPayoutHistoryPage {
  return {
    items: (data?.items ?? []).map(normalizeStaffPayoutHistory),
    pageNumber: data?.pageNumber ?? 1,
    totalPages: data?.totalPages ?? 1,
    totalCount: data?.totalCount ?? 0,
    hasPreviousPage: data?.hasPreviousPage ?? false,
    hasNextPage: data?.hasNextPage ?? false,
  }
}

function buildHistoryParams(query: StaffPayoutHistoryQuery): Record<string, string | number> {
  const params: Record<string, string | number> = {}
  if (query.status) params.status = query.status
  if (query.pageNumber) params.pageNumber = query.pageNumber
  if (query.pageSize) params.pageSize = query.pageSize
  return params
}

export function createTaxiqStaffPayoutsRepository(client: HttpClient = httpClient) {
  return {
    async listPending(): Promise<StaffPendingPayout[]> {
      const data = await client.get<StaffPendingPayoutApiDto[]>('/api/v1/taxiq/staff/payouts/pending')
      return (data ?? []).map(normalizeStaffPendingPayout)
    },

    async listHistory(query: StaffPayoutHistoryQuery = {}): Promise<StaffPayoutHistoryPage> {
      const data = await client.get<StaffPayoutHistoryApiPage>('/api/v1/taxiq/staff/payouts/history', {
        params: buildHistoryParams(query),
      })
      return normalizeStaffPayoutHistoryPage(data)
    },

    async confirm(payoutRecordId: string): Promise<void> {
      await client.post<void>(`/api/v1/taxiq/staff/payouts/${encodeURIComponent(payoutRecordId)}/confirm`)
    },

    async dispute(params: DisputeStaffPayoutParams): Promise<void> {
      await client.post<void>(`/api/v1/taxiq/staff/payouts/${encodeURIComponent(params.payoutRecordId)}/dispute`, {
        staffDisputeAmount: params.staffDisputeAmount,
        staffDisputeNote: params.staffDisputeNote,
      })
    },
  }
}

export const taxiqStaffPayoutsRepository = createTaxiqStaffPayoutsRepository()
export default taxiqStaffPayoutsRepository
