import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

export function useDashboardNavigation() {
  const location = useLocation()
  const navigate = useNavigate()
  
  const activeMenu = location.pathname.split('/')[2] || 'overview'

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [tipsTab, setTipsTab] = useState('overview')
  const [isTipsMobileExpanded, setIsTipsMobileExpanded] = useState(activeMenu === 'tips')
  const [touchpointsTab, setTouchpointsTab] = useState('stations')
  const [isTouchpointsMobileExpanded, setIsTouchpointsMobileExpanded] = useState(activeMenu === 'touchpoints')
  const [settingsTab, setSettingsTab] = useState('profile')
  const [isProfileExpanded, setIsProfileExpanded] = useState(false)

  useEffect(() => {
    if (activeMenu === 'tips') {
      setIsTipsMobileExpanded(true)
      setIsTouchpointsMobileExpanded(false)
    } else if (activeMenu === 'touchpoints') {
      setIsTouchpointsMobileExpanded(true)
      setIsTipsMobileExpanded(false)
    }
  }, [activeMenu])

  const handleNavigateMenu = (menuId) => {
    const route = menuId === 'overview' ? '/dashboard' : `/dashboard/${menuId}`
    navigate(route)
  }

  const navigateMenu = (menuId) => {
    const route = menuId === 'overview' ? '/dashboard' : `/dashboard/${menuId}`
    navigate(route)
    setIsMobileMenuOpen(false)
  }

  return {
    activeMenu,
    isMobileMenuOpen, setIsMobileMenuOpen,
    tipsTab, setTipsTab,
    isTipsMobileExpanded, setIsTipsMobileExpanded,
    touchpointsTab, setTouchpointsTab,
    isTouchpointsMobileExpanded, setIsTouchpointsMobileExpanded,
    settingsTab, setSettingsTab,
    isProfileExpanded, setIsProfileExpanded,
    handleNavigateMenu, navigateMenu
  }
}
