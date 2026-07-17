import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  buildDashboardMenuPath,
  DASHBOARD_MENU_ID,
} from '../constants'
import { useOpenProductManagement } from '../../../data/hooks/useOpenProductManagement'

type NavigateMenuOptions = {
  closeDrawer?: boolean
  tab?: string
}

export function useDashboardNavigation() {
  const location = useLocation()
  const navigate = useNavigate()
  const { openProductManagement } = useOpenProductManagement()

  const activeMenu = location.pathname.split('/')[2] || DASHBOARD_MENU_ID.overview
  const isPaymentsPayoutsActive =
    activeMenu === DASHBOARD_MENU_ID.tips || activeMenu === DASHBOARD_MENU_ID.reports

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isPaymentsPayoutsMobileExpanded, setIsPaymentsPayoutsMobileExpanded] = useState(isPaymentsPayoutsActive)
  const [isTouchpointsMobileExpanded, setIsTouchpointsMobileExpanded] = useState(
    activeMenu === DASHBOARD_MENU_ID.touchpoints,
  )
  const [settingsTab, setSettingsTab] = useState('profile')
  const [isProfileExpanded, setIsProfileExpanded] = useState(false)

  // Keep sidebar KYB/profile highlight in sync with /dashboard/settings/:tab
  useEffect(() => {
    if (activeMenu !== DASHBOARD_MENU_ID.settings) return
    const tabFromPath = location.pathname.split('/')[3]
    if (tabFromPath === 'kyb' || tabFromPath === 'profile' || tabFromPath === 'affiliate') {
      setSettingsTab(tabFromPath)
    } else if (!tabFromPath) {
      setSettingsTab('profile')
    }
  }, [activeMenu, location.pathname])

  // When the drawer opens, reflect the current route's expandable section.
  useEffect(() => {
    if (!isMobileMenuOpen) return
    setIsPaymentsPayoutsMobileExpanded(isPaymentsPayoutsActive)
    setIsTouchpointsMobileExpanded(activeMenu === DASHBOARD_MENU_ID.touchpoints)
  }, [isMobileMenuOpen, activeMenu, isPaymentsPayoutsActive])
  useEffect(() => {
    if (isPaymentsPayoutsActive) {
      setIsPaymentsPayoutsMobileExpanded(true)
      setIsTouchpointsMobileExpanded(false)
    }
  }, [activeMenu, isPaymentsPayoutsActive])

  const buildMenuRoute = (menuId: string, tab?: string) => {
    const base = buildDashboardMenuPath(menuId)
    if (!tab) return base
    return `${base}?tab=${encodeURIComponent(tab)}`
  }

  const handleNavigateMenu = (menuId: string, tab?: string) => {
    if (menuId === DASHBOARD_MENU_ID.productManagement) {
      void openProductManagement()
      return
    }
    navigate(buildMenuRoute(menuId, tab))
  }

  const navigateMenu = (menuId: string, options: NavigateMenuOptions = {}) => {
    const { closeDrawer = true, tab } = options
    if (menuId === DASHBOARD_MENU_ID.productManagement) {
      void openProductManagement().finally(() => {
        if (closeDrawer) setIsMobileMenuOpen(false)
      })
      return
    }
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
    settingsTab,
    setSettingsTab,
    isProfileExpanded,
    setIsProfileExpanded,
    handleNavigateMenu,
    navigateMenu,
  }
}
