/**
 * taxiqTipLedgerRepository — API implementation for Tip Ledger (mục 26). Scoped per staff
 * (StaffTaxYearId), mirroring how CashTipLog (the feature it replaces) was scoped. Owner and
 * Staff hit parallel endpoints for List/Add (`/owner/tip-ledger` vs `/staff/tip-ledger`, same
 * response/request shape); Edit/Delete/Export CPA Package are owner-only actions per backend.
 * CPA export reuses Share Link infra (mục 23) server-side — returns the same ShareLinkDto shape
 * as taxiqShareLinks.ts/taxiqForm1099Nec.ts.
 */
import httpClient from '../../lib/httpClient'
import type { ShareLink, ShareLinkApiDto } from './taxiqShareLinks'

type HttpClient = typeof httpClient

export const TIP_METHODS = ['Cash', 'Zelle', 'Venmo', 'CashApp', 'CardPos', 'Qr', 'PayPal', 'Other'] as const
export type TipMethod = (typeof TIP_METHODS)[number]

export const TIP_SOURCES = ['Cash', 'Direct', 'PosOwnerPaid'] as const
export type TipSource = (typeof TIP_SOURCES)[number]

export const TIP_QUALIFIED_STATUSES = ['NeedsReview', 'LikelyQualified', 'NotQualified'] as const
export type TipQualifiedStatus = (typeof TIP_QUALIFIED_STATUSES)[number]

export const TIP_PROOF_TYPES = ['None', 'Screenshot', 'ReceiptPhoto', 'PosRecord', 'CashNote'] as const
export type TipProofType = (typeof TIP_PROOF_TYPES)[number]

export const TIP_LEDGER_EXPORT_EXPIRY_DAYS = [7, 15, 30] as const
export type TipLedgerExportExpiryDays = (typeof TIP_LEDGER_EXPORT_EXPIRY_DAYS)[number]

export interface TipLedgerEntryApiDto {
  id: string
  date: string
  method: string
  amount: number
  serviceType?: string | null
  serviceAmount?: number | null
  source: string
  qualifiedStatus: string
  proof: string
  note?: string | null
  entered: string
}

export interface TipLedgerEntry {
  id: string
  date: string
  method: string
  amount: number
  serviceType: string | null
  serviceAmount: number | null
  source: string
  qualifiedStatus: string
  proof: string
  note: string | null
  entered: string
}

export interface TipLedgerYtdByMethod {
  method: string
  total: number
  count: number
  average: number
}

export interface TipLedgerQualifiedBreakdown {
  likelyQualifiedTotal: number
  needsReviewTotal: number
  notQualifiedTotal: number
}

export interface TipLedgerSummaryApiDto {
  todayTotal: number
  monthToDateTotal: number
  yearToDateTotal: number
  capUsedAmount: number
  capUsedPercent: number
  ytdByMethod: TipLedgerYtdByMethod[]
  qualifiedBreakdown: TipLedgerQualifiedBreakdown
  entries: TipLedgerEntryApiDto[]
}

export interface TipLedgerSummary {
  todayTotal: number
  monthToDateTotal: number
  yearToDateTotal: number
  capUsedAmount: number
  capUsedPercent: number
  ytdByMethod: TipLedgerYtdByMethod[]
  qualifiedBreakdown: TipLedgerQualifiedBreakdown
  entries: TipLedgerEntry[]
}

function normalizeEntry(dto: TipLedgerEntryApiDto): TipLedgerEntry {
  return {
    id: dto.id,
    date: dto.date,
    method: dto.method,
    amount: dto.amount,
    serviceType: dto.serviceType ?? null,
    serviceAmount: dto.serviceAmount ?? null,
    source: dto.source,
    qualifiedStatus: dto.qualifiedStatus,
    proof: dto.proof,
    note: dto.note ?? null,
    entered: dto.entered,
  }
}

function normalizeSummary(dto: TipLedgerSummaryApiDto): TipLedgerSummary {
  return {
    todayTotal: dto.todayTotal,
    monthToDateTotal: dto.monthToDateTotal,
    yearToDateTotal: dto.yearToDateTotal,
    capUsedAmount: dto.capUsedAmount,
    capUsedPercent: dto.capUsedPercent,
    ytdByMethod: dto.ytdByMethod ?? [],
    qualifiedBreakdown: dto.qualifiedBreakdown ?? { likelyQualifiedTotal: 0, needsReviewTotal: 0, notQualifiedTotal: 0 },
    entries: (dto.entries ?? []).map(normalizeEntry),
  }
}

export interface TipLedgerFilters {
  method?: TipMethod
  source?: TipSource
  qualifiedStatus?: TipQualifiedStatus
}

function buildQuery(staffTaxYearId: string, filters?: TipLedgerFilters): string {
  const query = new URLSearchParams({ staffTaxYearId })
  if (filters?.method) query.set('method', filters.method)
  if (filters?.source) query.set('source', filters.source)
  if (filters?.qualifiedStatus) query.set('qualifiedStatus', filters.qualifiedStatus)
  return query.toString()
}

export interface AddTipLedgerEntryParams {
  ownerTaxYearId: string
  staffTaxYearId: string
  date: string
  method: TipMethod
  amount: number
  serviceType?: string | null
  serviceAmount?: number | null
  isVoluntary: boolean
  isNotMandatoryServiceCharge: boolean
  proof: TipProofType
  note?: string | null
}

// Staff self-service variant — a staff member has no read access to a business's OwnerTaxYear
// (owner-only endpoint), so they send BusinessId instead and the backend resolves/creates the
// OwnerTaxYear server-side (AddTipLedgerEntryAsStaffCommand).
export interface AddTipLedgerEntryAsStaffParams {
  businessId: string
  staffTaxYearId: string
  date: string
  method: TipMethod
  amount: number
  serviceType?: string | null
  serviceAmount?: number | null
  isVoluntary: boolean
  isNotMandatoryServiceCharge: boolean
  proof: TipProofType
  note?: string | null
}

export interface EditTipLedgerEntryParams {
  date: string
  method: TipMethod
  amount: number
  serviceType?: string | null
  serviceAmount?: number | null
  isVoluntary: boolean
  isNotMandatoryServiceCharge: boolean
  proof: TipProofType
  note?: string | null
  reason: string
}

export interface ExportTipLedgerForCpaParams {
  recipientName: string
  recipientType: string
  cpaEmail?: string | null
  accessMode: string
  downloadPermission: string
  passcode?: string | null
  expiryDays?: TipLedgerExportExpiryDays | null
}

function normalizeShareLink(dto: ShareLinkApiDto): ShareLink {
  return {
    id: dto.id,
    accessToken: dto.accessToken,
    recipientName: dto.recipientName,
    recipientType: dto.recipientType,
    cpaEmail: dto.cpaEmail ?? null,
    accessMode: dto.accessMode,
    sharedDataBlocks: dto.sharedDataBlocks ?? [],
    downloadPermission: dto.downloadPermission,
    hasPasscode: dto.hasPasscode,
    status: dto.status,
    expiresAt: dto.expiresAt ?? null,
  }
}

export function createTaxiqTipLedgerRepository(client: HttpClient = httpClient) {
  return {
    async getOwnerSummary(staffTaxYearId: string, filters?: TipLedgerFilters): Promise<TipLedgerSummary> {
      const data = await client.get<TipLedgerSummaryApiDto>(
        `/api/v1/taxiq/owner/tip-ledger?${buildQuery(staffTaxYearId, filters)}`,
      )
      return normalizeSummary(data as TipLedgerSummaryApiDto)
    },

    async getStaffSummary(staffTaxYearId: string, filters?: TipLedgerFilters): Promise<TipLedgerSummary> {
      const data = await client.get<TipLedgerSummaryApiDto>(
        `/api/v1/taxiq/staff/tip-ledger?${buildQuery(staffTaxYearId, filters)}`,
      )
      return normalizeSummary(data as TipLedgerSummaryApiDto)
    },

    async addTipAsOwner(params: AddTipLedgerEntryParams): Promise<string> {
      return await client.post<string>('/api/v1/taxiq/owner/tip-ledger', {
        ownerTaxYearId: params.ownerTaxYearId,
        staffTaxYearId: params.staffTaxYearId,
        date: params.date,
        method: params.method,
        amount: params.amount,
        serviceType: params.serviceType ?? null,
        serviceAmount: params.serviceAmount ?? null,
        isVoluntary: params.isVoluntary,
        isNotMandatoryServiceCharge: params.isNotMandatoryServiceCharge,
        proof: params.proof,
        note: params.note ?? null,
      })
    },

    async addTipAsStaff(params: AddTipLedgerEntryAsStaffParams): Promise<string> {
      return await client.post<string>('/api/v1/taxiq/staff/tip-ledger', {
        businessId: params.businessId,
        staffTaxYearId: params.staffTaxYearId,
        date: params.date,
        method: params.method,
        amount: params.amount,
        serviceType: params.serviceType ?? null,
        serviceAmount: params.serviceAmount ?? null,
        isVoluntary: params.isVoluntary,
        isNotMandatoryServiceCharge: params.isNotMandatoryServiceCharge,
        proof: params.proof,
        note: params.note ?? null,
      })
    },

    async editTip(id: string, params: EditTipLedgerEntryParams): Promise<void> {
      await client.put(`/api/v1/taxiq/owner/tip-ledger/${encodeURIComponent(id)}`, {
        date: params.date,
        method: params.method,
        amount: params.amount,
        serviceType: params.serviceType ?? null,
        serviceAmount: params.serviceAmount ?? null,
        isVoluntary: params.isVoluntary,
        isNotMandatoryServiceCharge: params.isNotMandatoryServiceCharge,
        proof: params.proof,
        note: params.note ?? null,
        reason: params.reason,
      })
    },

    async deleteTip(id: string, deleteReason: string): Promise<void> {
      await client.del(`/api/v1/taxiq/owner/tip-ledger/${encodeURIComponent(id)}`, {
        body: JSON.stringify({ deleteReason }),
      })
    },

    async exportForCpa(staffTaxYearId: string, params: ExportTipLedgerForCpaParams): Promise<ShareLink> {
      const data = await client.post<ShareLinkApiDto>(
        `/api/v1/taxiq/owner/tip-ledger/${encodeURIComponent(staffTaxYearId)}/export`,
        {
          recipientName: params.recipientName,
          recipientType: params.recipientType,
          cpaEmail: params.cpaEmail ?? null,
          accessMode: params.accessMode,
          downloadPermission: params.downloadPermission,
          passcode: params.passcode ?? null,
          expiryDays: params.expiryDays ?? null,
        },
      )
      return normalizeShareLink(data as ShareLinkApiDto)
    },
  }
}

export const taxiqTipLedgerRepository = createTaxiqTipLedgerRepository()
export default taxiqTipLedgerRepository
