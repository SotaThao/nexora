// StaffSidebar — desktop (≥1024px) left nav and mobile drawer for the staff dashboard.
import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { LogOut, ChevronLeft, ChevronDown, ChevronUp } from 'lucide-react'
import { MY_CERTIFICATIONS_PATH_SEGMENT } from '../../dashboard/constants'
import { useStaffPendingAcceptanceCount } from '../../../data/hooks/useStaffPendingAcceptanceCount'
import { useTranslation } from '../../../contexts/LanguageContext'
import { STAFF_CALENDAR_LAYOUT_CLASS } from '../calendar/constants'
import { useStaffCalendarTodayCount } from '../calendar/useStaffCalendarSalon'
import {
  STAFF_CALENDAR_SCREEN,
  STAFF_MENU_ITEMS,
  STAFF_WORKSPACE_MENU_ITEM,
  STAFF_WORK_ORDERS_SCREEN,
  STAFF_WORKSPACE_SUBMENU,
  STAFF_TAXIQ_MENU_CHILD_MODULE,
  isStaffTopLevelMenuItemActive,
  isStaffWorkspaceRouteActive,
  isStaffWorkspaceSubActive,
} from '../constants'
import { useStaffAccount } from '../../../contexts/StaffAccountContext'
import { useStaffTaxYearByYear } from '../../../data/hooks/useTaxiqStaffTaxYear'
import MenuIcon from '../../ui/MenuIcon'
import HomepageLink from '../../ui/HomepageLink'
import LanguageSwitcher from '../../ui/LanguageSwitcher'
import {
  SIDEBAR_SHELL_CLASS,
  SIDEBAR_MOBILE_DRAWER_CLASS,
  SIDEBAR_NAV_CLASS,
  SIDEBAR_PROFILE_CARD_CLASS,
  SIDEBAR_AVATAR_IMAGE_CLASS,
  SIDEBAR_AVATAR_FALLBACK_CLASS,
  SIDEBAR_SIGN_OUT_WRAP_CLASS,
  SIDEBAR_SUBMENU_WRAP_CLASS,
  sidebarMenuItemClass,
  sidebarMenuItemBetweenClass,
  sidebarSubmenuItemClass,
} from '../../ui/sidebarMenuStyles'

export default function StaffSidebar({ activeScreen, isHomeActive = false, mobileOnly = false, onNavigate, onLogout, isOpen, onClose }) {
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { staffMember, account } = useStaffAccount()
  const displayName = account.defaultDisplayName || staffMember.fullName || 'Staff'
  const [isProfileExpanded, setIsProfileExpanded] = useState(false)
  const tabParam = searchParams.get('tab')
  const pendingAcceptanceCount = useStaffPendingAcceptanceCount().data ?? 0

  const isWorkspaceSectionActive = isStaffWorkspaceRouteActive(activeScreen, tabParam)

  const [isWorkspaceExpanded, setIsWorkspaceExpanded] = useState(isWorkspaceSectionActive)
  
  const [isTaxIqExpanded, setIsTaxIqExpanded] = useState(activeScreen === 'taxiq')
  // Tax IQ sub-items are real routes (/staff/taxiq/<id>), not a param — same
  // path-segment approach as DashboardSidebar.tsx's activeTaxIqSubTab.
  const activeTaxIqSubTab = location.pathname.split('/')[3] || null
  // Module-gated Tax IQ sub-items: shares the TanStack Query cache with the
  // /staff/taxiq route itself, so this fires no extra network request.
  const { data: staffTaxYearPage } = useStaffTaxYearByYear(new Date().getFullYear())
  const enabledTaxiqModules = staffTaxYearPage?.items?.[0]?.enabledModules
  // Shares the My Calendar screen's own queries, so the badge costs no extra request.
  const calendarTodayCount = useStaffCalendarTodayCount()

  useEffect(() => {
    setIsTaxIqExpanded(activeScreen === 'taxiq')
  }, [activeScreen])

  useEffect(() => {
    if (isWorkspaceSectionActive) {
      setIsWorkspaceExpanded(true)
    }
  }, [isWorkspaceSectionActive])

  const handleWorkspaceToggle = () => {
    setIsWorkspaceExpanded((prev) => !prev)
  }

  const handleWorkspaceNavigate = (item, isMobile) => {
    onNavigate(item.screen, item.params)
    if (isMobile && onClose) onClose()
  }

  const dashboardMenuItem = STAFF_MENU_ITEMS.find((item) => item.id === 'home')
  const sidebarMenuItems = STAFF_MENU_ITEMS.filter((item) => item.id !== 'home')
  const taxIqMenuItem = STAFF_MENU_ITEMS.find((item) => item.id === 'taxiq')

  const handleTaxIqToggle = () => {
    if (activeScreen === 'taxiq') {
      setIsTaxIqExpanded((prev) => !prev)
    } else {
      onNavigate('taxiq')
      setIsTaxIqExpanded(true)
    }
  }

  const handleTaxIqNavigate = (subId, isMobile) => {
    onNavigate(`taxiq/${subId}`)
    if (isMobile && onClose) onClose()
  }

  const renderTaxIqSection = (isMobile) => {
    const isTaxIqActive = activeScreen === 'taxiq'
    return (
      <div>
        <button
          type="button"
          onClick={handleTaxIqToggle}
          className={sidebarMenuItemBetweenClass(isTaxIqActive)}
        >
          <div className="flex items-center gap-3 min-w-0">
            <MenuIcon item={taxIqMenuItem} active={isTaxIqActive} />
            <span className="truncate">{t(taxIqMenuItem.labelKey)}</span>
          </div>
          <div className="shrink-0 text-white/50">
            {isTaxIqExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
        </button>

        {isTaxIqExpanded && (
          <div className={SIDEBAR_SUBMENU_WRAP_CLASS}>
            {taxIqMenuItem.children
              .filter((sub) => {
                // Fail-open (show all) before onboarding completes or while loading —
                // only hide once we positively know a module is disabled.
                const requiredModule = STAFF_TAXIQ_MENU_CHILD_MODULE[sub.id]
                if (!requiredModule || !enabledTaxiqModules) return true
                return enabledTaxiqModules.includes(requiredModule)
              })
              .map((sub) => {
                const isSubActive = isTaxIqActive && activeTaxIqSubTab === sub.id
                return (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() => handleTaxIqNavigate(sub.id, isMobile)}
                    className={sidebarSubmenuItemClass(isSubActive)}
                  >
                    <div className={`h-1.5 w-1.5 rounded-full ${isSubActive ? 'bg-brandCyan shadow-sm' : 'bg-white/30'}`} />
                    <span>{t(sub.labelKey)}</span>
                  </button>
                )
              })}
          </div>
        )}
      </div>
    )
  }

  const renderMenuItem = (item, isMobile) => {
    if (item.id === 'taxiq') {
      return <div key={item.id}>{renderTaxIqSection(isMobile)}</div>
    }

    const isActive = isStaffTopLevelMenuItemActive(activeScreen, tabParam, item.id)
    return (
      <button
        key={item.id}
        type="button"
        onClick={() => {
          onNavigate(item.id)
          if (isMobile && onClose) onClose()
        }}
        className={sidebarMenuItemClass(isActive)}
      >
        <MenuIcon item={item} active={isActive} />
        <span className="truncate">{t(item.labelKey)}</span>
        {item.id === STAFF_CALENDAR_SCREEN && calendarTodayCount > 0 ? (
          <span
            className={`${STAFF_CALENDAR_LAYOUT_CLASS.navCount} ${
              isActive
                ? STAFF_CALENDAR_LAYOUT_CLASS.navCountActive
                : STAFF_CALENDAR_LAYOUT_CLASS.navCountIdle
            }`}
          >
            {calendarTodayCount}
          </span>
        ) : null}
      </button>
    )
  }

  const renderWorkspaceSection = (isMobile) => (
    <div>
      <button
        type="button"
        onClick={handleWorkspaceToggle}
        className={sidebarMenuItemBetweenClass(isWorkspaceSectionActive)}
      >
        <div className="flex items-center gap-3 min-w-0">
          <MenuIcon item={STAFF_WORKSPACE_MENU_ITEM} active={isWorkspaceSectionActive} />
          <span className="truncate">{t(STAFF_WORKSPACE_MENU_ITEM.labelKey)}</span>
        </div>
        <div className="shrink-0 text-white/50">
          {isWorkspaceExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </div>
      </button>

      {isWorkspaceExpanded && (
        <div className={SIDEBAR_SUBMENU_WRAP_CLASS}>
          {STAFF_WORKSPACE_SUBMENU.map((item) => {
            const isSubActive = isStaffWorkspaceSubActive(
              activeScreen,
              tabParam,
              item,
              location.pathname,
            )
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleWorkspaceNavigate(item, isMobile)}
                className={sidebarSubmenuItemClass(isSubActive)}
              >
                <div className={`h-1.5 w-1.5 rounded-full ${isSubActive ? 'bg-brandCyan shadow-sm' : 'bg-white/30'}`} />
                <span>{t(item.labelKey)}</span>
                {item.screen === STAFF_WORK_ORDERS_SCREEN && pendingAcceptanceCount > 0 ? (
                  <span
                    aria-label={t('components.dashboard.views.pos.serviceLineStatus.pendingBadge', {
                      count: pendingAcceptanceCount,
                    })}
                    className="ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-400 px-1.5 text-[10px] font-black text-slate-900"
                  >
                    {pendingAcceptanceCount}
                  </span>
                ) : null}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )

  const renderContent = (isMobile = false) => (
    <>
      {isMobile && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Close navigation menu"
          className="absolute right-0 top-5 z-10 flex h-7 w-7 translate-x-1/2 items-center justify-center rounded-full bg-white text-nexoraText shadow-lg ring-1 ring-black/5 transition hover:bg-nexoraSurfaceMuted"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      )}

      <div className={SIDEBAR_PROFILE_CARD_CLASS}>
        <div
          className="flex items-center justify-between cursor-pointer"
          onClick={() => setIsProfileExpanded(!isProfileExpanded)}
        >
          <div className="flex items-center gap-3 min-w-0">
            {account.avatar ? (
              <img src={account.avatar} alt="" className={SIDEBAR_AVATAR_IMAGE_CLASS} />
            ) : (
              <div className={SIDEBAR_AVATAR_FALLBACK_CLASS}>
                {displayName.charAt(0)}
              </div>
            )}
            <div className="min-w-0">
              <div className="truncate text-sm font-bold text-white">{account.fullName || staffMember.fullName || displayName}</div>
              <div className="mt-0.5 truncate text-[11px] text-white/65">{t('staff_dashboard.staff_id')}: {account.staffCode || staffMember.id}</div>
            </div>
          </div>
          <div className="text-white/85 hover:text-white transition ml-2">
            {isProfileExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
        </div>

        {isProfileExpanded && (
          <div className="mt-3.5 pt-3 border-t border-white/5 space-y-1 animate-fadeIn">
            {[
              { tab: 'account', labelKey: 'staff_dashboard.nav.profile_account', disabled: false },
              { tab: 'kyc', labelKey: 'staff_dashboard.nav.profile_kyc', disabled: false },
            ].map(({ tab, labelKey, disabled }) => {
              const sectionParam = searchParams.get('section')
              const isSubActive =
                activeScreen === 'profile' &&
                (tab === 'account'
                  ? !sectionParam || sectionParam === 'personal'
                  : sectionParam === 'verification' || searchParams.get('tab') === 'kyc')
              return (
                <button
                  key={tab}
                  type="button"
                  disabled={disabled}
                  aria-disabled={disabled || undefined}
                  onClick={() => {
                    if (disabled) return
                    if (tab === 'kyc') {
                      onNavigate('profile', { section: 'verification' })
                    } else {
                      onNavigate('profile', { tab: 'account' })
                    }
                    if (isMobile && onClose) onClose()
                  }}
                  className={`flex h-9 w-full items-center gap-2.5 rounded-lg px-3 text-left text-xs font-bold transition ${
                    disabled
                      ? 'cursor-not-allowed text-white/40 opacity-60'
                      : isSubActive
                        ? 'text-brandCyan font-extrabold'
                        : 'text-white/75 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <div className={`h-1.5 w-1.5 rounded-full ${isSubActive ? 'bg-brandCyan shadow-sm' : 'bg-white/30'}`} />
                  <span>{t(labelKey)}</span>
                </button>
              )
            })}
            {/* Its own button rather than another entry in the list above: those two are tabs of
                the profile screen, this is a screen of its own. Personal, not salon-scoped, so it
                belongs in the account block and not in the workspace nav below. */}
            <button
              type="button"
              onClick={() => {
                onNavigate(MY_CERTIFICATIONS_PATH_SEGMENT)
                if (isMobile && onClose) onClose()
              }}
              className={`flex h-9 w-full items-center gap-2.5 rounded-lg px-3 text-left text-xs font-bold transition ${
                activeScreen === MY_CERTIFICATIONS_PATH_SEGMENT
                  ? 'text-brandCyan font-extrabold'
                  : 'text-white/75 hover:bg-white/5 hover:text-white'
              }`}
            >
              <div
                className={`h-1.5 w-1.5 rounded-full ${
                  activeScreen === MY_CERTIFICATIONS_PATH_SEGMENT
                    ? 'bg-brandCyan shadow-sm'
                    : 'bg-white/30'
                }`}
              />
              <span>{t('certifications.menu')}</span>
            </button>
            <LanguageSwitcher variant="sidebar" className="w-full" />
          </div>
        )}
      </div>

      <nav className={SIDEBAR_NAV_CLASS}>
        <HomepageLink
          variant="menu"
          active={isHomeActive}
          onNavigate={isMobile && onClose ? onClose : undefined}
        />

        {dashboardMenuItem && renderMenuItem(dashboardMenuItem, isMobile)}

        {renderWorkspaceSection(isMobile)}

        {sidebarMenuItems.map((item) => renderMenuItem(item, isMobile))}
      </nav>

      <div className={SIDEBAR_SIGN_OUT_WRAP_CLASS}>
        <button
          type="button"
          onClick={onLogout}
          className="flex w-full items-center gap-2 px-3 py-2 text-sm font-bold text-white/65 transition hover:text-white"
        >
          <LogOut className="h-4 w-4" />
          {t('staff_dashboard.sign_out')}
        </button>
      </div>
    </>
  )

  return (
    <>
      {!mobileOnly && (
      <aside className={SIDEBAR_SHELL_CLASS}>
        {renderContent(false)}
      </aside>
      )}

      {isOpen && (
        <div className="fixed inset-0 z-[100] lg:hidden" id="dashboard-mobile-menu">
          <button
            type="button"
            className="absolute inset-0 bg-nexoraText/60"
            aria-label="Close navigation menu"
            onClick={onClose}
          />
          <aside className={SIDEBAR_MOBILE_DRAWER_CLASS}>
            {renderContent(true)}
          </aside>
        </div>
      )}
    </>
  )
}
