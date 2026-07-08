import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import MobileMenuDrawer from '../../dashboard/layout/MobileMenuDrawer'
import { MENU_ITEMS } from '../../dashboard/constants'
import { useProfileSettings } from '../../../data/hooks/useProfileSettings'
import { useMerchantSetup } from '../../../data/hooks/useMerchantSetup'
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
  const [tipsTab, setTipsTab] = useState('overview')
  const [touchpointsTab, setTouchpointsTab] = useState('stations')
  const [isTipsMobileExpanded, setIsTipsMobileExpanded] = useState(false)
  const [isTouchpointsMobileExpanded, setIsTouchpointsMobileExpanded] = useState(false)

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
  const userSubscription = profileSettingsData?.subscription ?? profile?.subscription ?? null

  const handleNavigateMenu = useCallback(
    (menuId: string) => {
      const route = menuId === 'overview' ? '/dashboard' : `/dashboard/${menuId}`
      navigate(route)
    },
    [navigate],
  )

  const navigateMenu = useCallback(
    (menuId: string) => {
      handleNavigateMenu(menuId)
      setIsMobileMenuOpen(false)
    },
    [handleNavigateMenu],
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
          tipsTab={tipsTab}
          setTipsTab={setTipsTab}
          touchpointsTab={touchpointsTab}
          setTouchpointsTab={setTouchpointsTab}
          isTipsMobileExpanded={isTipsMobileExpanded}
          setIsTipsMobileExpanded={setIsTipsMobileExpanded}
          isTouchpointsMobileExpanded={isTouchpointsMobileExpanded}
          setIsTouchpointsMobileExpanded={setIsTouchpointsMobileExpanded}
          hasKyb={hasKyb}
          userRole="owner"
          onLogout={onLogout}
          menuItemsToDisplay={MENU_ITEMS}
          navigateMenu={navigateMenu}
        />

        {children}
      </div>
    </HomePageLayoutProvider>
  )
}
