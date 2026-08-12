import type { ReactNode } from 'react'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { useIsMobileUI } from '../../../hooks/useIsMobileUI'
import ResponsiveStaffRoute from './ResponsiveStaffRoute'
import { buildStaffRoutePath, STAFF_ROUTE_FAMILY } from './staffRoutePaths'

vi.mock('../../../hooks/useIsMobileUI', () => ({
  useIsMobileUI: vi.fn(),
}))

function LocationProbe() {
  return <div data-testid="location">{useLocation().pathname}</div>
}

function renderBoundary({
  initialPath,
  family,
  staffId,
  children,
}: {
  initialPath: string
  family: 'legacy' | 'settings'
  staffId?: string
  children: ReactNode
}) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <ResponsiveStaffRoute family={family} staffId={staffId}>
        {children}
      </ResponsiveStaffRoute>
      <LocationProbe />
    </MemoryRouter>,
  )
}

describe('ResponsiveStaffRoute', () => {
  it('redirects a legacy detail URL to Settings on desktop', () => {
    vi.mocked(useIsMobileUI).mockReturnValue(false)
    renderBoundary({
      initialPath: '/dashboard/staff/NEX-1',
      family: STAFF_ROUTE_FAMILY.Legacy,
      staffId: 'NEX-1',
      children: <div>legacy content</div>,
    })

    expect(screen.getByTestId('location')).toHaveTextContent(
      '/dashboard/settings/staff/NEX-1',
    )
    expect(screen.queryByText('legacy content')).not.toBeInTheDocument()
  })

  it('redirects a Settings detail URL to legacy Staff on mobile', () => {
    vi.mocked(useIsMobileUI).mockReturnValue(true)
    renderBoundary({
      initialPath: '/dashboard/settings/staff/NEX-1',
      family: STAFF_ROUTE_FAMILY.Settings,
      staffId: 'NEX-1',
      children: <div>settings content</div>,
    })

    expect(screen.getByTestId('location')).toHaveTextContent('/dashboard/staff/NEX-1')
    expect(screen.queryByText('settings content')).not.toBeInTheDocument()
  })

  it.each([
    [false, STAFF_ROUTE_FAMILY.Settings, 'desktop settings content'],
    [true, STAFF_ROUTE_FAMILY.Legacy, 'mobile legacy content'],
  ] as const)('renders the matching route family', (isMobile, family, copy) => {
    vi.mocked(useIsMobileUI).mockReturnValue(isMobile)
    const initialPath = buildStaffRoutePath(family)

    renderBoundary({ initialPath, family, children: <div>{copy}</div> })

    expect(screen.getByText(copy)).toBeInTheDocument()
    expect(screen.getByTestId('location')).toHaveTextContent(initialPath)
  })
})
