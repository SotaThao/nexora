import React, { useState, useEffect } from 'react'
import LoginScreen from './app/LoginScreen'
import AppRouter from './app/AppRouter'
import { useTranslation } from './contexts/LanguageContext'
import { initStorage } from './utils/storage'
import { logger } from './utils/logger'
import { useNotification } from './contexts/NotificationContext'
import { useStorageEventBridge } from './data/storageEventBridge'
import { useAuth } from './auth/useAuth'
import { usePendingAccounts, useReplaceAllPendingAccounts } from './data/hooks/usePendingAccounts'
import { useClearMerchantSetup, useMerchantSetup, useSaveMerchantSetup } from './data/hooks/useMerchantSetup'
import { useClearProfileSettings } from './data/hooks/useProfileSettings'
import { isDemoToolsEnabled } from './app/demoTools'

export default function App() {
  // Mount the storage-event → query-cache bridge once at app root (Phase 3 / D4).
  // Must be called inside QueryClientProvider (see src/main.jsx).
  useStorageEventBridge()

  const { currentLanguage, setLanguage, t } = useTranslation()
  const { showConfirm } = useNotification()
  const { session, status: authStatus, login, logout } = useAuth()
  const pendingAccountsQuery = usePendingAccounts()
  const replaceAllPendingAccountsMutation = useReplaceAllPendingAccounts()
  const merchantSetupQuery = useMerchantSetup()
  const saveMerchantSetupMutation = useSaveMerchantSetup()
  const clearMerchantSetupMutation = useClearMerchantSetup()
  const clearProfileSettingsMutation = useClearProfileSettings()

  const [view, setView] = useState('login') // 'login' | 'register-wizard' | 'onboarding' | 'dashboard' | 'customer' | 'staff-portal' | 'staff-dashboard'
  const [userRole, setUserRole] = useState('owner') // 'owner' | 'staff'
  const [currentStaffId, setCurrentStaffId] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [setupData, setSetupData] = useState(null)
  const [verificationStatus, setVerificationStatus] = useState('kyb_approved')
  const [simStatus, setSimStatus] = useState('basic')
  const [preKybView, setPreKybView] = useState('onboarding')

  // Login simulated form state
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')

  // Prefill details passed from login session to Onboarding SetupWizard
  const [ssoPrefillData, setSsoPrefillData] = useState(null)
  // Email passed from SSO redirect to RegisterWizard
  const [registerEmail, setRegisterEmail] = useState('')

  // KYB Verification deep linking state and modal control
  const [showKybModal, setShowKybModal] = useState(false)
  const [initialDashboardMenu, setInitialDashboardMenu] = useState('overview')
  const [initialSettingsTab, setInitialSettingsTab] = useState('profile')

  // Staff registration states
  const [staffInviteData, setStaffInviteData] = useState(null)
  const [simulationNotification, setSimulationNotification] = useState(null)
  const [loggedInStaffId, setLoggedInStaffId] = useState(null)

  // Derive pendingAccounts list for simulation panel from TanStack Query
  const pendingAccounts = pendingAccountsQuery.data ?? []

  // Load setup data or customer flow on mount
  useEffect(() => {
    initStorage()
    const params = new URLSearchParams(window.location.search)
    if (params.get('flow') === 'customer') {
      setView('customer')
      return
    }
    if (params.get('flow') === 'staff-invite') {
      const bizName = params.get('biz') || 'Golden Glow Nail Spa'
      setStaffInviteData({
        id: '',
        name: '',
        email: '',
        phone: '',
        role: 'Nail Technician',
        biz: bizName
      })
      setView('staff-portal')
      return
    }

    if (!isDemoToolsEnabled) return

    // Listen for simulation invite event from merchant dashboard
    const handleSimulationInvite = (e) => {
      if (e && e.detail) {
        setSimulationNotification(e.detail)
      }
    }
    window.addEventListener('showSimulationInvite', handleSimulationInvite)
    return () => {
      window.removeEventListener('showSimulationInvite', handleSimulationInvite)
    }
  }, [])

  useEffect(() => {
    if (merchantSetupQuery.data) {
      setSetupData(merchantSetupQuery.data)
    }
  }, [merchantSetupQuery.data])

  // Action: Handle manual login submit or SSO login
  const handleLoginSubmit = (ssoType = null, simulatedStatus = null) => {
    setIsLoading(true)
    setLoginError('')

    // Simulate API delay
    setTimeout(async () => {
      setIsLoading(false)

      const credentials = {
        email: email.trim().toLowerCase(),
        password,
        ssoType,
        simulatedStatus: simulatedStatus || simStatus,
      }

      try {
        const newSession = await login(credentials)
        applySessionToView(newSession)
      } catch (err) {
        const code = err?.message || ''
        if (code === 'missing_credentials') {
          setLoginError(t('login.login_error_missing'))
        } else if (code === 'incorrect_password') {
          setLoginError(currentLanguage === 'vi' ? 'Mật khẩu không chính xác.' : 'Incorrect password.')
        } else if (code === 'invalid_credentials') {
          setLoginError(currentLanguage === 'vi'
            ? 'Email hoặc mật khẩu không hợp lệ. Vui lòng nhập email đúng định dạng và mật khẩu từ 6 ký tự, hoặc sử dụng bảng điều khiển kịch bản ở bên phải.'
            : 'Invalid credentials. Please enter a valid email and 6+ character password, or use the Simulation Panel on the right.'
          )
        } else {
          setLoginError(currentLanguage === 'vi'
            ? 'Đăng nhập thất bại. Vui lòng thử lại.'
            : 'Login failed. Please try again.'
          )
        }
      }
    }, 1200)
  }

  // Apply session returned from the auth adapter to view/state — preserves original routing
  const applySessionToView = (newSession) => {
    if (!newSession) return

    const { flag, role, staffId: sId, verificationStatus: vs, ssoPrefillData: sso,
      clearMerchantSetup, clearProfileSettings, routeToDashboard } = newSession

    if (clearMerchantSetup) {
      clearMerchantSetupMutation.mutate()
      setSetupData(null)
    }
    if (clearProfileSettings) {
      clearProfileSettingsMutation.mutate()
    }

    // !personal path → staff dashboard
    if (flag === '!personal' || role === 'personal' || role === 'staff') {
      const resolvedStaffId = sId || 'NEX-STAFF-MIA0123'
      setLoggedInStaffId(resolvedStaffId)
      setCurrentStaffId(resolvedStaffId)
      setUserRole(role || 'staff')
      setView('staff-dashboard')
      return
    }

    // !business path → owner dashboard or onboarding
    setUserRole('owner')
    setCurrentStaffId(null)

    if (vs !== undefined && vs !== null) {
      setVerificationStatus(vs)
    }

    if (sso) {
      setSsoPrefillData(sso)
    }

    // SSO no-kyb scenario always goes to dashboard
    if (routeToDashboard) {
      setView('dashboard')
      return
    }

    // SSO with KYB → onboarding (Setup Wizard to configure)
    // Registered business accounts: check if setup exists
    if (!clearMerchantSetup && (setupData || merchantSetupQuery.data)) {
      setView('dashboard')
    } else {
      setView('onboarding')
    }
  }

  // Trigger Simulation Scenario directly
  const triggerSimulation = (scenario, status = null) => {
    setLoginError('')
    if (scenario === 'sso_with_kyb') {
      clearMerchantSetupMutation.mutate()
      setSetupData(null)
      setEmail('sso_with_kyb@gmail.com')
      setPassword('••••••••')
      handleLoginSubmit('sso_with_kyb')
    } else if (scenario === 'sso_no_kyb') {
      setEmail('sso_no_kyb@gmail.com')
      setPassword('••••••••')
      handleLoginSubmit('sso_no_kyb', status || simStatus)
    } else if (scenario === 'new_register') {
      setEmail('')
      setPassword('')
      setRegisterEmail('')
      setView('register-wizard')
    } else if (scenario === 'staff_portal') {
      setStaffInviteData({
        id: '',
        name: 'Lisa Tran',
        email: 'lisa@example.com',
        phone: '408-555-2345',
        role: 'Nail Technician',
        biz: 'Golden Glow Nail Spa'
      })
      setView('staff-portal')
    } else if (scenario === 'staff_dashboard') {
      setLoggedInStaffId('NEX-STAFF-MIA0123')
      setView('staff-dashboard')
    }
  }

  // Instantly toggle verification status of an account in the simulations listing
  const toggleAccountVerification = (emailAddress) => {
    const accs = pendingAccounts
    const statuses = ['basic', 'lite_pending', 'verified_lite', 'kyb_required', 'kyb_pending', 'kyb_approved', 'suspended']
    const updated = accs.map(acc => {
      if (acc.email === emailAddress) {
        const currentStatus = acc.verificationStatus || (acc.isVerified ? 'kyb_approved' : 'basic')
        const currentIndex = statuses.indexOf(currentStatus)
        const nextIndex = (currentIndex + 1) % statuses.length
        const nextStatus = statuses[nextIndex]
        return {
          ...acc,
          verificationStatus: nextStatus,
          isVerified: nextStatus === 'kyb_approved'
        }
      }
      return acc
    })
    replaceAllPendingAccountsMutation.mutate(updated)
  }

  // Delete simulated account
  const deleteSimulatedAccount = (emailAddress) => {
    const updated = pendingAccounts.filter(acc => acc.email !== emailAddress)
    replaceAllPendingAccountsMutation.mutate(updated)
  }

  // Action: Complete onboarding wizard
  const handleWizardComplete = (data) => {
    setSetupData(data)
    setView('dashboard')
  }

  // Action: Simulated log out / Reset onboarding to test again
  const handleResetApp = async () => {
    const ok = await showConfirm(t('login.reset_confirm') || 'Are you sure you want to reset?')
    if (ok) {
      clearMerchantSetupMutation.mutate()
      setSetupData(null)
      setVerificationStatus('kyb_approved')
      await logout()
      setView('login')
    }
  }

  const handleRegisterAndLogin = (registeredEmail) => {
    setRegisterEmail(registeredEmail)
    setVerificationStatus('basic')
    clearMerchantSetupMutation.mutate()
    clearProfileSettingsMutation.mutate()
    setSetupData(null)
    setSsoPrefillData({
      email: registeredEmail,
      name: '',
      industry: '',
      address: '',
      phone: '',
      website: '',
      logo: null,
      paymentAccounts: {
        venmo: '',
        cashapp: '',
        zelle: '',
        vlinkpay: ''
      },
      reviewLinks: {
        googleReview: '',
        yelpReview: '',
        facebookReview: '',
        feedbackEmail: registeredEmail
      }
    })
    setView('dashboard')
  }

  const handleKybSuccess = (emailAddress) => {
    setVerificationStatus('kyb_approved')
    const accs = pendingAccounts
    const matched = accs.find(acc => acc.email === emailAddress)
    if (matched && matched.kybDetails) {
      const kybProfile = {
        name: matched.kybDetails.legalName,
        industry: matched.kybDetails.businessType === 'LLC' ? 'Nail Salon' : 'Khác',
        address: 'VLINKPAY Merchant Registered Location',
        phone: '+1 (555) VLP-KYB1',
        website: '',
        logo: null,
        paymentAccounts: {
          venmo: '',
          cashapp: '',
          zelle: '',
          vlinkpay: matched.kybDetails.bankAccount ? `VLP-${matched.kybDetails.bankAccount.slice(-4)}` : 'VLINKPAY-ID'
        },
        email: matched.email,
        reviewLinks: {
          googleReview: 'https://google.com',
          yelpReview: 'https://yelp.com',
          facebookReview: '',
          feedbackEmail: matched.email
        }
      }
      setSsoPrefillData(kybProfile)
    }
    setView(preKybView)
  }

  const handleKybRequired = () => {
    setPreKybView(view)
    setRegisterEmail(ssoPrefillData?.email || '')
    setShowKybModal(true)
  }

  // Handle quick demo login from LoginScreen
  const handleQuickDemoLogin = (demoSetup) => {
    saveMerchantSetupMutation.mutate(demoSetup, {
      onSuccess: () => {
        setSetupData(demoSetup)
        setView('dashboard')
      },
      onError: (err) => {
        logger.error('Failed to save demo setup', err)
      },
    })
  }

  // Handle auto-login from account list in SimulationPanel
  const handleAutoLogin = (accEmail, accPassword) => {
    setEmail(accEmail)
    setPassword(accPassword)
    setTimeout(() => {
      handleLoginSubmit()
    }, 50)
  }

  return (
    <div className="min-h-dvh bg-nexoraCanvas text-inkBlue font-sans antialiased">
      {view === 'login' ? (
        <LoginScreen
          email={email}
          setEmail={setEmail}
          password={password}
          setPassword={setPassword}
          loginError={loginError}
          isLoading={isLoading}
          currentLanguage={currentLanguage}
          setLanguage={setLanguage}
          t={t}
          simStatus={simStatus}
          setSimStatus={setSimStatus}
          pendingAccounts={pendingAccounts}
          onLoginSubmit={handleLoginSubmit}
          onTriggerSimulation={triggerSimulation}
          onToggleAccountVerification={toggleAccountVerification}
          onDeleteSimulatedAccount={deleteSimulatedAccount}
          onQuickDemoLogin={handleQuickDemoLogin}
          onAutoLogin={handleAutoLogin}
          setStaffInviteData={setStaffInviteData}
          setView={setView}
          setLoggedInStaffId={setLoggedInStaffId}
          isDemoToolsEnabled={isDemoToolsEnabled}
        />
      ) : (
        <AppRouter
          view={view}
          setView={setView}
          setupData={setupData}
          setSetupData={setSetupData}
          registerEmail={registerEmail}
          staffInviteData={staffInviteData}
          setStaffInviteData={setStaffInviteData}
          ssoPrefillData={ssoPrefillData}
          verificationStatus={verificationStatus}
          showKybModal={showKybModal}
          setShowKybModal={setShowKybModal}
          simulationNotification={simulationNotification}
          setSimulationNotification={setSimulationNotification}
          initialDashboardMenu={initialDashboardMenu}
          setInitialDashboardMenu={setInitialDashboardMenu}
          initialSettingsTab={initialSettingsTab}
          setInitialSettingsTab={setInitialSettingsTab}
          currentLanguage={currentLanguage}
          t={t}
          userRole={userRole}
          currentStaffId={currentStaffId}
          loggedInStaffId={loggedInStaffId}
          onWizardComplete={handleWizardComplete}
          onKybSuccess={handleKybSuccess}
          onKybRequired={handleKybRequired}
          onResetApp={handleResetApp}
          onRegisterAndLogin={handleRegisterAndLogin}
          onLoadPendingAccounts={() => {}}
          preKybView={preKybView}
          isDemoToolsEnabled={isDemoToolsEnabled}
        />
      )}
    </div>
  )
}
