/**
 * taxiqOwnerAdjustmentsRepository — Owner Lock Tax Year + Adjustment Records (US-06).
 * See docs/plan/tasks/taxiq/fe-tasks/US-06-taxiq-fe-owner-year-end-export-lock-tax-year.md.
 *
 * EntityType/FieldName are free-text on the BE (validated by a switch in
 * CreateAdjustmentRecordCommand, not a real enum) — ADJUSTMENT_ENTITY_FIELD_MAP
 * below mirrors that switch exactly and must be kept in sync if BE adds cases.
 *
 * unlock() reopens a Locked (not yet Exported) tax year for direct editing — BE only allows
 * this when no CpaAccessGrant has ever been issued for it (TAXIQ_OWNER_TAX_YEAR_UNLOCK_BLOCKED_BY_CPA_ACCESS
 * otherwise), so it's a narrow "undo before anyone external has seen the locked data" escape
 * hatch, not a general reopen.
 */
import httpClient from '../../lib/httpClient'

type HttpClient = typeof httpClient

export const ADJUSTMENT_ENTITY_FIELD_MAP: Record<string, string[]> = {
  DeductionRecord: ['Amount', 'Description', 'VendorName', 'BusinessUsePercent'],
  PayoutRecord: ['ServicePayout', 'TipCardAmount', 'TipCashAmount', 'Bonus', 'Reimbursement'],
  EquipmentAsset: ['Amount', 'BusinessUsePercent', 'AssetName'],
  GiftCardLiability: ['TotalSold', 'TotalRedeemed'],
  MembershipCredit: ['CreditsIssued', 'CreditsUsed', 'CreditsExpired'],
  TaxPaymentReminder: ['DueDate', 'TaxType'],
  StaffW9Status: ['W9Status'],
}

export interface LockTaxYearParams {
  overrideNote?: string
}

export interface UnlockTaxYearParams {
  reason: string
}

export interface CreateAdjustmentParams {
  entityType: string
  entityId: string
  fieldName: string
  oldValue: string
  newValue: string
  reason: string
  cpaNotes?: string
  receiptId?: string
}

export interface AdjustmentRecordApiDto {
  id: string
  ownerTaxYearId: string | null
  staffTaxYearId: string | null
  entityType: string
  entityId: string
  fieldName: string
  oldValue: string
  newValue: string
  reason: string
  cpaNotes?: string | null
  receiptId?: string | null
  createdByUserId: string
  createdByUserName: string
  createdAt: string
}

interface AdjustmentRecordListApiDto {
  items: AdjustmentRecordApiDto[]
}

export interface AdjustmentRecord {
  id: string
  ownerTaxYearId: string | null
  staffTaxYearId: string | null
  entityType: string
  entityId: string
  fieldName: string
  oldValue: string
  newValue: string
  reason: string
  cpaNotes: string | null
  receiptId: string | null
  createdByUserId: string
  createdByUserName: string
  createdAt: string
}

export function normalizeAdjustment(dto: AdjustmentRecordApiDto): AdjustmentRecord {
  return {
    id: dto.id,
    ownerTaxYearId: dto.ownerTaxYearId ?? null,
    staffTaxYearId: dto.staffTaxYearId ?? null,
    entityType: dto.entityType,
    entityId: dto.entityId,
    fieldName: dto.fieldName,
    oldValue: dto.oldValue,
    newValue: dto.newValue,
    reason: dto.reason,
    cpaNotes: dto.cpaNotes ?? null,
    receiptId: dto.receiptId ?? null,
    createdByUserId: dto.createdByUserId,
    createdByUserName: dto.createdByUserName,
    createdAt: dto.createdAt,
  }
}

export function createTaxiqOwnerAdjustmentsRepository(client: HttpClient = httpClient) {
  return {
    async lock(ownerTaxYearId: string, params: LockTaxYearParams): Promise<void> {
      await client.post(`/api/v1/taxiq/owner/tax-years/${encodeURIComponent(ownerTaxYearId)}/lock`, {
        overrideNote: params.overrideNote,
      })
    },

    async unlock(ownerTaxYearId: string, params: UnlockTaxYearParams): Promise<void> {
      await client.post(`/api/v1/taxiq/owner/tax-years/${encodeURIComponent(ownerTaxYearId)}/unlock`, {
        reason: params.reason,
      })
    },

    async createAdjustment(ownerTaxYearId: string, params: CreateAdjustmentParams): Promise<string> {
      return client.post<string>(
        `/api/v1/taxiq/owner/tax-years/${encodeURIComponent(ownerTaxYearId)}/adjustments`,
        params,
      )
    },

    async listAdjustments(ownerTaxYearId: string): Promise<AdjustmentRecord[]> {
      const data = await client.get<AdjustmentRecordListApiDto>(
        `/api/v1/taxiq/owner/tax-years/${encodeURIComponent(ownerTaxYearId)}/adjustments`,
      )
      return (data?.items ?? []).map(normalizeAdjustment)
    },
  }
}

export const taxiqOwnerAdjustmentsRepository = createTaxiqOwnerAdjustmentsRepository()
export default taxiqOwnerAdjustmentsRepository
