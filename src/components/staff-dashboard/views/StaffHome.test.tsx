import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('../../../contexts/LanguageContext', () => ({
  useTranslation: () => ({ t: (key: string) => key, currentLanguage: 'en' }),
}))
vi.mock('react-router-dom', () => ({ useOutletContext: () => ({ onNavigate: vi.fn() }) }))
vi.mock('../../../contexts/StaffAccountContext', () => ({
  useStaffAccount: () => ({ account: { fullName: 'Anna Le', nickname: 'Anna' } }),
}))
vi.mock('../../../data/hooks/useStaffSelf', () => ({
  useConfirmStaffTipsReceipt: () => ({ mutate: vi.fn(), isPending: false }),
}))
vi.mock('../hooks/useStaffHomeData', () => ({
  useStaffHomeData: () => ({
    kpis: { todayTips: 120, todayCount: 5, monthTips: 1280, pendingCount: 3, rating: 4.8, isLoading: false },
    isHomeLoading: false,
    isPendingTipsFetching: false,
    pendingTips: [{ id: 't1', amount: 30, paymentMethod: 'Zelle', touchpoint: 'Front Desk · Golden Glow' }],
    linkedBusinesses: [
      { businessStaffLinkId: 'b1', businessName: 'Golden Glow', displayName: 'Anna', status: 'Active' },
    ],
  }),
}))

import StaffHome from './StaffHome.mobile'

describe('StaffHome (staff Pro home)', () => {
  it('renders greeting, KPIs, quick actions, pending, linked businesses, referral', () => {
    render(<StaffHome />)
    expect(screen.getByText('staff_dashboard.home.greeting_morning')).toBeInTheDocument()
    expect(screen.getByText('staff_dashboard.home.today_tips')).toBeInTheDocument()
    expect(screen.getByText('staff_dashboard.home.quick_qr')).toBeInTheDocument()
    expect(screen.getByText('staff_dashboard.home.pending_confirmations')).toBeInTheDocument()
    expect(screen.getByText('staff_dashboard.home.linked_businesses')).toBeInTheDocument()
    expect(screen.getByText('staff_dashboard.home.refer_title')).toBeInTheDocument()
  })

  it('shows real KPI + business data', () => {
    render(<StaffHome />)
    expect(screen.getByText('$120')).toBeInTheDocument() // today tips
    expect(screen.getByText('$1280')).toBeInTheDocument() // this month
    expect(screen.getByText('4.8')).toBeInTheDocument() // rating
    expect(screen.getByText('Golden Glow')).toBeInTheDocument()
  })
})
