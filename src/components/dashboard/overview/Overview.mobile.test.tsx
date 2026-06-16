import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import Overview from './Overview.mobile'

// t returns the key so we can assert on i18n keys directly.
vi.mock('../../../contexts/LanguageContext', () => ({
  useTranslation: () => ({ t: (key: string) => key, currentLanguage: 'en' }),
  renderLabel: (label: string) => label,
}))

const monthPrefix = new Date().toISOString().slice(0, 7)

const baseProps = {
  metrics: { googleRating: 4.8, totalReviews: 126 },
  transactions: [
    { amount: 1000, status: 'Success', dateTime: `${monthPrefix}-05T10:00:00Z` },
  ],
  staff: [
    { id: 's1', fullName: 'Anna Le', status: 'Active', position: 'Nail Technician' },
    { id: 's2', fullName: 'John Vo', status: 'Inactive', position: 'Technician' },
  ],
  pendingStaff: [{ id: 'p1', fullName: 'Lisa Tran', itemType: 'invite', position: 'Technician' }],
  touchpoints: [{ id: 't1', name: 'Front Desk QR', type: 'FrontDesk' }],
  businessName: 'Golden Glow Spa',
  profile: { fullName: 'Owner Nguyen' },
  hasSetup: true,
  onNavigateMenu: vi.fn(),
  setActiveKpi: vi.fn(),
  onOpenReviews: vi.fn(),
  onApproveClick: vi.fn(),
  previewQr: vi.fn(),
}

describe('Overview.mobile (Owner Pro home)', () => {
  it('renders all mockup sections', () => {
    render(<Overview {...baseProps} />)
    expect(screen.getByText('dashboard.owner_home.money_saved_title')).toBeInTheDocument()
    expect(screen.getByText('dashboard.owner_home.kpi_direct_tips')).toBeInTheDocument()
    expect(screen.getByText('dashboard.owner_home.staff_status_title')).toBeInTheDocument()
    expect(screen.getByText('dashboard.owner_home.qr_performance_title')).toBeInTheDocument()
    expect(screen.getByText('dashboard.owner_home.savings_summary_title')).toBeInTheDocument()
  })

  it('computes money-saved (3% of tips) from real transactions', () => {
    render(<Overview {...baseProps} />)
    // $1000 tips this month × 3% = $30
    expect(screen.getAllByText('$30').length).toBeGreaterThan(0)
  })

  it('lists real staff and pending data', () => {
    render(<Overview {...baseProps} />)
    expect(screen.getByText('Anna Le')).toBeInTheDocument()
    expect(screen.getByText('Lisa Tran')).toBeInTheDocument()
    expect(screen.getByText('Front Desk QR')).toBeInTheDocument()
  })

  it('shows empty states when data is missing', () => {
    render(<Overview {...baseProps} staff={[]} pendingStaff={[]} touchpoints={[]} />)
    expect(screen.getByText('dashboard.owner_home.no_staff')).toBeInTheDocument()
    expect(screen.getByText('dashboard.owner_home.no_qr')).toBeInTheDocument()
  })
})
