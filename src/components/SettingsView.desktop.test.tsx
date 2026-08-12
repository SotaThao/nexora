import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import SettingsViewDesktop from './SettingsView.desktop'

vi.mock('../contexts/LanguageContext', () => ({
  useTranslation: () => ({
    currentLanguage: 'en',
    t: (key: string) => key,
  }),
}))

vi.mock('./settings/hooks/useSettingsForm', () => ({
  default: () => ({
    effectiveVerificationStatus: 'kyb_approved',
    profile: {},
    showToast: vi.fn(),
    handleCopy: vi.fn(),
    copiedId: null,
  }),
}))

vi.mock('../auth/useAuth', () => ({
  default: () => ({ session: { accountType: 'business' } }),
}))

vi.mock('./settings/tabs/ProfileTab', () => ({
  default: () => <div>Account content</div>,
}))

vi.mock('./settings/tabs/KybTab', () => ({
  default: () => <div>KYB content</div>,
}))

describe('SettingsViewDesktop navigation', () => {
  it('renders all text-only tabs in order and activates injected Staff content', () => {
    const onTabChange = vi.fn()
    render(
      <MemoryRouter>
        <SettingsViewDesktop
          setupData={null}
          userEmail="owner@example.com"
          onKybRequired={vi.fn()}
          initialTab="profile"
          onTabChange={onTabChange}
          onKybSuccess={vi.fn()}
          staffContent={<div>Staff management content</div>}
        />
      </MemoryRouter>,
    )

    const tabs = within(screen.getByRole('tablist')).getAllByRole('tab')
    expect(tabs.map((tab) => tab.textContent)).toEqual([
      'components.SettingsView.account',
      'dashboard.menu.staff',
      'components.SettingsView.kyb',
      'components.SettingsView.affiliateLink',
      'staff_dashboard.profile.menu_privacy_security',
    ])
    tabs.forEach((tab) => expect(tab.querySelector('svg')).toBeNull())

    fireEvent.click(screen.getByRole('tab', { name: 'dashboard.menu.staff' }))

    expect(onTabChange).toHaveBeenCalledWith('staff')
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Staff management content')
    expect(screen.getByRole('tab', { name: 'dashboard.menu.staff' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
  })
})
