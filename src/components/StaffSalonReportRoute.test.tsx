import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

import AppRouter from '../app/AppRouter'
import StaffHeaderDesktop from './staff-dashboard/layout/StaffHeader.desktop'

const staffSelfRepositoryMock = vi.hoisted(() => ({
  getMyBusinesses: vi.fn(),
}))

const staffIncomeReportRepositoryMock = vi.hoisted(() => ({
  getIncomeReport: vi.fn(),
}))

vi.mock('../auth/useAuth', () => ({
  useAuth: () => ({
    session: {
      id: 'staff-user-1',
      email: 'staff@example.com',
      accountType: 'personal',
      role: 'staff',
      staffId: 'staff-1',
      hasStaffProfile: true,
    },
    status: 'authenticated',
    logout: vi.fn(),
  }),
  default: () => ({
    session: {
      id: 'staff-user-1',
      email: 'staff@example.com',
      accountType: 'personal',
      role: 'staff',
      staffId: 'staff-1',
      hasStaffProfile: true,
    },
    status: 'authenticated',
    logout: vi.fn(),
  }),
}))

vi.mock('../components/staff-dashboard/StaffDashboard', async () => {
  const { Outlet } = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return { default: () => <Outlet /> }
})

vi.mock('../auth/useSessionRole', () => ({
  useSessionRole: () => ({
    isStaff: true,
    session: { id: 'staff-user-1' },
  }),
}))

vi.mock('../data/repositories/staffSelf', () => ({
  default: staffSelfRepositoryMock,
}))

vi.mock('../data/repositories/staffIncomeReport', () => ({
  default: staffIncomeReportRepositoryMock,
}))

vi.mock('../contexts/StaffAccountContext', () => ({
  useStaffAccount: () => ({
    staffMember: { id: 'staff-1', fullName: 'Staff Member' },
    account: {
      avatar: null,
      defaultDisplayName: 'Staff Member',
      fullName: 'Staff Member',
      staffCode: 'S001',
    },
  }),
}))

vi.mock('../data/hooks/useNotifications', () => ({
  useUnreadCount: () => ({ data: 0 }),
  useNotifications: () => ({ data: [], isLoading: false }),
  useMarkNotificationRead: () => ({ mutate: vi.fn() }),
  useMarkAllNotificationsRead: () => ({ mutate: vi.fn(), isPending: false }),
}))

beforeEach(() => {
  vi.clearAllMocks()
  staffSelfRepositoryMock.getMyBusinesses.mockResolvedValue([
    {
      businessId: 'salon-bliss',
      businessName: 'Bliss Nails',
      linkStatus: '1',
      linkStatusLabel: 'Active',
    },
  ])
  staffIncomeReportRepositoryMock.getIncomeReport.mockResolvedValue({
    filter: { scope: 'All', period: 'Daily' },
    summary: {
      income: 306.5,
      pay: 192,
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
      posPay: 192,
      posTips: 3,
      qrTips: 83.5,
      manualTips: 0,
      directPayments: 0,
      selfReportedIncome: 28,
    },
    breakdown: [],
    businessBreakdown: [],
  })
  Object.defineProperty(window, 'scrollTo', {
    configurable: true,
    value: vi.fn(),
  })
})

it('runs the authenticated report route through source and period changes', async () => {
  render(
    <MemoryRouter
      initialEntries={['/staff/salons/report']}
      future={{ v7_relativeSplatPath: true, v7_startTransition: true }}
    >
      <AppRouter />
    </MemoryRouter>,
  )

  const table = await screen.findByRole('table')
  expect(screen.getByRole('heading', { name: 'Income Report' })).toBeInTheDocument()
  expect(within(table).getAllByRole('columnheader').map((header) => header.textContent)).toEqual([
    'Income',
    'Pay',
    'Tip',
    'Other Income',
    'Paid Amount',
  ])
  expect(within(table).getAllByRole('cell').map((cell) => cell.textContent)).toEqual([
    '$306.50',
    '$192.00',
    '$86.50',
    '$28.00',
    '$200.00',
  ])

  const sourceFilter = await screen.findByRole('combobox', { name: 'Report Scope' })
  await screen.findByRole('option', { name: 'Bliss Nails' })
  fireEvent.change(sourceFilter, { target: { value: 'salon-bliss' } })
  fireEvent.click(screen.getByRole('tab', { name: 'Weekly' }))

  await waitFor(() => expect(staffIncomeReportRepositoryMock.getIncomeReport).toHaveBeenLastCalledWith(
    expect.objectContaining({
      scope: 'Business',
      businessId: 'salon-bliss',
      period: 'Weekly',
    }),
  ))
  await waitFor(() => expect(
    within(screen.getByRole('table')).getAllByRole('columnheader').map((header) => header.textContent),
  ).toEqual([
    'Turns',
    'Hours',
    'Service',
    'Pay',
    'Commission',
    'Comm %',
    'Tip',
    'Tech Takes',
  ]))
})

it('shows Report as the staff header title', () => {
  render(
    <MemoryRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
      <StaffHeaderDesktop
        activeScreen="report"
        onNavigate={vi.fn()}
        onOpenMobileMenu={vi.fn()}
        onLogout={vi.fn()}
      />
    </MemoryRouter>,
  )

  expect(screen.getByRole('heading', { name: 'Report' })).toBeInTheDocument()
  expect(screen.queryByRole('heading', { name: 'Salon Report' })).not.toBeInTheDocument()
})
