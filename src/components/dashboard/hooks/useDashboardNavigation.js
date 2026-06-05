// Navigation / UI state for the merchant Dashboard: active menu, mobile menu,
// tips & touchpoints tabs (+ mobile expansion), settings tab, profile card,
// and the currently-viewed staff detail. Extracted from Dashboard.jsx (Group 5).
import { useState, useEffect } from 'react'

export function useDashboardNavigation(initialMenu = 'overview', initialSettingsTab = 'profile') {
  const [activeMenu, setActiveMenu] = useState(initialMenu)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [tipsTab, setTipsTab] = useState('overview')
  const [isTipsMobileExpanded, setIsTipsMobileExpanded] = useState(initialMenu === 'tips')
  const [touchpointsTab, setTouchpointsTab] = useState('stations')
  const [isTouchpointsMobileExpanded, setIsTouchpointsMobileExpanded] = useState(initialMenu === 'touchpoints')
  const [settingsTab, setSettingsTab] = useState(initialSettingsTab)
  const [isProfileExpanded, setIsProfileExpanded] = useState(false)
  const [viewingStaffDetailId, setViewingStaffDetailId] = useState(null)

  useEffect(() => {
    if (activeMenu === 'tips') {
      setIsTipsMobileExpanded(true)
      setIsTouchpointsMobileExpanded(false)
    } else if (activeMenu === 'touchpoints') {
      setIsTouchpointsMobileExpanded(true)
      setIsTipsMobileExpanded(false)
    }
  }, [activeMenu])

  useEffect(() => {
    if (initialMenu) {
      setActiveMenu(initialMenu)
    }
  }, [initialMenu])

  useEffect(() => {
    if (initialSettingsTab) {
      setSettingsTab(initialSettingsTab)
    }
  }, [initialSettingsTab])

  const handleNavigateMenu = (menuId) => {
    setActiveMenu(menuId)
    setViewingStaffDetailId(null)
  }

  const navigateMenu = (menuId) => {
    setActiveMenu(menuId)
    setViewingStaffDetailId(null)
    setIsMobileMenuOpen(false)
  }

  return {
    activeMenu, setActiveMenu,
    isMobileMenuOpen, setIsMobileMenuOpen,
    tipsTab, setTipsTab,
    isTipsMobileExpanded, setIsTipsMobileExpanded,
    touchpointsTab, setTouchpointsTab,
    isTouchpointsMobileExpanded, setIsTouchpointsMobileExpanded,
    settingsTab, setSettingsTab,
    isProfileExpanded, setIsProfileExpanded,
    viewingStaffDetailId, setViewingStaffDetailId,
    handleNavigateMenu, navigateMenu
  }
}
