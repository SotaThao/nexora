import type { ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'

import {
  StaffIncomeReportPeriod,
  StaffIncomeReportScope,
} from '../../constants/staffIncomeReport'
import { qk } from '../queryKeys'
import staffIncomeReportRepository from '../repositories/staffIncomeReport'
import { useStaffIncomeReport } from './useStaffIncomeReport'

const sessionRoleMock = vi.hoisted(() => ({
  current: {
    isStaff: true,
    session: { id: 'staff-user-1' },
  },
}))

vi.mock('../../auth/useSessionRole', () => ({
  useSessionRole: () => sessionRoleMock.current,
}))

vi.mock('../repositories/staffIncomeReport', () => ({
  default: {
    getIncomeReport: vi.fn(),
  },
}))

const repositoryMock = vi.mocked(staffIncomeReportRepository)

const report = {
  filter: { scope: 'Business', period: 'Monthly' },
  summary: {
    income: 1500,
    pay: 1000,
    tip: 400,
    otherIncome: 100,
    paidAmount: 1200,
    totalHours: 88,
    isEstimatedPay: true,
    turns: 70,
    service: 2500,
    commission: 1000,
    commissionPercent: 40,
    techTakes: 1400,
  },
  sources: {
    posPay: 1000,
    posTips: 100,
    qrTips: 300,
    manualTips: 0,
    directPayments: 0,
    selfReportedIncome: 100,
  },
  breakdown: [],
  businessBreakdown: [],
}

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

describe('useStaffIncomeReport', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    sessionRoleMock.current = {
      isStaff: true,
      session: { id: 'staff-user-1' },
    }
  })

  it('scopes the query key and repository request by every report filter', async () => {
    repositoryMock.getIncomeReport.mockResolvedValue(report)
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    const params = {
      scope: StaffIncomeReportScope.Business,
      businessId: 'salon-rose',
      period: StaffIncomeReportPeriod.Monthly,
      month: 8,
      year: 2026,
    } as const

    const { result } = renderHook(() => useStaffIncomeReport(params), {
      wrapper: createWrapper(queryClient),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toEqual(report)
    expect(repositoryMock.getIncomeReport).toHaveBeenCalledWith(params)
    expect(qk.staffIncomeReport('staff-user-1', params)).toEqual([
      'staffIncomeReport',
      'staff-user-1',
      {
        scope: 'Business',
        businessId: 'salon-rose',
        period: 'Monthly',
        month: 8,
        year: 2026,
      },
    ])
  })

  it('does not reuse cached income data after the authenticated staff identity changes', async () => {
    const firstReport = {
      ...report,
      summary: { ...report.summary, income: 100 },
    }
    const secondReport = {
      ...report,
      summary: { ...report.summary, income: 200 },
    }
    repositoryMock.getIncomeReport
      .mockResolvedValueOnce(firstReport)
      .mockResolvedValueOnce(secondReport)
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, staleTime: Infinity } },
    })
    const params = {
      scope: StaffIncomeReportScope.All,
      period: StaffIncomeReportPeriod.Daily,
      date: '2026-08-18',
    } as const

    const { result, rerender } = renderHook(() => useStaffIncomeReport(params), {
      wrapper: createWrapper(queryClient),
    })

    await waitFor(() => expect(result.current.data?.summary.income).toBe(100))

    sessionRoleMock.current = {
      isStaff: true,
      session: { id: 'staff-user-2' },
    }
    rerender()

    await waitFor(() => expect(result.current.data?.summary.income).toBe(200))
    expect(repositoryMock.getIncomeReport).toHaveBeenCalledTimes(2)
  })
})
