import React, { useState, useEffect } from 'react'
import LoginScreen from './app/LoginScreen'
import AppRouter from './app/AppRouter'
import { useTranslation } from './contexts/LanguageContext'
import { initStorage } from './utils/storage'
import { logger } from './utils/logger'
import { useNotification } from './contexts/NotificationContext'
import { useAuth } from './auth/useAuth'
import { useClearMerchantSetup, useMerchantSetup, useSaveMerchantSetup } from './data/hooks/useMerchantSetup'
import { useClearProfileSettings } from './data/hooks/useProfileSettings'
import { isDemoToolsEnabled } from './app/demoTools'
import { getErrorI18nKey } from './data/errorCodes'
import apiAuthAdapter from './auth/adapters/apiAuthAdapter'

export default function App() {
  const { currentLanguage, setLanguage, t } = useTranslation()
  const { showConfirm } = useNotification()
  const { session, status: authStatus, login, logout } = useAuth()

  const [view, setView] = useState('login') // 'login' | 'register-wizard' | 'onboarding' | 'dashboard' | 'customer' | 'staff-portal' | 'staff-dashboard'
  const [userRole, setUserRole] = useState('owner') // 'owner' | 'staff'
  const [currentStaffId, setCurrentStaffId] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [setupData, setSetupData] = useState(null)
  const [verificationStatus, setVerificationStatus] = useState('unverified')
  const [preKybView, setPreKybView] = useState('onboarding')
  const [isNewRegistration, setIsNewRegistration] = useState(false)

  const needsMerchantData = (view === 'dashboard' || view === 'onboarding')
  const merchantSetupQuery = useMerchantSetup({ enabled: needsMerchantData })
  const saveMerchantSetupMutation = useSaveMerchantSetup()
  const clearMerchantSetupMutation = useClearMerchantSetup()
  const clearProfileSettingsMutation = useClearProfileSettings()

  // Login form state
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

  // Load setup data or customer flow on mount
  useEffect(() => {
    initStorage()
    const params = new URLSearchParams(window.location.search)
    const action = params.get('action') || params.get('flow')
    if (action === 'verify-email' && params.get('token') && params.get('email')) {
      apiAuthAdapter.verifyEmail({
        token: params.get('token'),
        email: params.get('email')
      }).then(() => {
        setView('login')
        setLoginError('')
      }).catch(() => {
        setView('login')
        setLoginError(t('errors.user_invalid_email_verification_token') || 'Email verification failed.')
      })
      window.history.replaceState({}, '', window.location.pathname)
      return
    }
    if (action === 'reset-password') {
      setView('reset-password')
      return
    }
    if (params.get('flow') === 'customer') {
      setView('customer')
      return
    }
    // Public customer touch route: /touch/{businessSlug}/{touchPointSlug}
    const pathParts = window.location.pathname.split('/').filter(Boolean)
    if (pathParts[0] === 'touch' && pathParts.length >= 3) {
      setView('customer')
      return
    }
    // Token-based staff invite: /staff/invite/{token}
    if (pathParts[0] === 'staff' && pathParts[1] === 'invite' && pathParts[2]) {
      setStaffInviteData({ token: pathParts[2] })
      setView('staff-portal')
      return
    }
    if (params.get('flow') === 'staff-invite') {
      const bizName = params.get('biz') || ''
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

  // Restore session view on mount/load
  useEffect(() => {
    if (authStatus === 'authenticated' && session && view === 'login') {
      applySessionToView(session)
    }
  }, [authStatus, session, view])

  useEffect(() => {
    if (merchantSetupQuery.data) {
      setSetupData(merchantSetupQuery.data)
    }
  }, [merchantSetupQuery.data])

  // Action: Handle login submit
  const handleLoginSubmit = () => {
    setIsLoading(true)
    setLoginError('')

    setTimeout(async () => {
      setIsLoading(false)

      const credentials = {
        email: email.trim().toLowerCase(),
        password,
      }

      try {
        const newSession = await login(credentials)
        applySessionToView(newSession)
      } catch (err) {
        const errorCode = err?.errorCode || 'unknown_error'
        const i18nKey = getErrorI18nKey(errorCode)
        setLoginError(t(i18nKey))
      }
    }, 800)
  }

  // Apply session returned from the auth adapter to view/state
  const applySessionToView = (newSession, { isFreshRegistration = false } = {}) => {
    setIsNewRegistration(isFreshRegistration)
    if (!newSession) return

    const { flag, role, staffId: sId, verificationStatus: vs, ssoPrefillData: sso,
      clearMerchantSetup, clearProfileSettings } = newSession

    if (clearMerchantSetup) {
      clearMerchantSetupMutation.mutate()
      setSetupData(null)
    }
    if (clearProfileSettings) {
      clearProfileSettingsMutation.mutate()
    }

    // !personal path → staff dashboard
    if (flag === '!personal' || role === 'personal' || role === 'staff') {
      const resolvedStaffId = sId || null
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

    const hasOnboardingState = typeof newSession.hasCompletedOnboarding === 'boolean'
    const needsOnboarding = (
      isFreshRegistration ||
      newSession.clearMerchantSetup ||
      (hasOnboardingState && !newSession.hasCompletedOnboarding) ||
      (!hasOnboardingState && (vs === 'basic' || vs === 'unverified'))
    )

    if (needsOnboarding) {
      setView('onboarding')
      return
    }

    // KYB gates individual payment/compliance features, not dashboard access.
    setView('dashboard')
  }

  // Trigger Simulation Scenario directly (demo tools only)
  const triggerSimulation = (scenario) => {
    setLoginError('')
    if (scenario === 'new_register') {
      setEmail('')
      setPassword('')
      setRegisterEmail('')
      setView('register-wizard')
    } else if (scenario === 'staff_portal') {
      setStaffInviteData({
        id: '',
        name: '',
        email: '',
        phone: '',
        role: 'Nail Technician',
        biz: ''
      })
      setView('staff-portal')
    } else if (scenario === 'staff_dashboard') {
      setLoggedInStaffId(null)
      setView('staff-dashboard')
    }
  }

  // Action: Complete onboarding wizard
  const handleWizardComplete = (data) => {
    setSetupData(data)
    setIsNewRegistration(false)
    setView('dashboard')
  }

  // Action: Log out (clear tokens + session, then show login)
  const handleLogout = async () => {
    await logout()
    setSetupData(null)
    setIsNewRegistration(false)
    setView('login')
  }

  // Action: Log out / Reset app
  const handleResetApp = async () => {
    const ok = await showConfirm(t('login.reset_confirm') || 'Are you sure you want to reset?')
    if (ok) {
      clearMerchantSetupMutation.mutate()
      setSetupData(null)
      setVerificationStatus('unverified')
      await logout()
      setView('login')
    }
  }

  const handleRegisterAndLogin = async (registeredEmail) => {
    setRegisterEmail(registeredEmail)
    setEmail(registeredEmail)
    setVerificationStatus('basic')
    clearMerchantSetupMutation.mutate()
    clearProfileSettingsMutation.mutate()
    setSetupData(null)
    setIsNewRegistration(true)
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

    try {
      const newSession = await apiAuthAdapter.getSession()
      if (newSession) {
        applySessionToView(newSession, { isFreshRegistration: true })
        return
      }
    } catch (e) {
      logger.error('Failed to get session in handleRegisterAndLogin', e)
    }

    if (session) {
      applySessionToView(session, { isFreshRegistration: true })
      return
    }

    setView('onboarding')
  }

  const handleKybSuccess = (emailAddress) => {
    setVerificationStatus('kyb_approved')
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
          onLoginSubmit={handleLoginSubmit}
          onTriggerSimulation={triggerSimulation}
          onQuickDemoLogin={handleQuickDemoLogin}
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
          isNewRegistration={isNewRegistration}
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
          onLogout={handleLogout}
          onRegisterAndLogin={handleRegisterAndLogin}
          onLoadPendingAccounts={() => {}}
          onStartSetup={() => setView('onboarding')}
          preKybView={preKybView}
          isDemoToolsEnabled={isDemoToolsEnabled}
        />
      )}
    </div>
  )
}
