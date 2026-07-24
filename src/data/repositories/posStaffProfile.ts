/**
 * posStaffProfileRepository — POS Owner Setup: Staff Profile (US-019) + Pay Engine
 * (TaxIQ Payroll mục 13, US-031 FE / backend US-23).
 */
import httpClient from '../../lib/httpClient'
import type { PosStaffProfileApiDto, StaffWeeklyScheduleDayApiDto } from '../../types/repositories'

type HttpClient = typeof httpClient

export interface SaveStaffPosProfileParams {
  businessStaffLinkId: string
  posRoleId: string
  payStructureType: string
  commissionPercent?: number | null
  weeklySalaryAmount?: number | null
  agreedAmount?: number | null
  tipsEnabled: boolean
}

// Pay Engine only offers these four formulas — Commission/WeeklySalary/AgreedAmount above are
// the separate POS quick-setup screen and not written from the Pay Engine form.
export const PAY_FORMULAS = ['Hourly', 'Commission', 'Hybrid', 'Tiered'] as const
export type PayFormula = (typeof PAY_FORMULAS)[number]

export const PAY_SCHEDULES = ['Weekly', 'Biweekly', 'FifteenthAndThirtieth', 'Monthly'] as const
export type PaySchedule = (typeof PAY_SCHEDULES)[number]

export const PAYOUT_METHODS = [
  'Zelle', 'BankWire', 'PayPal', 'Venmo', 'CashApp', 'AppleCash', 'VlinkPay', 'Check', 'Cash', 'Other',
] as const
export type PayoutMethod = (typeof PAYOUT_METHODS)[number]

export interface TieredRateEntry {
  thresholdAmount: number
  commissionPercent: number
}

export interface ReadyToPayGate {
  workerClassificationReady: boolean
  payFormulaReady: boolean
  payoutMethodReady: boolean
  proofRuleRequired: boolean
  firstPaymentAction: string
}

export interface PayRuleDetailApiDto {
  businessStaffLinkId: string
  displayName: string
  photoUrl?: string | null
  contractType?: string | null
  tinStatus: string
  hasPayRule: boolean
  payStructureType: string
  hourlyRate?: number | null
  overtimeThresholdHours: number
  commissionPercent?: number | null
  tieredRates: TieredRateEntry[]
  salesThresholdBonusEnabled: boolean
  salesThresholdBonusThreshold?: number | null
  salesThresholdBonusPercent?: number | null
  kpiBonusEnabled: boolean
  kpiBonusTarget?: number | null
  kpiBonusPercent?: number | null
  paySchedule: string
  primaryMethod?: string | null
  primaryDestination?: string | null
  backupMethod?: string | null
  backupDestination?: string | null
  requirePaymentProof: boolean
  syncProofToPayoutLedger: boolean
  blockPaymentIfTaxProfileMissing: boolean
  allowOwnerOverrideWithAuditNote: boolean
  readyToPayGate: ReadyToPayGate
}

export type PayRuleDetail = PayRuleDetailApiDto

export interface PayRuleListItemApiDto {
  businessStaffLinkId: string
  displayName: string
  photoUrl?: string | null
  contractType?: string | null
  hasPayRule: boolean
  payStructureType?: string | null
  paySchedule?: string | null
  payoutMethodReady: boolean
  overallReady: boolean
}

export type PayRuleListItem = PayRuleListItemApiDto

export interface UpsertPayRuleParams {
  businessStaffLinkId: string
  payStructureType: PayFormula
  hourlyRate?: number | null
  overtimeThresholdHours?: number | null
  commissionPercent?: number | null
  tieredRates?: TieredRateEntry[] | null
  salesThresholdBonusEnabled: boolean
  salesThresholdBonusThreshold?: number | null
  salesThresholdBonusPercent?: number | null
  kpiBonusEnabled: boolean
  kpiBonusTarget?: number | null
  kpiBonusPercent?: number | null
  paySchedule: PaySchedule
  requirePaymentProof: boolean
  syncProofToPayoutLedger: boolean
  blockPaymentIfTaxProfileMissing: boolean
  allowOwnerOverrideWithAuditNote: boolean
}

export interface UpsertPayoutDestinationParams {
  businessStaffLinkId: string
  primaryMethod: PayoutMethod
  primaryDestination?: string | null
  backupMethod?: PayoutMethod | null
  backupDestination?: string | null
}

export function createPosStaffProfileRepository(client: HttpClient = httpClient) {
  return {
    async getStaffPosProfile(businessStaffLinkId: string): Promise<PosStaffProfileApiDto> {
      return await client.get<PosStaffProfileApiDto>(
        `/api/v1/merchant/pos/staff-profiles/${encodeURIComponent(businessStaffLinkId)}`,
      )
    },

    async saveStaffPosProfile(params: SaveStaffPosProfileParams): Promise<boolean> {
      const { businessStaffLinkId, ...body } = params
      return await client.put<boolean>(
        `/api/v1/merchant/pos/staff-profiles/${encodeURIComponent(businessStaffLinkId)}`,
        body,
      )
    },

    async updateContractType(businessStaffLinkId: string, contractType: string): Promise<void> {
      await client.put<void>(
        `/api/v1/merchant/pos/staff-profiles/${encodeURIComponent(businessStaffLinkId)}/contract-type`,
        { contractType },
      )
    },

    async setStaffPosStatus(businessStaffLinkId: string, status: string): Promise<boolean> {
      return await client.put<boolean>(
        `/api/v1/merchant/pos/staff-profiles/${encodeURIComponent(businessStaffLinkId)}/status`,
        { status },
      )
    },

    async getStaffServiceAssignments(businessStaffLinkId: string): Promise<string[]> {
      return await client.get<string[]>(
        `/api/v1/merchant/pos/staff-profiles/${encodeURIComponent(businessStaffLinkId)}/services`,
      )
    },

    async saveStaffServiceAssignments(businessStaffLinkId: string, posServiceIds: string[]): Promise<boolean> {
      return await client.put<boolean>(
        `/api/v1/merchant/pos/staff-profiles/${encodeURIComponent(businessStaffLinkId)}/services`,
        { posServiceIds },
      )
    },

    async getStaffWeeklySchedule(businessStaffLinkId: string): Promise<StaffWeeklyScheduleDayApiDto[]> {
      return await client.get<StaffWeeklyScheduleDayApiDto[]>(
        `/api/v1/merchant/pos/staff-profiles/${encodeURIComponent(businessStaffLinkId)}/weekly-schedule`,
      )
    },

    async saveStaffWeeklySchedule(
      businessStaffLinkId: string,
      days: StaffWeeklyScheduleDayApiDto[],
    ): Promise<boolean> {
      return await client.put<boolean>(
        `/api/v1/merchant/pos/staff-profiles/${encodeURIComponent(businessStaffLinkId)}/weekly-schedule`,
        { days },
      )
    },

    async listPayRules(): Promise<{ items: PayRuleListItem[] }> {
      return await client.get<{ items: PayRuleListItemApiDto[] }>(
        '/api/v1/merchant/pos/staff-profiles/pay-rules',
      )
    },

    async getPayRule(businessStaffLinkId: string): Promise<PayRuleDetail> {
      return await client.get<PayRuleDetailApiDto>(
        `/api/v1/merchant/pos/staff-profiles/${encodeURIComponent(businessStaffLinkId)}/pay-rule`,
      )
    },

    async upsertPayRule(params: UpsertPayRuleParams): Promise<boolean> {
      const { businessStaffLinkId, ...body } = params
      return await client.put<boolean>(
        `/api/v1/merchant/pos/staff-profiles/${encodeURIComponent(businessStaffLinkId)}/pay-rule`,
        body,
      )
    },

    async upsertPayoutDestination(params: UpsertPayoutDestinationParams): Promise<boolean> {
      const { businessStaffLinkId, ...body } = params
      return await client.put<boolean>(
        `/api/v1/merchant/pos/staff-profiles/${encodeURIComponent(businessStaffLinkId)}/payout-destination`,
        body,
      )
    },
  }
}

export const posStaffProfileRepository = createPosStaffProfileRepository()
export default posStaffProfileRepository
