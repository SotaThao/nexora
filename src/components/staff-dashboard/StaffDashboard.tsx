import { useState, useEffect } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { AlertCircle, Wallet, ArrowRight, Settings } from 'lucide-react'
import { StaffAccountProvider } from '../../contexts/StaffAccountContext'

import StaffSidebar from './layout/StaffSidebar'
import StaffHeader from './layout/StaffHeader'
import StaffBottomNav from './layout/StaffBottomNav'
import { useTranslation } from '../../contexts/LanguageContext'
import { useStaffPaymentMethods } from '../../data/hooks/useStaffPaymentMethods'
import { useRefetchStaffMenuQueries } from '../../data/hooks/useRefetchOnMenuChange'
import { useRegisterPushDeviceOnVisit } from '../../data/hooks/useRegisterPushDevice'

export default function StaffDashboard({ staffId = null, onLogout }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { data: paymentMethods, isSuccess: isPaymentMethodsLoaded } = useStaffPaymentMethods()
  const [showPayoutBanner, setShowPayoutBanner] = useState(false)
  
  const activeScreen = location.pathname.split('/')[2] || 'home'
  useRegisterPushDeviceOnVisit()
  useRefetchStaffMenuQueries(activeScreen)
  const mainWidthClass = activeScreen === 'payments' || activeScreen === 'earnings'
    ? 'w-full max-w-6xl xl:max-w-7xl'
    : 'max-w-3xl'
  
  const handleNavigate = (screen, params?: Record<string, string>) => {
    const path = screen === 'home' ? '/staff' : `/staff/${screen}`
    const search = params ? `?${new URLSearchParams(params).toString()}` : ''
    navigate(path + search)
    setIsMobileMenuOpen(false)
  }

  useEffect(() => {
    if (!isPaymentMethodsLoaded || !paymentMethods) return

    const hasConfiguredPayout = paymentMethods.some(
      (m) => m.isActive && m.isConfigured && m.accountInfo
    )

    const bannerDismissed = sessionStorage.getItem('hasDismissedPayoutBanner')

    if (!hasConfiguredPayout && !bannerDismissed) {
      setShowPayoutBanner(true)
    } else {
      setShowPayoutBanner(false)
    }
  }, [isPaymentMethodsLoaded, paymentMethods])

  return (
    <StaffAccountProvider staffId={staffId}>
      <div className="min-h-dvh bg-nexoraCanvas text-nexoraText">
        <StaffSidebar 
          activeScreen={activeScreen} 
          onNavigate={handleNavigate} 
          onLogout={onLogout} 
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
        />

        <div className="lg:pl-72">
          <StaffHeader
            activeScreen={activeScreen}
            onNavigate={handleNavigate}
            onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
            onLogout={onLogout}
          />
          <main className={`mx-auto ${mainWidthClass} px-4 py-5 pb-28 sm:px-6 lg:pb-10`}>
            {activeScreen === 'home' && showPayoutBanner && (
              <div className="mb-6 relative overflow-hidden rounded-2xl bg-gradient-to-br from-nexoraBrand/10 via-white to-nexoraBrandSoft border border-nexoraBrand/20 p-6 md:p-8 shadow-sm animate-fadeIn">
                <div className="absolute -right-10 -top-10 opacity-10">
                  <Wallet className="h-48 w-48 text-nexoraBrand" />
                </div>
                
                <div className="relative z-10 max-w-2xl">
                  <div className="inline-flex items-center gap-2 rounded-full bg-nexoraBrand/10 px-3 py-1 mb-4">
                    <AlertCircle className="h-4 w-4 text-nexoraBrand" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-nexoraBrand">
                      {t('staff_dashboard.missing_payout_title')}
                    </span>
                  </div>
                  
                  <h2 className="text-xl md:text-2xl font-black text-nexoraText tracking-tight mb-2">
                    {t('staff_dashboard.missing_payout_heading')}
                  </h2>
                  
                  <p className="text-sm text-nexoraMuted mb-6 leading-relaxed">
                    {t('staff_dashboard.missing_payout_toast')}
                  </p>

                  <div className="flex flex-wrap items-center gap-4">
                    <button
                      type="button"
                      onClick={() => handleNavigate('pay')}
                      className="group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-xl bg-nexoraBrand px-6 py-3 text-xs font-bold uppercase tracking-wider text-white shadow-lg transition-all hover:scale-[1.02] hover:shadow-nexoraBrand/25 active:scale-95"
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
        </div>

        <StaffBottomNav activeScreen={activeScreen} onNavigate={handleNavigate} />
      </div>
    </StaffAccountProvider>
  )
}
