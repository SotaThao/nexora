/** Homepage section component */
import { useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Globe, ChevronDown, LayoutDashboard, LogOut } from 'lucide-react'
import { useHomePageBridge } from '../context/HomePageBridgeContext'
import { useHomePageLayout } from '../context/HomePageLayoutContext'
import useAuth from '../../../auth/useAuth'
import { dashboardPathForSession } from '../utils/sessionRouting'
import { getInitialHomePageLanguage } from '../homepageLogic.js'
import { homepageTranslations, type HomePageLang } from '../i18n/homepageTranslations'
import HeaderEcosystem from '../../dashboard/layout/HeaderEcosystem'

export default function HomePageHeaderSection() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { hp, onLogout } = useHomePageBridge()
  const { hasMobileMenu, openSidebarMenu } = useHomePageLayout()
  const { session, status } = useAuth()
  const [homepageLang, setHomepageLang] = useState<HomePageLang>(getInitialHomePageLanguage)

  const copy = homepageTranslations[homepageLang]
  const homeAnchorPrefix = pathname === '/' ? '' : '/'
  const homeHref = pathname === '/' ? '#' : '/'
  const isAuthenticated = status === 'authenticated' && Boolean(session)
  const dashboardPath = useMemo(
    () => (session ? dashboardPathForSession(session) : '/dashboard'),
    [session],
  )
  const dashboardLabel = dashboardPath === '/staff'
    ? copy['header-staff']
    : copy['header-dashboard']

  const handleSelectLanguage = (lang: HomePageLang) => {
    hp.selectLanguage(lang)
    setHomepageLang(lang)
  }

  const handleMobileMenuToggle = () => {
    if (hasMobileMenu) {
      openSidebarMenu()
      return
    }
    hp.toggleMobileMenu()
  }

  return (
    <>
      <header className="safe-area-top fixed top-0 inset-x-0 z-50 bg-white/90 backdrop-blur-md border-b border-line">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            <button
              className="mobile-menu-toggle lg:hidden focus:outline-none focus:ring-2 focus:ring-purple/35 ds-control ds-button"
              aria-controls={hasMobileMenu ? 'dashboard-mobile-menu' : 'mobile-navigation-menu'}
              aria-label={hasMobileMenu ? 'Open navigation menu' : 'Open mobile menu'}
              aria-expanded="false"
              id="mobile-menu-toggle"
              onClick={handleMobileMenuToggle}
              type="button"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6 transition-transform duration-300" fill="none" id="mobile-menu-icon" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M4 6h16M4 12h16M4 18h16" id="hamburger-path" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" />
              </svg>
            </button>

            <a className="hidden sm:flex items-center group shrink-0 ds-control ds-link" href={homeHref} aria-label="NEXORA TOUCH">
              <picture>
                <source media="(max-width: 767px)" srcSet="/homepage/assets/images/icon-nexora.png" />
                <img alt="NEXORA TOUCH" className="homepage-header-logo-img h-8 sm:h-10 w-auto group-hover:scale-105 transition-transform" src="/homepage/assets/images/logo-light-mode.png" />
              </picture>
            </a>
          </div>

          <nav className="hidden lg:flex items-center gap-4 xl:gap-8 text-sm font-semibold text-slate-600">
            <a className="hover:text-purple transition-colors ds-control ds-link ds-nav-link" data-i18n="nav-features" href={`${homeAnchorPrefix}#features`}>{copy['nav-features']}</a>
            <a className="hover:text-purple transition-colors ds-control ds-link ds-nav-link" href="https://taxiq.nexoratouch.com/" target="_blank" rel="noopener noreferrer">
              <span data-i18n="nav-simulator">{copy['nav-simulator']}</span>
            </a>
            <a className="hover:text-purple transition-colors ds-control ds-link ds-nav-link" data-i18n="nav-tax-iq" href={`${homeAnchorPrefix}#tax-iq`}>{copy['nav-tax-iq']}</a>
            <a className="hover:text-purple transition-colors ds-control ds-link ds-nav-link" data-i18n="nav-rewards" href={`${homeAnchorPrefix}#customer-rewards`}>{copy['nav-rewards']}</a>
            <a className="hover:text-purple transition-colors ds-control ds-link ds-nav-link" data-i18n="nav-calculator" href={`${homeAnchorPrefix}#calculator`}>{copy['nav-calculator']}</a>
            <a className="hover:text-purple transition-colors ds-control ds-link ds-nav-link" data-i18n="nav-pricing" href={`${homeAnchorPrefix}#pricing`}>{copy['nav-pricing']}</a>
            <Link className="hover:text-purple transition-colors ds-control ds-link ds-nav-link" data-i18n="nav-news-library" to="/news-library">
              {copy['nav-news-library']}
            </Link>
          </nav>

          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            <div className="relative inline-block text-left">
              <button
                type="button"
                className="flex flex-col items-center justify-center rounded-lg px-2 py-1 leading-none text-nexoraText transition hover:bg-nexoraCanvas ds-control ds-button"
                id="lang-dropdown-btn"
                aria-haspopup="listbox"
                aria-expanded="false"
                onClick={() => { hp.toggleLanguageDropdown() }}
              >
                <Globe className="h-4 w-4 text-nexoraMuted" aria-hidden="true" />
                <span className="mt-0.5 text-[9px] font-bold uppercase tracking-wide" id="lang-current-text">{homepageLang.toUpperCase()}</span>
                <ChevronDown className="hidden" id="lang-dropdown-chevron" aria-hidden="true" />
              </button>

              <div className="hidden absolute right-0 mt-2 w-36 bg-white rounded-2xl shadow-xl border border-slate-100 animate-fadeIn z-50 overflow-hidden ds-surface" id="language-dropdown-menu">
                <div className="py-1">
                  <button
                    type="button"
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer ds-control"
                    onClick={() => handleSelectLanguage('vi')}
                  >
                    Tiếng Việt
                  </button>
                  <button
                    type="button"
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer ds-control"
                    onClick={() => handleSelectLanguage('en')}
                  >
                    English
                  </button>
                </div>
              </div>
            </div>

            <HeaderEcosystem plain />

            {hasMobileMenu && isAuthenticated ? (
              <div className="flex items-center gap-2" id="header-user-badge">
                <button
                  type="button"
                  className="homepage-header-action homepage-header-action--primary"
                  onClick={() => navigate(dashboardPath)}
                >
                  <LayoutDashboard className="homepage-header-action__icon" aria-hidden="true" />
                  <span>{dashboardLabel}</span>
                </button>
                <button
                  type="button"
                  className="homepage-header-action homepage-header-action--ghost"
                  onClick={onLogout}
                >
                  <LogOut className="homepage-header-action__icon" aria-hidden="true" />
                  <span data-i18n="btn-logout">{copy['btn-logout']}</span>
                </button>
              </div>
            ) : !hasMobileMenu && isAuthenticated ? (
              <div className="homepage-header-session" id="header-user-badge">
                <span className="homepage-header-session__status" title="Signed in" aria-hidden="true">
                  <span className="homepage-header-session__dot" />
                </span>
                <button
                  type="button"
                  className="homepage-header-action homepage-header-action--primary"
                  onClick={() => navigate(dashboardPath)}
                >
                  <LayoutDashboard className="homepage-header-action__icon" aria-hidden="true" />
                  <span>{dashboardLabel}</span>
                </button>
              </div>
            ) : !hasMobileMenu ? (
              <div className="flex items-center gap-2" id="header-auth-group">
                <button
                  type="button"
                  className="homepage-header-action homepage-header-action--ghost"
                  onClick={() => navigate('/login')}
                >
                  <span data-i18n="btn-login">{copy['btn-login']}</span>
                </button>
                <button
                  type="button"
                  className="homepage-header-action homepage-header-action--primary"
                  onClick={() => navigate('/register')}
                >
                  <span data-i18n="btn-register">{copy['btn-register']}</span>
                </button>
              </div>
            ) : null}
          </div>
        </div>

        {!hasMobileMenu && (
          <div className="mobile-menu-panel hidden lg:hidden animate-fadeIn p-2 space-y-1 font-extrabold text-xs sm:text-sm text-slate-600" id="mobile-navigation-menu">
            <a className="flex px-3 py-2 hover:text-purple transition-colors ds-control ds-link" data-i18n="nav-features" href={`${homeAnchorPrefix}#features`} onClick={() => { hp.toggleMobileMenu() }}>{copy['nav-features']}</a>
            <a className="flex px-3 py-2 hover:text-purple transition-colors ds-control ds-link" data-i18n="nav-simulator" href="https://taxiq.nexoratouch.com/" target="_blank" rel="noopener noreferrer" onClick={() => { hp.toggleMobileMenu() }}>{copy['nav-simulator']}</a>
            <a className="flex px-3 py-2 hover:text-purple transition-colors ds-control ds-link" data-i18n="nav-tax-iq" href={`${homeAnchorPrefix}#tax-iq`} onClick={() => { hp.toggleMobileMenu() }}>{copy['nav-tax-iq']}</a>
            <a className="flex px-3 py-2 hover:text-purple transition-colors ds-control ds-link" data-i18n="nav-rewards" href={`${homeAnchorPrefix}#customer-rewards`} onClick={() => { hp.toggleMobileMenu() }}>{copy['nav-rewards']}</a>
            <a className="flex px-3 py-2 hover:text-purple transition-colors ds-control ds-link" data-i18n="nav-calculator" href={`${homeAnchorPrefix}#calculator`} onClick={() => { hp.toggleMobileMenu() }}>{copy['nav-calculator']}</a>
            <a className="flex px-3 py-2 hover:text-purple transition-colors ds-control ds-link" data-i18n="nav-pricing" href={`${homeAnchorPrefix}#pricing`} onClick={() => { hp.toggleMobileMenu() }}>{copy['nav-pricing']}</a>
            <Link className="flex px-3 py-2 hover:text-purple transition-colors ds-control ds-link" data-i18n="nav-news-library" to="/news-library" onClick={() => { hp.toggleMobileMenu() }}>
              {copy['nav-news-library']}
            </Link>
          </div>
        )}
      </header>
      <div className="homepage-header-spacer" aria-hidden="true" />
    </>
  )
}
