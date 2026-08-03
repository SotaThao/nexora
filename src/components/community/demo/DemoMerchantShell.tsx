import {
  ChevronDown,
  ChevronLeft,
  ChevronUp,
  CircleDollarSign,
  Home,
  LogOut,
  Menu,
  MessageCircle,
  Plus,
  QrCode,
  Search,
  Users,
  X,
} from 'lucide-react'
import { Fragment, useState, type ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from '../../../contexts/LanguageContext'
import { CommunityChatInboxTrigger } from '../CommunityChatDock'
import { CommunityNotificationBell } from '../CommunityNotifications'
import {
  MERCHANT_SIDEBAR_MENU_ITEMS,
  VISIBLE_TOUCHPOINTS_SUBMENU,
} from '../../dashboard/constants'
import PaymentsPayoutsMenuSection from '../../dashboard/layout/PaymentsPayoutsMenuSection'
import AppDownloadLinks from '../../ui/AppDownloadLinks'
import LanguageSwitcher from '../../ui/LanguageSwitcher'
import MenuIcon from '../../ui/MenuIcon'
import SidebarPlanCard from '../../ui/SidebarPlanCard'
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

type DemoMerchantShellProps = {
  children: ReactNode
  onDemoNavigation: () => void
}

type DemoMerchantSidebarProps = {
  isOpen: boolean
  onClose: () => void
  onDemoNavigation: () => void
}

const homepageMenuItem = { id: 'homepage', icon: Home }
const communityMenuItem = { id: 'community', icon: MessageCircle }
const communitySubmenuItems = [
  { id: 'feed', label: 'Feed' },
  { id: 'groups', label: 'Groups' },
  { id: 'learning', label: 'Learning' },
  { id: 'jobs', label: 'Jobs' },
  { id: 'events', label: 'Events' },
] as const

function merchantMenuLabel(id: string, fallback: string, t: (key: string) => string) {
  return (
    {
      overview: t('dashboard.menu.dashboard'),
      staff: t('dashboard.menu.staff'),
      reviews: t('dashboard.menu.reviews'),
      reports: t('dashboard.menu.transactions'),
      'booking-hub': t('dashboard.menu.booking_hub'),
      touchpoints: t('dashboard.menu.touchpoints'),
      devices: t('dashboard.menu.qr_nfc'),
      analytics: t('dashboard.menu.analytics'),
      settings: t('dashboard.menu.settings'),
      support: t('dashboard.menu.support'),
    }[id] || fallback
  )
}

// Demo-local replica of dashboard/layout/DashboardSidebar.tsx and MobileMenuDrawer.tsx.
// The production shell cannot be mounted on this public route because it consumes auth/query/router state.
function DemoMerchantSidebar({ isOpen, onClose, onDemoNavigation }: DemoMerchantSidebarProps) {
  const { t } = useTranslation()
  const { pathname, search } = useLocation()
  const isCommunityRoute = pathname === '/community' || pathname.startsWith('/community/')
  const isCommunityHomeRoute = pathname === '/community' || pathname === '/community/'
  const activeCommunityTab = isCommunityHomeRoute
    ? new URLSearchParams(search).get('tab') ?? 'feed'
    : null
  const [isProfileExpanded, setIsProfileExpanded] = useState(false)
  const [isCommunityExpanded, setIsCommunityExpanded] = useState(isCommunityRoute)
  const [isPaymentsExpanded, setIsPaymentsExpanded] = useState(false)
  const [isTouchpointsExpanded, setIsTouchpointsExpanded] = useState(false)
  const overviewItem = MERCHANT_SIDEBAR_MENU_ITEMS.find((item) => item.id === 'overview')
  const remainingItems = MERCHANT_SIDEBAR_MENU_ITEMS.filter((item) => item.id !== 'overview')

  const handleUnavailable = (isMobile: boolean) => {
    onDemoNavigation()
    if (isMobile) onClose()
  }

  const renderProfileCard = (isMobile: boolean) => (
    <div className={(isMobile ? 'mb-4 ' : '') + SIDEBAR_PROFILE_CARD_CLASS}>
      <button
        type="button"
        aria-expanded={isProfileExpanded}
        onClick={() => setIsProfileExpanded((current) => !current)}
        className="flex min-h-11 w-full items-center justify-between text-left"
      >
        <span className="flex min-w-0 items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/10 text-base font-extrabold">
            B
          </span>
          <span className="min-w-0">
            {isMobile ? (
              <span className="block truncate text-xs font-black uppercase tracking-wider text-white/65">
                Bitcoin Nail Bar
              </span>
            ) : null}
            <span className={(isMobile ? 'mt-0.5 text-xs' : 'text-sm') + ' block truncate font-bold text-white'}>
              {isMobile ? 'Kayla Le' : 'Bitcoin Nail Bar'}
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
            onClick={() => handleUnavailable(isMobile)}
            className="flex min-h-11 w-full items-center gap-2.5 rounded-lg px-3 text-left text-xs font-bold text-white/75 transition hover:bg-white/5 hover:text-white"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-white/30" />
            <span>{t('dashboard.menu.business_setting')}</span>
          </button>
          <button
            type="button"
            disabled
            aria-disabled="true"
            className="flex min-h-11 w-full cursor-not-allowed items-center gap-2.5 rounded-lg px-3 text-left text-xs font-bold text-white/40 opacity-60"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-white/20" />
            <span>{t('dashboard.menu.kyb')} ({t('common.coming_soon')})</span>
          </button>
        </div>
      ) : null}
    </div>
  )

  const renderMenuItem = (
    item: (typeof MERCHANT_SIDEBAR_MENU_ITEMS)[number],
    isMobile: boolean,
  ) => {
    const isTouchpoints = item.id === 'touchpoints'
    const isStaffItem = item.id === 'staff'
    return (
      <Fragment key={item.id}>
        {isStaffItem ? (
          // Real route navigation (not a modal) so the URL actually changes —
          // team members reviewing the demo can see/share the real flow.
          <Link
            to="/community/staff"
            onClick={() => { if (isMobile) onClose() }}
            className={sidebarMenuItemBetweenClass(false)}
          >
            <span className="flex min-w-0 items-center gap-3">
              <MenuIcon item={item} active={false} />
              <span className="truncate">{merchantMenuLabel(item.id, item.label, t)}</span>
            </span>
          </Link>
        ) : (
          <button
            type="button"
            aria-expanded={isTouchpoints ? isTouchpointsExpanded : undefined}
            onClick={() => {
              if (isTouchpoints) setIsTouchpointsExpanded((current) => !current)
              onDemoNavigation()
              if (isMobile && !isTouchpoints) onClose()
            }}
            className={sidebarMenuItemBetweenClass(false)}
          >
            <span className="flex min-w-0 items-center gap-3">
              <MenuIcon item={item} active={false} />
              <span className="truncate">{merchantMenuLabel(item.id, item.label, t)}</span>
            </span>
            {isTouchpoints ? (
              <span className="shrink-0 text-white/50">
                {isTouchpointsExpanded ? (
                  <ChevronUp className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <ChevronDown className="h-4 w-4" aria-hidden="true" />
                )}
              </span>
            ) : null}
          </button>
        )}

        {item.id === 'staff' ? (
          <PaymentsPayoutsMenuSection
            activeMenu="community"
            tabParam={null}
            isExpanded={isPaymentsExpanded}
            onToggle={() => {
              setIsPaymentsExpanded((current) => !current)
              onDemoNavigation()
            }}
            onNavigate={() => handleUnavailable(isMobile)}
          />
        ) : null}

        {isTouchpoints && isTouchpointsExpanded ? (
          <div className={SIDEBAR_SUBMENU_WRAP_CLASS}>
            {VISIBLE_TOUCHPOINTS_SUBMENU.map((subItem) => (
              <button
                key={subItem.id}
                type="button"
                onClick={() => handleUnavailable(isMobile)}
                className={sidebarSubmenuItemClass(false) + ' min-h-11'}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-white/30" />
                <span>{t(subItem.labelKey)}</span>
              </button>
            ))}
          </div>
        ) : null}
      </Fragment>
    )
  }

  const renderNavigation = (isMobile: boolean) => (
    <nav className={(isMobile ? SIDEBAR_NAV_CLASS + ' mt-0 flex-1' : SIDEBAR_NAV_CLASS)} aria-label="Điều hướng merchant demo">
      <button
        type="button"
        onClick={() => handleUnavailable(isMobile)}
        className={sidebarMenuItemClass(false) + ' border-0'}
      >
        <MenuIcon item={homepageMenuItem} active={false} />
        <span className="truncate">{t('dashboard.menu.home')}</span>
      </button>

      {overviewItem ? renderMenuItem(overviewItem, isMobile) : null}

      <div>
        <button
          type="button"
          aria-current={isCommunityRoute ? 'page' : undefined}
          aria-expanded={isCommunityExpanded}
          onClick={() => {
            setIsCommunityExpanded((current) => !current)
            onDemoNavigation()
          }}
          className={sidebarMenuItemBetweenClass(isCommunityRoute)}
        >
          <span className="flex min-w-0 items-center gap-3">
            <MenuIcon item={communityMenuItem} active={isCommunityRoute} />
            <span className="truncate">Community</span>
          </span>
          <span className="flex shrink-0 items-center gap-2">
            <span className="rounded-full bg-white/15 px-2 py-0.5 text-[9px] font-black tracking-wide text-white ring-1 ring-white/20">
              NEW
            </span>
            <span className="text-white/50">
              {isCommunityExpanded ? (
                <ChevronUp className="h-4 w-4" aria-hidden="true" />
              ) : (
                <ChevronDown className="h-4 w-4" aria-hidden="true" />
              )}
            </span>
          </span>
        </button>

        {isCommunityExpanded ? (
          <div className={SIDEBAR_SUBMENU_WRAP_CLASS}>
            {communitySubmenuItems.map((item) => {
              const isActive = activeCommunityTab === item.id

              return (
                <Link
                  key={item.id}
                  to={`/community?tab=${item.id}`}
                  aria-current={isActive ? 'page' : undefined}
                  onClick={() => handleUnavailable(isMobile)}
                  className={`flex min-h-11 w-full items-center gap-2.5 rounded-lg px-3 text-left text-xs font-bold transition hover:bg-white/5 hover:text-white ${
                    isActive ? 'bg-white/5 text-white' : 'text-white/75'
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      isActive ? 'bg-white/75' : 'bg-white/30'
                    }`}
                  />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </div>
        ) : null}
      </div>

      {remainingItems
        .filter((item) => !isMobile || item.id !== 'settings')
        .map((item) => renderMenuItem(item, isMobile))}
    </nav>
  )

  const renderBottom = (isMobile: boolean) => (
    <div className="mt-auto shrink-0 space-y-3 pt-3">
      <SidebarPlanCard
        subscriptionCopy={{ planLabel: 'Nexora Pro', detailLabel: 'Đang hoạt động' }}
        onManagePlan={() => handleUnavailable(isMobile)}
        t={t}
        compact={isMobile}
      />
      <div className={SIDEBAR_SIGN_OUT_WRAP_CLASS + ' border-t-0 pt-0'}>
        <button
          type="button"
          onClick={() => handleUnavailable(isMobile)}
          className="flex min-h-11 w-full items-center gap-2 px-3 py-2 text-sm font-bold text-white/65 transition hover:text-white"
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
          {t('dashboard.sidebar.sign_out')}
        </button>
      </div>
    </div>
  )

  return (
    <>
      <aside className="fixed bottom-0 left-0 top-[52px] z-30 hidden w-72 flex-col bg-nexoraSidebar px-5 py-7 text-white lg:flex">
        {renderProfileCard(false)}
        {renderNavigation(false)}
        {renderBottom(false)}
      </aside>

      {isOpen ? (
        <div className="fixed inset-x-0 bottom-0 top-[52px] z-[100] lg:hidden" id="community-business-mobile-menu">
          <button
            type="button"
            className="absolute inset-0 bg-nexoraText/60"
            aria-label="Đóng menu điều hướng"
            onClick={onClose}
          />
          <aside className={SIDEBAR_MOBILE_DRAWER_CLASS + ' py-6'}>
            <button
              type="button"
              onClick={onClose}
              aria-label="Đóng menu"
              className="absolute right-0 top-5 z-10 flex h-11 w-11 translate-x-1/2 items-center justify-center rounded-full bg-white text-nexoraText shadow-lg ring-1 ring-black/5 transition hover:bg-nexoraSurfaceMuted"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </button>
            {renderProfileCard(true)}
            {renderNavigation(true)}
            {renderBottom(true)}
          </aside>
        </div>
      ) : null}
    </>
  )
}

type DemoMerchantHeaderProps = {
  onOpenMobileMenu: () => void
  onDemoNavigation: () => void
}

// Demo-local replica of DashboardHeader.mobile.tsx and DashboardHeader.desktop.tsx.
// Query-backed search and dropdown panels are represented by their closed production states.
function DemoMerchantHeader({ onOpenMobileMenu, onDemoNavigation }: DemoMerchantHeaderProps) {
  const { t } = useTranslation()
  const { pathname } = useLocation()
  // CommunityNotificationBell/CommunityChatInboxTrigger need CommunityAuthProvider +
  // CommunityChatDockProvider, which only wrap the real /community route (not the
  // provider-less /design-demo/community-business preview) — gate on pathname like
  // DemoStaffShell's header does, so this never crashes when reused there.
  const showCommunityActions = pathname === '/community' || pathname.startsWith('/community/')

  const utilityControls = (
    <>
      <LanguageSwitcher className="[&>button]:min-h-11 [&>button]:min-w-11" />
      <button
        type="button"
        aria-label="Hệ sinh thái Nexora"
        onClick={onDemoNavigation}
        className="grid h-11 w-11 place-items-center rounded-lg text-nexoraText transition hover:bg-nexoraSurfaceMuted"
      >
        <img src="/assets/icon_eco.svg" alt="" className="h-[22px] w-[22px]" aria-hidden="true" />
      </button>
      {showCommunityActions ? (
        <>
          <CommunityNotificationBell />
          <CommunityChatInboxTrigger />
        </>
      ) : (
        <button
          type="button"
          aria-label="Thông báo"
          onClick={onDemoNavigation}
          className="relative flex h-11 w-11 items-center justify-center rounded-xl border border-nexoraBorder bg-white text-nexoraText shadow-nexora-soft transition hover:bg-nexoraSurfaceMuted"
        >
          <img src="/assets/menu/notification.png" alt="" className="h-5 w-5 object-contain" aria-hidden="true" />
          <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-nexoraDanger px-1 text-[9px] font-black text-white ring-2 ring-white">
            4
          </span>
        </button>
      )}
      <button
        type="button"
        aria-label="Menu tài khoản Bitcoin Nail Bar"
        onClick={onDemoNavigation}
        className="relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border border-nexoraBorder bg-gradient-to-br from-nexoraElectric to-nexoraViolet text-[11px] font-bold uppercase text-white shadow-nexora-soft transition hover:opacity-90"
      >
        BN
      </button>
    </>
  )

  return (
    <header className="safe-area-top sticky top-[52px] z-20 border-b border-nexoraBorder bg-nexoraSurface/90 backdrop-blur-md">
      <div className="flex min-h-16 items-center justify-between px-4 lg:hidden">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenMobileMenu}
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-nexoraBorder bg-white text-nexoraText shadow-nexora-soft transition hover:bg-nexoraSurfaceMuted"
            aria-label="Mở menu điều hướng"
            aria-controls="community-business-mobile-menu"
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
          </button>
          <img src="/assets/nexora-logo.png" alt="Nexora Logo" className="h-9 w-9 shrink-0 object-contain" />
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2">{utilityControls}</div>
      </div>

      <div className="hidden min-h-16 items-center justify-between gap-3 px-5 lg:flex">
        <div className="relative w-full max-w-[385px]">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-nexoraMuted" aria-hidden="true" />
          <input
            readOnly
            aria-label="Tìm kiếm trong dashboard"
            className="nexora-search-input"
            placeholder={t('dashboard.header.search_placeholder')}
          />
        </div>
        <div className="flex shrink-0 items-center gap-3">
          {utilityControls}
          <button type="button" onClick={onDemoNavigation} className="nexora-primary-button min-h-11">
            <Plus className="h-4 w-4" aria-hidden="true" />
            <span>{t('dashboard.header.add_tp')}</span>
          </button>
        </div>
      </div>
    </header>
  )
}

type DemoMerchantBottomNavProps = {
  onDemoNavigation: () => void
}

// Demo-local replica of dashboard/layout/MobileBottomNav.tsx with Community inserted demo-locally.
function DemoMerchantBottomNav({ onDemoNavigation }: DemoMerchantBottomNavProps) {
  const items = [
    { id: 'overview', label: 'Home', Icon: Home },
    { id: 'staff', label: 'Staff', Icon: Users },
    { id: 'community', label: 'Community', Icon: MessageCircle },
    { id: 'tips', label: 'Tips', Icon: CircleDollarSign },
    { id: 'touchpoints', label: 'QR', Icon: QrCode },
  ]

  return (
    <nav
      aria-label="Điều hướng merchant trên di động"
      className="fixed bottom-0 left-0 right-0 z-30 border-t border-nexoraBorder bg-white/95 backdrop-blur-md lg:hidden"
      style={{
        paddingBottom: 'var(--app-safe-area-bottom, env(safe-area-inset-bottom, 0px))',
        boxShadow: '0 -8px 28px rgba(15,23,42,0.08)',
      }}
    >
      <div className="flex h-[68px] items-center px-2">
        {items.map(({ id, label, Icon }) => {
          const active = id === 'community'
          const content = (
            <>
              <span className="relative">
                <Icon
                  className={'h-5 w-5 transition-colors duration-200 ' + (active ? 'text-nexoraBrandDark' : 'text-nexoraSubtle')}
                  strokeWidth={active ? 2.4 : 2}
                  aria-hidden="true"
                />
                {active ? (
                  <span className="absolute -right-4 -top-2 rounded-full bg-nexoraBrandSoft px-1 text-[7px] font-black text-nexoraBrand">
                    NEW
                  </span>
                ) : null}
              </span>
              <span className={'max-w-full truncate px-0.5 text-[11px] font-bold transition-colors duration-200 ' + (active ? 'text-nexoraBrand' : 'text-nexoraSubtle')}>
                {label}
              </span>
            </>
          )
          const itemClassName = 'relative flex h-full min-w-0 flex-1 flex-col items-center justify-center gap-1 focus:outline-none active:scale-95 transition-transform'

          if (id === 'staff') {
            // Real route navigation (not a modal) — matches the sidebar's Staff link.
            return (
              <Link key={id} to="/community/staff" className={itemClassName}>
                {content}
              </Link>
            )
          }

          return (
            <button
              key={id}
              type="button"
              aria-current={active ? 'page' : undefined}
              onClick={active ? undefined : onDemoNavigation}
              className={itemClassName}
            >
              {content}
            </button>
          )
        })}
      </div>
    </nav>
  )
}

export default function DemoMerchantShell({ children, onDemoNavigation }: DemoMerchantShellProps) {
  const { t } = useTranslation()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-dvh w-full overflow-x-hidden bg-nexoraCanvas font-sans text-nexoraText">
      <div aria-hidden="true" className="h-[52px]" />
      <DemoMerchantSidebar
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        onDemoNavigation={onDemoNavigation}
      />

      <div className="flex min-h-[calc(100dvh-52px)] w-full min-w-0 flex-col lg:pl-72">
        <DemoMerchantHeader
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          onDemoNavigation={onDemoNavigation}
        />
        <main className="w-full min-w-0 flex-1 overflow-x-hidden p-4 pb-6 sm:p-6 sm:pb-8 lg:p-7 lg:pb-7">
          {children}
        </main>
        <footer className="mb-20 border-t border-nexoraBorder bg-white px-3 py-3 sm:px-6 lg:mb-0 lg:px-7 lg:py-4">
          <div className="flex flex-wrap items-center justify-between gap-2 text-left">
            <p className="shrink-0 text-xs font-medium text-slate-700 sm:text-sm">{t('dashboard.footer.copyright')}</p>
            <AppDownloadLinks />
          </div>
        </footer>
      </div>

      <DemoMerchantBottomNav onDemoNavigation={onDemoNavigation} />
    </div>
  )
}
