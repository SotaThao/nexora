import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import MobileMenuDrawer from '../../dashboard/layout/MobileMenuDrawer'
import { MERCHANT_SIDEBAR_MENU_ITEMS, buildDashboardMenuPath } from '../../dashboard/constants'
import { useProfileSettings } from '../../../data/hooks/useProfileSettings'
import { useMerchantSetup } from '../../../data/hooks/useMerchantSetup'
import { getTipPlatformSubscription } from '../../../utils/subscriptionDisplay'
import { HomePageLayoutProvider } from '../context/HomePageLayoutContext'
import type { AuthSession } from '../../../types/auth'

interface HomePageOwnerSidebarLayoutProps {
  session: AuthSession
  onLogout: () => void
  children: ReactNode
}

export default function HomePageOwnerSidebarLayout({
  session,
  onLogout,
  children,
}: HomePageOwnerSidebarLayoutProps) {
  const navigate = useNavigate()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [settingsTab, setSettingsTab] = useState('profile')
  const [isProfileExpanded, setIsProfileExpanded] = useState(false)
  const [isPaymentsPayoutsMobileExpanded, setIsPaymentsPayoutsMobileExpanded] = useState(false)
  const [isTouchpointsMobileExpanded, setIsTouchpointsMobileExpanded] = useState(false)
  const [isBookingHubMobileExpanded, setIsBookingHubMobileExpanded] = useState(false)
  const [isGiftCardCenterMobileExpanded, setIsGiftCardCenterMobileExpanded] = useState(false)

  const { data: profileSettingsData } = useProfileSettings()
  const { data: merchantSetupData } = useMerchantSetup()

  const hasKyb = session.verificationStatus === 'kyb_approved'

  const profile = useMemo(() => {
    const businessLogo = merchantSetupData?.businessInfo?.logo || null
    if (profileSettingsData) {
      return { ...profileSettingsData, avatar: profileSettingsData.avatar || businessLogo }
    }
    const storeInfo = merchantSetupData?.businessInfo
    return {
      fullName: storeInfo?.ownerName || '',
      email: storeInfo?.businessEmail || session.email || '',
      avatar: businessLogo,
      businessName: storeInfo?.name || '',
      businessPhone: storeInfo?.phone || '',
      businessWebsite: storeInfo?.website || '',
      street: storeInfo?.address || '',
      googleReview: '',
      yelpReview: '',
      paymentAccounts: {
        zelle: '',
        bankwire: '',
        paypal: '',
        venmo: '',
        cashapp: '',
        applecash: '',
        vlinkpay: '',
      },
    }
  }, [profileSettingsData, merchantSetupData, session.email])

  const businessName =
    profile?.businessName || merchantSetupData?.businessInfo?.name || ''
  const userSubscription =
    getTipPlatformSubscription(profileSettingsData)
    ?? getTipPlatformSubscription(profile)
    ?? null

  const handleNavigateMenu = useCallback(
    (menuId: string) => {
      navigate(buildDashboardMenuPath(menuId))
    },
    [navigate],
  )

  const navigateMenu = useCallback(
    (menuId: string, options: { tab?: string; closeDrawer?: boolean } = {}) => {
      const { tab, closeDrawer = true } = options
      const base = buildDashboardMenuPath(menuId)
      const route = tab ? `${base}?tab=${encodeURIComponent(tab)}` : base
      navigate(route)
      if (closeDrawer) setIsMobileMenuOpen(false)
    },
    [navigate],
  )

  const layoutValue = useMemo(
    () => ({
      hasMobileMenu: true,
      openSidebarMenu: () => setIsMobileMenuOpen(true),
    }),
    [],
  )

  return (
    <HomePageLayoutProvider value={layoutValue}>
      <div className="min-h-dvh">
        <MobileMenuDrawer
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
          profile={profile}
          subscription={userSubscription}
          businessName={businessName}
          activeMenu="home"
          isHomeActive
          setActiveMenu={handleNavigateMenu}
          settingsTab={settingsTab}
          setSettingsTab={setSettingsTab}
          isProfileExpanded={isProfileExpanded}
          setIsProfileExpanded={setIsProfileExpanded}
          isPaymentsPayoutsMobileExpanded={isPaymentsPayoutsMobileExpanded}
          setIsPaymentsPayoutsMobileExpanded={setIsPaymentsPayoutsMobileExpanded}
          isTouchpointsMobileExpanded={isTouchpointsMobileExpanded}
          setIsTouchpointsMobileExpanded={setIsTouchpointsMobileExpanded}
          isBookingHubMobileExpanded={isBookingHubMobileExpanded}
          setIsBookingHubMobileExpanded={setIsBookingHubMobileExpanded}
          isGiftCardCenterMobileExpanded={isGiftCardCenterMobileExpanded}
          setIsGiftCardCenterMobileExpanded={setIsGiftCardCenterMobileExpanded}
          hasKyb={hasKyb}
          userRole="owner"
          onLogout={onLogout}
          menuItemsToDisplay={MERCHANT_SIDEBAR_MENU_ITEMS}
          navigateMenu={navigateMenu}
        />

        {children}
      </div>
    </HomePageLayoutProvider>
  )
}
