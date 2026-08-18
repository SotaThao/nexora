import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

import AppRouter from '../app/AppRouter'

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
