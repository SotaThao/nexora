import React from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { ChevronLeft, ChevronUp, ChevronDown, LogOut } from 'lucide-react'
import { useTranslation } from '../../../contexts/LanguageContext'
import { useOpenProductManagement } from '../../../data/hooks/useOpenProductManagement'
import MenuIcon from '../../ui/MenuIcon'
import HomepageLink from '../../ui/HomepageLink'
import LanguageSwitcher from '../../ui/LanguageSwitcher'
import SidebarPlanCard from '../../ui/SidebarPlanCard'
import { getSubscriptionSidebarCopy, getTipPlatformSubscription } from '../../../utils/subscriptionDisplay'
import { useMerchantSetup } from '../../../data/hooks/useMerchantSetup'
import { useOwnerTaxYearByBusiness } from '../../../data/hooks/useTaxiqOwnerTaxYear'
import { useAuth } from '../../../auth/useAuth'
import {
  SIDEBAR_NAV_CLASS,
  SIDEBAR_PROFILE_CARD_CLASS,
  SIDEBAR_AVATAR_IMAGE_CLASS,
  SIDEBAR_AVATAR_FALLBACK_CLASS,
  SIDEBAR_MOBILE_SIGN_OUT_WRAP_CLASS,
  SIDEBAR_SUBMENU_WRAP_CLASS,
  sidebarMenuItemBetweenClass,
  sidebarSubmenuItemClass,
} from '../../ui/sidebarMenuStyles'
import PaymentsPayoutsMenuSection from './PaymentsPayoutsMenuSection'
import { 
	isPaymentsPayoutsRouteActive, 
	getVisibleBookingHubSubmenu, 
	isBookingHubSubActive,
	isPackageManagementSubActive, 
	PACKAGE_MANAGEMENT_SUBMENU,
	VISIBLE_TOUCHPOINTS_SUBMENU, 
	GIFT_CARD_CENTER_SUBMENU, 
	DASHBOARD_MENU,
	DASHBOARD_MENU_ID,
	MY_CERTIFICATIONS_PATH,
	MY_CERTIFICATIONS_PATH_SEGMENT,
	buildDashboardMenuPath,
	packageManagementPath,
	getDefaultBookingHubTab, 
	getDashboardMenuLocalizedLabel, 
	isDashboardStaffRole, 
	POS_SUBMENU, 
	TAXIQ_SUBMENU, 
	TAXIQ_MENU_CHILD_MODULE } from '../constants'
import { PackageManagementTab } from '../views/packageManagement/constants'
import { handleExpandableMenuClick } from '../hooks/expandableMenuNav'
import { useMerchantVoiceTenantStatus } from '../../../data/hooks/useMerchantVoiceBookings'
import MobileSidebarOverlay from '../../ui/MobileSidebarOverlay'

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
  isTaxIqMobileExpanded,
  setIsTaxIqMobileExpanded,
  isBookingHubMobileExpanded,
  setIsBookingHubMobileExpanded,
  isPosMobileExpanded,
  setIsPosMobileExpanded,
  isPackageManagementMobileExpanded,
  setIsPackageManagementMobileExpanded,
  isGiftCardCenterMobileExpanded,
  setIsGiftCardCenterMobileExpanded,
  hasKyb,
  userRole,
  onLogout,
  menuItemsToDisplay,
  navigateMenu,
}) {
  const { t, currentLanguage } = useTranslation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const location = useLocation()
  const { session } = useAuth()
  // POS is fully gated behind onboarding — no submenu until the merchant finishes it (see PosOnboardingLayout).
  const hasCompletedOnboarding = session?.hasCompletedOnboarding !== false
  const { openProductManagement, isOpeningProductManagement, openingProductManagementDestination } = useOpenProductManagement()
  const activeSubTab = searchParams.get('tab')
  // Tax IQ sub-items are real routes (/dashboard/taxiq/<id>), not a ?tab= param —
  // mirrors DashboardSidebar's desktop equivalent.
  const activeTaxIqSubTab = location.pathname.split('/')[3] || null
  // POS sub-items are real routes (/dashboard/pos/<id>), same as Tax IQ above —
  // mirrors DashboardSidebar's desktop equivalent (activePosSubTab).
  const activePosSubTab = location.pathname.split('/')[3] || null
  const isPaymentsPayoutsActive = isPaymentsPayoutsRouteActive(activeMenu, activeSubTab)
  // Module-gated Tax IQ sub-items: shares the TanStack Query cache with the
  // /dashboard/taxiq route itself and with DashboardSidebar, so this fires no
  // extra network request.
  const { data: merchantSetupData } = useMerchantSetup({ enabled: userRole !== 'staff' })
  const taxiqBusinessId = merchantSetupData?.businessInfo?.businessId
  const { data: ownerTaxYearPage } = useOwnerTaxYearByBusiness(taxiqBusinessId, new Date().getFullYear())
  const enabledTaxiqModules = ownerTaxYearPage?.items?.[0]?.enabledModules
  const { data: voiceTenantStatus } = useMerchantVoiceTenantStatus({
    enabled: !isDashboardStaffRole(userRole),
  })
  const hasVoiceTenant = voiceTenantStatus?.hasVoiceTenant === true
  const bookingHubSubmenu = getVisibleBookingHubSubmenu(hasVoiceTenant)
  const subscriptionCopy = getSubscriptionSidebarCopy(
    // Sidebar plan = TipPlatform (/dashboard/subscriptions), never VoiceAI (AI Hub).
    subscription ?? getTipPlatformSubscription(profile),
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
    setIsBookingHubMobileExpanded(false)
    setIsGiftCardCenterMobileExpanded(false)
  }

  const handleMenuClick = (id: string) => {
    if (id === DASHBOARD_MENU_ID.productManagement) {
      setIsGiftCardCenterMobileExpanded((prev) => !prev)
      setIsTouchpointsMobileExpanded(false)
      setIsBookingHubMobileExpanded(false)
      setIsPaymentsPayoutsMobileExpanded(false)
      return
    }

    handleExpandableMenuClick({
      clickedId: id,
      activeMenu,
      sections: [
        {
          id: DASHBOARD_MENU.PackageManagement,
          setExpanded: setIsPackageManagementMobileExpanded,
          enter: () =>
            navigateMenu(DASHBOARD_MENU.PackageManagement, {
              closeDrawer: false,
              tab: PackageManagementTab.Overview,
            }),
        },
        {
          id: DASHBOARD_MENU.TaxIq,
          setExpanded: setIsTaxIqMobileExpanded,
          enter: () => navigateMenu(DASHBOARD_MENU.TaxIq, { closeDrawer: false }),
        },
        ...(VISIBLE_TOUCHPOINTS_SUBMENU.length > 0
          ? [{
              id: DASHBOARD_MENU.Touchpoints,
              setExpanded: setIsTouchpointsMobileExpanded,
              enter: () => navigateMenu(DASHBOARD_MENU.Touchpoints, { closeDrawer: false }),
            }]
          : []),
        {
          id: DASHBOARD_MENU.BookingHub,
          setExpanded: setIsBookingHubMobileExpanded,
          enter: () =>
            navigateMenu(DASHBOARD_MENU.BookingHub, {
              closeDrawer: false,
              tab: hasVoiceTenant ? undefined : getDefaultBookingHubTab(false),
            }),
        },
        {
          id: DASHBOARD_MENU.Pos,
          setExpanded: setIsPosMobileExpanded,
          enter: () => navigateMenu(DASHBOARD_MENU.Pos, { closeDrawer: false }),
        },
      ],
      onPlainNavigate: (menuId) => navigateMenu(menuId),
      collapseExtras: () => {
        setIsPaymentsPayoutsMobileExpanded(false)
        setIsGiftCardCenterMobileExpanded(false)
      },
    })
  }

  return (
    <MobileSidebarOverlay isOpen={isOpen} onClose={onClose} panelClassName="py-6">
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
          {isProfileExpanded && (
            <div className="mt-3 pt-2.5 border-t border-white/5 space-y-1 animate-fadeIn">
              {userRole !== 'staff' && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      navigate('/dashboard/settings/profile')
                      setSettingsTab('profile')
                      onClose()
                    }}
                    className={`flex h-8 w-full items-center gap-2.5 rounded-lg px-2 text-left text-xs font-bold transition ${
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
                      onClose()
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
                  {/* Personal, not business-scoped — a NEXORA TOUCH certificate belongs to whoever
                      is signed in, so it sits in this account block rather than under a workspace
                      module. */}
                  <button
                    type="button"
                    onClick={() => {
                      navigate(MY_CERTIFICATIONS_PATH)
                      onClose()
                    }}
                    className={`flex h-9 w-full items-center gap-2.5 rounded-lg px-3 text-left text-xs font-bold transition ${
                      activeMenu === MY_CERTIFICATIONS_PATH_SEGMENT
                        ? 'text-brandCyan font-extrabold'
                        : 'text-white/75 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <div className={`h-1.5 w-1.5 rounded-full ${activeMenu === MY_CERTIFICATIONS_PATH_SEGMENT ? 'bg-brandCyan shadow-sm' : 'bg-white/30'}`} />
                    <span>{t('certifications.menu')}</span>
                  </button>
                </>
              )}
              <LanguageSwitcher variant="sidebar" className="w-full" />
            </div>
          )}
        </div>

        <nav className={`${SIDEBAR_NAV_CLASS} mt-0 flex-1`}>
          <HomepageLink variant="menu" active={isHomeActive} onNavigate={onClose} />
          {menuItemsToDisplay.filter(
            (item) =>
              item.id !== DASHBOARD_MENU_ID.settings &&
              item.id !== DASHBOARD_MENU_ID.staff,
          ).map((item) => {
            const { id, label } = item
            const isActive = activeMenu === id
            const localizedLabel = getDashboardMenuLocalizedLabel(id, t, label)

            return (
              <React.Fragment key={id}>
                <button
                  type="button"
                  onClick={() => handleMenuClick(id)}
                  disabled={id === DASHBOARD_MENU_ID.productManagement && isOpeningProductManagement}
                  className={sidebarMenuItemBetweenClass(isActive || (id === DASHBOARD_MENU_ID.productManagement && isGiftCardCenterMobileExpanded) || (id === DASHBOARD_MENU_ID.packageManagement && isPackageManagementMobileExpanded))}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <MenuIcon item={item} active={isActive || (id === DASHBOARD_MENU_ID.productManagement && isGiftCardCenterMobileExpanded) || (id === DASHBOARD_MENU_ID.packageManagement && isPackageManagementMobileExpanded)} />
                    <span>{localizedLabel}</span>
                  </div>
                  {id === DASHBOARD_MENU_ID.productManagement ? (
                    <div className="text-white/65 shrink-0">
                      {isOpeningProductManagement ? (
                        <span className="block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      ) : isGiftCardCenterMobileExpanded ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </div>
                  ): id === DASHBOARD_MENU_ID.packageManagement ? (
                    <div className="text-white/65 shrink-0">
                      {isPackageManagementMobileExpanded ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </div>
                  ) : id === DASHBOARD_MENU.Touchpoints && VISIBLE_TOUCHPOINTS_SUBMENU.length > 0 ? (
                    <div className="text-white/65 shrink-0">
                      {isTouchpointsMobileExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </div>
                  )  : id === DASHBOARD_MENU.TaxIq ? (
                    <div className="text-white/65 shrink-0">
                      {isTaxIqMobileExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </div>
                  ) : id === DASHBOARD_MENU.BookingHub ? (
                    <div className="text-white/65 shrink-0">
                      {isBookingHubMobileExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </div>
                  ) : id === DASHBOARD_MENU.Pos && hasCompletedOnboarding ? (
                    <div className="text-white/65 shrink-0">
                      {isPosMobileExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </div>
                  ) : null}
                </button>

                {userRole !== 'staff' && id === DASHBOARD_MENU_ID.overview && (
                  <PaymentsPayoutsMenuSection
                    activeMenu={activeMenu}
                    tabParam={activeSubTab}
                    isExpanded={isPaymentsPayoutsMobileExpanded || isPaymentsPayoutsActive}
                    onToggle={handlePaymentsPayoutsToggle}
                    onNavigate={handlePaymentsPayoutsNavigate}
                  />
                )}

                {id === DASHBOARD_MENU_ID.productManagement && isGiftCardCenterMobileExpanded && (
                  <div className={SIDEBAR_SUBMENU_WRAP_CLASS}>
                    {GIFT_CARD_CENTER_SUBMENU.map((sub) => {
                      const isSubOpening = openingProductManagementDestination === sub.destination
                      return (
                        <button
                          key={sub.id}
                          type="button"
                          disabled={isOpeningProductManagement}
                          onClick={() => {
                            void openProductManagement(sub.destination).finally(() => {
                              onClose()
                            })
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

                {id === DASHBOARD_MENU.PackageManagement && isPackageManagementMobileExpanded && (
                  <div className={SIDEBAR_SUBMENU_WRAP_CLASS}>
                    {PACKAGE_MANAGEMENT_SUBMENU.map((sub) => {
                      const isSubActive = isPackageManagementSubActive(
                        activeMenu,
                        activeSubTab,
                        sub.id,
                        location.pathname,
                      )
                      return (
                        <button
                          key={sub.id}
                          type="button"
                          onClick={() =>
                            navigateMenu(DASHBOARD_MENU.PackageManagement, {
                              tab: sub.id,
                            })
                          }
                          className={sidebarSubmenuItemClass(isSubActive)}
                        >
                          <div
                            className={`h-1.5 w-1.5 rounded-full ${isSubActive ? 'bg-brandCyan shadow-sm' : 'bg-white/30'}`}
                          />
                          <span>{t(sub.labelKey)}</span>
                        </button>
                      )
                    })}
                  </div>
                )}

                {id === DASHBOARD_MENU.BookingHub && isBookingHubMobileExpanded && (
                  <div className={SIDEBAR_SUBMENU_WRAP_CLASS}>
                    {bookingHubSubmenu.map((sub) => {
                      const isSubActive = isBookingHubSubActive(activeMenu, activeSubTab, sub.id, hasVoiceTenant)
                      return (
                        <button
                          key={sub.id}
                          type="button"
                          onClick={() => navigateMenu(DASHBOARD_MENU.BookingHub, { tab: sub.id })}
                          className={sidebarSubmenuItemClass(isSubActive)}
                        >
                          <div className={`h-1.5 w-1.5 rounded-full ${isSubActive ? 'bg-brandCyan shadow-sm' : 'bg-white/30'}`} />
                          <span>{t(sub.labelKey)}</span>
                        </button>
                      )
                    })}
                  </div>
                )}
                {id === DASHBOARD_MENU.TaxIq && isTaxIqMobileExpanded && (
                  <div className={SIDEBAR_SUBMENU_WRAP_CLASS}>
                    {TAXIQ_SUBMENU.filter((sub) => {
                      // Fail-open (show all) before onboarding completes or while loading —
                      // only hide once we positively know a module is disabled.
                      const requiredModule = TAXIQ_MENU_CHILD_MODULE[sub.id]
                      if (!requiredModule || !enabledTaxiqModules) return true
                      return enabledTaxiqModules.includes(requiredModule)
                    }).map((sub) => {
                      const isSubActive = activeMenu === DASHBOARD_MENU.TaxIq &&
                        (sub.id === 'onboarding' ? !activeTaxIqSubTab : activeTaxIqSubTab === sub.id)
                      return (
                        <button
                          key={sub.id}
                          type="button"
                          onClick={() => navigateMenu(sub.id === 'onboarding' ? DASHBOARD_MENU.TaxIq : `${DASHBOARD_MENU.TaxIq}/${sub.id}`)}
                          className={sidebarSubmenuItemClass(isSubActive)}
                        >
                          <div className={`h-1.5 w-1.5 rounded-full ${isSubActive ? 'bg-brandCyan shadow-sm' : 'bg-white/30'}`} />
                          <span>{t(sub.labelKey)}</span>
                        </button>
                      )
                    })}
                  </div>
                )}
                {id === DASHBOARD_MENU.Touchpoints &&
                  VISIBLE_TOUCHPOINTS_SUBMENU.length > 0 &&
                  isTouchpointsMobileExpanded && (
                  <div className={SIDEBAR_SUBMENU_WRAP_CLASS}>
                    {VISIBLE_TOUCHPOINTS_SUBMENU.map((sub) => {
                      const isSubActive = activeMenu === DASHBOARD_MENU.Touchpoints && (activeSubTab || 'stations') === sub.id
                      return (
                        <button
                          key={sub.id}
                          type="button"
                          onClick={() => navigateMenu(DASHBOARD_MENU.Touchpoints, { tab: sub.id })}
                          className={sidebarSubmenuItemClass(isSubActive)}
                        >
                          <div className={`h-1.5 w-1.5 rounded-full ${isSubActive ? 'bg-brandCyan shadow-sm' : 'bg-white/30'}`} />
                          <span>{t(sub.labelKey)}</span>
                        </button>
                      )
                    })}
                  </div>
                )}
                {id === DASHBOARD_MENU.Pos && isPosMobileExpanded && hasCompletedOnboarding && (
                  <div className={SIDEBAR_SUBMENU_WRAP_CLASS}>
                    {POS_SUBMENU.map((sub) => {
                      // 'board' (Front Desk) lives at /dashboard/pos itself (no
                      // extra segment) so it's the default POS view; it's active
                      // whenever there's no deeper sub-route.
                      const isSubActive = activeMenu === DASHBOARD_MENU.Pos &&
                        (sub.id === 'board' ? !activePosSubTab : activePosSubTab === sub.id)
                      return (
                        <button
                          key={sub.id}
                          type="button"
                          onClick={() => navigateMenu(
                            sub.id === 'board'
                              ? DASHBOARD_MENU.Pos
                              : sub.id === 'report'
                                ? `${DASHBOARD_MENU.Pos}/report/technician`
                                : `${DASHBOARD_MENU.Pos}/${sub.id}`,
                          )}
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
              onManagePlan={() => {
                navigate(packageManagementPath(PackageManagementTab.Subscriptions))
                onClose()
              }}
              t={t}
              compact
            />
          )}

          <div className={SIDEBAR_MOBILE_SIGN_OUT_WRAP_CLASS}>
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
    </MobileSidebarOverlay>
  )
}
