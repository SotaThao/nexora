import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { TIPS_TAB_IDS } from '../constants'

export function useDashboardNavigation() {
  const location = useLocation()
  const navigate = useNavigate()
  
  const activeMenu = location.pathname.split('/')[2] || 'overview'

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [tipsTab, setTipsTab] = useState(TIPS_TAB_IDS[0])
  const [isTipsMobileExpanded, setIsTipsMobileExpanded] = useState(activeMenu === 'tips')
  const [touchpointsTab, setTouchpointsTab] = useState('stations')
  const [isTouchpointsMobileExpanded, setIsTouchpointsMobileExpanded] = useState(activeMenu === 'touchpoints')
  const [settingsTab, setSettingsTab] = useState('profile')
  const [isProfileExpanded, setIsProfileExpanded] = useState(false)

  useEffect(() => {
    if (activeMenu === 'tips') {
      setIsTipsMobileExpanded(true)
      setIsTouchpointsMobileExpanded(false)
      const tab = new URLSearchParams(location.search).get('tab')
      setTipsTab(TIPS_TAB_IDS.includes(tab) ? tab : TIPS_TAB_IDS[0])
    } else if (activeMenu === 'touchpoints') {
      setIsTouchpointsMobileExpanded(true)
      setIsTipsMobileExpanded(false)
      const tab = new URLSearchParams(location.search).get('tab')
      if (tab === 'stations' || tab === 'devices') {
        setTouchpointsTab(tab)
      }
    }
  }, [activeMenu, location.search])

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
