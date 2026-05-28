import React, { useState } from 'react'
import { 
  Mail, Lock, Eye, EyeOff, ShieldCheck, Check, 
  CheckCircle2, ArrowRight, ArrowLeft, Building2, 
  Globe, Landmark, FileText, Sparkles, CheckSquare
} from 'lucide-react'
import { useTranslation } from '../contexts/LanguageContext'

export default function RegisterWizard({ ssoEmail, onBackToLogin, onRegisterSuccess, onRegisterAndLogin, onKybSuccess, isRedirectedFromSession }) {
  const { t, currentLanguage, setLanguage } = useTranslation()
  const [currentStep, setCurrentStep] = useState(1) // 1, 2

  // Step 1 states
  const [email, setEmail] = useState(ssoEmail || '')
  const [confirmEmail, setConfirmEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [referralCode, setReferralCode] = useState('')
  
  // Validation errors
  const [errors, setErrors] = useState({})
  
  // Simulation states
  const [simulationStatus, setSimulationStatus] = useState(null) // 'success' or null

  // Handle Step 1 Submit
  const handleStep1Next = (e) => {
    e.preventDefault()
    const newErrors = {}

    if (!email.trim()) {
      newErrors.email = t('register.errors.email_required')
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = t('register.errors.email_invalid')
    }

    if (!confirmEmail.trim()) {
      newErrors.confirmEmail = t('register.errors.confirm_email_required')
    } else if (confirmEmail.trim().toLowerCase() !== email.trim().toLowerCase()) {
      newErrors.confirmEmail = t('register.errors.email_mismatch')
    }

    if (!password) {
      newErrors.password = t('register.errors.password_required')
    } else if (password.length < 6) {
      newErrors.password = t('register.errors.password_short')
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setErrors({})
    
    // Register account in local persistence as unverified
    const pendingAccounts = JSON.parse(localStorage.getItem('nexora_pending_accounts') || '[]')
    const newAccount = {
      email: email.trim().toLowerCase(),
      password: password,
      referralCode: referralCode.trim(),
      isVerified: false,
      kybDetails: null
    }
    
    const filtered = pendingAccounts.filter(acc => acc.email !== newAccount.email)
    filtered.push(newAccount)
    localStorage.setItem('nexora_pending_accounts', JSON.stringify(filtered))

    if (onRegisterAndLogin) {
      onRegisterAndLogin(email.trim().toLowerCase())
    } else {
      setCurrentStep(2)
    }
  }

  // Action: Simulate Admin Verification instantly
  const handleSimulateVerify = () => {
    const pendingAccounts = JSON.parse(localStorage.getItem('nexora_pending_accounts') || '[]')
    const updated = pendingAccounts.map(acc => {
      if (acc.email === email.trim().toLowerCase()) {
        return { 
          ...acc, 
          isVerified: true,
          kybDetails: {
            legalName: 'Golden Glow Nails LLC',
            taxId: 'XX-XXXXXXX',
            businessType: 'LLC',
            ownerName: 'Elena Rostova',
            bankName: 'Chase Bank',
            bankAccount: '1234567890',
            bankRouting: '021000021'
          }
        }
      }
      return acc
    })
    localStorage.setItem('nexora_pending_accounts', JSON.stringify(updated))
    setSimulationStatus('success')
    
    if (isRedirectedFromSession && onKybSuccess) {
      onKybSuccess(email.trim().toLowerCase())
    }
  }

  // Helper for steps naming
  const getStepName = (step) => {
    switch (step) {
      case 1: return currentLanguage === 'vi' ? 'Thông tin đăng ký' : 'Account Details'
      case 2: return currentLanguage === 'vi' ? 'Hoàn tất đăng ký' : 'Registration Success'
      default: return ''
    }
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0B1C30] font-sans antialiased relative overflow-x-hidden selection:bg-nexoraBrandSoft selection:text-nexoraBrand">
      {/* Background decorations */}
      <div className="absolute top-1/4 left-1/4 h-56 w-56 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[rgba(66,72,216,0.04)] via-transparent to-transparent blur-3xl pointer-events-none sm:h-96 sm:w-96"></div>
      <div className="absolute bottom-1/4 right-1/4 h-64 w-64 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[rgba(43,89,255,0.02)] via-transparent to-transparent blur-3xl pointer-events-none sm:h-[450px] sm:w-[450px]"></div>

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

      <div className="max-w-4xl mx-auto px-4 py-8 relative z-10 flex flex-col justify-center min-h-screen">
        {/* Branding header */}
        <div className="text-center mb-6">
          <img src="/assets/nexora-logo.png" alt="Nexora Logo" className="w-12 h-12 mx-auto object-contain mb-2 shadow-sm" />
          <h2 className="font-sans text-xl font-bold tracking-wide sm:text-2xl text-nexoraText">
            NEXORA <span className="ml-1.5 inline-flex align-middle text-nexoraBrand font-sans text-xs tracking-widest font-black uppercase bg-nexoraBrand/10 px-2 py-0.5 rounded border border-nexoraBrand/30">TOUCH</span>
          </h2>
          <p className="text-xs text-nexoraSubtle font-light tracking-wide mt-1">Cổng đăng ký Merchant Nexora & VLINKPAY KYB</p>
        </div>

        {/* Wizard Steps indicator */}
        <div className="max-w-md mx-auto w-full mb-8">
          <div className="relative flex items-center justify-between">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-[2px] bg-nexoraBorder -z-10"></div>
            <div 
              className="absolute left-0 top-1/2 -translate-y-1/2 h-[2px] bg-nexoraBrand -z-10 transition-all duration-500"
              style={{ width: `${((currentStep - 1) / 1) * 100}%` }}
            ></div>

            {[1, 2].map((step) => {
              const isActive = step === currentStep
              const isCompleted = step < currentStep
              return (
                <div key={step} className="flex flex-col items-center">
                  <div 
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 border-2 font-bold text-xs
                      ${isActive 
                        ? 'bg-white border-nexoraBrand text-nexoraBrand shadow-[0_2px_8px_rgba(70,72,216,0.15)] scale-110' 
                        : isCompleted
                          ? 'bg-nexoraBrand border-nexoraBrand text-white'
                          : 'bg-white border-nexoraBorder text-nexoraSubtle'
                      }`}
                  >
                    {isCompleted ? <Check className="w-4 h-4 stroke-[3px]" /> : step}
                  </div>
                  <span className={`mt-1.5 text-[9px] font-bold tracking-wide transition-colors duration-300
                    ${isActive ? 'text-nexoraBrand' : isCompleted ? 'text-nexoraText' : 'text-nexoraSubtle'}`}>
                    {getStepName(step)}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Main Card container */}
        <div className="bg-white rounded-2xl border border-nexoraBorder shadow-premium overflow-hidden transition-all duration-500">
          
          {/* STEP 1: Registration Form */}
          {currentStep === 1 && (
            <div className="p-6 sm:p-10 space-y-6">
              <div>
                <h3 className="text-lg font-bold text-nexoraText">{t('register.title_step_1')}</h3>
                <p className="text-xs text-nexoraSubtle mt-1">{t('register.desc_step_1')}</p>
              </div>

              <form onSubmit={handleStep1Next} className="space-y-4 max-w-md mx-auto">
                {/* Email Input */}
                <div>
                  <label className="block text-[10px] font-bold text-nexoraText uppercase tracking-wider mb-2">
                    {t('register.email_label')}
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 w-4 h-4 text-nexoraSubtle" />
                    <input 
                      type="email"
                      placeholder={t('register.email_placeholder')}
                      disabled={!!ssoEmail}
                      className={`w-full bg-nexoraCanvas border ${errors.email ? 'border-red-300' : 'border-nexoraBorder'} ${ssoEmail ? 'bg-blue-50/50 text-nexoraSubtle' : 'focus:bg-white focus:border-nexoraBrand'} rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none transition-all`}
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value)
                        if (errors.email) setErrors({ ...errors, email: '' })
                      }}
                    />
                  </div>
                  {errors.email && <span className="text-xs text-red-500 mt-1 block">{errors.email}</span>}
                </div>

                {/* Confirm Email Input */}
                <div>
                  <label className="block text-[10px] font-bold text-nexoraText uppercase tracking-wider mb-2">
                    {t('register.confirm_email_label')}
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 w-4 h-4 text-nexoraSubtle" />
                    <input 
                      type="email"
                      placeholder={t('register.confirm_email_placeholder')}
                      className={`w-full bg-nexoraCanvas border ${errors.confirmEmail ? 'border-red-300 focus:border-red-500' : 'border-nexoraBorder focus:border-nexoraBrand focus:bg-white'} rounded-lg pl-10 pr-4 py-2.5 text-sm text-nexoraText focus:outline-none transition-all`}
                      value={confirmEmail}
                      onChange={(e) => {
                        setConfirmEmail(e.target.value)
                        if (errors.confirmEmail) setErrors({ ...errors, confirmEmail: '' })
                      }}
                    />
                  </div>
                  {errors.confirmEmail && <span className="text-xs text-red-500 mt-1 block">{errors.confirmEmail}</span>}
                </div>

                {/* Password Input */}
                <div>
                  <label className="block text-[10px] font-bold text-nexoraText uppercase tracking-wider mb-2">
                    {t('register.password_label')}
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 w-4 h-4 text-nexoraSubtle" />
                    <input 
                      type={showPassword ? "text" : "password"}
                      placeholder={t('register.password_placeholder')}
                      className={`w-full bg-nexoraCanvas border ${errors.password ? 'border-red-300 focus:border-red-500' : 'border-nexoraBorder focus:border-nexoraBrand focus:bg-white'} rounded-lg pl-10 pr-12 py-2.5 text-sm text-nexoraText focus:outline-none transition-all`}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value)
                        if (errors.password) setErrors({ ...errors, password: '' })
                      }}
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-nexoraSubtle hover:text-nexoraText transition"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.password && <span className="text-xs text-red-500 mt-1 block">{errors.password}</span>}
                </div>

                {/* Referral Code Input */}
                <div>
                  <label className="block text-[10px] font-bold text-nexoraText uppercase tracking-wider mb-2">
                    {t('register.referral_code_label')}
                  </label>
                  <input 
                    type="text"
                    placeholder={t('register.referral_code_placeholder')}
                    className="w-full bg-nexoraCanvas border border-nexoraBorder focus:border-nexoraBrand focus:bg-white rounded-lg px-4 py-2.5 text-sm text-nexoraText focus:outline-none transition-all"
                    value={referralCode}
                    onChange={(e) => setReferralCode(e.target.value)}
                  />
                </div>

                <div className="pt-4 flex flex-col sm:flex-row gap-3">
                  <button 
                    type="button"
                    onClick={onBackToLogin}
                    className="w-full min-h-11 py-2.5 border border-nexoraBorder hover:bg-nexoraCanvas text-nexoraSubtle hover:text-nexoraText font-semibold text-xs uppercase tracking-wider rounded-lg flex items-center justify-center gap-1.5 transition-all"
                  >
                    <ArrowLeft className="w-4 h-4" /> {t('common.back')}
                  </button>
                  <button 
                    type="submit"
                    className="w-full min-h-11 py-2.5 bg-gradient-to-r from-[#2B59FF] to-[#8E4DF8] hover:opacity-90 text-white font-extrabold text-xs uppercase tracking-wider rounded-lg flex items-center justify-center gap-1.5 shadow-[0_4px_12px_rgba(43,89,255,0.25)] transition-all"
                  >
                    {t('common.next')} <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* STEP 2: Registration Success */}
          {currentStep === 2 && (
            <div className="p-6 sm:p-10 space-y-6 text-center">
              <div className="w-16 h-16 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-full flex items-center justify-center mx-auto animate-pulse">
                <Sparkles className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-bold text-nexoraText">
                  {currentLanguage === 'vi' ? 'Đăng ký tài khoản thành công!' : 'Account Registered Successfully!'}
                </h3>
                <p className="text-xs text-nexoraSubtle max-w-lg mx-auto">
                  {currentLanguage === 'vi'
                    ? 'Tài khoản của bạn đã được đăng ký thành công. Để bắt đầu nhận tiền trực tiếp và thiết lập nhân viên, vui lòng hoàn tất xác thực KYB trong mục Cài đặt > KYB sau khi đăng nhập.'
                    : 'Your merchant account has been registered. To unlock all direct settlement channels and configure your team, please complete KYB verification under Settings > KYB in your Dashboard.'
                  }
                </p>
              </div>

              {/* Status Indicator */}
              <div className="max-w-md mx-auto p-4 rounded-xl border border-yellow-200 bg-yellow-50/60 flex flex-col items-center justify-center space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-yellow-500 animate-ping"></span>
                  <span className="text-xs font-extrabold text-yellow-700 uppercase tracking-wider">
                    {currentLanguage === 'vi' ? 'CHƯA XÁC THỰC KYB' : 'KYB PENDING'}
                  </span>
                </div>
                <p className="text-[11px] text-yellow-800 leading-relaxed max-w-sm">
                  {currentLanguage === 'vi'
                    ? 'Bạn có thể đăng nhập vào Dashboard để xem thử giao diện và cấu hình thợ, nhưng các tính năng thanh toán trực tiếp sẽ bị khóa cho đến khi được duyệt.'
                    : 'You can log in to the Dashboard to explore the interface, but active transaction routing will remain locked until KYB is approved.'
                  }
                </p>
              </div>

              {/* Info summary */}
              <div className="max-w-md mx-auto bg-slate-50 border border-slate-200 rounded-xl p-4 text-left text-xs space-y-2.5">
                <h4 className="font-extrabold text-slate-800 border-b border-slate-200 pb-1.5 uppercase text-[10px] tracking-wider">
                  {currentLanguage === 'vi' ? 'Thông tin đăng ký của bạn' : 'Registered Merchant Summary'}
                </h4>
                <div className="grid grid-cols-3 gap-y-1.5 text-slate-600">
                  <span className="font-semibold">{currentLanguage === 'vi' ? 'Email tài khoản:' : 'Account Email:'}</span>
                  <span className="col-span-2 font-mono break-all text-slate-800">{email}</span>

                  {referralCode && (
                    <>
                      <span className="font-semibold">{currentLanguage === 'vi' ? 'Mã giới thiệu:' : 'Referral Code:'}</span>
                      <span className="col-span-2 text-slate-800 font-mono">{referralCode}</span>
                    </>
                  )}
                </div>
              </div>

              {simulationStatus === 'success' && (
                <div className="max-w-md mx-auto p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-medium">
                  {currentLanguage === 'vi'
                    ? 'MÔ PHỎNG: Kích hoạt KYB tài khoản thành công! Bây giờ bạn có thể đăng nhập.'
                    : 'SIMULATION: Account KYB verified successfully! You can now log in.'
                  }
                </div>
              )}

              {/* Simulation Admin Verification Panel */}
              <div className="max-w-md mx-auto p-4 rounded-xl border border-dashed border-nexoraBrand/40 bg-nexoraBrandSoft/20 space-y-3">
                <div className="flex items-center justify-center gap-1.5 text-xs text-nexoraBrand font-bold">
                  <CheckSquare className="w-4 h-4" /> SIMULATION DEPLOYMENT CONTROLS
                </div>
                <p className="text-[10px] text-nexoraSubtle leading-relaxed">
                  {currentLanguage === 'vi' 
                    ? 'Nhấp vào nút dưới đây để mô phỏng Admin VLINKPAY kích hoạt hồ sơ KYB của bạn ngay lập tức. Sau đó bạn có thể đăng nhập.'
                    : 'Click below to simulate VLINKPAY instantly verifying your KYB application, allowing direct dashboard login.'
                  }
                </p>
                <button 
                  onClick={handleSimulateVerify}
                  className="w-full py-2 bg-nexoraBrand hover:bg-nexoraBrandDark text-white text-xs font-extrabold uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <CheckCircle2 className="w-4 h-4" /> {t('register.simulate_verify_btn')}
                </button>
              </div>

              <div className="pt-6">
                <button 
                  onClick={onBackToLogin}
                  className="px-6 py-2.5 border border-nexoraBorder hover:bg-nexoraCanvas text-nexoraSubtle hover:text-nexoraText font-semibold text-xs uppercase tracking-wider rounded-lg transition-all"
                >
                  {t('register.back_to_login')}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
