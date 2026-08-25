/**
 * weeklyPayrollRepository — TaxIQ/POS Weekly Payroll (mục 14, US-25 backend).
 * Reads real Hours/Sales/Tips computed from Pay Engine (US-23) + Clock-In/Out (US-24),
 * pays staff by reusing the existing Payout Confirm/Dispute flow.
 */
import httpClient from '../../lib/httpClient'

type HttpClient = typeof httpClient

export interface WeeklyPayrollStaffRow {
  businessStaffLinkId: string
  posStaffProfileId: string
  displayName: string
  photoUrl?: string | null
  payStructureType: string
  contractType?: string | null
  hours: number
  sales: number
  hourlyPay: number
  commission: number
  bonus: number
  tips: number
  /** Service discounts this technician agreed to absorb. Deducted from pay, never from tips. */
  discountBorne: number
  takeHome: number
  // Ready | Review | PayrollTax | Paid
  status: string
  canPay: boolean
  canOverride: boolean
  payoutId?: string | null
}

export interface WeeklyPayroll {
  weekStart: string
  weekEnd: string
  totalWeeklyPay: number
  totalSales: number
  totalTips: number
  totalBonus: number
  staff: WeeklyPayrollStaffRow[]
}

export interface DiscountBorneDetail {
  serviceName: string
  amount: number
  note?: string | null
}

export interface DailyDetailRow {
  date: string
  services: string[]
  hours: number
  sales: number
  tips: number
  discountBorne: number
  discountDetails: DiscountBorneDetail[]
  estimatedPay: number
}

export interface WeeklyPayrollDailyDetail {
  weekStart: string
  weekEnd: string
  displayName: string
  days: DailyDetailRow[]
  totalHours: number
  totalSales: number
  totalTips: number
  totalDiscountBorne: number
  totalEstimatedPay: number
}

export interface PayWeeklyPayrollParams {
  businessStaffLinkId: string
  weekStart?: string
  evidenceUrls?: string[] | null
  overrideNote?: string | null
}

export interface PayAllWeeklyPayrollParams {
  weekStart?: string
  evidenceUrls?: string[] | null
}

export interface PayAllWeeklyPayrollSkipped {
  businessStaffLinkId: string
  displayName: string
  reason: string
}

export interface PayAllWeeklyPayrollResult {
  paidCount: number
  totalPaid: number
  payoutIds: string[]
  skipped: PayAllWeeklyPayrollSkipped[]
}

function withWeekStart(path: string, weekStart?: string) {
  return weekStart ? `${path}?weekStart=${encodeURIComponent(weekStart)}` : path
}

export function createWeeklyPayrollRepository(client: HttpClient = httpClient) {
  return {
    async getWeeklyPayroll(weekStart?: string): Promise<WeeklyPayroll> {
      return await client.get<WeeklyPayroll>(withWeekStart('/api/v1/merchant/pos/weekly-payroll', weekStart))
    },

    async getDailyDetail(businessStaffLinkId: string, weekStart?: string): Promise<WeeklyPayrollDailyDetail> {
      return await client.get<WeeklyPayrollDailyDetail>(
        withWeekStart(`/api/v1/merchant/pos/weekly-payroll/${encodeURIComponent(businessStaffLinkId)}/daily-detail`, weekStart),
      )
    },

    async pay(params: PayWeeklyPayrollParams): Promise<string> {
      const { businessStaffLinkId, weekStart, ...body } = params
      return await client.post<string>(
        withWeekStart(`/api/v1/merchant/pos/weekly-payroll/${encodeURIComponent(businessStaffLinkId)}/pay`, weekStart),
        body,
      )
    },

    async payAll(params: PayAllWeeklyPayrollParams): Promise<PayAllWeeklyPayrollResult> {
      const { weekStart, ...body } = params
      return await client.post<PayAllWeeklyPayrollResult>(
        withWeekStart('/api/v1/merchant/pos/weekly-payroll/pay-all', weekStart),
        body,
      )
    },

    async exportCsv(weekStart?: string): Promise<Blob> {
      return await client.getBlob(withWeekStart('/api/v1/merchant/pos/weekly-payroll/export.csv', weekStart))
    },
  }
}

export const weeklyPayrollRepository = createWeeklyPayrollRepository()
export default weeklyPayrollRepository
