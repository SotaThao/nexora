import React, { useState, useEffect } from 'react'
import SetupWizard from './components/SetupWizard'
import Dashboard from './components/Dashboard'
import { Sparkles, ShieldCheck, LogIn, Lock, Mail, RefreshCw, Layers } from 'lucide-react'

export default function App() {
  const [view, setView] = useState('login') // 'login' | 'onboarding' | 'dashboard'
  const [isLoading, setIsLoading] = useState(false)
  const [setupData, setSetupData] = useState(null)
  
  // Login simulated form state
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')

  // Check if onboarding completed previously
  useEffect(() => {
    const savedSetup = localStorage.getItem('nexora_merchant_setup')
    if (savedSetup) {
      try {
        const parsed = JSON.parse(savedSetup)
        setSetupData(parsed)
        // If SSO token also existed (simulated), we could go straight to dashboard.
        // For testing convenience, we start at login but have demo logins.
      } catch (e) {
        console.error('Error parsing setup details', e)
      }
    }
  }, [])

  // Action: Handle SSO Login submit
  const handleSsoLogin = (prefillData = null) => {
    setIsLoading(true)
    setLoginError('')
    
    // Simulate API delay
    setTimeout(() => {
      setIsLoading(false)
      
      if (prefillData) {
        // Direct prefill
        setSetupData(prefillData)
        localStorage.setItem('nexora_merchant_setup', JSON.stringify(prefillData))
        setView('dashboard')
        return
      }

      if (!email.trim() || !password.trim()) {
        setLoginError('Vui lòng điền đầy đủ Email và Mật khẩu.')
        return
      }

      // Successful simulated login.
      // If setupData is already present, go directly to Dashboard. Otherwise go to SetupWizard.
      const savedSetup = localStorage.getItem('nexora_merchant_setup')
      if (savedSetup) {
        setView('dashboard')
      } else {
        setView('onboarding')
      }
    }, 1200)
  }

  // Action: Complete onboarding wizard
  const handleWizardComplete = (data) => {
    setSetupData(data)
    setView('dashboard')
  }

  // Action: Simulated log out / Reset onboarding to test again
  const handleResetApp = () => {
    if (confirm('Bạn có muốn xóa dữ liệu đã lưu để thực hiện lại từ đầu quy trình Onboarding Setup Wizard?')) {
      localStorage.removeItem('nexora_merchant_setup')
      setSetupData(null)
      setView('login')
    }
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0B1C30] font-sans antialiased">
      
      {/* 1. LOGIN SSO SCREEN */}
      {view === 'login' && (
        <div className="min-h-screen flex items-center justify-center bg-luxuryBlack relative overflow-hidden text-white px-4 selection:bg-luxuryGold selection:text-black">
          {/* Neon background decorations */}
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[rgba(212,175,55,0.06)] via-transparent to-transparent blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-1/4 right-1/4 w-[450px] h-[450px] bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[rgba(50,215,255,0.04)] via-transparent to-transparent blur-3xl pointer-events-none"></div>

          <div className="w-full max-w-md glass-dark rounded-2xl p-8 border border-[rgba(212,175,55,0.18)] shadow-2xl relative overflow-hidden flex flex-col justify-between">
            {/* VLINKPAY branding logo */}
            <div className="text-center mb-8">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-luxuryGold to-luxuryGoldDark flex items-center justify-center mx-auto shadow-lg shadow-[rgba(212,175,55,0.15)] mb-3">
                <span className="font-serif font-black text-black text-2xl">N</span>
              </div>
              <h2 className="font-serif text-2xl font-bold tracking-wide">
                NEXORA <span className="text-luxuryGold font-sans text-xs tracking-widest font-black uppercase bg-luxuryGold/10 px-2 py-0.5 rounded border border-luxuryGold/30 ml-1.5">TOUCH</span>
              </h2>
              <p className="text-xs text-neutral-400 mt-1">Smart Tip & Google Review Filtration Gateway</p>
            </div>

            {isLoading ? (
              <div className="py-12 flex flex-col items-center justify-center space-y-4">
                <div className="w-10 h-10 border-4 border-luxuryGold/20 border-t-luxuryGold rounded-full animate-spin"></div>
                <p className="text-xs text-luxuryGold font-semibold uppercase tracking-wider animate-pulse">
                  Connecting to VLINKPAY SSO...
                </p>
              </div>
            ) : (
              <div className="space-y-5">
                <div className="p-3 rounded-lg bg-[rgba(212,175,55,0.04)] border border-luxuryGold/20 text-[11px] text-[rgba(243,229,171,0.8)] leading-relaxed">
                  <ShieldCheck className="w-4 h-4 text-luxuryGold inline mr-1.5 shrink-0" />
                  <strong>VLINKPAY SSO Integration:</strong> Bạn sẽ sử dụng tài khoản doanh nghiệp đã đăng ký tại hệ thống thanh toán VLINKPAY để đăng nhập nhanh.
                </div>

                {loginError && (
                  <div className="p-3 rounded-lg bg-red-950/40 border border-red-500/20 text-xs text-red-200">
                    {loginError}
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-luxuryGoldLight uppercase tracking-wider mb-2">SSO Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 w-4 h-4 text-neutral-500" />
                      <input 
                        type="email"
                        placeholder="owner@yourstore.com"
                        className="w-full bg-neutral-900 border border-neutral-800 focus:border-luxuryGold rounded-lg pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none placeholder-neutral-600 transition-colors"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-luxuryGoldLight uppercase tracking-wider mb-2">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 w-4 h-4 text-neutral-500" />
                      <input 
                        type="password"
                        placeholder="••••••••"
                        className="w-full bg-neutral-900 border border-neutral-800 focus:border-luxuryGold rounded-lg pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none placeholder-neutral-600 transition-colors"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => handleSsoLogin()}
                  className="w-full py-2.5 bg-gradient-to-r from-luxuryGold via-luxuryGoldLight to-luxuryGoldDark hover:opacity-90 transition-opacity text-black font-extrabold text-xs uppercase tracking-wider rounded-lg flex items-center justify-center gap-1.5 shadow-[0_4px_14px_rgba(212,175,55,0.2)]"
                >
                  <LogIn className="w-4 h-4 stroke-[3px]" /> Đăng nhập qua VLINKPAY SSO
                </button>

                <div className="relative py-2 text-center">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-neutral-800"></div></div>
                  <span className="relative bg-luxuryBlack px-3 text-[10px] text-neutral-500 font-bold uppercase tracking-wider">Hoặc thử nhanh</span>
                </div>

                {/* Quick login button with prefilled demo data */}
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => {
                      setEmail('owner@goldenglownails.com')
                      setPassword('password123')
                      handleSsoLogin()
                    }}
                    className="py-2 border border-neutral-800 hover:border-neutral-700 bg-neutral-950 text-neutral-300 text-xs font-semibold rounded-lg transition-all"
                  >
                    Mở Form Đăng Ký Mới
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
                          timezone: 'US/Eastern',
                          logo: null
                        },
                        reviewLinks: {
                          googleReview: 'https://g.page/r/cGoldenGlowNails/review',
                          yelpReview: 'https://www.yelp.com/biz/golden-glow-nails-palm-beach',
                          facebookReview: 'https://www.facebook.com/goldenglownails/reviews',
                          feedbackEmail: 'manager@goldenglownails.com'
                        },
                        staffList: [
                          {
                            id: '1',
                            fullName: 'Jane Samantha Miller',
                            nickname: 'Jane M.',
                            position: 'Nail Artist & Stylist',
                            avatar: '',
                            isActive: true,
                            paymentAccounts: { venmo: '@jane-miller-glow', cashapp: '$janeglow', zelle: 'jane.miller@gmail.com', vlinkpay: '' }
                          },
                          {
                            id: '2',
                            fullName: 'David Nguyen',
                            nickname: 'David N.',
                            position: 'Nail Tech Specialist',
                            avatar: '',
                            isActive: true,
                            paymentAccounts: { venmo: '', cashapp: '$davidnails', zelle: '407-555-0199', vlinkpay: 'VLP-8893-DN' }
                          }
                        ],
                        touchPoints: [
                          { id: 'tp-main', name: 'Business Main Lobby QR', type: 'Business Main' },
                          { id: 'tp-front', name: 'Reception Front Desk', type: 'Front Desk' },
                          { id: 'tp-t1', name: 'Service Chair 01', type: 'Table QR' },
                          { id: 'tp-t2', name: 'Service Chair 02', type: 'Table QR' },
                        ]
                      }
                      handleSsoLogin(demoSetup)
                    }}
                    className="py-2 border border-luxuryGold/20 hover:border-luxuryGold text-luxuryGold bg-luxuryGold/5 hover:bg-luxuryGold/10 text-xs font-semibold rounded-lg flex items-center justify-center gap-1 transition-all"
                  >
                    <Sparkles className="w-3 h-3 text-luxuryGold" /> Vào thẳng Dashboard
                  </button>
                </div>
              </div>
            )}
            
            <span className="text-[9px] text-neutral-600 font-medium tracking-wide mt-6 block text-center uppercase">
              VLINKPAY OAuth 2.0 Security Compliance
            </span>
          </div>
        </div>
      )}

      {/* 2. ONBOARDING SETUP WIZARD */}
      {view === 'onboarding' && (
        <SetupWizard onComplete={handleWizardComplete} />
      )}

      {/* 3. OWNER DASHBOARD */}
      {view === 'dashboard' && (
        <div className="relative">
          {/* Quick debug reset onboarding button */}
          <button 
            onClick={handleResetApp}
            className="fixed bottom-4 right-4 z-40 p-2.5 rounded-full bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white shadow-lg hover:rotate-180 transition-all duration-300"
            title="Reset ứng dụng (Đăng ký lại)"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          
          <Dashboard setupData={setupData} />
        </div>
      )}

    </div>
  )
}
