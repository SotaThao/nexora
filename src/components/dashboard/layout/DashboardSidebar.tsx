// DashboardSidebar — left nav: brand, profile card, plan card, menu w/ tips & touchpoints sub-tabs.
// Extracted from Dashboard.jsx (Group 2 refactor).
import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom'
import { ChevronUp, ChevronDown, LogOut } from 'lucide-react'
import { useTranslation } from '../../../contexts/LanguageContext'
import { useOpenProductManagement } from '../../../data/hooks/useOpenProductManagement'
import { visibleMenuItems, MERCHANT_SIDEBAR_MENU_ITEMS, TAXIQ_SUBMENU, TAXIQ_MENU_CHILD_MODULE, POS_SUBMENU, isPaymentsPayoutsRouteActive, getVisibleBookingHubSubmenu, isBookingHubSubActive, VISIBLE_TOUCHPOINTS_SUBMENU, GIFT_CARD_CENTER_SUBMENU, DASHBOARD_MENU, DASHBOARD_MENU_ID, bookingHubPath, getDefaultBookingHubTab, getDashboardMenuLocalizedLabel, isDashboardStaffRole } from '../constants'
import { handleExpandableMenuClick } from '../hooks/expandableMenuNav'
import MenuIcon from '../../ui/MenuIcon'
import HomepageLink from '../../ui/HomepageLink'
import LanguageSwitcher from '../../ui/LanguageSwitcher'
import SidebarPlanCard from '../../ui/SidebarPlanCard'
import PaymentsPayoutsMenuSection from './PaymentsPayoutsMenuSection'
import { useMerchantVoiceTenantStatus } from '../../../data/hooks/useMerchantVoiceBookings'
import { getSubscriptionSidebarCopy } from '../../../utils/subscriptionDisplay'
import { useMerchantSetup } from '../../../data/hooks/useMerchantSetup'
import { useOwnerTaxYearByBusiness } from '../../../data/hooks/useTaxiqOwnerTaxYear'
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
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const { openProductManagement, isOpeningProductManagement, openingProductManagementDestination } = useOpenProductManagement()
  // Sub-tabs are URL-driven (?tab=) so the sidebar highlight stays in sync with
  // the rendered route content (TipsRoute / TouchpointsRoute read the same param).
  const activeSubTab = searchParams.get('tab')
  // Tax IQ sub-items are real routes (/dashboard/taxiq/<id>), not a ?tab= param.
  const activeTaxIqSubTab = location.pathname.split('/')[3] || null
  // POS sub-items are real routes too (/dashboard/pos/<id>); the bare /dashboard/pos
  // route is "General Settings" (no extra segment), mirroring Tax IQ's "onboarding".
  const activePosSubTab = location.pathname.split('/')[3] || null
  const { data: voiceTenantStatus } = useMerchantVoiceTenantStatus({
    enabled: !isDashboardStaffRole(userRole),
  })
  const hasVoiceTenant = voiceTenantStatus?.hasVoiceTenant === true
  const bookingHubSubmenu = getVisibleBookingHubSubmenu(hasVoiceTenant)
  const isPaymentsPayoutsActive = isPaymentsPayoutsRouteActive(activeMenu, activeSubTab)
  const [isPaymentsPayoutsExpanded, setIsPaymentsPayoutsExpanded] = useState(isPaymentsPayoutsActive)
  const [isTaxIqExpanded, setIsTaxIqExpanded] = useState(activeMenu === DASHBOARD_MENU.TaxIq)
  const [isPosExpanded, setIsPosExpanded] = useState(activeMenu === 'pos')
  // Module-gated Tax IQ sub-items: shares the TanStack Query cache with the
  // /dashboard/taxiq route itself, so this fires no extra network request.
  const { data: merchantSetupData } = useMerchantSetup({ enabled: userRole !== 'staff' })
  const taxiqBusinessId = merchantSetupData?.businessInfo?.businessId
  const { data: ownerTaxYearPage } = useOwnerTaxYearByBusiness(taxiqBusinessId, new Date().getFullYear())
  const enabledTaxiqModules = ownerTaxYearPage?.items?.[0]?.enabledModules
  const [isTouchpointsExpanded, setIsTouchpointsExpanded] = useState(activeMenu === DASHBOARD_MENU.Touchpoints)
  const [isBookingHubExpanded, setIsBookingHubExpanded] = useState(activeMenu === DASHBOARD_MENU.BookingHub)
  const [isGiftCardCenterExpanded, setIsGiftCardCenterExpanded] = useState(false)

  useEffect(() => {
    if (isPaymentsPayoutsActive) {
      setIsPaymentsPayoutsExpanded(true)
    }
    setIsTouchpointsExpanded(activeMenu === DASHBOARD_MENU.Touchpoints)
    setIsTaxIqExpanded(activeMenu === DASHBOARD_MENU.TaxIq)
    setIsPosExpanded(activeMenu === 'pos')
    setIsBookingHubExpanded(activeMenu === DASHBOARD_MENU.BookingHub)
  }, [activeMenu, isPaymentsPayoutsActive])

  const handlePaymentsPayoutsToggle = () => {
    setIsPaymentsPayoutsExpanded((prev) => !prev)
  }

  const handlePaymentsPayoutsNavigate = (screen: string, tab?: string) => {
    const route = `/dashboard/${screen}${tab ? `?tab=${encodeURIComponent(tab)}` : ''}`
    navigate(route, { replace: true })
    setIsPaymentsPayoutsExpanded(true)
    setIsTouchpointsExpanded(false)
    setIsTaxIqExpanded(false)
    setIsBookingHubExpanded(false)
    setIsGiftCardCenterExpanded(false)
  }

  const handleMenuClick = (id: string) => {
    if (id === DASHBOARD_MENU_ID.productManagement) {
      setIsGiftCardCenterExpanded((prev) => !prev)
      setIsTouchpointsExpanded(false)
      setIsBookingHubExpanded(false)
      setIsPaymentsPayoutsExpanded(false)
      return
    }

    handleExpandableMenuClick({
      clickedId: id,
      activeMenu,
      sections: [
        {
          id: DASHBOARD_MENU.Touchpoints,
          setExpanded: setIsTouchpointsExpanded,
          enter: () => setActiveMenu(DASHBOARD_MENU.Touchpoints),
        },
        {
          id: DASHBOARD_MENU.TaxIq,
          setExpanded: setIsTaxIqExpanded,
          enter: () => setActiveMenu(DASHBOARD_MENU.TaxIq),
        },
	{
          id: 'pos',
          setExpanded: setIsPosExpanded,
          enter: () => setActiveMenu('pos'),
        },
        {
          id: DASHBOARD_MENU.BookingHub,
          setExpanded: setIsBookingHubExpanded,
          enter: () => {
            if (hasVoiceTenant) {
              setActiveMenu(DASHBOARD_MENU.BookingHub)
              return
            }
            navigate(bookingHubPath(getDefaultBookingHubTab(false)), { replace: true })
          },
        },
      ],
      onPlainNavigate: setActiveMenu,
      collapseExtras: () => {
        setIsPaymentsPayoutsExpanded(false)
        setIsGiftCardCenterExpanded(false)
      },
    })
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
              type="button"
              onClick={() => {
                navigate('/dashboard/settings/profile')
                setSettingsTab('profile')
              }}
              className={`flex h-9 w-full items-center gap-2.5 rounded-lg px-3 text-left text-xs font-bold transition ${
                activeMenu === DASHBOARD_MENU_ID.settings && settingsTab === 'profile'
                  ? 'text-brandCyan font-extrabold'
                  : 'text-white/75 hover:bg-white/5 hover:text-white'
              }`}
            >
              <div className={`h-1.5 w-1.5 rounded-full ${activeMenu === DASHBOARD_MENU_ID.settings && settingsTab === 'profile' ? 'bg-brandCyan shadow-sm' : 'bg-white/30'}`} />
              <span>{t('dashboard.menu.business_setting')}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                navigate('/dashboard/settings/kyb')
                setSettingsTab('kyb')
              }}
              className={`flex h-9 w-full items-center gap-2.5 rounded-lg px-3 text-left text-xs font-bold transition ${
                activeMenu === DASHBOARD_MENU_ID.settings && settingsTab === 'kyb'
                  ? 'text-brandCyan font-extrabold'
                  : 'text-white/75 hover:bg-white/5 hover:text-white'
              }`}
            >
              <div className={`h-1.5 w-1.5 rounded-full ${activeMenu === DASHBOARD_MENU_ID.settings && settingsTab === 'kyb' ? 'bg-brandCyan shadow-sm' : 'bg-white/30'}`} />
              <span>{t('dashboard.menu.kyb')}</span>
            </button>
            <LanguageSwitcher variant="sidebar" className="w-full" />
          </div>
        )}
      </div>

      {/* Navigation Menu */}
      <nav className={SIDEBAR_NAV_CLASS}>
        <HomepageLink variant="menu" active={isHomeActive} />
        {(() => {
          const menuItemsToDisplay = userRole === 'staff'
            ? [
                { id: DASHBOARD_MENU_ID.overview, label: t('components.dashboard.layout.DashboardSidebar.myDashboard'), icon: visibleMenuItems.find(i => i.id === DASHBOARD_MENU_ID.overview)?.icon },
                { id: DASHBOARD_MENU_ID.support, label: t('dashboard.menu.support'), icon: visibleMenuItems.find(i => i.id === DASHBOARD_MENU_ID.support)?.icon }
              ]
            : MERCHANT_SIDEBAR_MENU_ITEMS

          return menuItemsToDisplay.map((item) => {
          const { id, label } = item
          const isActive = activeMenu === id
          const localizedLabel = getDashboardMenuLocalizedLabel(id, t, label)

          return (
            <React.Fragment key={id}>
              <button
                type="button"
                onClick={() => handleMenuClick(id)}
                disabled={id === DASHBOARD_MENU_ID.productManagement && isOpeningProductManagement}
                className={sidebarMenuItemBetweenClass(isActive || (id === DASHBOARD_MENU_ID.productManagement && isGiftCardCenterExpanded))}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <MenuIcon item={item} active={isActive || (id === DASHBOARD_MENU_ID.productManagement && isGiftCardCenterExpanded)} />
                  <span className="truncate">{localizedLabel}</span>
                </div>
                {id === DASHBOARD_MENU_ID.productManagement ? (
                  <div className="text-white/50 shrink-0">
                    {isOpeningProductManagement ? (
                      <span className="block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    ) : isGiftCardCenterExpanded ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </div>
                ): id === DASHBOARD_MENU.TaxIq ? (
                  <div className="text-white/50 shrink-0">
                    {isTaxIqExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                ): id === 'pos' ? (
                  <div className="text-white/50 shrink-0">
                    {isPosExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                ) : id === DASHBOARD_MENU.BookingHub ? (
                  <div className="text-white/50 shrink-0">
                    {isBookingHubExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                ) : null}
              </button>

              {userRole !== 'staff' && id === DASHBOARD_MENU_ID.staff && (
                <PaymentsPayoutsMenuSection
                  activeMenu={activeMenu}
                  tabParam={activeSubTab}
                  isExpanded={isPaymentsPayoutsExpanded}
                  onToggle={handlePaymentsPayoutsToggle}
                  onNavigate={handlePaymentsPayoutsNavigate}
                />
              )}

              {id === DASHBOARD_MENU_ID.productManagement && isGiftCardCenterExpanded && (
                <div className={SIDEBAR_SUBMENU_WRAP_CLASS}>
                  {GIFT_CARD_CENTER_SUBMENU.map((sub) => {
                    const isSubOpening = openingProductManagementDestination === sub.destination
                    return (
                      <button
                        key={sub.id}
                        type="button"
                        disabled={isOpeningProductManagement}
                        onClick={() => {
                          void openProductManagement(sub.destination)
                          setIsGiftCardCenterExpanded(true)
                        }}
                        className={sidebarSubmenuItemClass(isSubOpening)}
                      >
                        <div className={`h-1.5 w-1.5 rounded-full ${isSubOpening ? 'bg-brandCyan shadow-sm' : 'bg-white/30'}`} />
                        <span className="flex-1 text-left">{t(sub.labelKey)}</span>
                        {isSubOpening ? (
                          <span className="h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        ) : null}
                      </button>
                    )
                  })}
                </div>
              )}

              {id === DASHBOARD_MENU.BookingHub && isBookingHubExpanded && (
                <div className={SIDEBAR_SUBMENU_WRAP_CLASS}>
                  {bookingHubSubmenu.map((sub) => {
                    const isSubActive = isBookingHubSubActive(activeMenu, activeSubTab, sub.id, hasVoiceTenant)
                    return (
                      <button
                        key={sub.id}
                        type="button"
                        onClick={() => {
                          navigate(bookingHubPath(sub.id), { replace: true })
                          setIsBookingHubExpanded(true)
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

              {id === DASHBOARD_MENU.Touchpoints && isTouchpointsExpanded && (
                <div className={SIDEBAR_SUBMENU_WRAP_CLASS}>
                  {VISIBLE_TOUCHPOINTS_SUBMENU.map((sub) => {
                    const isSubActive = activeMenu === DASHBOARD_MENU.Touchpoints && (activeSubTab || 'stations') === sub.id
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

              {id === DASHBOARD_MENU.TaxIq && isTaxIqExpanded && (
                <div className={SIDEBAR_SUBMENU_WRAP_CLASS}>
                  {TAXIQ_SUBMENU.filter((sub) => {
                    // Fail-open (show all) before onboarding completes or while loading —
                    // only hide once we positively know a module is disabled.
                    const requiredModule = TAXIQ_MENU_CHILD_MODULE[sub.id]
                    if (!requiredModule || !enabledTaxiqModules) return true
                    return enabledTaxiqModules.includes(requiredModule)
                  }).map((sub) => {
                    // 'onboarding' lives at /dashboard/taxiq itself (no extra segment),
                    // so it's active whenever there's no deeper sub-route in the URL.
                    const isSubActive = activeMenu === DASHBOARD_MENU.TaxIq &&
                      (sub.id === 'onboarding' ? !activeTaxIqSubTab : activeTaxIqSubTab === sub.id)
                    return (
                      <button
                        key={sub.id}
                        type="button"
                        onClick={() => {
                          navigate(sub.id === 'onboarding' ? '/dashboard/taxiq' : `/dashboard/taxiq/${sub.id}`)
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
	      {id === 'pos' && isPosExpanded && (
                <div className={SIDEBAR_SUBMENU_WRAP_CLASS}>
                  {POS_SUBMENU.map((sub) => {
                    // 'board' (Front Desk) lives at /dashboard/pos itself (no
                    // extra segment) so it's the default POS view; it's active
                    // whenever there's no deeper sub-route.
                    const isSubActive = activeMenu === 'pos' &&
                      (sub.id === 'board' ? !activePosSubTab : activePosSubTab === sub.id)
                    return (
                      <button
                        key={sub.id}
                        type="button"
                        onClick={() => {
                          navigate(sub.id === 'board' ? '/dashboard/pos' : `/dashboard/pos/${sub.id}`)
                        }}
                        className={sidebarSubmenuItemClass(isSubActive)}
                      >
                        <div className={`h-1.5 w-1.5 rounded-full ${isSubActive ? 'bg-brandCyan shadow-sm' : 'bg-white/30'}`} />
                        <span>{t(`dashboard.menu.pos_${sub.id.replace('-', '_')}`)}</span>
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
