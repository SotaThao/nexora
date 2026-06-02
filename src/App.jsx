import React, { useState, useEffect } from 'react'
import SetupWizard from './components/SetupWizard'
import Dashboard from './components/Dashboard'
import CustomerFlow from './components/CustomerFlow'
import RegisterWizard from './components/RegisterWizard'
import StaffRegistrationWizard from './components/StaffRegistrationWizard'
import StaffDashboard from './components/staff-dashboard/StaffDashboard'
import {
  Sparkles, ShieldCheck, LogIn, Lock, Mail, RefreshCw, 
  Layers, Users, ShieldAlert, CheckCircle2, ChevronRight, Activity, X
} from 'lucide-react'
import { useTranslation } from './contexts/LanguageContext'
import { storage, initStorage } from './utils/storage'
import { useNotification } from './contexts/NotificationContext'

const localStorage = storage
const sessionStorage = storage

// Mock SSO Account Details
const MOCK_SSO_KYB_PROFILE = {
  name: 'VLINK Nail Spa',
  industry: 'Nail Salon',
  address: '789 Broadway, New York, NY 10003',
  phone: '+1 (212) 555-0199',
  website: 'https://vlinknailstudio.com',
  logo: null,
  paymentAccounts: {
    venmo: '@vlinknail',
    cashapp: '$vlinknail',
    zelle: 'pay@vlinknailstudio.com',
    vlinkpay: 'VLP-7721-VN'
  },
  email: 'sso_with_kyb@gmail.com'
}

const MOCK_SSO_NO_KYB_EMAIL = 'sso_no_kyb@gmail.com'

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

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0B1C30] font-sans antialiased">
      
      {/* 1. LOGIN SSO SCREEN (With Grid layout for Simulation Controller) */}
      {view === 'login' && (
        <div className="min-h-dvh flex items-center justify-center bg-nexoraCanvas relative overflow-x-hidden overflow-y-auto text-nexoraText px-4 py-6 sm:py-10 selection:bg-nexoraBrandSoft selection:text-nexoraBrand">
          {/* Soft background decorations */}
          <div className="absolute top-1/4 left-1/4 h-56 w-56 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[rgba(66,72,216,0.05)] via-transparent to-transparent blur-3xl pointer-events-none sm:h-96 sm:w-96"></div>
          <div className="absolute bottom-1/4 right-1/4 h-64 w-64 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[rgba(43,89,255,0.03)] via-transparent to-transparent blur-3xl pointer-events-none sm:h-[450px] sm:w-[450px]"></div>

          {/* Language Switcher */}
          <div className="absolute top-4 right-4 z-50 flex items-center gap-2 bg-white/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-nexoraBorder shadow-sm">
            <button 
              onClick={() => setLanguage('vi')}
              className={`text-xs font-bold px-2 py-0.5 rounded transition ${currentLanguage === 'vi' ? 'bg-nexoraBrand text-white' : 'text-nexoraSubtle hover:text-nexoraText'}`}
            >
              VI
            </button>
            <span className="text-nexoraBorder text-xs">|</span>
            <button 
              onClick={() => setLanguage('en')}
              className={`text-xs font-bold px-2 py-0.5 rounded transition ${currentLanguage === 'en' ? 'bg-nexoraBrand text-white' : 'text-nexoraSubtle hover:text-nexoraText'}`}
            >
              EN
            </button>
          </div>

          <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch relative z-10">
            
            {/* Left Column: Login Card */}
            <div className="lg:col-span-7 bg-white rounded-2xl p-5 sm:p-8 border border-nexoraBorder shadow-premium flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[rgba(70,72,216,0.03)] via-transparent to-transparent rounded-full pointer-events-none"></div>

              {/* VLINKPAY branding logo */}
              <div className="text-center mb-6">
                <img src="/assets/nexora-logo.png" alt="Nexora Logo" className="w-12 h-12 mx-auto object-contain mb-3" />
                <h2 className="font-sans text-xl font-bold tracking-wide sm:text-2xl">
                  NEXORA <span className="ml-1.5 inline-flex align-middle text-nexoraBrand font-sans text-xs tracking-widest font-black uppercase bg-nexoraBrand/10 px-2 py-0.5 rounded border border-nexoraBrand/30">TOUCH</span>
                </h2>
                <p className="text-xs text-nexoraMuted mt-1">{t('login.gateway_sub')}</p>
              </div>

              {isLoading ? (
                <div className="py-16 flex flex-col items-center justify-center space-y-4">
                  <div className="w-10 h-10 border-4 border-nexoraBrand/20 border-t-nexoraBrand rounded-full animate-spin"></div>
                  <p className="text-xs text-nexoraBrand font-semibold uppercase tracking-wider animate-pulse">
                    {t('login.connecting_sso')}
                  </p>
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="p-3 rounded-lg bg-nexoraBrandSoft/40 border border-nexoraBrandSoft text-[11px] text-nexoraText leading-relaxed">
                    <ShieldCheck className="w-4 h-4 text-nexoraBrand inline mr-1.5 shrink-0" />
                    <strong>{t('login.sso_integration_title')}</strong> {t('login.sso_integration_desc')}
                  </div>

                  {loginError && (
                    <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
                      {loginError}
                    </div>
                  )}

                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold text-nexoraText uppercase tracking-wider mb-2">{t('login.email_label')}</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 w-4 h-4 text-nexoraSubtle" />
                        <input 
                          type="email"
                          placeholder={t('login.email_placeholder')}
                          className="w-full bg-nexoraCanvas border border-nexoraBorder focus:border-nexoraBrand focus:bg-white rounded-lg pl-10 pr-4 py-2.5 text-sm text-nexoraText focus:outline-none placeholder-nexoraSubtle transition-all"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-nexoraText uppercase tracking-wider mb-2">{t('login.password_label')}</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 w-4 h-4 text-nexoraSubtle" />
                        <input 
                          type="password"
                          placeholder={t('login.password_placeholder')}
                          className="w-full bg-nexoraCanvas border border-nexoraBorder focus:border-nexoraBrand focus:bg-white rounded-lg pl-10 pr-4 py-2.5 text-sm text-nexoraText focus:outline-none placeholder-nexoraSubtle transition-all"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={() => handleLoginSubmit()}
                    className="w-full min-h-11 py-2.5 bg-gradient-to-r from-[#2B59FF] to-[#8E4DF8] hover:opacity-90 transition-opacity text-white font-extrabold text-xs uppercase tracking-wider rounded-lg flex items-center justify-center gap-1.5 shadow-[0_4px_14px_rgba(43,89,255,0.25)]"
                  >
                    <LogIn className="w-4 h-4 stroke-[3px]" /> {t('login.login_btn')}
                  </button>

                  <div className="relative py-2 text-center">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-nexoraBorder"></div></div>
                    <span className="relative bg-white px-3 text-[10px] text-nexoraSubtle font-bold uppercase tracking-wider">{t('login.or_try_demo')}</span>
                  </div>

                  {/* Quick login / registration options */}
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <button 
                      onClick={() => triggerSimulation('new_register')}
                      className="min-h-11 py-2 border border-nexoraBorder hover:border-nexoraBorder/80 bg-nexoraCanvas text-nexoraText text-xs font-semibold rounded-lg transition-all"
                    >
                      {t('login.register_btn')}
                    </button>

                    <button 
                      onClick={() => {
                        // Prefill and login directly to Dashboard
                        const demoSetup = {
                          businessInfo: {
                            name: 'Golden Glow Nail Spa & Salon',
                            industry: 'Nail Salon',
                            address: '1088 Gold Coast Hwy, Palm Beach, QLD 4221',
                            phone: '+1 (555) 789-2026',
                            website: 'https://goldenglownails.com',
                            logo: null,
                            paymentAccounts: {
                              venmo: '@goldenglow-spa',
                              cashapp: '$goldenglownails',
                              zelle: 'payment@goldenglownails.com',
                              vlinkpay: 'VLP-8893-GG'
                            }
                          },
                          reviewLinks: {
                            googleReview: 'https://g.page/r/cGoldenGlowNails/review',
                            yelpReview: 'https://www.yelp.com/biz/golden-glow-nails-palm-beach',
                            facebookReview: 'https://www.facebook.com/goldenglownails/reviews',
                            feedbackEmail: 'manager@goldenglownails.com'
                          },
                          staffList: [
                            {
                              id: 'NEX-STAFF-MIA0123',
                              fullName: 'Mia Tran',
                              nickname: 'Mia T.',
                              position: 'Gel-X Artist',
                              avatar: '',
                              isActive: true,
                              showInTipsFlow: true,
                              paymentAccounts: { venmo: '@mia-nails', cashapp: '$miaglow', zelle: 'mia.tran@gmail.com', vlinkpay: 'VLP-0123-MIA' }
                            },
                            {
                              id: 'NEX-STAFF-VL8893',
                              fullName: 'Vivian Le',
                              nickname: 'Vivian L.',
                              position: 'Acrylic Specialist',
                              avatar: '',
                              isActive: true,
                              showInTipsFlow: true,
                              paymentAccounts: { venmo: '', cashapp: '$vivianle', zelle: '407-555-0199', vlinkpay: 'VLP-8893-VL' }
                            },
                            {
                              id: 'NEX-STAFF-ASH0155',
                              fullName: 'Ashley Park',
                              nickname: 'Ashley P.',
                              position: 'Pedicure Lead',
                              avatar: '',
                              isActive: true,
                              showInTipsFlow: true,
                              paymentAccounts: { venmo: '@ashley-pedi', cashapp: '', zelle: 'ashley@glownails.com', vlinkpay: 'VLP-0155-ASH' }
                            },
                            {
                              id: 'NEX-STAFF-HN1148',
                              fullName: 'Hanna Nguyen',
                              nickname: 'Hanna Ng.',
                              position: 'Nail Art Designer',
                              avatar: '',
                              isActive: false,
                              showInTipsFlow: true,
                              paymentAccounts: { venmo: '@hanna-art', cashapp: '', zelle: '', vlinkpay: 'VLP-1148-HN' }
                            }
                          ],
                          touchPoints: [
                            { id: 'tp-main', name: 'Business Main Lobby QR', type: 'Business Main' },
                            { id: 'tp-front', name: 'Reception Front Desk', type: 'Front Desk' },
                            { id: 'tp-t1', name: 'Service Chair 01', type: 'Table QR' },
                            { id: 'tp-t2', name: 'Service Chair 02', type: 'Table QR' },
                          ]
                        }
                        localStorage.setItem('nexora_merchant_setup', JSON.stringify(demoSetup))
                        sessionStorage.setItem('nexora_merchant_setup', JSON.stringify(demoSetup))
                        setSetupData(demoSetup)
                        setView('dashboard')
                      }}
                      className="min-h-11 py-2 border border-nexoraBrand/20 hover:border-nexoraBrand text-nexoraBrand bg-nexoraBrandSoft/40 hover:bg-nexoraBrandSoft text-xs font-semibold rounded-lg flex items-center justify-center gap-1 transition-all"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-nexoraBrand" /> {t('login.enter_dashboard_btn')}
                    </button>
                  </div>
                </div>
              )}
              
              <span className="text-[9px] text-nexoraSubtle font-medium tracking-wide mt-6 block text-center uppercase">
                {t('login.sso_security_footer')}
              </span>
            </div>

            {/* Right Column: Simulation Controller Card */}
            <div className="lg:col-span-5 bg-white rounded-2xl p-5 sm:p-8 border border-nexoraBorder shadow-premium flex flex-col justify-between relative overflow-hidden">
              <div className="space-y-4">
                <div className="border-b border-nexoraBorder pb-3">
                  <h3 className="text-sm font-extrabold text-nexoraText flex items-center gap-2">
                    <Activity className="w-4 h-4 text-nexoraBrand" />
                    {currentLanguage === 'vi' ? 'TRÌNH GIẢ LẬP KỊCH BẢN' : 'SIMULATION FLOW CONTROLLER'}
                  </h3>
                  <p className="text-[10px] text-nexoraSubtle mt-1">
                    {currentLanguage === 'vi'
                      ? 'Chọn kịch bản để kiểm tra phân luồng Onboarding và đăng ký (Flow 1 & 2):'
                      : 'Trigger simulation cases to test the onboarding and register branches (Flow 1 & 2):'
                    }
                  </p>
                </div>

                <div className="space-y-2.5">
                  {/* Scenario 1: SSO with KYB */}
                  <button 
                    onClick={() => triggerSimulation('sso_with_kyb')}
                    className="w-full text-left p-3 rounded-xl border border-nexoraBorder hover:border-nexoraBrand bg-slate-50 hover:bg-nexoraBrandSoft/10 transition flex items-start gap-3 group"
                  >
                    <span className="h-6 w-6 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center font-bold text-xs text-indigo-600 shrink-0">1</span>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-800 group-hover:text-nexoraBrand flex items-center gap-1.5">
                        {currentLanguage === 'vi' ? 'Đã có KYB (SSO)' : 'Already has KYB (SSO)'}
                        <ChevronRight className="w-3 h-3 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                      <p className="text-[9px] text-slate-500 mt-0.5">
                        {currentLanguage === 'vi'
                          ? 'Đăng nhập SSO -> Tự điền Step 1 và vào flow setup thợ & QR/NFC như cũ.'
                          : 'SSO Login -> Auto-fills Step 1 and enters the staff & QR/NFC setup flow (as before).'
                        }
                      </p>
                    </div>
                  </button>

                  {/* Scenario 2: SSO without KYB */}
                  <div className="flex flex-col gap-1.5 p-3 rounded-xl border border-nexoraBorder bg-slate-50">
                    <div className="flex items-start gap-3">
                      <span className="h-6 w-6 rounded-lg bg-pink-50 border border-pink-100 flex items-center justify-center font-bold text-xs text-pink-600 shrink-0">2</span>
                      <div className="min-w-0 flex-grow">
                        <div className="text-xs font-bold text-slate-800 flex items-center justify-between">
                          <span>{currentLanguage === 'vi' ? 'Chưa có KYB (SSO)' : 'No KYB yet (SSO)'}</span>
                          <button 
                            onClick={() => triggerSimulation('sso_no_kyb', simStatus)}
                            className="px-2 py-0.5 bg-nexoraBrand text-white rounded text-[9px] font-bold uppercase hover:bg-opacity-95"
                          >
                            {currentLanguage === 'vi' ? 'Đăng nhập' : 'Login'}
                          </button>
                        </div>
                        <p className="text-[9px] text-slate-500 mt-0.5">
                          {currentLanguage === 'vi'
                            ? 'Chọn trạng thái để bắt đầu luồng tương ứng:'
                            : 'Select verification status to initiate the flow:'}
                        </p>
                        
                        <select 
                          value={simStatus} 
                          onChange={(e) => setSimStatus(e.target.value)}
                          className="mt-2 w-full bg-white border border-nexoraBorder rounded px-2 py-1 text-xs text-slate-700 outline-none focus:border-nexoraBrand"
                        >
                          <option value="basic">basic (unverified)</option>
                          <option value="lite_pending">lite_pending</option>
                          <option value="verified_lite">verified_lite</option>
                          <option value="kyb_required">kyb_required</option>
                          <option value="kyb_pending">kyb_pending</option>
                          <option value="kyb_approved">kyb_approved (verified)</option>
                          <option value="suspended">suspended</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Scenario 3: New Register */}
                  <button 
                    onClick={() => triggerSimulation('new_register')}
                    className="w-full text-left p-3 rounded-xl border border-nexoraBorder hover:border-nexoraBrand bg-slate-50 hover:bg-nexoraBrandSoft/10 transition flex items-start gap-3 group"
                  >
                    <span className="h-6 w-6 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center font-bold text-xs text-emerald-600 shrink-0">3</span>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-800 group-hover:text-nexoraBrand flex items-center gap-1.5">
                        {currentLanguage === 'vi' ? 'Chưa có tài khoản (Đăng ký mới)' : 'No Account (New Register)'}
                        <ChevronRight className="w-3 h-3 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                      <p className="text-[9px] text-slate-500 mt-0.5">
                        {currentLanguage === 'vi'
                          ? 'Đăng ký mới -> Hiển thị Step 1 đăng ký mới, đăng nhập trực tiếp sau khi hoàn tất dưới dạng chưa KYB.'
                          : 'New Register -> Shows Step 1, logs in directly after completion as a no-KYB account.'
                        }
                      </p>
                    </div>
                  </button>

                  {/* Scenario 4: Staff Portal Setup */}
                  <button 
                    onClick={() => {
                      setStaffInviteData({
                        id: '',
                        name: 'Lisa Tran',
                        email: 'lisa@example.com',
                        phone: '408-555-2345',
                        role: 'Nail Technician',
                        biz: 'Golden Glow Nail Spa'
                      })
                      setView('staff-portal')
                    }}
                    className="w-full text-left p-3 rounded-xl border border-nexoraBorder hover:border-nexoraBrand bg-slate-50 hover:bg-nexoraBrandSoft/10 transition flex items-start gap-3 group"
                  >
                    <span className="h-6 w-6 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center font-bold text-xs text-amber-600 shrink-0">4</span>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-800 group-hover:text-nexoraBrand flex items-center gap-1.5">
                        {currentLanguage === 'vi' ? 'Giả lập Staff Setup Portal' : 'Simulate Staff Setup Portal'}
                        <ChevronRight className="w-3 h-3 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                      <p className="text-[9px] text-slate-500 mt-0.5">
                        {currentLanguage === 'vi'
                          ? 'Mở trực tiếp luồng đăng ký & cài đặt ví cho nhân viên Lisa Tran.'
                          : 'Directly opens the registration & wallet setup flow for technician Lisa Tran.'
                        }
                      </p>
                    </div>
                  </button>

                  {/* Scenario 5: Staff Personal Dashboard */}
                  <button
                    onClick={() => {
                      setLoggedInStaffId('NEX-STAFF-MIA0123')
                      setView('staff-dashboard')
                    }}
                    className="w-full text-left p-3 rounded-xl border border-nexoraBorder hover:border-nexoraBrand bg-slate-50 hover:bg-nexoraBrandSoft/10 transition flex items-start gap-3 group"
                  >
                    <span className="h-6 w-6 rounded-lg bg-sky-50 border border-sky-100 flex items-center justify-center font-bold text-xs text-sky-600 shrink-0">5</span>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-800 group-hover:text-nexoraBrand flex items-center gap-1.5">
                        {currentLanguage === 'vi' ? 'Đăng nhập Staff (Dashboard cá nhân)' : 'Staff Login (Personal Dashboard)'}
                        <ChevronRight className="w-3 h-3 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                      <p className="text-[9px] text-slate-500 mt-0.5">
                        {currentLanguage === 'vi'
                          ? 'Mở dashboard cá nhân của nhân viên (cờ !personal) để tự quản lý tips, ví, QR, hồ sơ.'
                          : 'Open the staff personal dashboard (!personal flag) to self-manage tips, payouts, QR, profile.'
                        }
                      </p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Real Registered Database Simulation inside UI */}
              <div className="pt-4 border-t border-slate-100 mt-4 space-y-2 flex-grow flex flex-col justify-end">
                <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-wider">
                  {currentLanguage === 'vi' ? 'CƠ SỞ DỮ LIỆU TÀI KHOẢN GIẢ LẬP' : 'SIMULATED ACCOUNTS DATABASE'}
                </h4>
                
                {pendingAccounts.length === 0 ? (
                  <div className="p-3 border border-dashed border-slate-200 rounded-xl text-center text-[10px] text-slate-400">
                    {currentLanguage === 'vi' ? 'Chưa có tài khoản đăng ký tùy chỉnh' : 'No custom registered accounts yet'}
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
                    {pendingAccounts.map((acc, index) => (
                      <div key={index} className="p-2 border border-slate-200 rounded-lg bg-slate-50 flex items-center justify-between gap-2 text-[10px]">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <div className="font-mono font-bold truncate text-slate-700 max-w-[110px]" title={acc.email}>{acc.email}</div>
                            <span className={`px-1 py-0.2 rounded text-[7px] font-extrabold uppercase shrink-0
                              ${acc.role === 'personal' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}
                            >
                              {acc.role || 'business'}
                            </span>
                          </div>
                          <div className="text-[9px] flex flex-wrap items-center gap-1 mt-0.5">
                            <span className="font-semibold">{currentLanguage === 'vi' ? 'Mật khẩu:' : 'Pass:'} {acc.password}</span>
                            <span>•</span>
                            <span className="font-bold text-indigo-600">
                              {acc.role === 'personal' ? 'active' : (acc.verificationStatus || (acc.isVerified ? 'kyb_approved' : 'basic'))}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button 
                            onClick={() => {
                              setEmail(acc.email)
                              setPassword(acc.password)
                              // Force small delay to ensure input fields are updated
                              setTimeout(() => {
                                handleLoginSubmit()
                              }, 50)
                            }}
                            className="px-1.5 py-0.5 rounded text-[8px] font-extrabold transition-all bg-nexoraBrand text-white hover:bg-nexoraBrandDark"
                            title="Auto Login"
                          >
                            LOGIN
                          </button>
                          {acc.role !== 'personal' && (
                            <button 
                              onClick={() => toggleAccountVerification(acc.email)}
                              className="px-1.5 py-0.5 rounded text-[8px] font-extrabold transition-all border bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200"
                              title="Cycle verification status"
                            >
                              CYCLE
                            </button>
                          )}
                          <button 
                            onClick={() => deleteSimulatedAccount(acc.email)}
                            className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded border border-red-200"
                            title="Delete"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

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
            loadPendingAccounts()
          }}
          onRegisterAndLogin={handleRegisterAndLogin}
          onKybSuccess={handleKybSuccess}
          isRedirectedFromSession={!!(ssoPrefillData?.email)}
        />
      )}

      {/* 3. ONBOARDING SETUP WIZARD (Flow 1 / Prefillable) */}
      {view === 'onboarding' && (
        <SetupWizard 
          initialBusinessInfo={ssoPrefillData}
          verificationStatus={verificationStatus}
          hasKyb={verificationStatus === 'kyb_approved'}
          onKybRequired={handleKybRequired}
          onComplete={handleWizardComplete} 
          onBackToLogin={() => setView('login')} 
        />
      )}

      {/* 4. OWNER DASHBOARD */}
      {view === 'dashboard' && (
        <div className="relative">
          {/* Quick debug reset onboarding button */}
          <button 
            onClick={handleResetApp}
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
            onKybRequired={handleKybRequired}
            onKybSuccess={handleKybSuccess}
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
                console.error(e)
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
                className="px-5 py-2.5 bg-gradient-to-r from-[#2B59FF] to-[#8E4DF8] hover:opacity-90 text-white text-xs font-black uppercase tracking-wider rounded-lg shadow-md transition-all animate-pulse"
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

    </div>
  )
}
