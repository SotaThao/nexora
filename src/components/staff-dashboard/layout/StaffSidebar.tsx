// StaffSidebar — desktop (≥1024px) left nav and mobile drawer for the staff dashboard.
import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { LogOut, ChevronLeft, ChevronDown, ChevronUp } from 'lucide-react'
import { useTranslation } from '../../../contexts/LanguageContext'
import {
  STAFF_MENU_ITEMS,
  STAFF_WORKSPACE_MENU_ITEM,
  STAFF_WORKSPACE_SUBMENU,
  isStaffTopLevelMenuItemActive,
  isStaffWorkspaceRouteActive,
  isStaffWorkspaceSubActive,
} from '../constants'
import { useStaffAccount } from '../../../contexts/StaffAccountContext'
import MenuIcon from '../../ui/MenuIcon'
import HomepageLink from '../../ui/HomepageLink'
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
  const { staffMember, account } = useStaffAccount()
  const displayName = account.defaultDisplayName || staffMember.fullName || 'Staff'
  const [isProfileExpanded, setIsProfileExpanded] = useState(false)
  const tabParam = searchParams.get('tab')

  const isWorkspaceSectionActive = isStaffWorkspaceRouteActive(activeScreen, tabParam)

  const [isWorkspaceExpanded, setIsWorkspaceExpanded] = useState(isWorkspaceSectionActive)

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

  const renderMenuItem = (item, isMobile) => {
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
            const isSubActive = isStaffWorkspaceSubActive(activeScreen, tabParam, item)
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleWorkspaceNavigate(item, isMobile)}
                className={sidebarSubmenuItemClass(isSubActive)}
              >
                <div className={`h-1.5 w-1.5 rounded-full ${isSubActive ? 'bg-brandCyan shadow-sm' : 'bg-white/30'}`} />
                <span>{t(item.labelKey)}</span>
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
              { tab: 'kyc', labelKey: 'staff_dashboard.nav.profile_kyc', disabled: true },
            ].map(({ tab, labelKey, disabled }) => {
              const isSubActive = activeScreen === 'profile' && tab === 'account'
              return (
                <button
                  key={tab}
                  type="button"
                  disabled={disabled}
                  aria-disabled={disabled || undefined}
                  onClick={() => {
                    if (disabled) return
                    onNavigate('profile', { tab })
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
                  <span>
                    {t(labelKey)}
                    {disabled ? ` (${t('common.coming_soon')})` : ''}
                  </span>
                </button>
              )
            })}
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
