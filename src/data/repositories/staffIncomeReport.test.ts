import { describe, expect, it, vi } from 'vitest'

import {
  StaffIncomeReportPeriod,
  StaffIncomeReportScope,
} from '../../constants/staffIncomeReport'
import {
  createStaffIncomeReportRepository,
  type StaffIncomeReportResponse,
} from './staffIncomeReport'

function createClientMock() {
  return {
    get: vi.fn(),
  }
}

const completeResponse = {
  filter: {
    scope: 'All',
    period: 'Daily',
    startDate: '2026-08-18',
    endDate: '2026-08-18',
  },
  summary: {
    income: 354.5,
    pay: 240,
    tip: 86.5,
    otherIncome: 28,
    paidAmount: 200,
    totalHours: 8,
    isEstimatedPay: true,
    turns: 6,
    service: 480,
    commission: 192,
    commissionPercent: 40,
    techTakes: 278.5,
  },
  sources: {
    posPay: 240,
    posTips: 3,
    qrTips: 83.5,
    manualTips: 0,
    directPayments: 0,
    selfReportedIncome: 28,
  },
  breakdown: [
    {
      date: '2026-08-18',
      income: 354.5,
      pay: 240,
      tip: 86.5,
      otherIncome: 28,
      paidAmount: 200,
      totalHours: 8,
      isEstimatedPay: true,
      turns: 6,
      service: 480,
      commission: 192,
      commissionPercent: 40,
      techTakes: 278.5,
    },
  ],
  businessBreakdown: [
    {
      businessId: 'salon-1',
      businessName: 'Bliss Nails',
      summary: {
        income: 326.5,
        pay: 240,
        tip: 86.5,
        otherIncome: 0,
        paidAmount: 200,
        totalHours: 8,
        isEstimatedPay: true,
        turns: 6,
        service: 480,
        commission: 192,
        commissionPercent: 40,
        techTakes: 278.5,
      },
      sources: {
        posPay: 240,
        posTips: 3,
        qrTips: 83.5,
        manualTips: 0,
        directPayments: 0,
        selfReportedIncome: 0,
      },
    },
  ],
} satisfies StaffIncomeReportResponse

describe('staffIncomeReportRepository', () => {
  it.each([
    {
      name: 'all sources',
      scope: { scope: StaffIncomeReportScope.All },
      expected: 'scope=All',
    },
    {
      name: 'one business',
      scope: { scope: StaffIncomeReportScope.Business, businessId: 'salon/rose' },
      expected: 'scope=Business&businessId=salon%2Frose',
    },
    {
      name: 'independent income',
      scope: { scope: StaffIncomeReportScope.Independent },
      expected: 'scope=Independent',
    },
  ])('serializes $name without unrelated scope parameters', async ({ scope, expected }) => {
    const client = createClientMock()
    client.get.mockResolvedValue(completeResponse)
    const repository = createStaffIncomeReportRepository(client as never)

    await repository.getIncomeReport({
      ...scope,
      period: StaffIncomeReportPeriod.Daily,
      date: '2026-08-18',
    } as Parameters<typeof repository.getIncomeReport>[0])

    expect(client.get).toHaveBeenCalledWith(
      `/api/v1/staff/reports/income?${expected}&period=Daily&date=2026-08-18`,
    )
    expect(client.get.mock.calls[0][0]).not.toContain('timezone')
    expect(client.get.mock.calls[0][0]).not.toContain('staffId')
  })

  it.each([
    {
      name: 'daily',
      period: { period: StaffIncomeReportPeriod.Daily, date: '2026-08-18' },
      expected: 'period=Daily&date=2026-08-18',
    },
    {
      name: 'weekly',
      period: { period: StaffIncomeReportPeriod.Weekly, weekStart: '2026-08-17' },
      expected: 'period=Weekly&weekStart=2026-08-17',
    },
    {
      name: 'monthly',
      period: { period: StaffIncomeReportPeriod.Monthly, month: 8, year: 2026 },
      expected: 'period=Monthly&month=8&year=2026',
    },
    {
      name: 'yearly',
      period: { period: StaffIncomeReportPeriod.Yearly, year: 2026 },
      expected: 'period=Yearly&year=2026',
    },
  ])('serializes only the $name time parameters', async ({ period, expected }) => {
    const client = createClientMock()
    client.get.mockResolvedValue(completeResponse)
    const repository = createStaffIncomeReportRepository(client as never)

    await repository.getIncomeReport({
      scope: StaffIncomeReportScope.All,
      ...period,
    } as Parameters<typeof repository.getIncomeReport>[0])

    expect(client.get).toHaveBeenCalledWith(
      `/api/v1/staff/reports/income?scope=All&${expected}`,
    )
  })

  it('preserves every response section and nullable POS metrics from the API', async () => {
    const client = createClientMock()
    const response = {
      ...completeResponse,
      summary: {
        ...completeResponse.summary,
        turns: null,
        service: null,
        commission: null,
        commissionPercent: null,
        techTakes: null,
      },
    }
    client.get.mockResolvedValue(response)
    const repository = createStaffIncomeReportRepository(client as never)

    const result = await repository.getIncomeReport({
      scope: StaffIncomeReportScope.Independent,
      period: StaffIncomeReportPeriod.Yearly,
      year: 2026,
    })

    expect(result).toEqual(response)
  })
})
