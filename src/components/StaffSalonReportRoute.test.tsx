import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

import AppRouter from '../app/AppRouter'
import StaffHeaderDesktop from './staff-dashboard/layout/StaffHeader.desktop'

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

vi.mock('../components/staff-dashboard/views/StaffSalonReport', () => ({
  default: () => <div>Salon report route content</div>,
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
  Object.defineProperty(window, 'scrollTo', {
    configurable: true,
    value: vi.fn(),
  })
})

it('renders the staff salon report route for an authenticated staff member', async () => {
  render(
    <MemoryRouter
      initialEntries={['/staff/salons/report']}
      future={{ v7_relativeSplatPath: true, v7_startTransition: true }}
    >
      <AppRouter />
    </MemoryRouter>,
  )

  expect(await screen.findByText('Salon report route content')).toBeInTheDocument()
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
