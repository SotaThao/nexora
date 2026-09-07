import httpClient from '../../lib/httpClient'
import {
  PosServiceIncomeReportMode,
  PosServiceIncomeRowType,
} from '../../constants/posServiceIncomeReport'

type HttpClient = typeof httpClient
type QueryParams = Record<string, string | number>

const BASE_PATH = '/api/v1/merchant/pos/reports/service-income'

export type PosServiceIncomeReportParams = {
  businessId: string
  mode: PosServiceIncomeReportMode
  /** yyyy-MM-dd anchor for Day / Week / Month — the server derives the week and month bounds. */
  date?: string
  from?: string
  to?: string
}

export type PosServiceIncomeLinesParams = PosServiceIncomeReportParams & {
  rowType: PosServiceIncomeRowType
  /** Required for Service / AddOn, and must stay unset for Custom. */
  rowId?: string | null
  pageNumber?: number
  pageSize?: number
}

export type PosServiceIncomeRow = {
  rowType: PosServiceIncomeRowType
  /** ServiceId for a Service row, ServiceAddOnId for an AddOn row, null for the Custom row. */
  rowId: string | null
  /** Null on the Custom row — the caller renders a translated label instead. */
  name: string | null
  parentServiceName: string | null
  isInactive: boolean
  grossRevenue: number
  discountTotal: number
  netRevenue: number
  completedCount: number
}

export type PosServiceIncomeTotals = {
  servicesGross: number
  serviceDiscountTotal: number
  servicesNet: number
  completedCount: number
}

export type PosServiceIncomeReport = {
  mode: PosServiceIncomeReportMode
  periodStart: string
  periodEnd: string
  generatedAtUtc: string
  /** Sorted by netRevenue desc by the server. */
  rows: PosServiceIncomeRow[]
  totals: PosServiceIncomeTotals
}

export type PosServiceIncomeLine = {
  orderNumber: string
  completedAtLocal: string
  customerName: string | null
  technicianName: string | null
  quantity: number
  grossAmount: number
  lineDiscount: number
  allocatedOrderDiscount: number
  netAmount: number
}

export type PosServiceIncomeLinePage = {
  items: PosServiceIncomeLine[]
  pageNumber: number
  totalPages: number
  totalCount: number
  hasPreviousPage: boolean
  hasNextPage: boolean
}

function toNumber(value: unknown): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

/**
 * The only place a raw backend enum literal is allowed (AGENTS.md): the report is served with
 * string enum names, but a numeric-enum serializer would send the ordinals from
 * `PosServiceIncomeRowType.cs` instead, and a mislabelled row would silently query the wrong lines.
 */
const ROW_TYPE_BY_ORDINAL: Record<number, PosServiceIncomeRowType> = {
  0: PosServiceIncomeRowType.Service,
  1: PosServiceIncomeRowType.AddOn,
  2: PosServiceIncomeRowType.Custom,
}

function normalizeRowType(value: unknown): PosServiceIncomeRowType {
  if (typeof value === 'number') return ROW_TYPE_BY_ORDINAL[value] ?? PosServiceIncomeRowType.Custom
  const known = Object.values(PosServiceIncomeRowType).find((item) => item === value)
  return known ?? PosServiceIncomeRowType.Custom
}

function normalizeMode(value: unknown, fallback: PosServiceIncomeReportMode): PosServiceIncomeReportMode {
  return Object.values(PosServiceIncomeReportMode).find((item) => item === value) ?? fallback
}

function periodQueryParams(params: PosServiceIncomeReportParams): QueryParams {
  const query: QueryParams = {
    businessId: params.businessId,
    mode: params.mode,
  }
  if (params.mode === PosServiceIncomeReportMode.Range) {
    if (params.from) query.from = params.from
    if (params.to) query.to = params.to
  } else if (params.date) {
    query.date = params.date
  }
  return query
}

function linesQueryParams(params: PosServiceIncomeLinesParams): QueryParams {
  const query = periodQueryParams(params)
  query.rowType = params.rowType
  if (params.rowType !== PosServiceIncomeRowType.Custom && params.rowId) {
    query.rowId = params.rowId
  }
  query.pageNumber = params.pageNumber ?? 1
  query.pageSize = params.pageSize ?? 20
  return query
}

function normalizeRow(row: Partial<PosServiceIncomeRow> | null): PosServiceIncomeRow {
  return {
    rowType: normalizeRowType(row?.rowType),
    rowId: row?.rowId ?? null,
    name: row?.name ?? null,
    parentServiceName: row?.parentServiceName ?? null,
    isInactive: Boolean(row?.isInactive),
    grossRevenue: toNumber(row?.grossRevenue),
    discountTotal: toNumber(row?.discountTotal),
    netRevenue: toNumber(row?.netRevenue),
    completedCount: toNumber(row?.completedCount),
  }
}

function normalizeReport(
  data: Partial<PosServiceIncomeReport> | null,
  fallbackMode: PosServiceIncomeReportMode,
): PosServiceIncomeReport {
  return {
    mode: normalizeMode(data?.mode, fallbackMode),
    periodStart: data?.periodStart ?? '',
    periodEnd: data?.periodEnd ?? '',
    generatedAtUtc: data?.generatedAtUtc ?? '',
    rows: (data?.rows ?? []).map(normalizeRow),
    totals: {
      servicesGross: toNumber(data?.totals?.servicesGross),
      serviceDiscountTotal: toNumber(data?.totals?.serviceDiscountTotal),
      servicesNet: toNumber(data?.totals?.servicesNet),
      completedCount: toNumber(data?.totals?.completedCount),
    },
  }
}

function normalizeLine(line: Partial<PosServiceIncomeLine> | null): PosServiceIncomeLine {
  return {
    orderNumber: line?.orderNumber ?? '',
    completedAtLocal: line?.completedAtLocal ?? '',
    customerName: line?.customerName ?? null,
    technicianName: line?.technicianName ?? null,
    quantity: toNumber(line?.quantity),
    grossAmount: toNumber(line?.grossAmount),
    lineDiscount: toNumber(line?.lineDiscount),
    allocatedOrderDiscount: toNumber(line?.allocatedOrderDiscount),
    netAmount: toNumber(line?.netAmount),
  }
}

function normalizeLinePage(
  data: Partial<PosServiceIncomeLinePage> | null,
  requestedPage: number,
): PosServiceIncomeLinePage {
  const items = (data?.items ?? []).map(normalizeLine)
  return {
    items,
    pageNumber: toNumber(data?.pageNumber) || requestedPage,
    totalPages: Math.max(1, toNumber(data?.totalPages) || 1),
    totalCount: toNumber(data?.totalCount) || items.length,
    hasPreviousPage: Boolean(data?.hasPreviousPage),
    hasNextPage: Boolean(data?.hasNextPage),
  }
}

export function createPosServiceIncomeReportRepository(client: HttpClient = httpClient) {
  return {
    async getReport(params: PosServiceIncomeReportParams): Promise<PosServiceIncomeReport> {
      const data = await client.get<PosServiceIncomeReport>(BASE_PATH, {
        params: periodQueryParams(params),
      })
      return normalizeReport(data, params.mode)
    },

    async getLines(params: PosServiceIncomeLinesParams): Promise<PosServiceIncomeLinePage> {
      const data = await client.get<PosServiceIncomeLinePage>(`${BASE_PATH}/lines`, {
        params: linesQueryParams(params),
      })
      return normalizeLinePage(data, params.pageNumber ?? 1)
    },
  }
}

export const posServiceIncomeReportRepository = createPosServiceIncomeReportRepository()
export default posServiceIncomeReportRepository
