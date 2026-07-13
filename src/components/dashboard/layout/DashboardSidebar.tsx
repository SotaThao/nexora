// DashboardSidebar — left nav: brand, profile card, plan card, menu w/ tips & touchpoints sub-tabs.
// Extracted from Dashboard.jsx (Group 2 refactor).
import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ChevronUp, ChevronDown, LogOut } from 'lucide-react'
import { useTranslation } from '../../../contexts/LanguageContext'
import { visibleMenuItems, MERCHANT_SIDEBAR_MENU_ITEMS, isPaymentsPayoutsRouteActive, VISIBLE_TOUCHPOINTS_SUBMENU } from '../constants'
import MenuIcon from '../../ui/MenuIcon'
import HomepageLink from '../../ui/HomepageLink'
import SidebarPlanCard from '../../ui/SidebarPlanCard'
import PaymentsPayoutsMenuSection from './PaymentsPayoutsMenuSection'
import { getSubscriptionSidebarCopy } from '../../../utils/subscriptionDisplay'
import {
  SIDEBAR_SHELL_CLASS,
  SIDEBAR_NAV_CLASS,
  SIDEBAR_PROFILE_CARD_CLASS,
  SIDEBAR_AVATAR_IMAGE_CLASS,
  SIDEBAR_AVATAR_FALLBACK_CLASS,
  SIDEBAR_SIGN_OUT_WRAP_CLASS,
  SIDEBAR_SUBMENU_WRAP_CLASS,
  sidebarMenuItemBetweenClass,
  sidebarSubmenuItemClass,
} from '../../ui/sidebarMenuStyles'

export default function DashboardSidebar({
  activeMenu,
  isHomeActive = false,
  setActiveMenu,
  businessName,
  profile,
  subscription = null,
  settingsTab,
  setSettingsTab,
  isProfileExpanded,
  setIsProfileExpanded,
  hasKyb = true,
  verificationStatus = 'kyb_approved',
  onBlockedFeatureClick,
  onLogout,
  userRole = 'owner'
}) {
  const { currentLanguage, setLanguage, t } = useTranslation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  // Sub-tabs are URL-driven (?tab=) so the sidebar highlight stays in sync with
  // the rendered route content (TipsRoute / TouchpointsRoute read the same param).
  const activeSubTab = searchParams.get('tab')
  const isPaymentsPayoutsActive = isPaymentsPayoutsRouteActive(activeMenu, activeSubTab)
  const [isPaymentsPayoutsExpanded, setIsPaymentsPayoutsExpanded] = useState(isPaymentsPayoutsActive)
  const [isTouchpointsExpanded, setIsTouchpointsExpanded] = useState(activeMenu === 'touchpoints')

  useEffect(() => {
    if (isPaymentsPayoutsActive) {
      setIsPaymentsPayoutsExpanded(true)
    }
    setIsTouchpointsExpanded(activeMenu === 'touchpoints')
  }, [activeMenu, isPaymentsPayoutsActive])

  const handlePaymentsPayoutsToggle = () => {
    setIsPaymentsPayoutsExpanded((prev) => !prev)
  }

  const handlePaymentsPayoutsNavigate = (screen: string, tab?: string) => {
    const route = `/dashboard/${screen}${tab ? `?tab=${encodeURIComponent(tab)}` : ''}`
    navigate(route, { replace: true })
    setIsPaymentsPayoutsExpanded(true)
    setIsTouchpointsExpanded(false)
  }

  const handleMenuClick = (id: string) => {
    if (id === 'touchpoints') {
      if (activeMenu === 'touchpoints') {
        setIsTouchpointsExpanded((prev) => !prev)
      } else {
        setActiveMenu('touchpoints')
        setIsTouchpointsExpanded(true)
        setIsPaymentsPayoutsExpanded(false)
      }
      return
    }

    setActiveMenu(id)
    setIsPaymentsPayoutsExpanded(false)
    setIsTouchpointsExpanded(false)
  }

  const subscriptionCopy = getSubscriptionSidebarCopy(
    subscription ?? profile?.subscription,
    t,
    currentLanguage,
  )

  return (
    <aside className={SIDEBAR_SHELL_CLASS}>
      {/* Expandable Profile Card */}
      <div className={SIDEBAR_PROFILE_CARD_CLASS}>
        <div className="flex items-center justify-between cursor-pointer" onClick={() => setIsProfileExpanded(!isProfileExpanded)}>
          <div className="flex items-center gap-3 min-w-0">
            {profile.avatar && !profile.avatar.includes('unsplash.com') ? (
              <img src={profile.avatar} alt="" className={`${SIDEBAR_AVATAR_IMAGE_CLASS} shrink-0`} />
            ) : (
              <div className={`${SIDEBAR_AVATAR_FALLBACK_CLASS} shrink-0`}>
                {(businessName || profile.fullName || profile.email || '?').charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              {/* Top line: business name when present (same bold style), else
                  fall back to owner name / email. Email shown below only when
                  there is no business name to avoid redundant identity lines. */}
              <div className="flex items-center gap-1 min-w-0">
                <div className="truncate text-sm font-bold text-white">{businessName || profile.fullName || profile.email}</div>
              </div>
              {!businessName && (
                <div className="text-[10px] text-white/60 truncate mt-0.5">{profile.email}</div>
              )}
            </div>
          </div>
          <div className="text-white/85 hover:text-white transition ml-2">
            {isProfileExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
        </div>

        {/* Submenu links */}
        {isProfileExpanded && userRole !== 'staff' && (
          <div className="mt-3.5 pt-3 border-t border-white/5 space-y-1 animate-fadeIn">
            <button
              onClick={() => {
                setActiveMenu('settings')
                setSettingsTab('profile')
              }}
              className={`flex h-9 w-full items-center gap-2.5 rounded-lg px-3 text-left text-xs font-bold transition ${
                activeMenu === 'settings' && settingsTab === 'profile'
                  ? 'text-brandCyan font-extrabold'
                  : 'text-white/75 hover:bg-white/5 hover:text-white'
              }`}
            >
              <div className={`h-1.5 w-1.5 rounded-full ${activeMenu === 'settings' && settingsTab === 'profile' ? 'bg-brandCyan shadow-sm' : 'bg-white/30'}`} />
              <span>{t('dashboard.menu.business_setting')}</span>
            </button>
            <button
              type="button"
              disabled
              aria-disabled="true"
              className="flex h-9 w-full cursor-not-allowed items-center gap-2.5 rounded-lg px-3 text-left text-xs font-bold text-white/40 opacity-60"
            >
              <div className="h-1.5 w-1.5 rounded-full bg-white/20" />
              <span>{t('dashboard.menu.kyb')} ({t('common.coming_soon')})</span>
            </button>
          </div>
        )}
      </div>

      {/* Navigation Menu */}
      <nav className={SIDEBAR_NAV_CLASS}>
        <HomepageLink variant="menu" active={isHomeActive} />
        {(() => {
          const menuItemsToDisplay = userRole === 'staff'
            ? [
                { id: 'overview', label: t('components.dashboard.layout.DashboardSidebar.myDashboard'), icon: visibleMenuItems.find(i => i.id === 'overview')?.icon },
                { id: 'support', label: t('dashboard.menu.support'), icon: visibleMenuItems.find(i => i.id === 'support')?.icon }
              ]
            : MERCHANT_SIDEBAR_MENU_ITEMS

          return menuItemsToDisplay.map((item) => {
          const { id, label } = item
          const isActive = activeMenu === id
          const localizedLabel = {
            overview: t('dashboard.menu.dashboard'),
            staff: t('dashboard.menu.staff'),
            reviews: t('dashboard.menu.reviews'),
            reports: t('dashboard.menu.transactions'),
            'booking-hub': t('dashboard.menu.booking_hub'),
            touchpoints: t('dashboard.menu.touchpoints'),
            devices: t('dashboard.menu.qr_nfc'),
            analytics: t('dashboard.menu.analytics'),
            support: t('dashboard.menu.support')
          }[id] || label

          return (
            <React.Fragment key={id}>
              <button
                type="button"
                onClick={() => handleMenuClick(id)}
                className={sidebarMenuItemBetweenClass(isActive)}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <MenuIcon item={item} active={isActive} />
                  <span className="truncate">{localizedLabel}</span>
                </div>
                {id === 'touchpoints' && (
                  <div className="text-white/50 shrink-0">
                    {isTouchpointsExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                )}
              </button>

              {userRole !== 'staff' && id === 'staff' && (
                <PaymentsPayoutsMenuSection
                  activeMenu={activeMenu}
                  tabParam={activeSubTab}
                  isExpanded={isPaymentsPayoutsExpanded}
                  onToggle={handlePaymentsPayoutsToggle}
                  onNavigate={handlePaymentsPayoutsNavigate}
                />
              )}

              {id === 'touchpoints' && isTouchpointsExpanded && (
                <div className={SIDEBAR_SUBMENU_WRAP_CLASS}>
                  {VISIBLE_TOUCHPOINTS_SUBMENU.map((sub) => {
                    const isSubActive = activeMenu === 'touchpoints' && (activeSubTab || 'stations') === sub.id
                    return (
                      <button
                        key={sub.id}
                        type="button"
                        onClick={() => {
                          navigate(`/dashboard/touchpoints?tab=${sub.id}`, { replace: true })
                        }}
                        className={sidebarSubmenuItemClass(isSubActive)}
                      >
                        <div className={`h-1.5 w-1.5 rounded-full ${isSubActive ? 'bg-brandCyan shadow-sm' : 'bg-white/30'}`} />
                        <span>{t(sub.labelKey)}</span>
                      </button>
                    )
                  })}
                </div>
              )}
            </React.Fragment>
          )
        })
      })()}

      </nav>

      <div className="mt-auto shrink-0 space-y-3 pt-3">
        {userRole !== 'staff' && (
          <SidebarPlanCard
            subscriptionCopy={subscriptionCopy}
            onManagePlan={() => setActiveMenu('subscriptions')}
            t={t}
          />
        )}

        <div className={`${SIDEBAR_SIGN_OUT_WRAP_CLASS} border-t-0 pt-0`}>
          <button onClick={onLogout} className="flex items-center gap-2 px-3 py-2 text-sm font-bold text-white/65 transition hover:text-white w-full">
            <LogOut className="h-4 w-4" />
            {t('dashboard.sidebar.sign_out')}
          </button>
        </div>
      </div>
    </aside>
  )
}
