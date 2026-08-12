import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import { useMerchantStaffByCode } from '../../../data/hooks/useMerchantStaff'
import {
  StaffDetailRouteContent,
  StaffListRouteContent,
} from './StaffManagementRouteContent'
import { STAFF_ROUTE_FAMILY } from './staffRoutePaths'

vi.mock('../views/StaffView', () => ({
  default: ({ onViewDetail }: { onViewDetail: (member: LooseObject) => void }) => (
    <button type="button" onClick={() => onViewDetail({ staffCode: 'NEX-1' })}>
      Open Staff
    </button>
  ),
}))

vi.mock('../../../data/hooks/useMerchantStaff', () => ({
  useMerchantStaffByCode: vi.fn(),
}))

vi.mock('../../StaffDetailView', () => ({
  default: () => <div>Staff detail</div>,
}))

function LocationProbe() {
  return <div data-testid="location">{useLocation().pathname}</div>
}

const outletContext = {
  filteredStaff: [],
  pendingStaff: [],
  staff: [],
  staffLoading: false,
  staffListLoading: false,
  staffListFetching: false,
  activeStaffPage: 1,
  activeStaffPageSize: 10,
  activeStaffTotalPages: 1,
  activeStaffTotalCount: 0,
  activeStaffHasNext: false,
  activeStaffHasPrev: false,
  setActiveStaffPage: vi.fn(),
  setInviteShareDefaultName: vi.fn(),
  setInviteShareDefaultContact: vi.fn(),
  setIsInviteShareOpen: vi.fn(),
}

describe('StaffManagementRouteContent', () => {
  it('keeps desktop list-to-detail navigation inside Settings', () => {
    render(
      <MemoryRouter initialEntries={['/dashboard/settings/staff']}>
        <Routes>
          <Route element={<Outlet context={outletContext} />}>
            <Route
              path="/dashboard/settings/staff"
              element={
                <StaffListRouteContent routeFamily={STAFF_ROUTE_FAMILY.Settings} />
              }
            />
            <Route path="*" element={<LocationProbe />} />
          </Route>
        </Routes>
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Open Staff' }))

    expect(screen.getByTestId('location')).toHaveTextContent(
      '/dashboard/settings/staff/NEX-1',
    )
  })

  it('returns an invalid desktop detail to the Settings Staff list', () => {
    vi.mocked(useMerchantStaffByCode).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
    } as ReturnType<typeof useMerchantStaffByCode>)

    render(
      <MemoryRouter initialEntries={['/dashboard/settings/staff/missing']}>
        <Routes>
          <Route element={<Outlet context={outletContext} />}>
            <Route
              path="/dashboard/settings/staff/:staffId"
              element={
                <StaffDetailRouteContent routeFamily={STAFF_ROUTE_FAMILY.Settings} />
              }
            />
            <Route path="/dashboard/settings/staff" element={<LocationProbe />} />
          </Route>
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByTestId('location')).toHaveTextContent('/dashboard/settings/staff')
  })
})
