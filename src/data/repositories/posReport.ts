/**
 * posReportRepository — Front Desk -> Report (backend T4/T5).
 * Read-only per-technician operations report: turns, hours, gross service revenue, commission,
 * tips, the discount the technician absorbed, and take-home. Pay actions live in Weekly Payroll,
 * not here.
 */
import httpClient from '../../lib/httpClient'
import { PosReportMode } from '../../constants/posReportMode'

type HttpClient = typeof httpClient

const BASE_PATH = '/api/v1/merchant/pos/reports/staff'

export interface PosReportRow {
  businessStaffLinkId: string
  posStaffProfileId: string
  displayName: string
  photoUrl?: string | null
  payStructureType: string
  isInactive: boolean
  turns: number
  hours: number
  serviceAmount: number
  /** Null for pay structures that earn no commission (Hourly / Weekly Salary / Agreed Amount). */
  commissionPercent?: number | null
  /** True when the percent came from a Tiered bracket rather than a flat configured rate. */
  isCommissionPercentEstimated: boolean
  commission: number
  tips: number
  discount: number
  techTakes: number
  weeklyGuarantee?: number | null
}

export interface PosReportTotals {
  turns: number
  hours: number
  serviceAmount: number
  commission: number
  tips: number
  discount: number
  techTakes: number
}

export interface PosReportPeriod {
  key: string
  start: string
  end: string
}

export interface PosStaffReport {
  mode: string
  periods: PosReportPeriod[]
  rows: PosReportRow[]
  totals: PosReportTotals
  generatedAtUtc: string
}

export interface PosReportParams {
  businessId: string
  mode: PosReportMode
  dates?: string[]
  weeks?: string[]
  month?: string
}

type QueryParams = Record<string, string | number | boolean | string[] | number[]>

/** Only the parameter matching the mode is sent — the backend validator rejects the others. */
function toQueryParams(params: PosReportParams): QueryParams {
  const query: QueryParams = {
    businessId: params.businessId,
    mode: params.mode,
  }
  if (params.mode === PosReportMode.Daily) query.dates = params.dates ?? []
  if (params.mode === PosReportMode.Weekly) query.weeks = params.weeks ?? []
  if (params.mode === PosReportMode.Monthly) query.month = params.month ?? ''
  return query
}

export function createPosReportRepository(client: HttpClient = httpClient) {
  return {
    async getStaffReport(params: PosReportParams): Promise<PosStaffReport> {
      const data = await client.get<PosStaffReport>(BASE_PATH, { params: toQueryParams(params) })
      return {
        mode: data?.mode ?? params.mode,
        periods: data?.periods ?? [],
        rows: data?.rows ?? [],
        totals: data?.totals ?? {
          turns: 0, hours: 0, serviceAmount: 0, commission: 0, tips: 0, discount: 0, techTakes: 0,
        },
        generatedAtUtc: data?.generatedAtUtc ?? '',
      }
    },

    async exportStaffReportCsv(params: PosReportParams): Promise<Blob> {
      return await client.getBlob(`${BASE_PATH}/export.csv`, { params: toQueryParams(params) })
    },
  }
}

const posReportRepository = createPosReportRepository()
export default posReportRepository
