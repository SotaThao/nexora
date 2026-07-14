import React from 'react'
import { useSearchParams } from 'react-router-dom'
import { ChevronLeft, ChevronUp, ChevronDown, LogOut } from 'lucide-react'
import { useTranslation } from '../../../contexts/LanguageContext'
import MenuIcon from '../../ui/MenuIcon'
import HomepageLink from '../../ui/HomepageLink'
import SidebarPlanCard from '../../ui/SidebarPlanCard'
import { getSubscriptionSidebarCopy } from '../../../utils/subscriptionDisplay'
import {
  SIDEBAR_MOBILE_DRAWER_CLASS,
  SIDEBAR_NAV_CLASS,
  SIDEBAR_PROFILE_CARD_CLASS,
  SIDEBAR_AVATAR_IMAGE_CLASS,
  SIDEBAR_AVATAR_FALLBACK_CLASS,
  SIDEBAR_SIGN_OUT_WRAP_CLASS,
  SIDEBAR_SUBMENU_WRAP_CLASS,
  sidebarMenuItemBetweenClass,
  sidebarSubmenuItemClass,
} from '../../ui/sidebarMenuStyles'
import PaymentsPayoutsMenuSection from './PaymentsPayoutsMenuSection'
import { isPaymentsPayoutsRouteActive, VISIBLE_TOUCHPOINTS_SUBMENU } from '../constants'

export default function MobileMenuDrawer({
  isOpen,
  onClose,
  profile,
  subscription = null,
  businessName,
  activeMenu,
  isHomeActive = false,
  setActiveMenu,
  settingsTab,
  setSettingsTab,
  isProfileExpanded,
  setIsProfileExpanded,
  isPaymentsPayoutsMobileExpanded,
  setIsPaymentsPayoutsMobileExpanded,
  isTouchpointsMobileExpanded,
  setIsTouchpointsMobileExpanded,
  hasKyb,
  userRole,
  onLogout,
  menuItemsToDisplay,
  navigateMenu,
}) {
  const { t, currentLanguage } = useTranslation()
  const [searchParams] = useSearchParams()
  const activeSubTab = searchParams.get('tab')
  const isPaymentsPayoutsActive = isPaymentsPayoutsRouteActive(activeMenu, activeSubTab)
  const subscriptionCopy = getSubscriptionSidebarCopy(
    subscription ?? profile?.subscription,
    t,
    currentLanguage,
  )

  const handlePaymentsPayoutsToggle = () => {
    setIsPaymentsPayoutsMobileExpanded((prev) => !prev)
  }

  const handlePaymentsPayoutsNavigate = (screen: string, tab?: string) => {
    navigateMenu(screen, { tab, closeDrawer: true })
    setIsPaymentsPayoutsMobileExpanded(true)
    setIsTouchpointsMobileExpanded(false)
  }

  const handleMenuClick = (id: string) => {
    if (id === 'touchpoints') {
      if (activeMenu === 'touchpoints') {
        setIsTouchpointsMobileExpanded((prev) => !prev)
      } else {
        navigateMenu('touchpoints', { closeDrawer: false })
        setIsTouchpointsMobileExpanded(true)
        setIsPaymentsPayoutsMobileExpanded(false)
      }
      return
    }

    navigateMenu(id)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] lg:hidden" id="dashboard-mobile-menu">
      <button
        type="button"
        className="absolute inset-0 bg-nexoraText/60"
        aria-label="Close navigation menu"
        onClick={onClose}
      />
      <aside className={`${SIDEBAR_MOBILE_DRAWER_CLASS} py-6`}>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close menu"
          className="absolute right-0 top-5 z-10 flex h-7 w-7 translate-x-1/2 items-center justify-center rounded-full bg-white text-nexoraText shadow-lg ring-1 ring-black/5 transition hover:bg-nexoraSurfaceMuted"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {/* Expandable Profile Card for Mobile */}
        <div className={`mb-4 ${SIDEBAR_PROFILE_CARD_CLASS}`}>
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
                <div className="truncate text-xs font-black text-white/65 uppercase tracking-wider">{businessName}</div>
                <div className="flex items-center gap-1 min-w-0 mt-0.5">
                  <div className="truncate text-xs font-bold text-white">{profile.fullName || businessName || profile.email}</div>
                </div>
                {!businessName && (
                  <div className="text-[10px] text-white/60 truncate mt-0.5">{profile.email}</div>
                )}
              </div>
            </div>
            <div className="text-white/85 hover:text-white transition ml-2">
              {isProfileExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </div>
          </div>

          {/* Submenu links */}
          {isProfileExpanded && userRole !== 'staff' && (
            <div className="mt-3 pt-2.5 border-t border-white/5 space-y-1 animate-fadeIn">
              <button
                type="button"
                onClick={() => {
                  setActiveMenu('settings')
                  setSettingsTab('profile')
                  onClose()
                }}
                className={`flex h-8 w-full items-center gap-2.5 rounded-lg px-2 text-left text-xs font-bold transition ${
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
                className="flex h-8 w-full cursor-not-allowed items-center gap-2.5 rounded-lg px-2 text-left text-xs font-bold text-white/40 opacity-60"
              >
                <div className="h-1.5 w-1.5 rounded-full bg-white/20" />
                <span>{t('dashboard.menu.kyb')} ({t('common.coming_soon')})</span>
              </button>
            </div>
          )}
        </div>

        <nav className={`${SIDEBAR_NAV_CLASS} mt-0 flex-1`}>
          <HomepageLink variant="menu" active={isHomeActive} onNavigate={onClose} />
          {menuItemsToDisplay.filter((item) => item.id !== 'settings').map((item) => {
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
                    <span>{localizedLabel}</span>
                  </div>
                  {id === 'touchpoints' && (
                    <div className="text-white/65 shrink-0">
                      {isTouchpointsMobileExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </div>
                  )}
                </button>

                {userRole !== 'staff' && id === 'staff' && (
                  <PaymentsPayoutsMenuSection
                    activeMenu={activeMenu}
                    tabParam={activeSubTab}
                    isExpanded={isPaymentsPayoutsMobileExpanded || isPaymentsPayoutsActive}
                    onToggle={handlePaymentsPayoutsToggle}
                    onNavigate={handlePaymentsPayoutsNavigate}
                  />
                )}

                {id === 'touchpoints' && isTouchpointsMobileExpanded && (
                  <div className={SIDEBAR_SUBMENU_WRAP_CLASS}>
                    {VISIBLE_TOUCHPOINTS_SUBMENU.map((sub) => {
                      const isSubActive = activeMenu === 'touchpoints' && (activeSubTab || 'stations') === sub.id
                      return (
                        <button
                          key={sub.id}
                          type="button"
                          onClick={() => navigateMenu('touchpoints', { tab: sub.id })}
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
          })}

        </nav>

        <div className="mt-auto shrink-0 space-y-3 pt-3">
          {userRole !== 'staff' && (
            <SidebarPlanCard
              subscriptionCopy={subscriptionCopy}
              onManagePlan={() => navigateMenu('subscriptions')}
              t={t}
              compact
            />
          )}

          <div className={`${SIDEBAR_SIGN_OUT_WRAP_CLASS} border-t-0 pt-0`}>
            <button
              onClick={onLogout}
              className="flex items-center gap-2 px-3 py-2.5 text-sm font-bold text-white/65 transition hover:text-white w-full"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
              <span>{t('dashboard.sidebar.sign_out')}</span>
            </button>
          </div>
        </div>
      </aside>
    </div>
  )
}
