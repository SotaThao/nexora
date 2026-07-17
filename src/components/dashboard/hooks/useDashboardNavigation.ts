import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { DASHBOARD_MENU } from '../constants'

type NavigateMenuOptions = {
  closeDrawer?: boolean
  tab?: string
}

export function useDashboardNavigation() {
  const location = useLocation()
  const navigate = useNavigate()

  const activeMenu = location.pathname.split('/')[2] || 'overview'
  const isPaymentsPayoutsActive = activeMenu === 'tips' || activeMenu === 'reports'

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isPaymentsPayoutsMobileExpanded, setIsPaymentsPayoutsMobileExpanded] = useState(isPaymentsPayoutsActive)
  const [isTouchpointsMobileExpanded, setIsTouchpointsMobileExpanded] = useState(
    activeMenu === DASHBOARD_MENU.Touchpoints,
  )
  const [isBookingHubMobileExpanded, setIsBookingHubMobileExpanded] = useState(
    activeMenu === DASHBOARD_MENU.BookingHub,
  )
  const [settingsTab, setSettingsTab] = useState('profile')
  const [isProfileExpanded, setIsProfileExpanded] = useState(false)

  // When the drawer opens, reflect the current route's expandable section.
  useEffect(() => {
    if (!isMobileMenuOpen) return
    setIsPaymentsPayoutsMobileExpanded(isPaymentsPayoutsActive)
    setIsTouchpointsMobileExpanded(activeMenu === DASHBOARD_MENU.Touchpoints)
    setIsBookingHubMobileExpanded(activeMenu === DASHBOARD_MENU.BookingHub)
  }, [isMobileMenuOpen, activeMenu, isPaymentsPayoutsActive])
  useEffect(() => {
    if (isPaymentsPayoutsActive) {
      setIsPaymentsPayoutsMobileExpanded(true)
      setIsTouchpointsMobileExpanded(false)
      setIsBookingHubMobileExpanded(false)
    }
    if (activeMenu === DASHBOARD_MENU.BookingHub) {
      setIsBookingHubMobileExpanded(true)
    }
  }, [activeMenu, isPaymentsPayoutsActive])

  const buildMenuRoute = (menuId: string, tab?: string) => {
    const base = menuId === 'overview' ? '/dashboard' : `/dashboard/${menuId}`
    if (!tab) return base
    return `${base}?tab=${encodeURIComponent(tab)}`
  }

  const handleNavigateMenu = (menuId: string, tab?: string) => {
    navigate(buildMenuRoute(menuId, tab))
  }

  const navigateMenu = (menuId: string, options: NavigateMenuOptions = {}) => {
    const { closeDrawer = true, tab } = options
    navigate(buildMenuRoute(menuId, tab))
    if (closeDrawer) setIsMobileMenuOpen(false)
  }

  return {
    activeMenu,
    isMobileMenuOpen,
    setIsMobileMenuOpen,
    isPaymentsPayoutsMobileExpanded,
    setIsPaymentsPayoutsMobileExpanded,
    isTouchpointsMobileExpanded,
    setIsTouchpointsMobileExpanded,
    isBookingHubMobileExpanded,
    setIsBookingHubMobileExpanded,
    settingsTab,
    setSettingsTab,
    isProfileExpanded,
    setIsProfileExpanded,
    handleNavigateMenu,
    navigateMenu,
  }
}
