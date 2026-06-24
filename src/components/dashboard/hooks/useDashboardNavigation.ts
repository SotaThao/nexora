import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

type NavigateMenuOptions = {
  closeDrawer?: boolean
  tab?: string
}

export function useDashboardNavigation() {
  const location = useLocation()
  const navigate = useNavigate()

  const activeMenu = location.pathname.split('/')[2] || 'overview'

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isTipsMobileExpanded, setIsTipsMobileExpanded] = useState(activeMenu === 'tips')
  const [isTouchpointsMobileExpanded, setIsTouchpointsMobileExpanded] = useState(activeMenu === 'touchpoints')
  const [settingsTab, setSettingsTab] = useState('profile')
  const [isProfileExpanded, setIsProfileExpanded] = useState(false)

  // When the drawer opens, reflect the current route's expandable section.
  useEffect(() => {
    if (!isMobileMenuOpen) return
    setIsTipsMobileExpanded(activeMenu === 'tips')
    setIsTouchpointsMobileExpanded(activeMenu === 'touchpoints')
  }, [isMobileMenuOpen, activeMenu])
  useEffect(() => {
    if (activeMenu === 'tips') {
      setIsTipsMobileExpanded(true)
      setIsTouchpointsMobileExpanded(false)
    }
  }, [activeMenu])

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
    isTipsMobileExpanded,
    setIsTipsMobileExpanded,
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
