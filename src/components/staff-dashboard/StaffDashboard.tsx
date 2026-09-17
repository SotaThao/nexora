import { useState, useEffect } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { AlertCircle, Wallet, ArrowRight, Settings, UserRound, X } from 'lucide-react'
import { StaffAccountProvider } from '../../contexts/StaffAccountContext'

import StaffBeepAlert from './StaffBeepAlert'
import StaffSidebar from './layout/StaffSidebar'
import StaffHeader from './layout/StaffHeader'
import StaffBottomNav from './layout/StaffBottomNav'
import AppDownloadLinks from '../ui/AppDownloadLinks'
import { useTranslation } from '../../contexts/LanguageContext'
import { useStaffPaymentMethods } from '../../data/hooks/useStaffPaymentMethods'
import { isPaymentMethodConfigured } from '../../data/paymentMethodTypes'
import { useRefetchStaffMenuQueries } from '../../data/hooks/useRefetchOnMenuChange'
import { useAuth } from '../../auth/useAuth'
import { useProfileSettings } from '../../data/hooks/useProfileSettings'
import { resolveStaffDashboardPresentation } from './staffDashboardPresentation'

export default function StaffDashboard({ staffId = null, onLogout }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { session } = useAuth()
  const { data: userProfile, isSuccess: isUserProfileLoaded } = useProfileSettings()
  const { data: paymentMethods, isSuccess: isPaymentMethodsLoaded } = useStaffPaymentMethods()
  const [showPayoutBanner, setShowPayoutBanner] = useState(false)
  const [showOnboardingBanner, setShowOnboardingBanner] = useState(false)
  const [onboardingBannerMode, setOnboardingBannerMode] = useState<'profile' | 'payment'>('profile')
  
  const activeScreen = location.pathname.split('/')[2] || 'home'
  useRefetchStaffMenuQueries(activeScreen)
  const isVerificationSection =
    activeScreen === 'profile' && new URLSearchParams(location.search).get('section') === 'verification'
  const { headerScreen, mainWidthClass, mainPaddingClass } = resolveStaffDashboardPresentation(
    location.pathname,
    activeScreen,
    isVerificationSection,
  )
  const isKYCVerified =
    userProfile?.isKYCVerified === true || userProfile?.isKycVerified === true
  const hasConfiguredPayout = Boolean(
    paymentMethods?.some((method) => method.isActive && isPaymentMethodConfigured(method)),
  )
  
  const handleNavigate = (screen, params?: Record<string, string>) => {
    const path = screen === 'home' ? '/staff' : `/staff/${screen}`
    const search = params ? `?${new URLSearchParams(params).toString()}` : ''
    navigate(path + search)
    setIsMobileMenuOpen(false)
  }

  useEffect(() => {
    // KYC-verified users use the "Finish setting up your profile" banner for
    // payment-method setup instead of the separate payout banner.
    if (isKYCVerified) {
      setShowPayoutBanner(false)
      return
    }

    if (!isPaymentMethodsLoaded || !paymentMethods) return

    const bannerDismissed = sessionStorage.getItem('hasDismissedPayoutBanner')

    if (!hasConfiguredPayout && !bannerDismissed) {
      setShowPayoutBanner(true)
    } else {
      setShowPayoutBanner(false)
    }
  }, [isKYCVerified, isPaymentMethodsLoaded, paymentMethods, hasConfiguredPayout])

  useEffect(() => {
    if (!isUserProfileLoaded || !session) {
      setShowOnboardingBanner(false)
      setOnboardingBannerMode('profile')
      return
    }

    const bannerDismissed = sessionStorage.getItem('hasDismissedOnboardingBanner')
    if (bannerDismissed) {
      setShowOnboardingBanner(false)
      setOnboardingBannerMode('profile')
      return
    }

    // Already KYC-verified: only remind to finish payment method setup.
    if (isKYCVerified) {
      if (!isPaymentMethodsLoaded) return
      setOnboardingBannerMode('payment')
      setShowOnboardingBanner(!hasConfiguredPayout)
      return
    }

    const isMissingBasicInfo = !userProfile?.firstName?.trim()
    const hasNoStaffProfile = !session.hasStaffProfile
    setOnboardingBannerMode('profile')
    setShowOnboardingBanner(isMissingBasicInfo || hasNoStaffProfile)
  }, [
    isUserProfileLoaded,
    isPaymentMethodsLoaded,
    session,
    userProfile?.firstName,
    isKYCVerified,
    hasConfiguredPayout,
  ])

  const dismissOnboardingBanner = () => {
    sessionStorage.setItem('hasDismissedOnboardingBanner', 'true')
    setShowOnboardingBanner(false)
  }

  const handleOnboardingBannerAction = () => {
    if (onboardingBannerMode === 'payment') {
      handleNavigate('pay')
      return
    }
    navigate('/onboarding')
    setIsMobileMenuOpen(false)
  }

  return (
    <StaffAccountProvider staffId={staffId}>
      <div data-dashboard-shell className="min-h-dvh bg-nexoraCanvas text-nexoraText">
        <StaffSidebar 
          activeScreen={activeScreen} 
          onNavigate={handleNavigate} 
          onLogout={onLogout} 
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
        />

        <div className="flex min-h-dvh flex-col lg:pl-72">
          <StaffHeader
            activeScreen={headerScreen}
            onNavigate={handleNavigate}
            onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
            onLogout={onLogout}
          />
          <main className={`mx-auto w-full flex-1 ${mainWidthClass} ${mainPaddingClass}`}>
            {activeScreen === 'home' && showOnboardingBanner && (
              <div className="mb-6 relative overflow-hidden rounded-2xl bg-gradient-to-br from-nexoraBrand/10 via-white to-nexoraBrandSoft border border-nexoraBrand/20 p-6 md:p-8 shadow-sm animate-fadeIn">
                <div className="absolute -right-10 -top-10 opacity-10">
                  {onboardingBannerMode === 'payment' ? (
                    <Wallet className="h-48 w-48 text-nexoraBrand" />
                  ) : (
                    <UserRound className="h-48 w-48 text-nexoraBrand" />
                  )}
                </div>

                <button
                  type="button"
                  onClick={dismissOnboardingBanner}
                  className="absolute right-4 top-4 z-20 rounded-lg p-1.5 text-nexoraSubtle transition hover:bg-white hover:text-nexoraText"
                  aria-label={t('staff_dashboard.dismiss_onboarding_banner')}
                  title={t('staff_dashboard.dismiss_onboarding_banner')}
                >
                  <X className="h-4 w-4" />
                </button>

                <div className="relative z-10 max-w-2xl">
                  <div className="inline-flex items-center gap-2 rounded-full bg-nexoraBrand/10 px-3 py-1 mb-4">
                    <AlertCircle className="h-4 w-4 text-nexoraBrand" />
                    <span className="text-xs font-black uppercase tracking-widest text-nexoraBrand">
                      {t('staff_dashboard.onboarding_banner_title')}
                    </span>
                  </div>

                  <h2 className="text-nexoraText tracking-tight mb-2 text-xl lg:text-2xl font-semibold leading-snug">
                    {t('staff_dashboard.onboarding_banner_heading')}
                  </h2>

                  <p className="text-nexoraMuted mb-6 text-[13px] font-normal leading-5">
                    {t(
                      onboardingBannerMode === 'payment'
                        ? 'staff_dashboard.onboarding_banner_description_payment'
                        : 'staff_dashboard.onboarding_banner_description',
                    )}
                  </p>

                  <div className="flex flex-wrap items-center gap-4">
                    <button
                      type="button"
                      onClick={handleOnboardingBannerAction}
                      className="group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-xl bg-nexoraBrand px-6 py-3 text-xs font-semibold uppercase tracking-wider text-white shadow-lg transition-all hover:scale-[1.02] hover:shadow-nexoraBrand/25 active:scale-95"
                    >
                      {onboardingBannerMode === 'payment' ? (
                        <Settings className="h-4 w-4 transition-transform group-hover:rotate-90" />
                      ) : (
                        <UserRound className="h-4 w-4" />
                      )}
                      <span>
                        {t(
                          onboardingBannerMode === 'payment'
                            ? 'staff_dashboard.setup_payout_now'
                            : 'staff_dashboard.complete_onboarding_now',
                        )}
                      </span>
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </button>
                  </div>
                </div>
              </div>
            )}
            {activeScreen === 'home' && !showOnboardingBanner && showPayoutBanner && (
              <div className="mb-6 relative overflow-hidden rounded-2xl bg-gradient-to-br from-nexoraBrand/10 via-white to-nexoraBrandSoft border border-nexoraBrand/20 p-6 md:p-8 shadow-sm animate-fadeIn">
                <div className="absolute -right-10 -top-10 opacity-10">
                  <Wallet className="h-48 w-48 text-nexoraBrand" />
                </div>
                
                <div className="relative z-10 max-w-2xl">
                  <div className="inline-flex items-center gap-2 rounded-full bg-nexoraBrand/10 px-3 py-1 mb-4">
                    <AlertCircle className="h-4 w-4 text-nexoraBrand" />
                    <span className="text-xs font-black uppercase tracking-widest text-nexoraBrand">
                      {t('staff_dashboard.missing_payout_title')}
                    </span>
                  </div>
                  
                  <h2 className="text-nexoraText tracking-tight mb-2 text-xl lg:text-2xl font-semibold leading-snug">
                    {t('staff_dashboard.missing_payout_heading')}
                  </h2>
                  
                  <p className="text-sm text-nexoraMuted mb-6 leading-relaxed">
                    {t('staff_dashboard.missing_payout_toast')}
                  </p>

                  <div className="flex flex-wrap items-center gap-4">
                    <button
                      type="button"
                      onClick={() => handleNavigate('pay')}
                      className="group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-xl bg-nexoraBrand px-6 py-3 text-xs font-semibold uppercase tracking-wider text-white shadow-lg transition-all hover:scale-[1.02] hover:shadow-nexoraBrand/25 active:scale-95"
                    >
                      <Settings className="h-4 w-4 transition-transform group-hover:rotate-90" />
                      <span>{t('staff_dashboard.setup_payout_now')}</span>
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </button>
                  </div>
                </div>
              </div>
            )}
            <Outlet context={{ onNavigate: handleNavigate, onLogout }} />
          </main>
          <footer className="mb-20 border-t border-nexoraBorder bg-white px-3 py-3 sm:px-6 lg:mb-0 lg:px-7 lg:py-4">
            <div className="flex flex-nowrap items-center justify-between gap-2 text-left">
              <p className="min-w-0 flex-1 truncate text-xs font-medium text-slate-700 sm:text-sm">{t('dashboard.footer.copyright')}</p>
              <div className="shrink-0">
                <AppDownloadLinks />
              </div>
            </div>
          </footer>
        </div>

        <StaffBottomNav activeScreen={activeScreen} onNavigate={handleNavigate} />

        {/* Shell-level so an incoming beep reaches the tech on whatever staff screen they are on. */}
        <StaffBeepAlert />
      </div>
    </StaffAccountProvider>
  )
}
