/** Homepage section component */
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Globe, ChevronDown, LayoutDashboard } from 'lucide-react'
import { useHomePageBridge } from '../context/HomePageBridgeContext'
import useAuth from '../../../auth/useAuth'
import { dashboardPathForSession } from '../useHomePageAuth'
import { getInitialHomePageLanguage } from '../homepageLogic.js'
import { homepageTranslations, type HomePageLang } from '../i18n/homepageTranslations'

export default function HomePageHeaderSection() {
  const navigate = useNavigate()
  const { hp } = useHomePageBridge()
  const { session, status } = useAuth()
  const [homepageLang, setHomepageLang] = useState<HomePageLang>(getInitialHomePageLanguage)

  const copy = homepageTranslations[homepageLang]
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

  return (
    <>
      <header className="safe-area-top fixed top-0 inset-x-0 z-50 bg-white/90 backdrop-blur-md border-b border-line">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            <button
              className="mobile-menu-toggle md:hidden focus:outline-none focus:ring-2 focus:ring-purple/35 ds-control ds-button"
              aria-controls="mobile-navigation-menu"
              aria-label="Open mobile menu"
              aria-expanded="false"
              id="mobile-menu-toggle"
              onClick={() => { hp.toggleMobileMenu() }}
              type="button"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6 transition-transform duration-300" fill="none" id="mobile-menu-icon" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M4 6h16M4 12h16M4 18h16" id="hamburger-path" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" />
              </svg>
            </button>

            <a className="flex items-center group shrink-0 ds-control ds-link" href="#" aria-label="NEXORA TOUCH">
              <picture>
                <source media="(max-width: 767px)" srcSet="/homepage/assets/images/icon-nexora.png" />
                <img alt="NEXORA TOUCH" className="h-8 sm:h-10 w-auto group-hover:scale-105 transition-transform" src="/homepage/assets/images/logo-light-mode.png" />
              </picture>
            </a>
          </div>

          <nav className="hidden md:flex items-center gap-6 lg:gap-8 text-sm font-semibold text-slate-600">
            <a className="hover:text-purple transition-colors ds-control ds-link ds-nav-link" data-i18n="nav-features" href="#features">Features</a>
            <a className="hover:text-purple transition-colors ds-control ds-link ds-nav-link" href="#simulator">
              <span data-i18n="nav-simulator">Live Demo</span>
            </a>
            <a className="hover:text-purple transition-colors ds-control ds-link ds-nav-link" data-i18n="nav-tax-iq" href="#tax-iq">Tax IQ Assistant</a>
            <a className="hover:text-purple transition-colors ds-control ds-link ds-nav-link" data-i18n="nav-rewards" href="#customer-rewards">Customer Portal</a>
            <a className="hover:text-purple transition-colors ds-control ds-link ds-nav-link" data-i18n="nav-calculator" href="#calculator">Calculator</a>
            <a className="hover:text-purple transition-colors ds-control ds-link ds-nav-link" data-i18n="nav-pricing" href="#pricing">Pricing</a>
          </nav>

          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            <div className="relative inline-block text-left">
              <button
                type="button"
                className="homepage-header-lang-btn ds-control ds-button"
                id="lang-dropdown-btn"
                aria-haspopup="listbox"
                aria-expanded="false"
                onClick={() => { hp.toggleLanguageDropdown() }}
              >
                <Globe className="homepage-header-lang-btn__icon" aria-hidden="true" />
                <span id="lang-current-text">{homepageLang.toUpperCase()}</span>
                <ChevronDown className="homepage-header-lang-btn__chevron" id="lang-dropdown-chevron" aria-hidden="true" />
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

            {isAuthenticated ? (
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
            ) : (
              <div className="homepage-header-actions" id="header-auth-group">
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
            )}
          </div>
        </div>

        <div className="mobile-menu-panel hidden md:hidden animate-fadeIn p-2 space-y-1 font-extrabold text-xs sm:text-sm text-slate-600" id="mobile-navigation-menu">
          <a className="flex px-3 py-2 hover:text-purple transition-colors ds-control ds-link" data-i18n="nav-features" href="#features" onClick={() => { hp.toggleMobileMenu() }}>Features</a>
          <a className="flex px-3 py-2 hover:text-purple transition-colors ds-control ds-link" data-i18n="nav-simulator" href="#simulator" onClick={() => { hp.toggleMobileMenu() }}>Live Demo</a>
          <a className="flex px-3 py-2 hover:text-purple transition-colors ds-control ds-link" data-i18n="nav-tax-iq" href="#tax-iq" onClick={() => { hp.toggleMobileMenu() }}>Tax IQ Assistant</a>
          <a className="flex px-3 py-2 hover:text-purple transition-colors ds-control ds-link" data-i18n="nav-rewards" href="#customer-rewards" onClick={() => { hp.toggleMobileMenu() }}>Customer Portal</a>
          <a className="flex px-3 py-2 hover:text-purple transition-colors ds-control ds-link" data-i18n="nav-calculator" href="#calculator" onClick={() => { hp.toggleMobileMenu() }}>Calculator</a>
          <a className="flex px-3 py-2 hover:text-purple transition-colors ds-control ds-link" data-i18n="nav-pricing" href="#pricing" onClick={() => { hp.toggleMobileMenu() }}>Pricing</a>
        </div>
      </header>
      <div className="homepage-header-spacer" aria-hidden="true" />
    </>
  )
}
