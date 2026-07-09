/**
 * taxiqCpaViewerRepository — public, token-authenticated API for the CPA External
 * Viewer (US-10 Phần B). No JWT: every call passes `{ anonymous: true }` so
 * httpClient skips attaching the Bearer token and skips the 401-refresh retry loop
 * (see src/lib/httpClient.ts requestInterceptor + `anonymous` flag).
 */
import httpClient from '../../lib/httpClient'

type HttpClient = typeof httpClient

export interface CpaDeductionApiDto {
  id: string
  categoryId: string
  categoryName: string
  description: string
  amount: number
  deductibleAmount: number
  date: string
  vendorName?: string | null
  businessUsePercent?: number | null
  smartFieldValues?: string | null
  recordStatus: string
  aiDeductionStatus?: string | null
  aiExplanation?: string | null
  cpaNotes?: string | null
  receiptCount: number
}

export interface CpaDeduction {
  id: string
  categoryId: string
  categoryName: string
  description: string
  amount: number
  deductibleAmount: number
  date: string
  vendorName: string | null
  businessUsePercent: number | null
  smartFieldValues: string | null
  recordStatus: string
  aiDeductionStatus: string | null
  aiExplanation: string | null
  cpaNotes: string | null
  receiptCount: number
}

function normalizeCpaDeduction(dto: CpaDeductionApiDto): CpaDeduction {
  return {
    id: dto.id,
    categoryId: dto.categoryId,
    categoryName: dto.categoryName,
    description: dto.description,
    amount: dto.amount,
    deductibleAmount: dto.deductibleAmount,
    date: dto.date,
    vendorName: dto.vendorName ?? null,
    businessUsePercent: dto.businessUsePercent ?? null,
    smartFieldValues: dto.smartFieldValues ?? null,
    recordStatus: dto.recordStatus,
    aiDeductionStatus: dto.aiDeductionStatus ?? null,
    aiExplanation: dto.aiExplanation ?? null,
    cpaNotes: dto.cpaNotes ?? null,
    receiptCount: dto.receiptCount,
  }
}

export interface CpaPayoutApiDto {
  id: string
  staffName?: string | null
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
}

export interface CpaPayout {
  id: string
  staffName: string | null
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
}

function normalizeCpaPayout(dto: CpaPayoutApiDto): CpaPayout {
  return {
    id: dto.id,
    staffName: dto.staffName ?? null,
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
  }
}

export interface CpaPackageApiDto {
  grantId: string
  packageType: string
  dataMode: string
  expiresAt: string
  deductions: CpaDeductionApiDto[]
  payouts: CpaPayoutApiDto[]
}

export interface CpaPackage {
  grantId: string
  packageType: string
  dataMode: string
  expiresAt: string
  deductions: CpaDeduction[]
  payouts: CpaPayout[]
}

function normalizeCpaPackage(dto: CpaPackageApiDto): CpaPackage {
  return {
    grantId: dto.grantId,
    packageType: dto.packageType,
    dataMode: dto.dataMode,
    expiresAt: dto.expiresAt,
    deductions: (dto.deductions ?? []).map(normalizeCpaDeduction),
    payouts: (dto.payouts ?? []).map(normalizeCpaPayout),
  }
}

export interface AddCpaNoteParams {
  deductionRecordId: string
  cpaNotes: string
  cpaAccessToken: string
}

export function createTaxiqCpaViewerRepository(client: HttpClient = httpClient) {
  return {
    async getPackage(token: string): Promise<CpaPackage> {
      const data = await client.get<CpaPackageApiDto>(
        `/api/v1/taxiq/cpa-access/package?token=${encodeURIComponent(token)}`,
        { anonymous: true },
      )
      return normalizeCpaPackage(data as CpaPackageApiDto)
    },

    async addNote(params: AddCpaNoteParams): Promise<void> {
      await client.post<void>(
        '/api/v1/taxiq/cpa-access/notes',
        {
          deductionRecordId: params.deductionRecordId,
          cpaNotes: params.cpaNotes,
          cpaAccessToken: params.cpaAccessToken,
        },
        { anonymous: true },
      )
    },
  }
}

export const taxiqCpaViewerRepository = createTaxiqCpaViewerRepository()
export default taxiqCpaViewerRepository
