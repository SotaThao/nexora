/**
 * taxiqOwnerAdjustmentsRepository — Owner Lock Tax Year + Adjustment Records (US-06).
 * See docs/plan/tasks/taxiq/fe-tasks/US-06-taxiq-fe-owner-year-end-export-lock-tax-year.md.
 *
 * EntityType/FieldName are free-text on the BE (validated by a switch in
 * CreateAdjustmentRecordCommand, not a real enum) — ADJUSTMENT_ENTITY_FIELD_MAP
 * below mirrors that switch exactly and must be kept in sync if BE adds cases.
 */
import httpClient from '../../lib/httpClient'

type HttpClient = typeof httpClient

export const ADJUSTMENT_ENTITY_FIELD_MAP: Record<string, string[]> = {
  DeductionRecord: ['Amount', 'Description', 'VendorName', 'BusinessUsePercent'],
  PayoutRecord: ['ServicePayout', 'Tip', 'Bonus', 'Reimbursement'],
  EquipmentAsset: ['Amount', 'BusinessUsePercent', 'AssetName'],
  GiftCardLiability: ['TotalSold', 'TotalRedeemed'],
  MembershipCredit: ['CreditsIssued', 'CreditsUsed', 'CreditsExpired'],
}

export interface LockTaxYearParams {
  overrideNote?: string
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
