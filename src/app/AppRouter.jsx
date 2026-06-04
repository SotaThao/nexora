import React, { lazy, Suspense } from 'react'
import { RefreshCw, ShieldAlert, X, Sparkles } from 'lucide-react'
import { storage } from '../utils/storage'
import { logger } from '../utils/logger'

const localStorage = storage

const SetupWizard = lazy(() => import('../components/SetupWizard'))
const Dashboard = lazy(() => import('../components/Dashboard'))
const CustomerFlow = lazy(() => import('../components/CustomerFlow'))
const RegisterWizard = lazy(() => import('../components/RegisterWizard'))
const StaffRegistrationWizard = lazy(() => import('../components/StaffRegistrationWizard'))
const StaffDashboard = lazy(() => import('../components/staff-dashboard/StaffDashboard'))

function LoadingScreen() {
  return (
    <div className="min-h-dvh flex items-center justify-center bg-nexoraCanvas">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-nexoraBrand/20 border-t-nexoraBrand rounded-full animate-spin"></div>
        <p className="text-xs text-nexoraBrand font-semibold uppercase tracking-wider animate-pulse">Loading...</p>
      </div>
    </div>
  )
}

export default function AppRouter({
  view,
  setView,
  setupData,
  setSetupData,
  registerEmail,
  staffInviteData,
  setStaffInviteData,
  ssoPrefillData,
  verificationStatus,
  showKybModal,
  setShowKybModal,
  simulationNotification,
  setSimulationNotification,
  initialDashboardMenu,
  setInitialDashboardMenu,
  initialSettingsTab,
  setInitialSettingsTab,
  currentLanguage,
  t,
  userRole,
  currentStaffId,
  loggedInStaffId,
  onWizardComplete,
  onKybSuccess,
  onKybRequired,
  onResetApp,
  onRegisterAndLogin,
  onLoadPendingAccounts,
  preKybView,
}) {
  return (
    <Suspense fallback={<LoadingScreen />}>

      {/* 2. REGISTRATION & KYB FLOW (Flow 2) */}
      {view === 'register-wizard' && (
        <RegisterWizard
          ssoEmail={registerEmail}
          onBackToLogin={() => {
            if (ssoPrefillData?.email) {
              setView(preKybView)
            } else {
              setView('login')
            }
          }}
          onRegisterSuccess={() => {
            setView('login')
            onLoadPendingAccounts()
          }}
          onRegisterAndLogin={onRegisterAndLogin}
          onKybSuccess={onKybSuccess}
          isRedirectedFromSession={!!(ssoPrefillData?.email)}
        />
      )}

      {/* 3. ONBOARDING SETUP WIZARD (Flow 1 / Prefillable) */}
      {view === 'onboarding' && (
        <SetupWizard
          initialBusinessInfo={ssoPrefillData}
          verificationStatus={verificationStatus}
          hasKyb={verificationStatus === 'kyb_approved'}
          onKybRequired={onKybRequired}
          onComplete={onWizardComplete}
          onBackToLogin={() => setView('login')}
        />
      )}

      {/* 4. OWNER DASHBOARD */}
      {view === 'dashboard' && (
        <div className="relative">
          {/* Quick debug reset onboarding button */}
          <button
            onClick={onResetApp}
            className="fixed bottom-4 right-4 z-40 p-2.5 rounded-full bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white shadow-lg hover:rotate-180 transition-all duration-300"
            title={t('login.reset_confirm')}
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <Dashboard
            setupData={setupData}
            verificationStatus={verificationStatus}
            hasKyb={verificationStatus === 'kyb_approved'}
            userEmail={ssoPrefillData?.email || registerEmail}
            onKybRequired={onKybRequired}
            onKybSuccess={onKybSuccess}
            initialMenu={initialDashboardMenu}
            initialSettingsTab={initialSettingsTab}
            onLogout={() => setView('login')}
            userRole={userRole}
            currentStaffId={currentStaffId}
          />
        </div>
      )}

      {/* 5. CUSTOMER TIPPING & REVIEW FLOW SIMULATION */}
      {view === 'customer' && (
        <CustomerFlow />
      )}

      {/* 6. STAFF REGISTRATION & SETUP PORTAL */}
      {view === 'staff-portal' && (
        <StaffRegistrationWizard
          inviteData={staffInviteData}
          onReturnToMerchant={() => {
            // Reload setupData to reflect new active thợ instantly
            const savedSetup = localStorage.getItem('nexora_merchant_setup')
            if (savedSetup) {
              try {
                setSetupData(JSON.parse(savedSetup))
              } catch (e) {
                logger.error(e)
              }
            }
            // Clear URL query parameters
            window.history.replaceState({}, document.title, window.location.pathname)
            setView('dashboard')
          }}
        />
      )}

      {/* 7. STAFF PERSONAL DASHBOARD (!personal account) */}
      {view === 'staff-dashboard' && (
        <StaffDashboard staffId={loggedInStaffId} onLogout={() => setView('login')} />
      )}

      {/* KYB Verification Required Custom Modal */}
      {showKybModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-100 max-w-md w-full shadow-2xl p-6 relative overflow-hidden animate-scaleIn text-center space-y-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-500 mx-auto shrink-0 shadow-sm">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-black text-slate-800 uppercase tracking-wider">
                {currentLanguage === 'vi' ? 'Yêu cầu xác thực KYB' : 'KYB Verification Required'}
              </h3>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                {currentLanguage === 'vi'
                  ? 'Tính năng này yêu cầu hồ sơ doanh nghiệp đã được xác thực KYB bởi VLINKPAY. Nhấp vào nút bên dưới để chuyển hướng đến trang Cài đặt > KYB để gửi thông tin doanh nghiệp của bạn.'
                  : 'This feature requires your business profile to be KYB verified by VLINKPAY. Click below to navigate to Settings > KYB tab and submit your compliance information.'}
              </p>
            </div>
            <div className="pt-2 flex flex-col sm:flex-row gap-2.5 justify-center">
              <button
                type="button"
                onClick={() => setShowKybModal(false)}
                className="px-5 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider rounded-lg transition-all"
              >
                {currentLanguage === 'vi' ? 'Hủy bỏ' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowKybModal(false)
                  if (view === 'onboarding') {
                    const savedSetup = localStorage.getItem('nexora_merchant_setup')
                    if (savedSetup) {
                      setSetupData(JSON.parse(savedSetup))
                    }
                    setInitialDashboardMenu('settings')
                    setInitialSettingsTab('kyb')
                    setView('dashboard')
                  } else if (view === 'dashboard') {
                    setInitialDashboardMenu('settings')
                    setInitialSettingsTab('kyb')
                  }
                }}
                className="px-5 py-2.5 bg-gradient-to-r from-nexoraElectric to-nexoraViolet hover:opacity-90 text-white text-xs font-black uppercase tracking-wider rounded-lg shadow-md transition-all animate-pulse"
              >
                {currentLanguage === 'vi' ? 'Xác thực ngay' : 'Verify Now'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Simulation Invite Toast */}
      {simulationNotification && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4 animate-fadeIn">
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-2xl p-4 shadow-2xl border border-amber-400 flex items-center justify-between gap-4">
            <div className="flex items-start gap-3 min-w-0">
              <div className="bg-white/20 rounded-xl p-2 text-white shrink-0 mt-0.5">
                <Sparkles className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <strong className="text-xs block font-black uppercase tracking-wider">
                  {simulationNotification.isLinkOnly ? '🔗 Link Request Sent' : '📧 Invite Link Sent'}
                </strong>
                <p className="text-[10px] text-white/95 leading-normal mt-0.5 font-medium">
                  {simulationNotification.isLinkOnly
                    ? `Link request sent to ${simulationNotification.name} (${simulationNotification.role})`
                    : `Staff invitation link generated for ${simulationNotification.name} (${simulationNotification.email || simulationNotification.phone})`
                  }
                </p>
              </div>
            </div>

            <div className="flex gap-1.5 shrink-0 items-center">
              <button
                onClick={() => {
                  setStaffInviteData(simulationNotification)
                  setView('staff-portal')
                  setSimulationNotification(null)
                }}
                className="px-3 py-2 bg-white text-orange-600 hover:bg-orange-50 rounded-xl text-[10px] font-black uppercase transition-all shadow-sm shrink-0"
              >
                {currentLanguage === 'vi' ? 'Mở Thiết lập' : 'Open Setup'}
              </button>
              <button
                onClick={() => setSimulationNotification(null)}
                className="p-1.5 hover:bg-white/15 rounded-xl text-white/80 transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

    </Suspense>
  )
}
