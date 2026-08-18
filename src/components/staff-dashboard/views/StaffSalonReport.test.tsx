import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router-dom'

import StaffSalonReport from './StaffSalonReport'

const staffSelfRepositoryMock = vi.hoisted(() => ({
  getMyBusinesses: vi.fn(),
}))

vi.mock('../../../data/repositories/staffSelf', () => ({
  default: staffSelfRepositoryMock,
}))

vi.mock('../../../auth/useSessionRole', () => ({
  useSessionRole: () => ({ isStaff: true }),
}))

function salon(overrides: Record<string, unknown>) {
  return {
    businessId: 'salon-1',
    businessName: 'Bliss Nails',
    nicknameAtBusiness: null,
    address: '100 Main Street',
    city: 'Austin',
    state: 'TX',
    logoUrl: null,
    role: 'Technician',
    roleLabel: 'Technician',
    roleAtBusiness: 'Technician',
    linkStatus: '1',
    linkStatusLabel: 'Active',
    linkedAt: '2026-01-05T00:00:00Z',
    businessSlug: 'bliss-nails',
    touchPointSlug: 'front-desk',
    masterTouchPointSlug: 'front-desk',
    tipUrl: null,
    qrImageUrl: null,
    touchPointsMissing: false,
    ...overrides,
  }
}

function LocationProbe() {
  const location = useLocation()
  return <output data-testid="location">{`${location.pathname}${location.search}`}</output>
}

function renderReport(initialEntry = '/staff/salons/report') {
  return render(
    <MemoryRouter
      initialEntries={[initialEntry]}
      future={{ v7_relativeSplatPath: true, v7_startTransition: true }}
    >
      <StaffSalonReport />
      <LocationProbe />
    </MemoryRouter>,
  )
}

describe('StaffSalonReport', () => {
  beforeEach(() => {
    staffSelfRepositoryMock.getMyBusinesses.mockResolvedValue([])
  })

  it('renders the daily report with the requested metrics and a date filter', () => {
    renderReport()

    expect(screen.getByRole('heading', { name: 'Salon Report' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Daily' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByLabelText('Date')).toHaveAttribute('type', 'date')

    ;['Turns', 'Hours', 'Service', 'Commission', 'Tip', 'Comm %', 'Tech takes'].forEach(
      (label) => expect(screen.getByRole('columnheader', { name: label })).toBeInTheDocument(),
    )
  })

  it('uses week and year filters on the weekly tab and syncs the URL', () => {
    renderReport()

    fireEvent.click(screen.getByRole('tab', { name: 'Weekly' }))

    expect(screen.getByTestId('location')).toHaveTextContent('/staff/salons/report?tab=weekly')
    expect(screen.getByLabelText('Week')).toBeInTheDocument()
    expect(screen.getByLabelText('Year')).toBeInTheDocument()
    expect(screen.queryByLabelText('Date')).not.toBeInTheDocument()
  })

  it('shows month and year filters for monthly, and only year for yearly', () => {
    renderReport('/staff/salons/report?tab=monthly')

    expect(screen.getByRole('tab', { name: 'Monthly' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByLabelText('Month')).toBeInTheDocument()
    expect(screen.getByLabelText('Year')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('tab', { name: 'Yearly' }))

    expect(screen.getByTestId('location')).toHaveTextContent('/staff/salons/report?tab=yearly')
    expect(screen.queryByLabelText('Month')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Week')).not.toBeInTheDocument()
    expect(screen.getByLabelText('Year')).toBeInTheDocument()
  })

  it('keeps period labels accessible while hiding them visually', () => {
    renderReport()

    expect(screen.getByText('Date', { selector: 'span' })).toHaveClass('sr-only')
    expect(screen.getByLabelText('Date')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('tab', { name: 'Weekly' }))
    expect(screen.getByText('Week', { selector: 'span' })).toHaveClass('sr-only')
    expect(screen.getByText('Year', { selector: 'span' })).toHaveClass('sr-only')

    fireEvent.click(screen.getByRole('tab', { name: 'Monthly' }))
    expect(screen.getByText('Month', { selector: 'span' })).toHaveClass('sr-only')
    expect(screen.getByText('Year', { selector: 'span' })).toHaveClass('sr-only')

    fireEvent.click(screen.getByRole('tab', { name: 'Yearly' }))
    expect(screen.getByText('Year', { selector: 'span' })).toHaveClass('sr-only')
    expect(screen.getByLabelText('Year')).toBeInTheDocument()
  })

  it('filters by active salons and preserves the selected salon when changing tabs', async () => {
    staffSelfRepositoryMock.getMyBusinesses.mockResolvedValue([
      salon({ businessId: 'salon-bliss', businessName: 'Bliss Nails' }),
      salon({ businessId: 'salon-rose', businessName: 'Rose Spa' }),
      salon({
        businessId: 'salon-old',
        businessName: 'Old Salon',
        linkStatus: '2',
        linkStatusLabel: 'Inactive',
      }),
    ])
    renderReport()

    await screen.findByRole('option', { name: 'All salons' })
    const salonFilter = screen.getByLabelText('Salon')
    expect(salonFilter).toHaveValue('all')
    expect(screen.getByRole('option', { name: 'All salons' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Bliss Nails' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Rose Spa' })).toBeInTheDocument()
    expect(screen.queryByRole('option', { name: 'Old Salon' })).not.toBeInTheDocument()

    fireEvent.change(salonFilter, { target: { value: 'salon-rose' } })
    fireEvent.click(screen.getByRole('tab', { name: 'Weekly' }))

    expect(screen.getByTestId('location')).toHaveTextContent(
      '/staff/salons/report?salon=salon-rose&tab=weekly',
    )
  })

  it('shows one salon label and keeps the select in the same filter group', async () => {
    staffSelfRepositoryMock.getMyBusinesses.mockResolvedValue([
      salon({ businessId: 'salon-bliss', businessName: 'Bliss Nails' }),
    ])
    renderReport()

    await screen.findByRole('option', { name: 'Bliss Nails' })
    const filterGroup = screen.getByRole('group', { name: 'Salon filter' })

    expect(within(filterGroup).getAllByText('Salon')).toHaveLength(1)
    expect(within(filterGroup).getByRole('combobox', { name: 'Salon' })).toBeInTheDocument()
  })

  it('disables the salon filter when there are no active linked salons', async () => {
    staffSelfRepositoryMock.getMyBusinesses.mockResolvedValue([
      salon({ linkStatus: '2', linkStatusLabel: 'Inactive' }),
    ])
    renderReport()

    await screen.findByRole('option', { name: 'No linked salons' })
    const salonFilter = screen.getByLabelText('Salon')
    expect(salonFilter).toBeDisabled()
    expect(screen.getByRole('option', { name: 'No linked salons' })).toBeInTheDocument()
  })
})
