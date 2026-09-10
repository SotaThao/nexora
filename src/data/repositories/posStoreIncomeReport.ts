import httpClient from '../../lib/httpClient'
import {
  PosStoreIncomeReportMode,
  type PosStoreIncomePaymentMethod,
} from '../../constants/posStoreIncomeReport'

type HttpClient = typeof httpClient
type QueryParams = Record<string, string | number>

const BASE_PATH = '/api/v1/merchant/pos/reports/store-income'

export type PosStoreIncomeReportParams = {
  businessId: string
  mode: PosStoreIncomeReportMode
  date?: string
  year?: number
  from?: string
  to?: string
}

export type PosStoreIncomePaymentBreakdownItem = {
  paymentMethodType: PosStoreIncomePaymentMethod | string
  transactionCount: number
  amount: number
}

export type PosStoreIncomeTransactionGroup = {
  group: string
  transactionCount: number
  amount: number
}

export type PosStoreIncomeDaySummary = {
  paymentBreakdown: PosStoreIncomePaymentBreakdownItem[]
  incomeService: number
  servicesSubtotal: number
  serviceDiscounts: number
  productsSubtotal: number
  salesTax: number
  tips: number
  supplyFee: number
  merchantFee: number
  returnTransactionCount: number
  returnTransactionAmount: number
  totalCollected: number
  transactionGroups: PosStoreIncomeTransactionGroup[]
}

export type PosStoreIncomeBucket = {
  key: string
  start: string
  end: string
  transactionCount: number
  paymentAmounts: Record<string, number>
  tipAmount: number
  supplyFee: number
  totalCollected: number
}

export type PosStoreIncomeReport = {
  mode: PosStoreIncomeReportMode
  periodStart: string
  periodEnd: string
  generatedAtUtc: string
  daySummary: PosStoreIncomeDaySummary | null
  buckets: PosStoreIncomeBucket[]
  bucketsTotal: PosStoreIncomeBucket | null
}

function toQueryParams(params: PosStoreIncomeReportParams): QueryParams {
  const query: QueryParams = {
    businessId: params.businessId,
    mode: params.mode,
  }
  if (params.mode === PosStoreIncomeReportMode.Day || params.mode === PosStoreIncomeReportMode.Week) {
    if (params.date) query.date = params.date
  }
  if (params.mode === PosStoreIncomeReportMode.Year && params.year !== undefined) {
    query.year = params.year
  }
  if (params.mode === PosStoreIncomeReportMode.Range) {
    if (params.from) query.from = params.from
    if (params.to) query.to = params.to
  }
  return query
}

function normalizeReport(
  data: Partial<PosStoreIncomeReport> | null,
  fallbackMode: PosStoreIncomeReportMode,
): PosStoreIncomeReport {
  const daySummary = data?.daySummary
    ? {
        ...data.daySummary,
        supplyFee: data.daySummary.supplyFee ?? 0,
        incomeService: Math.round(((data.daySummary.servicesSubtotal ?? 0) - (data.daySummary.supplyFee ?? 0)) * 100) / 100,
        paymentBreakdown: data.daySummary.paymentBreakdown ?? [],
        transactionGroups: data.daySummary.transactionGroups ?? [],
      }
    : null
  return {
    mode: data?.mode ?? fallbackMode,
    periodStart: data?.periodStart ?? '',
    periodEnd: data?.periodEnd ?? '',
    generatedAtUtc: data?.generatedAtUtc ?? '',
    daySummary,
    buckets: (data?.buckets ?? []).map((bucket) => ({ ...bucket, supplyFee: bucket.supplyFee ?? 0 })),
    bucketsTotal: data?.bucketsTotal ? { ...data.bucketsTotal, supplyFee: data.bucketsTotal.supplyFee ?? 0 } : null,
  }
}

export function createPosStoreIncomeReportRepository(client: HttpClient = httpClient) {
  return {
    async getReport(params: PosStoreIncomeReportParams): Promise<PosStoreIncomeReport> {
      const data = await client.get<PosStoreIncomeReport>(BASE_PATH, {
        params: toQueryParams(params),
      })
      return normalizeReport(data, params.mode)
    },

    async exportPdf(params: PosStoreIncomeReportParams): Promise<Blob> {
      return await client.getBlob(`${BASE_PATH}/export.pdf`, {
        params: toQueryParams(params),
      })
    },

    async emailReport(params: PosStoreIncomeReportParams, toEmails: string[]): Promise<boolean> {
      return await client.post<boolean>(
        `${BASE_PATH}/email`,
        { toEmails },
        { params: toQueryParams(params) },
      )
    },
  }
}

export const posStoreIncomeReportRepository = createPosStoreIncomeReportRepository()
export default posStoreIncomeReportRepository
