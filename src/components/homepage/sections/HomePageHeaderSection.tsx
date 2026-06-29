/** Homepage section component */
import { useNavigate } from 'react-router-dom'
import { useHomePageBridge } from '../context/HomePageBridgeContext'
import LucideIcon from '../ui/LucideIcon'

export default function HomePageHeaderSection() {
  const navigate = useNavigate()
  const { hp, planCta, onLogout } = useHomePageBridge()

  return (
    <>
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-line">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-2 sm:gap-4">
            <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
              
              <button className="mobile-menu-toggle md:hidden focus:outline-none focus:ring-2 focus:ring-purple/35 ds-control ds-button" aria-controls="mobile-navigation-menu" aria-label="Open mobile menu" aria-expanded="false" id="mobile-menu-toggle" onClick={() => { hp.toggleMobileMenu() }}>
                <svg className="w-5 h-5 sm:w-6 sm:h-6 transition-transform duration-300" fill="none" id="mobile-menu-icon" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M4 6h16M4 12h16M4 18h16" id="hamburger-path" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5"></path>
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
            
            <div className="flex items-center gap-1.5 sm:gap-3">
              
              <div className="relative inline-block text-left shrink-0">
                <button className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition-all ds-control ds-button" id="lang-dropdown-btn" onClick={() => { hp.toggleLanguageDropdown() }}>
                  <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg>
                  <span className="hidden xs:inline" id="lang-current-text">EN</span>
                  <svg className="w-3 h-3 text-slate-400 transition-transform duration-300" fill="none" id="lang-dropdown-chevron" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5"></path>
                  </svg>
                </button>
                
                <div className="hidden absolute right-0 mt-2 w-32 bg-white rounded-2xl shadow-xl border border-slate-100 animate-fadeIn z-50 overflow-hidden ds-surface" id="language-dropdown-menu">
                  <div className="py-1">
                    <a className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-black transition-colors cursor-pointer ds-control ds-link" onClick={() => { hp.selectLanguage('vi') }}>
                      Tiếng Việt
                    </a>
                    <a className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-black transition-colors cursor-pointer ds-control ds-link" onClick={() => { hp.selectLanguage('en') }}>
                      English
                    </a>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-1 sm:gap-2" id="header-auth-group">
                
                <button className="text-[10px] sm:text-xs font-extrabold text-slate-700 bg-slate-100 hover:bg-slate-200 hover:text-purple px-2.5 sm:px-4 py-2 rounded-full transition-all duration-300 transform hover:scale-[1.04] active:scale-95 flex items-center gap-1 shadow-sm border border-slate-200/80 ds-control ds-button" onClick={() => navigate('/login')}>
                  <span data-i18n="btn-login">Login</span>
                </button>
                
                <button className="text-[10px] sm:text-xs font-extrabold text-white bg-purple hover:bg-[#563bd8] px-2.5 sm:px-4 py-2 rounded-full transition-all duration-300 transform hover:scale-[1.04] active:scale-95 flex items-center gap-1 shadow-md ds-control ds-button" onClick={() => navigate('/register')}>
                  <span data-i18n="btn-register">Sign Up</span>
                </button>
              </div>
              
              <div className="hidden items-center gap-2 bg-purple/10 px-2.5 sm:px-3 py-1 rounded-full border border-purple/20 shrink-0 min-w-0" id="header-user-badge">
                <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-green animate-pulse shrink-0" aria-hidden="true"></span>
                <span className="hidden text-[10px] sm:text-xs font-bold text-purple min-w-0 truncate" data-i18n="header-guest" id="header-user-name" aria-hidden="true">Hello, Guest</span>
                <div className="header-user-actions shrink-0" id="header-user-actions">
                  <button className="header-user-chip header-user-chip--muted" type="button" data-i18n="btn-logout" onClick={onLogout}>Logout</button>
                </div>
              </div>
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
    </>
  )
}
