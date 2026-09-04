import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useOpenProductManagement } from '../../../data/hooks/useOpenProductManagement'
import {
  buildDashboardMenuPath,
  DASHBOARD_MENU,
  DASHBOARD_MENU_ID,
  normalizeDashboardSettingsTab,
} from '../constants'
import { buildTouchpointsSearch } from '../../touchpoints/touchpointSections'

type NavigateMenuOptions = {
  closeDrawer?: boolean
  tab?: string
  section?: string
}

export function useDashboardNavigation() {
  const location = useLocation()
  const navigate = useNavigate()
  const { openProductManagement } = useOpenProductManagement()

  const activeMenu = location.pathname.split('/')[2] || DASHBOARD_MENU_ID.overview
  const isPaymentsPayoutsActive =
    activeMenu === DASHBOARD_MENU_ID.tips || activeMenu === DASHBOARD_MENU_ID.reports

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  // Desktop sidebar collapse toggle — same open/closed mechanic as the mobile
  // drawer above, just docked instead of an overlay (see DashboardSidebar's
  // `isOpen` prop and DashboardHeader.desktop's PanelLeft toggle button).
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(true)
  const [isPaymentsPayoutsMobileExpanded, setIsPaymentsPayoutsMobileExpanded] = useState(isPaymentsPayoutsActive)
  const [isTaxIqMobileExpanded, setIsTaxIqMobileExpanded] = useState(activeMenu === DASHBOARD_MENU.TaxIq)

  const [isTouchpointsMobileExpanded, setIsTouchpointsMobileExpanded] = useState(
    activeMenu === DASHBOARD_MENU.Touchpoints,
  )
  const [isBookingHubMobileExpanded, setIsBookingHubMobileExpanded] = useState(
    activeMenu === DASHBOARD_MENU.BookingHub,
  )
  const [isPosMobileExpanded, setIsPosMobileExpanded] = useState(activeMenu === DASHBOARD_MENU.Pos)
  const [isPackageManagementMobileExpanded, setIsPackageManagementMobileExpanded] =
    useState(activeMenu === DASHBOARD_MENU.PackageManagement)
  const [isGiftCardCenterMobileExpanded, setIsGiftCardCenterMobileExpanded] = useState(false)
  const [settingsTab, setSettingsTab] = useState('profile')
  const [isProfileExpanded, setIsProfileExpanded] = useState(false)

  // Keep sidebar KYB/profile highlight in sync with /dashboard/settings/:tab
  useEffect(() => {
    if (activeMenu !== DASHBOARD_MENU_ID.settings) return
    const tabFromPath = location.pathname.split('/')[3]
    setSettingsTab(normalizeDashboardSettingsTab(tabFromPath || 'profile'))
  }, [activeMenu, location.pathname])

  // When the drawer opens, reflect the current route's expandable section.
  useEffect(() => {
    if (!isMobileMenuOpen) return
    setIsPaymentsPayoutsMobileExpanded(isPaymentsPayoutsActive)
    setIsTaxIqMobileExpanded(activeMenu === DASHBOARD_MENU.TaxIq)
    setIsTouchpointsMobileExpanded(activeMenu === DASHBOARD_MENU.Touchpoints)
    setIsBookingHubMobileExpanded(activeMenu === DASHBOARD_MENU.BookingHub)
    setIsPosMobileExpanded(activeMenu === DASHBOARD_MENU.Pos)
    setIsPackageManagementMobileExpanded(
      activeMenu === DASHBOARD_MENU.PackageManagement,
    )
  }, [isMobileMenuOpen, activeMenu, isPaymentsPayoutsActive])
  useEffect(() => {
    if (isPaymentsPayoutsActive) {
      setIsPaymentsPayoutsMobileExpanded(true)
      setIsTouchpointsMobileExpanded(false)
      setIsTaxIqMobileExpanded(false)
      setIsBookingHubMobileExpanded(false)
      setIsPosMobileExpanded(false)
      setIsPackageManagementMobileExpanded(false)
      setIsGiftCardCenterMobileExpanded(false)
    }
    if (activeMenu === DASHBOARD_MENU.BookingHub) {
      setIsBookingHubMobileExpanded(true)
    }
    if (activeMenu === DASHBOARD_MENU.PackageManagement) {
      setIsPackageManagementMobileExpanded(true)
    }
  }, [activeMenu, isPaymentsPayoutsActive])

  const buildMenuRoute = (menuId: string, tab?: string, section?: string) => {
    const base = buildDashboardMenuPath(menuId)
    if (menuId === DASHBOARD_MENU_ID.touchpoints) {
      return `${base}?${buildTouchpointsSearch({ tab, section })}`
    }
    if (!tab) return base
    return `${base}?tab=${encodeURIComponent(tab)}`
  }

  const handleNavigateMenu = (menuId: string, tab?: string, section?: string) => {
    if (menuId === DASHBOARD_MENU_ID.productManagement) {
      void openProductManagement()
      return
    }
    navigate(buildMenuRoute(menuId, tab, section))
  }

  const navigateMenu = (menuId: string, options: NavigateMenuOptions = {}) => {
    const { closeDrawer = true, tab, section } = options
    if (menuId === DASHBOARD_MENU_ID.productManagement) {
      void openProductManagement().finally(() => {
        if (closeDrawer) setIsMobileMenuOpen(false)
      })
      return
    }
    navigate(buildMenuRoute(menuId, tab, section))
    if (closeDrawer) setIsMobileMenuOpen(false)
  }

  return {
    activeMenu,
    isMobileMenuOpen,
    setIsMobileMenuOpen,
    isDesktopSidebarOpen,
    setIsDesktopSidebarOpen,
    isPaymentsPayoutsMobileExpanded,
    setIsPaymentsPayoutsMobileExpanded,
    isTouchpointsMobileExpanded,
    isTaxIqMobileExpanded, 
    setIsTaxIqMobileExpanded,
    setIsTouchpointsMobileExpanded,
    isBookingHubMobileExpanded,
    setIsBookingHubMobileExpanded,
    isPosMobileExpanded,
    setIsPosMobileExpanded,
    isPackageManagementMobileExpanded,
    setIsPackageManagementMobileExpanded,
    isGiftCardCenterMobileExpanded,
    setIsGiftCardCenterMobileExpanded,
    settingsTab,
    setSettingsTab,
    isProfileExpanded,
    setIsProfileExpanded,
    handleNavigateMenu,
    navigateMenu,
  }
}
