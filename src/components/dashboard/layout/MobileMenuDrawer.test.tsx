import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { vi } from 'vitest'
import MobileMenuDrawer from './MobileMenuDrawer'
import { MERCHANT_SIDEBAR_MENU_ITEMS } from '../constants'

vi.mock('../../../contexts/LanguageContext', () => ({
  useTranslation: () => ({
    currentLanguage: 'en',
    t: (key: string) => key,
  }),
}))

vi.mock('../../../data/hooks/useOpenProductManagement', () => ({
  useOpenProductManagement: () => ({
    isOpeningProductManagement: false,
    openProductManagement: vi.fn(),
    openingProductManagementDestination: null,
  }),
}))

vi.mock('../../../data/hooks/useMerchantSetup', () => ({
  useMerchantSetup: () => ({ data: null }),
}))

vi.mock('../../../data/hooks/useTaxiqOwnerTaxYear', () => ({
  useOwnerTaxYearByBusiness: () => ({ data: null }),
}))

vi.mock('../../../data/hooks/useMerchantVoiceBookings', () => ({
  useMerchantVoiceTenantStatus: () => ({ data: null }),
}))

vi.mock('../../../auth/useAuth', () => ({
  useAuth: () => ({ session: { hasCompletedOnboarding: true } }),
}))

vi.mock('../../ui/MenuIcon', () => ({ default: () => null }))
vi.mock('../../ui/HomepageLink', () => ({ default: () => <span>Home</span> }))
vi.mock('../../ui/LanguageSwitcher', () => ({ default: () => null }))
vi.mock('../../ui/SidebarPlanCard', () => ({ default: () => null }))
vi.mock('./PaymentsPayoutsMenuSection', () => ({
  default: () => <div>Payments &amp; Payouts</div>,
}))

const noop = vi.fn()

describe('MobileMenuDrawer merchant navigation', () => {
  it('hides Staff while keeping the remaining merchant menu available', () => {
    render(
      <MemoryRouter>
        <MobileMenuDrawer
          isOpen
          onClose={noop}
          profile={{ fullName: 'Owner', email: 'owner@example.com', avatar: null }}
          businessName="Salon"
          activeMenu="overview"
          setActiveMenu={noop}
          settingsTab="profile"
          setSettingsTab={noop}
          isProfileExpanded={false}
          setIsProfileExpanded={noop}
          isPaymentsPayoutsMobileExpanded={false}
          setIsPaymentsPayoutsMobileExpanded={noop}
          isTouchpointsMobileExpanded={false}
          setIsTouchpointsMobileExpanded={noop}
          isTaxIqMobileExpanded={false}
          setIsTaxIqMobileExpanded={noop}
          isBookingHubMobileExpanded={false}
          setIsBookingHubMobileExpanded={noop}
          isPosMobileExpanded={false}
          setIsPosMobileExpanded={noop}
          isPackageManagementMobileExpanded={false}
          setIsPackageManagementMobileExpanded={noop}
          isGiftCardCenterMobileExpanded={false}
          setIsGiftCardCenterMobileExpanded={noop}
          hasKyb
          userRole="owner"
          onLogout={noop}
          menuItemsToDisplay={MERCHANT_SIDEBAR_MENU_ITEMS}
          navigateMenu={noop}
        />
      </MemoryRouter>,
    )

    expect(screen.queryByRole('button', { name: 'dashboard.menu.staff' })).not.toBeInTheDocument()
    expect(screen.getByText('Payments & Payouts')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'dashboard.menu.support' })).toBeInTheDocument()
  })
})
