/**
 * taxiqOwnerPayoutsRepository — API implementation for US-09 (Owner Payout & Dispute
 * Center). Backend: OwnerPayoutController (BE US-10 payout entry + US-12 dispute
 * resolution) + GetStaffListForTaxIqQuery / CreateStaffTaxYearByOwnerCommand (precondition
 * flow — Owner creates a StaffTaxYear on behalf of Staff before entering their first payout).
 */
import httpClient from '../../lib/httpClient'

type HttpClient = typeof httpClient

export const CONTRACT_TYPES = ['W2', 'C1099', 'BoothRenter'] as const
export type ContractType = (typeof CONTRACT_TYPES)[number]

export const W9_STATUSES = ['NotRequired', 'Pending', 'Received'] as const
export type W9Status = (typeof W9_STATUSES)[number]

export const PAY_PERIODS = ['Weekly', 'BiWeekly', 'Monthly', 'AdHoc'] as const
export type PayPeriod = (typeof PAY_PERIODS)[number]

export const PAYOUT_STATUSES = ['PendingConfirmation', 'Confirmed', 'DisputeReported', 'CPAReviewRequired'] as const
export type PayoutStatus = (typeof PAYOUT_STATUSES)[number]

export const DISPUTE_RESOLUTIONS = ['Approve', 'Adjust', 'Reject'] as const
export type DisputeResolution = (typeof DISPUTE_RESOLUTIONS)[number]

export interface StaffTinApiDto {
  ssn?: string | null
  ein?: string | null
}

export interface StaffTin {
  ssn: string | null
  ein: string | null
}

function normalizeStaffTin(dto: StaffTinApiDto): StaffTin {
  return {
    ssn: dto.ssn ?? null,
    ein: dto.ein ?? null,
  }
}

export interface StaffTaxIqItemApiDto {
  userProfileId: string
  staffProfileId: string
  displayName: string
  photoUrl?: string | null
  position?: string | null
  hasStaffTaxYear: boolean
  staffTaxYearId?: string | null
  contractType?: string | null
  w9Status?: string | null
  taxYearStatus?: string | null
}

export interface StaffTaxIqItem {
  userProfileId: string
  staffProfileId: string
  displayName: string
  photoUrl: string | null
  position: string | null
  hasStaffTaxYear: boolean
  staffTaxYearId: string | null
  contractType: string | null
  w9Status: string | null
  taxYearStatus: string | null
}

function normalizeStaffTaxIqItem(dto: StaffTaxIqItemApiDto): StaffTaxIqItem {
  return {
    userProfileId: dto.userProfileId,
    staffProfileId: dto.staffProfileId,
    displayName: dto.displayName,
    photoUrl: dto.photoUrl ?? null,
    position: dto.position ?? null,
    hasStaffTaxYear: dto.hasStaffTaxYear,
    staffTaxYearId: dto.staffTaxYearId ?? null,
    contractType: dto.contractType ?? null,
    w9Status: dto.w9Status ?? null,
    taxYearStatus: dto.taxYearStatus ?? null,
  }
}

export interface CreateStaffTaxYearByOwnerParams {
  ownerTaxYearId: string
  staffUserId: string
  contractType: ContractType
  w9Status?: W9Status
}

export interface UpdateStaffW9StatusParams {
  ownerTaxYearId: string
  staffTaxYearId: string
  w9Status: W9Status
}

export interface PayoutRecordApiDto {
  id: string
  ownerTaxYearId: string
  staffUserId: string
  staffName: string
  payPeriod: string
  periodStart: string
  periodEnd: string
  servicePayout: number
  tip: number
  bonus: number
  reimbursement: number
  paymentMethod: string
  status: string
  grossPayout: number
  netPaid: number
  createdAt: string
  lastModified?: string | null
}

export interface PayoutRecord {
  id: string
  ownerTaxYearId: string
  staffUserId: string
  staffName: string
  payPeriod: string
  periodStart: string
  periodEnd: string
  servicePayout: number
  tip: number
  bonus: number
  reimbursement: number
  paymentMethod: string
  status: string
  grossPayout: number
  netPaid: number
  createdAt: string
  lastModified: string | null
}

function normalizePayoutRecord(dto: PayoutRecordApiDto): PayoutRecord {
  return {
    id: dto.id,
    ownerTaxYearId: dto.ownerTaxYearId,
    staffUserId: dto.staffUserId,
    staffName: dto.staffName,
    payPeriod: dto.payPeriod,
    periodStart: dto.periodStart,
    periodEnd: dto.periodEnd,
    servicePayout: dto.servicePayout,
    tip: dto.tip,
    bonus: dto.bonus,
    reimbursement: dto.reimbursement,
    paymentMethod: dto.paymentMethod,
    status: dto.status,
    grossPayout: dto.grossPayout,
    netPaid: dto.netPaid,
    createdAt: dto.createdAt,
    lastModified: dto.lastModified ?? null,
  }
}

export interface PayoutFormFields {
  payPeriod: PayPeriod
  periodStart: string
  periodEnd: string
  servicePayout: number
  tip: number
  bonus: number
  reimbursement: number
  paymentMethod: string
}

export interface CreatePayoutRecordParams extends PayoutFormFields {
  ownerTaxYearId: string
  staffUserId: string
}

export interface UpdatePayoutRecordParams extends PayoutFormFields {
  payoutRecordId: string
}

export interface ListPayoutRecordsParams {
  ownerTaxYearId: string
  staffUserId?: string
  status?: PayoutStatus
}

export interface DisputedPayoutApiDto {
  id: string
  ownerTaxYearId: string
  staffUserId: string
  staffName: string
  payPeriod: string
  periodStart: string
  periodEnd: string
  servicePayout: number
  tip: number
  bonus: number
  reimbursement: number
  paymentMethod: string
  grossPayout: number
  staffDisputeAmount: number
  staffDisputeNote: string
  createdAt: string
  lastModified?: string | null
}

export interface DisputedPayout {
  id: string
  ownerTaxYearId: string
  staffUserId: string
  staffName: string
  payPeriod: string
  periodStart: string
  periodEnd: string
  servicePayout: number
  tip: number
  bonus: number
  reimbursement: number
  paymentMethod: string
  grossPayout: number
  staffDisputeAmount: number
  staffDisputeNote: string
  createdAt: string
  lastModified: string | null
}

function normalizeDisputedPayout(dto: DisputedPayoutApiDto): DisputedPayout {
  return {
    id: dto.id,
    ownerTaxYearId: dto.ownerTaxYearId,
    staffUserId: dto.staffUserId,
    staffName: dto.staffName,
    payPeriod: dto.payPeriod,
    periodStart: dto.periodStart,
    periodEnd: dto.periodEnd,
    servicePayout: dto.servicePayout,
    tip: dto.tip,
    bonus: dto.bonus,
    reimbursement: dto.reimbursement,
    paymentMethod: dto.paymentMethod,
    grossPayout: dto.grossPayout,
    staffDisputeAmount: dto.staffDisputeAmount,
    staffDisputeNote: dto.staffDisputeNote,
    createdAt: dto.createdAt,
    lastModified: dto.lastModified ?? null,
  }
}

export interface ResolveDisputeParams {
  payoutRecordId: string
  resolution: DisputeResolution
  ownerResolutionNote: string
  adjustedServicePayout?: number | null
  adjustedTip?: number | null
  adjustedBonus?: number | null
}

export function createTaxiqOwnerPayoutsRepository(client: HttpClient = httpClient) {
  return {
    async listStaff(ownerTaxYearId: string): Promise<StaffTaxIqItem[]> {
      const data = await client.get<{ items: StaffTaxIqItemApiDto[] }>(
        `/api/v1/taxiq/owner/staff?ownerTaxYearId=${encodeURIComponent(ownerTaxYearId)}`,
      )
      return (data?.items ?? []).map(normalizeStaffTaxIqItem)
    },

    async createStaffTaxYear(params: CreateStaffTaxYearByOwnerParams): Promise<string> {
      return await client.post<string>('/api/v1/taxiq/owner/staff-tax-years', {
        ownerTaxYearId: params.ownerTaxYearId,
        staffUserId: params.staffUserId,
        contractType: params.contractType,
        w9Status: params.w9Status ?? 'NotRequired',
      })
    },

    async updateStaffW9Status(params: UpdateStaffW9StatusParams): Promise<void> {
      await client.put<void>(
        `/api/v1/taxiq/owner/staff-tax-years/${encodeURIComponent(params.staffTaxYearId)}/w9-status`,
        {
          ownerTaxYearId: params.ownerTaxYearId,
          w9Status: params.w9Status,
        },
      )
    },

    async getStaffTin(ownerTaxYearId: string, staffUserId: string, reveal: boolean): Promise<StaffTin> {
      const query = new URLSearchParams({ ownerTaxYearId, staffUserId, reveal: String(reveal) })
      const dto = await client.get<StaffTinApiDto>(`/api/v1/taxiq/owner/staff-tin?${query.toString()}`)
      return normalizeStaffTin(dto)
    },

    async list(params: ListPayoutRecordsParams): Promise<PayoutRecord[]> {
      const query = new URLSearchParams({ ownerTaxYearId: params.ownerTaxYearId })
      if (params.staffUserId) query.set('staffUserId', params.staffUserId)
      if (params.status) query.set('status', params.status)
      const data = await client.get<{ items: PayoutRecordApiDto[] }>(`/api/v1/taxiq/owner/payouts?${query.toString()}`)
      return (data?.items ?? []).map(normalizePayoutRecord)
    },

    async create(params: CreatePayoutRecordParams): Promise<string> {
      return await client.post<string>('/api/v1/taxiq/owner/payouts', {
        ownerTaxYearId: params.ownerTaxYearId,
        staffUserId: params.staffUserId,
        payPeriod: params.payPeriod,
        periodStart: params.periodStart,
        periodEnd: params.periodEnd,
        servicePayout: params.servicePayout,
        tip: params.tip,
        bonus: params.bonus,
        reimbursement: params.reimbursement,
        paymentMethod: params.paymentMethod,
      })
    },

    async update(params: UpdatePayoutRecordParams): Promise<void> {
      await client.put<void>(`/api/v1/taxiq/owner/payouts/${encodeURIComponent(params.payoutRecordId)}`, {
        payPeriod: params.payPeriod,
        periodStart: params.periodStart,
        periodEnd: params.periodEnd,
        servicePayout: params.servicePayout,
        tip: params.tip,
        bonus: params.bonus,
        reimbursement: params.reimbursement,
        paymentMethod: params.paymentMethod,
      })
    },

    async listDisputed(ownerTaxYearId: string): Promise<DisputedPayout[]> {
      const data = await client.get<{ items: DisputedPayoutApiDto[] }>(
        `/api/v1/taxiq/owner/payouts/disputed?ownerTaxYearId=${encodeURIComponent(ownerTaxYearId)}`,
      )
      return (data?.items ?? []).map(normalizeDisputedPayout)
    },

    async resolveDispute(params: ResolveDisputeParams): Promise<void> {
      await client.post<void>(`/api/v1/taxiq/owner/payouts/${encodeURIComponent(params.payoutRecordId)}/resolve`, {
        resolution: params.resolution,
        ownerResolutionNote: params.ownerResolutionNote,
        adjustedServicePayout: params.adjustedServicePayout ?? null,
        adjustedTip: params.adjustedTip ?? null,
        adjustedBonus: params.adjustedBonus ?? null,
      })
    },
  }
}

export const taxiqOwnerPayoutsRepository = createTaxiqOwnerPayoutsRepository()
export default taxiqOwnerPayoutsRepository
