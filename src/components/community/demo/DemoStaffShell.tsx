import {
  ChevronDown,
  ChevronLeft,
  ChevronUp,
  Home,
  LogOut,
  Menu,
  Plus,
  User,
  Users,
  Wallet,
} from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { useTranslation } from '../../../contexts/LanguageContext'
import AppDownloadLinks from '../../ui/AppDownloadLinks'
import LanguageSwitcher from '../../ui/LanguageSwitcher'
import MenuIcon from '../../ui/MenuIcon'
import {
  SIDEBAR_MOBILE_DRAWER_CLASS,
  SIDEBAR_NAV_CLASS,
  SIDEBAR_PROFILE_CARD_CLASS,
  SIDEBAR_SIGN_OUT_WRAP_CLASS,
  SIDEBAR_SUBMENU_WRAP_CLASS,
  sidebarMenuItemBetweenClass,
  sidebarMenuItemClass,
  sidebarSubmenuItemClass,
} from '../../ui/sidebarMenuStyles'
import {
  STAFF_MENU_ITEMS,
  STAFF_WORKSPACE_MENU_ITEM,
  STAFF_WORKSPACE_SUBMENU,
} from '../../staff-dashboard/constants'

const communityMenuItem = { id: 'community', icon: Users }
const homepageMenuItem = { id: 'homepage', icon: Home }

type DemoStaffShellProps = {
  children: ReactNode
  onDemoNavigation: () => void
}

type DemoSidebarProps = {
  isOpen: boolean
  onClose: () => void
  onDemoNavigation: () => void
}

// Demo-local replica of staff-dashboard/layout/StaffSidebar.tsx.
// The production component cannot be mounted here because it reads StaffAccount and query-backed URL state.
function DemoSidebar({ isOpen, onClose, onDemoNavigation }: DemoSidebarProps) {
  const { t } = useTranslation()
  const [isProfileExpanded, setIsProfileExpanded] = useState(false)
  const [isWorkspaceExpanded, setIsWorkspaceExpanded] = useState(false)
  const dashboardMenuItem = STAFF_MENU_ITEMS.find((item) => item.id === 'home')
  const remainingMenuItems = STAFF_MENU_ITEMS.filter((item) => item.id !== 'home')

  const handleUnavailableItem = (isMobile: boolean) => {
    onDemoNavigation()
    if (isMobile) onClose()
  }

  const renderRegularItem = (item: (typeof STAFF_MENU_ITEMS)[number], isMobile: boolean) => (
    <button
      key={item.id}
      type="button"
      onClick={() => handleUnavailableItem(isMobile)}
      className={sidebarMenuItemClass(false)}
    >
      <MenuIcon item={item} active={false} />
      <span className="truncate">{t(item.labelKey)}</span>
    </button>
  )

  const renderContent = (isMobile: boolean) => (
    <>
      {isMobile ? (
        <button
          type="button"
          onClick={onClose}
          aria-label="Đóng menu điều hướng"
          className="absolute right-0 top-5 z-10 flex h-11 w-11 translate-x-1/2 items-center justify-center rounded-full bg-white text-nexoraText shadow-lg ring-1 ring-black/5 transition hover:bg-nexoraSurfaceMuted"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        </button>
      ) : null}

      <div className={SIDEBAR_PROFILE_CARD_CLASS}>
        <button
          type="button"
          aria-expanded={isProfileExpanded}
          onClick={() => setIsProfileExpanded((current) => !current)}
          className="flex min-h-11 w-full items-center justify-between text-left"
        >
          <span className="flex min-w-0 items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/10 text-base font-extrabold">
              K
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-bold text-white">Kayla Le</span>
              <span className="mt-0.5 block truncate text-[11px] text-white/65">
                {t('staff_dashboard.staff_id')}: NX-2481
              </span>
            </span>
          </span>
          <span className="ml-2 shrink-0 text-white/85 transition hover:text-white">
            {isProfileExpanded ? (
              <ChevronUp className="h-4 w-4" aria-hidden="true" />
            ) : (
              <ChevronDown className="h-4 w-4" aria-hidden="true" />
            )}
          </span>
        </button>

        {isProfileExpanded ? (
          <div className="mt-3.5 space-y-1 border-t border-white/5 pt-3 animate-fadeIn">
            <button
              type="button"
              onClick={() => handleUnavailableItem(isMobile)}
              className="flex min-h-11 w-full items-center gap-2.5 rounded-lg px-3 text-left text-xs font-bold text-white/75 transition hover:bg-white/5 hover:text-white"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-white/30" />
              {t('staff_dashboard.nav.profile_account')}
            </button>
            <button
              type="button"
              disabled
              aria-disabled="true"
              className="flex min-h-11 w-full cursor-not-allowed items-center gap-2.5 rounded-lg px-3 text-left text-xs font-bold text-white/40 opacity-60"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-white/30" />
              {t('staff_dashboard.nav.profile_kyc')} ({t('common.coming_soon')})
            </button>
          </div>
        ) : null}
      </div>

      <nav className={SIDEBAR_NAV_CLASS} aria-label="Điều hướng staff demo">
        <button
          type="button"
          onClick={() => handleUnavailableItem(isMobile)}
          className={sidebarMenuItemClass(false) + ' border-0'}
        >
          <MenuIcon item={homepageMenuItem} active={false} />
          <span className="truncate">{t('dashboard.menu.home')}</span>
        </button>

        {dashboardMenuItem ? renderRegularItem(dashboardMenuItem, isMobile) : null}

        <button
          type="button"
          aria-current="page"
          className={sidebarMenuItemClass(true)}
        >
          <MenuIcon item={communityMenuItem} active />
          <span className="min-w-0 flex-1 truncate">Community</span>
          <span className="shrink-0 rounded-full bg-white/15 px-2 py-0.5 text-[9px] font-black tracking-wide text-white ring-1 ring-white/20">
            NEW
          </span>
        </button>

        <div>
          <button
            type="button"
            aria-expanded={isWorkspaceExpanded}
            onClick={() => {
              setIsWorkspaceExpanded((current) => !current)
              onDemoNavigation()
            }}
            className={sidebarMenuItemBetweenClass(false)}
          >
            <span className="flex min-w-0 items-center gap-3">
              <MenuIcon item={STAFF_WORKSPACE_MENU_ITEM} active={false} />
              <span className="truncate">{t(STAFF_WORKSPACE_MENU_ITEM.labelKey)}</span>
            </span>
            <span className="shrink-0 text-white/50">
              {isWorkspaceExpanded ? (
                <ChevronUp className="h-4 w-4" aria-hidden="true" />
              ) : (
                <ChevronDown className="h-4 w-4" aria-hidden="true" />
              )}
            </span>
          </button>

          {isWorkspaceExpanded ? (
            <div className={SIDEBAR_SUBMENU_WRAP_CLASS}>
              {STAFF_WORKSPACE_SUBMENU.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleUnavailableItem(isMobile)}
                  className={sidebarSubmenuItemClass(false) + ' min-h-11'}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-white/30" />
                  <span>{t(item.labelKey)}</span>
                </button>
              ))}
            </div>
          ) : null}
        </div>

        {remainingMenuItems.map((item) => renderRegularItem(item, isMobile))}
      </nav>

      <div className={SIDEBAR_SIGN_OUT_WRAP_CLASS}>
        <button
          type="button"
          onClick={() => handleUnavailableItem(isMobile)}
          className="flex min-h-11 w-full items-center gap-2 px-3 py-2 text-sm font-bold text-white/65 transition hover:text-white"
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
          {t('staff_dashboard.sign_out')}
        </button>
      </div>
    </>
  )

  return (
    <>
      <aside className="fixed bottom-0 left-0 top-[52px] z-30 hidden w-72 flex-col bg-nexoraSidebar px-5 py-7 text-white lg:flex">
        {renderContent(false)}
      </aside>

      {isOpen ? (
        <div className="fixed inset-x-0 bottom-0 top-[52px] z-[100] lg:hidden" id="community-demo-mobile-menu">
          <button
            type="button"
            className="absolute inset-0 bg-nexoraText/60"
            aria-label="Đóng menu điều hướng"
            onClick={onClose}
          />
          <aside className={SIDEBAR_MOBILE_DRAWER_CLASS}>{renderContent(true)}</aside>
        </div>
      ) : null}
    </>
  )
}

type DemoHeaderProps = {
  onOpenMobileMenu: () => void
  onDemoNavigation: () => void
}

// Demo-local replica of StaffHeader.mobile.tsx and StaffHeader.desktop.tsx.
// Query-backed notification/ecosystem controls are represented by their closed visual states.
function DemoHeader({ onOpenMobileMenu, onDemoNavigation }: DemoHeaderProps) {
  return (
    <header className="safe-area-top sticky top-[52px] z-20 border-b border-nexoraBorder bg-nexoraSurface">
      <div className="flex items-center justify-between gap-2 px-4 py-3 lg:hidden">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenMobileMenu}
            aria-label="Mở menu điều hướng"
            aria-controls="community-demo-mobile-menu"
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-nexoraText transition hover:bg-nexoraCanvas"
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
          </button>
          <img src="/assets/nexora-logo.png" alt="Nexora Logo" className="h-9 w-9 shrink-0 object-contain" />
        </div>

        <div className="flex items-center justify-end gap-1.5 sm:gap-2">
          <LanguageSwitcher className="[&>button]:min-h-11 [&>button]:min-w-11" />
          <button
            type="button"
            aria-label="Hệ sinh thái Nexora"
            onClick={onDemoNavigation}
            className="grid h-11 w-11 place-items-center rounded-lg text-nexoraText transition hover:bg-nexoraSurfaceMuted"
          >
            <img src="/assets/icon_eco.svg" alt="" className="h-[22px] w-[22px]" aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-label="Thông báo"
            onClick={onDemoNavigation}
            className="relative flex h-11 w-11 items-center justify-center rounded-full transition hover:bg-nexoraCanvas"
          >
            <img src="/assets/menu/notification.png" alt="" className="h-5 w-5 object-contain" aria-hidden="true" />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-nexoraDanger ring-2 ring-white" />
          </button>
          <button
            type="button"
            aria-label="Hồ sơ Kayla Le"
            onClick={onDemoNavigation}
            className="relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border-2 border-white bg-gradient-to-br from-nexoraElectric to-nexoraViolet text-sm font-bold text-white shadow-sm transition hover:opacity-90"
          >
            K
            <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-nexoraSuccess" />
          </button>
        </div>
      </div>

      <div className="hidden min-h-16 items-center justify-between gap-3 px-5 lg:flex">
        <div className="flex min-w-0 items-center gap-2">
          <h1 className="truncate text-lg font-extrabold text-nexoraText">Community</h1>
          <span className="rounded-full bg-gradient-to-r from-nexoraElectric to-nexoraViolet px-2 py-1 text-[9px] font-extrabold tracking-wide text-white">
            NEW
          </span>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <button
            type="button"
            className="inline-flex min-h-11 items-center justify-center rounded-full bg-gradient-to-r from-nexoraElectric to-nexoraViolet px-4 text-[12px] font-extrabold text-white shadow-nexora-soft transition hover:opacity-90"
          >
            ＋ Tạo nhóm
          </button>
          <LanguageSwitcher className="[&>button]:min-h-11 [&>button]:min-w-11" />
          <button
            type="button"
            aria-label="Hệ sinh thái Nexora"
            onClick={onDemoNavigation}
            className="grid h-11 w-11 place-items-center rounded-lg text-nexoraText transition hover:bg-nexoraSurfaceMuted"
          >
            <img src="/assets/icon_eco.svg" alt="" className="h-[22px] w-[22px]" aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-label="Thông báo"
            onClick={onDemoNavigation}
            className="relative flex h-11 w-11 items-center justify-center rounded-full border border-nexoraBorder transition hover:bg-nexoraCanvas"
          >
            <img src="/assets/menu/notification.png" alt="" className="h-5 w-5 object-contain" aria-hidden="true" />
            <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-nexoraDanger px-1 text-[9px] font-black text-white ring-2 ring-white">
              3
            </span>
          </button>
          <button
            type="button"
            aria-label="Hồ sơ Kayla Le"
            onClick={onDemoNavigation}
            className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border border-nexoraBorder bg-nexoraBrand text-sm font-bold text-white transition hover:opacity-90"
          >
            K
          </button>
        </div>
      </div>
    </header>
  )
}

type DemoBottomNavProps = {
  onDemoNavigation: () => void
}

// Demo-local replica of staff-dashboard/layout/StaffBottomNav.tsx.
// It keeps the real 68px shell, icon scale, and label type while applying the approved Community nav slots.
function DemoBottomNav({ onDemoNavigation }: DemoBottomNavProps) {
  const itemClass =
    'relative flex h-full min-w-0 flex-1 flex-col items-center justify-center gap-1 focus:outline-none active:scale-95 transition-transform'

  return (
    <nav
      aria-label="Điều hướng chính trên di động"
      className="fixed bottom-0 left-0 right-0 z-30 border-t border-white/10 bg-nexoraSidebar lg:hidden"
      style={{
        paddingBottom: 'var(--app-safe-area-bottom, env(safe-area-inset-bottom, 0px))',
        boxShadow: '0 -8px 28px rgba(15,23,42,0.20)',
      }}
    >
      <div className="mx-auto flex h-[68px] max-w-lg items-center px-2">
        <button type="button" onClick={onDemoNavigation} className={itemClass}>
          <Home className="h-5 w-5 text-white/65" strokeWidth={2} aria-hidden="true" />
          <span className="max-w-full truncate px-0.5 text-[11px] font-bold text-white/65">Home</span>
        </button>
        <button type="button" onClick={onDemoNavigation} className={itemClass}>
          <Wallet className="h-5 w-5 text-white/65" strokeWidth={2} aria-hidden="true" />
          <span className="max-w-full truncate px-0.5 text-[11px] font-bold text-white/65">Wallet</span>
        </button>
        <div className="flex h-full min-w-0 flex-1 items-center justify-center">
          <button
            type="button"
            aria-label="Tạo mới"
            onClick={onDemoNavigation}
            className="relative -top-2 grid h-[52px] w-[52px] place-items-center rounded-full border-[5px] border-nexoraSidebar bg-gradient-to-br from-nexoraElectric to-nexoraViolet text-white shadow-lg shadow-nexoraElectric/30"
          >
            <Plus className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>
        <button type="button" aria-current="page" className={itemClass}>
          <span className="relative">
            <Users
              className="h-5 w-5 text-brandCyan drop-shadow-[0_0_7px_rgba(50,215,255,0.85)]"
              strokeWidth={2.4}
              aria-hidden="true"
            />
            <span className="absolute -right-2 -top-1 h-2 w-2 rounded-full bg-nexoraDanger ring-2 ring-nexoraSidebar" />
          </span>
          <span className="max-w-full truncate px-0.5 text-[11px] font-bold text-brandCyan">Community</span>
        </button>
        <button type="button" onClick={onDemoNavigation} className={itemClass}>
          <User className="h-5 w-5 text-white/65" strokeWidth={2} aria-hidden="true" />
          <span className="max-w-full truncate px-0.5 text-[11px] font-bold text-white/65">Profile</span>
        </button>
      </div>
    </nav>
  )
}

export default function DemoStaffShell({ children, onDemoNavigation }: DemoStaffShellProps) {
  const { t } = useTranslation()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-dvh bg-nexoraCanvas text-nexoraText">
      <div aria-hidden="true" className="h-[52px]" />
      <DemoSidebar
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        onDemoNavigation={onDemoNavigation}
      />

      <div className="flex min-h-[calc(100dvh-52px)] flex-col lg:pl-72">
        <DemoHeader
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          onDemoNavigation={onDemoNavigation}
        />
        <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-5 sm:px-6">{children}</main>
        <footer className="mb-20 border-t border-nexoraBorder bg-white px-3 py-3 sm:px-6 lg:mb-0 lg:px-7 lg:py-4">
          <div className="flex flex-nowrap items-center justify-between gap-2 text-left">
            <p className="min-w-0 flex-1 truncate text-xs font-medium text-slate-700 sm:text-sm">
              {t('dashboard.footer.copyright')}
            </p>
            <div className="shrink-0">
              <AppDownloadLinks />
            </div>
          </div>
        </footer>
      </div>

      <DemoBottomNav onDemoNavigation={onDemoNavigation} />
    </div>
  )
}
