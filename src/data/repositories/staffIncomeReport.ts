import {
  StaffIncomeReportPeriod,
  StaffIncomeReportScope,
} from '../../constants/staffIncomeReport'
import httpClient from '../../lib/httpClient'

type HttpClient = typeof httpClient

export type StaffIncomeReportScopeParams =
  | { scope: StaffIncomeReportScope.All }
  | { scope: StaffIncomeReportScope.Business; businessId: string }
  | { scope: StaffIncomeReportScope.Independent }

export type StaffIncomeReportPeriodParams =
  | { period: StaffIncomeReportPeriod.Daily; date: string }
  | { period: StaffIncomeReportPeriod.Weekly; weekStart: string }
  | { period: StaffIncomeReportPeriod.Monthly; month: number; year: number }
  | { period: StaffIncomeReportPeriod.Yearly; year: number }

export type StaffIncomeReportParams = StaffIncomeReportScopeParams & StaffIncomeReportPeriodParams

export interface StaffIncomeReportSummary {
  income: number
  pay: number
  tip: number
  otherIncome: number
  paidAmount: number
  totalHours: number
  isEstimatedPay: boolean
  turns: number | null
  service: number | null
  commission: number | null
  commissionPercent: number | null
  techTakes: number | null
}

export interface StaffIncomeReportSources {
  posPay: number
  posTips: number
  qrTips: number
  manualTips: number
  directPayments: number
  selfReportedIncome: number
}

export interface StaffIncomeReportBreakdownItem extends Record<string, unknown> {
  turns: number | null
  service: number | null
  commission: number | null
  commissionPercent: number | null
  techTakes: number | null
}

export interface StaffIncomeBusinessBreakdownItem extends Record<string, unknown> {
  summary: StaffIncomeReportSummary
  sources: StaffIncomeReportSources
}

export interface StaffIncomeReportResponse {
  filter: Record<string, unknown>
  summary: StaffIncomeReportSummary
  sources: StaffIncomeReportSources
  breakdown: StaffIncomeReportBreakdownItem[]
  businessBreakdown: StaffIncomeBusinessBreakdownItem[]
}

function buildIncomeReportQuery(params: StaffIncomeReportParams): string {
  const query = new URLSearchParams()
  query.set('scope', params.scope)

  if (params.scope === StaffIncomeReportScope.Business) {
    query.set('businessId', params.businessId)
  }

  query.set('period', params.period)

  switch (params.period) {
    case StaffIncomeReportPeriod.Daily:
      query.set('date', params.date)
      break
    case StaffIncomeReportPeriod.Weekly:
      query.set('weekStart', params.weekStart)
      break
    case StaffIncomeReportPeriod.Monthly:
      query.set('month', String(params.month))
      query.set('year', String(params.year))
      break
    case StaffIncomeReportPeriod.Yearly:
      query.set('year', String(params.year))
      break
  }

  return query.toString()
}

export function createStaffIncomeReportRepository(client: HttpClient = httpClient) {
  return {
    async getIncomeReport(params: StaffIncomeReportParams): Promise<StaffIncomeReportResponse> {
      return client.get<StaffIncomeReportResponse>(
        `/api/v1/staff/reports/income?${buildIncomeReportQuery(params)}`,
      )
    },
  }
}

export const staffIncomeReportRepository = createStaffIncomeReportRepository()
export default staffIncomeReportRepository
