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

export function createTaxiqStaffPayoutsRepository(client: HttpClient = httpClient) {
  return {
    async listPending(): Promise<StaffPendingPayout[]> {
      const data = await client.get<StaffPendingPayoutApiDto[]>('/api/v1/taxiq/staff/payouts/pending')
      return (data ?? []).map(normalizeStaffPendingPayout)
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
