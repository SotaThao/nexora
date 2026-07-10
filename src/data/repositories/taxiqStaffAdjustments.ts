/**
 * taxiqStaffAdjustmentsRepository — Staff Adjustment Records (US-013), parallel to the
 * Owner-scoped `taxiqOwnerAdjustments`. See openspec/changes/integrate-taxiq-staff-adjustment.
 *
 * EntityType/FieldName are free-text on the BE (validated by a switch in
 * CreateAdjustmentRecordCommand, not a real enum) — STAFF_ADJUSTMENT_ENTITY_FIELD_MAP
 * below mirrors that switch exactly and must be kept in sync if BE adds cases.
 */
import httpClient from '../../lib/httpClient'
import { normalizeAdjustment } from './taxiqOwnerAdjustments'
import type { AdjustmentRecord, AdjustmentRecordApiDto, CreateAdjustmentParams } from './taxiqOwnerAdjustments'

type HttpClient = typeof httpClient

export const STAFF_ADJUSTMENT_ENTITY_FIELD_MAP: Record<string, string[]> = {
  DeductionRecord: ['Amount', 'Description', 'VendorName', 'BusinessUsePercent'],
  MileageLog: ['Date', 'Purpose', 'StartLocation', 'EndLocation', 'Miles'],
  CashTipLog: ['Date', 'Amount', 'Note'],
  SelfReportedIncome: [
    'Amount',
    'TransactionDate',
    'PeriodEndDate',
    'PeriodType',
    'Source',
    'IncomeType',
    'IncomeTypeNote',
    'Notes',
  ],
}

interface AdjustmentRecordListApiDto {
  items: AdjustmentRecordApiDto[]
}

export function createTaxiqStaffAdjustmentsRepository(client: HttpClient = httpClient) {
  return {
    async createAdjustment(staffTaxYearId: string, params: CreateAdjustmentParams): Promise<string> {
      return client.post<string>(
        `/api/v1/taxiq/staff/tax-years/${encodeURIComponent(staffTaxYearId)}/adjustments`,
        params,
      )
    },

    async listAdjustments(staffTaxYearId: string): Promise<AdjustmentRecord[]> {
      const data = await client.get<AdjustmentRecordListApiDto>(
        `/api/v1/taxiq/staff/tax-years/${encodeURIComponent(staffTaxYearId)}/adjustments`,
      )
      return (data?.items ?? []).map(normalizeAdjustment)
    },
  }
}

export const taxiqStaffAdjustmentsRepository = createTaxiqStaffAdjustmentsRepository()
export default taxiqStaffAdjustmentsRepository
