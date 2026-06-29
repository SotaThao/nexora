import React, { useState, useEffect } from 'react'
import LoginScreen from './app/LoginScreen'
import AppRouter from './app/AppRouter'
import { MOCK_SSO_KYB_PROFILE, MOCK_SSO_NO_KYB_EMAIL } from './app/mockSso'
import { useTranslation } from './contexts/LanguageContext'
import { storage, initStorage } from './utils/storage'
import { useNotification } from './contexts/NotificationContext'

const localStorage = storage
const sessionStorage = storage

export default function App() {
  const { currentLanguage, setLanguage, t } = useTranslation()
  const { showConfirm } = useNotification()
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

  // List of pending accounts from localStorage to display in simulation controls
  const [pendingAccounts, setPendingAccounts] = useState([])

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

    const savedSetup = localStorage.getItem('nexora_merchant_setup')
    if (savedSetup) {
      try {
        const parsed = JSON.parse(savedSetup)
        setSetupData(parsed)
        sessionStorage.setItem('nexora_merchant_setup', savedSetup)
      } catch (e) {
        console.error('Error parsing setup details', e)
      }
    }

    const savedProfile = localStorage.getItem('nexora_profile_settings')
    if (savedProfile) {
      sessionStorage.setItem('nexora_profile_settings', savedProfile)
    }

    // Load pending/registered accounts
    loadPendingAccounts()

    // Listen for storage events (e.g. from Supabase or sibling frames) to update setupData state
    const handleStorage = (e) => {
      if (!e || !e.key || e.key === 'nexora_merchant_setup') {
        const updatedSetup = localStorage.getItem('nexora_merchant_setup')
        if (updatedSetup) {
          try {
            setSetupData(JSON.parse(updatedSetup))
          } catch (err) {}
        }
      }
      if (!e || !e.key || e.key === 'nexora_pending_accounts') {
        loadPendingAccounts()
      }
    }
    window.addEventListener('storage', handleStorage)

    // Listen for simulation invite event from merchant dashboard
    const handleSimulationInvite = (e) => {
      if (e && e.detail) {
        setSimulationNotification(e.detail)
      }
    }
    window.addEventListener('showSimulationInvite', handleSimulationInvite)
    return () => {
      window.removeEventListener('showSimulationInvite', handleSimulationInvite)
      window.removeEventListener('storage', handleStorage)
    }
  }, [])

  const loadPendingAccounts = () => {
    const accs = JSON.parse(localStorage.getItem('nexora_pending_accounts') || '[]')
    setPendingAccounts(accs)
  }

  // Action: Handle manual login submit or SSO login
  const handleLoginSubmit = (ssoType = null, simulatedStatus = null) => {
    setIsLoading(true)
    setLoginError('')

    // Simulate API delay
    setTimeout(() => {
      setIsLoading(false)
      loadPendingAccounts()

      const targetEmail = ssoType ? (ssoType === 'sso_with_kyb' ? 'sso_with_kyb@gmail.com' : 'sso_no_kyb@gmail.com') : email.trim().toLowerCase()
      const targetPassword = ssoType ? '••••••••' : password

      if (!targetEmail || !targetPassword) {
        setLoginError(t('login.login_error_missing'))
        return
      }

      // SCENARIO 1: SSO WITH KYB
      if (targetEmail === 'sso_with_kyb@gmail.com') {
        setUserRole('owner')
        setCurrentStaffId(null)
        setSsoPrefillData(MOCK_SSO_KYB_PROFILE)
        localStorage.removeItem('nexora_merchant_setup')
        setSetupData(null)
        setVerificationStatus('kyb_approved')
        setView('onboarding')
        return
      }

      // SCENARIO 2: SSO WITHOUT KYB
      if (targetEmail === 'sso_no_kyb@gmail.com') {
        setUserRole('owner')
        setCurrentStaffId(null)
        const allAccounts = JSON.parse(localStorage.getItem('nexora_pending_accounts') || '[]')
        const matched = allAccounts.find(acc => acc.email === targetEmail)

        const activeStatus = simulatedStatus || matched?.verificationStatus || (matched?.isVerified ? 'kyb_approved' : 'basic')
        setVerificationStatus(activeStatus)
        const isAlreadyVerified = activeStatus === 'kyb_approved'

        const kybProfile = {
          name: isAlreadyVerified ? matched.kybDetails.legalName : 'Golden Glow Nails',
          industry: isAlreadyVerified ? (matched.kybDetails.businessType === 'LLC' ? 'Nail Salon' : 'Khác') : 'Nail Salon',
          address: isAlreadyVerified ? 'VLINKPAY Merchant Registered Location' : '123 Beauty Lane, San Jose, CA 95112',
          phone: isAlreadyVerified ? '+1 (555) VLP-KYB1' : '+1 (408) 555-0123',
          website: 'https://goldenglownails.com',
          logo: null,
          paymentAccounts: {
            venmo: '',
            cashapp: '',
            zelle: '',
            vlinkpay: isAlreadyVerified && matched.kybDetails.bankAccount ? `VLP-${matched.kybDetails.bankAccount.slice(-4)}` : ''
          },
          email: targetEmail,
          reviewLinks: {
            googleReview: isAlreadyVerified ? 'https://google.com' : '',
            yelpReview: isAlreadyVerified ? 'https://yelp.com' : '',
            facebookReview: '',
            feedbackEmail: targetEmail
          }
        }
        setSsoPrefillData(kybProfile)

        localStorage.removeItem('nexora_merchant_setup')
        localStorage.removeItem('nexora_profile_settings')
        setSetupData(null)
        setView('dashboard')
        return
      }

      // SCENARIO 3: CHECK MANUALLY REGISTERED ACCOUNTS
      const allAccounts = JSON.parse(localStorage.getItem('nexora_pending_accounts') || '[]')
      const matchedAccount = allAccounts.find(acc => acc.email === targetEmail)

      if (matchedAccount) {
        if (matchedAccount.password !== targetPassword) {
          setLoginError(currentLanguage === 'vi' ? 'Mật khẩu không chính xác.' : 'Incorrect password.')
          return
        }

        const role = matchedAccount.role || 'owner'
        setUserRole(role)

        if (role === 'personal' || role === 'staff') {
          setLoggedInStaffId(matchedAccount.staffId || 'NEX-STAFF-MIA0123')
          setCurrentStaffId(matchedAccount.staffId || 'NEX-STAFF-MIA0123')
          setView('staff-dashboard')
          return
        }

        setCurrentStaffId(null)
        const activeStatus = matchedAccount.verificationStatus || (matchedAccount.isVerified ? 'kyb_approved' : 'basic')
        setVerificationStatus(activeStatus)
        const isAlreadyVerified = activeStatus === 'kyb_approved'

        const kybProfile = {
          name: isAlreadyVerified ? matchedAccount.kybDetails.legalName : '',
          industry: isAlreadyVerified ? (matchedAccount.kybDetails.businessType === 'LLC' ? 'Nail Salon' : 'Khác') : '',
          address: isAlreadyVerified ? 'VLINKPAY Merchant Registered Location' : '',
          phone: isAlreadyVerified ? '+1 (555) VLP-KYB1' : '',
          website: '',
          logo: null,
          paymentAccounts: {
            venmo: '',
            cashapp: '',
            zelle: '',
            vlinkpay: isAlreadyVerified && matchedAccount.kybDetails.bankAccount ? `VLP-${matchedAccount.kybDetails.bankAccount.slice(-4)}` : ''
          },
          email: matchedAccount.email,
          reviewLinks: {
            googleReview: isAlreadyVerified ? 'https://google.com' : '',
            yelpReview: isAlreadyVerified ? 'https://yelp.com' : '',
            facebookReview: '',
            feedbackEmail: matchedAccount.email
          }
        }
        setSsoPrefillData(kybProfile)

        const savedSetup = localStorage.getItem('nexora_merchant_setup')
        if (savedSetup) {
          setView('dashboard')
        } else {
          setView('onboarding')
        }
        return
      }

      // Fallback for simple demo logs (non-SSO, non-registered)
      if (targetEmail.includes('@') && targetPassword.length >= 6) {
        // Detect if email matches a technician inside merchant setup
        const savedSetupStr = localStorage.getItem('nexora_merchant_setup')
        let matchedStaff = null
        if (savedSetupStr) {
          try {
            const parsedSetup = JSON.parse(savedSetupStr)
            matchedStaff = parsedSetup.staffList?.find(s => s.email?.trim().toLowerCase() === targetEmail)
          } catch(e) {}
        }

        if (matchedStaff) {
          setUserRole('staff')
          setCurrentStaffId(matchedStaff.id)
          setView('dashboard')
        } else {
          setUserRole('owner')
          setCurrentStaffId(null)
          const savedSetup = localStorage.getItem('nexora_merchant_setup')
          if (savedSetup) {
            setView('dashboard')
          } else {
            setView('onboarding')
          }
        }
      } else {
        setLoginError(currentLanguage === 'vi'
          ? 'Email hoặc mật khẩu không hợp lệ. Vui lòng nhập email đúng định dạng và mật khẩu từ 6 ký tự, hoặc sử dụng bảng điều khiển kịch bản ở bên phải.'
          : 'Invalid credentials. Please enter a valid email and 6+ character password, or use the Simulation Panel on the right.'
        )
      }
    }, 1200)
  }

  // Trigger Simulation Scenario directly
  const triggerSimulation = (scenario, status = null) => {
    setLoginError('')
    if (scenario === 'sso_with_kyb') {
      localStorage.removeItem('nexora_merchant_setup')
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
    } else if (scenario === 'customer') {
      setView('customer')
    }
  }

  // Instantly toggle verification status of an account in the simulations listing
  const toggleAccountVerification = (emailAddress) => {
    const accs = JSON.parse(localStorage.getItem('nexora_pending_accounts') || '[]')
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
    localStorage.setItem('nexora_pending_accounts', JSON.stringify(updated))
    loadPendingAccounts()
  }

  // Delete simulated account
  const deleteSimulatedAccount = (emailAddress) => {
    const accs = JSON.parse(localStorage.getItem('nexora_pending_accounts') || '[]')
    const updated = accs.filter(acc => acc.email !== emailAddress)
    localStorage.setItem('nexora_pending_accounts', JSON.stringify(updated))
    loadPendingAccounts()
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
      localStorage.removeItem('nexora_merchant_setup')
      setSetupData(null)
      setVerificationStatus('kyb_approved')
      setView('login')
    }
  }

  const handleRegisterAndLogin = (registeredEmail) => {
    setRegisterEmail(registeredEmail)
    setVerificationStatus('basic')
    localStorage.removeItem('nexora_merchant_setup')
    localStorage.removeItem('nexora_profile_settings')
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
    const accs = JSON.parse(localStorage.getItem('nexora_pending_accounts') || '[]')
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
    loadPendingAccounts()
  }

  const handleKybRequired = () => {
    setPreKybView(view)
    setRegisterEmail(ssoPrefillData?.email || '')
    setShowKybModal(true)
  }

  // Handle quick demo login from LoginScreen
  const handleQuickDemoLogin = (demoSetup) => {
    localStorage.setItem('nexora_merchant_setup', JSON.stringify(demoSetup))
    sessionStorage.setItem('nexora_merchant_setup', JSON.stringify(demoSetup))
    setSetupData(demoSetup)
    setView('dashboard')
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
    <div className="min-h-dvh bg-[#F8FAFC] text-[#0B1C30] font-sans antialiased">
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
          onLoadPendingAccounts={loadPendingAccounts}
          preKybView={preKybView}
        />
      )}
    </div>
  )
}
