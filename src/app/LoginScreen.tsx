import React, { useState } from 'react'
import { Lock, Mail, Eye, EyeOff } from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'
import AuthGraphicPanel from '../components/auth/AuthGraphicPanel'
import SecondaryButton from '../components/ui/SecondaryButton'
import { useAuth } from '../auth/useAuth'
import { useTranslation } from '../contexts/LanguageContext'
import { getErrorI18nKey } from '../data/errorCodes'
import { getApiErrorCode } from '../types/domain'

function GoogleIcon() {
  return (
    <svg viewBox="0 0 18 18" aria-hidden="true" className="h-4 w-4">
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.91c1.7-1.57 2.69-3.88 2.69-6.62Z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.91-2.26c-.81.54-1.84.86-3.05.86-2.35 0-4.33-1.58-5.04-3.71H.96v2.33A9 9 0 0 0 9 18Z" />
      <path fill="#FBBC05" d="M3.96 10.71A5.41 5.41 0 0 1 3.68 9c0-.59.1-1.16.28-1.71V4.96H.96A9 9 0 0 0 0 9c0 1.45.35 2.82.96 4.04l3-2.33Z" />
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.34l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.96l3 2.33C4.67 5.16 6.65 3.58 9 3.58Z" />
    </svg>
  )
}

function AppleBrandIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-current">
      <path d="M16.37 1.43c0 1.12-.42 2.13-1.25 3.03-.99 1.05-2.1 1.66-3.32 1.56-.15-1.08.43-2.24 1.23-3.08.88-.92 2.39-1.62 3.37-1.67.02.04.02.08.02.16ZM20.49 17.37c-.53 1.22-.79 1.77-1.47 2.85-.95 1.47-2.29 3.3-3.95 3.32-1.47.02-1.85-.96-3.86-.95-2 .01-2.42.98-3.89.95-1.66-.03-2.93-1.67-3.88-3.14-2.66-4.12-2.94-8.95-1.3-11.51 1.16-1.81 3-2.87 4.74-2.87 1.77 0 2.89.98 4.35.98 1.42 0 2.28-.98 4.32-.98 1.54 0 3.17.84 4.33 2.28-3.81 2.09-3.19 7.52.61 9.07Z" />
    </svg>
  )
}

export default function LoginScreen() {
  const { currentLanguage, setLanguage, t } = useTranslation()
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState(location.state?.loginError || '')
  const [fieldErrorKeys, setFieldErrorKeys] = useState<{ email?: string; password?: string }>({})
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleLoginSubmit = () => {
    const newFieldErrorKeys: { email?: string; password?: string } = {}
    if (!email.trim()) {
      newFieldErrorKeys.email = 'register.errors.email_required'
    } else if (!/^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/.test(email.trim())) {
      newFieldErrorKeys.email = 'register.errors.email_invalid'
    }
    if (!password) {
      newFieldErrorKeys.password = 'register.errors.password_required'
    } else if (password.length < 6) {
      newFieldErrorKeys.password = 'register.errors.password_short'
    }
    if (Object.keys(newFieldErrorKeys).length > 0) {
      setFieldErrorKeys(newFieldErrorKeys)
      setLoginError('')
      return
    }
    setFieldErrorKeys({})
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
        // Onboarding completion is independent of KYB/verification status.
        // A business that finished onboarding but hasn't done KYB has
        // verificationStatus 'basic'/'unverified' — that must NOT force the
        // onboarding wizard (KYB has its own gate). Rely only on the real
        // onboarding signal (hasCompletedOnboarding, derived from account
        // status Active / kyb_approved / explicit flag in apiAuthAdapter).
        const needsOnboarding =
          newSession.clearMerchantSetup ||
          newSession.hasCompletedOnboarding === false

        // Staff dashboard requires BOTH: a real StaffProfile (accepted invite)
        // AND persisted onboarding data on the backend. Otherwise the user
        // must finish registration/onboarding first.
        const isStaffReady =
          Boolean(newSession.staffId) ||
          (newSession.hasStaffProfile && newSession.hasCompletedOnboarding)

        if ((newSession.role === 'personal' || newSession.role === 'staff') && !isStaffReady) {
          navigate('/register', { state: { showPersonalSuccessPopup: true, ssoEmail: newSession.email } })
        } else if (newSession.flag === '!personal' || newSession.role === 'personal' || newSession.role === 'staff') {
          navigate('/staff')
        } else if (needsOnboarding) {
          navigate('/onboarding')
        } else {
          navigate('/dashboard')
        }
      } catch (err: unknown) {
        const errorCode = getApiErrorCode(err, 'unknown_error')
        const i18nKey = getErrorI18nKey(errorCode)
        setLoginError(t(i18nKey))
      }
    }, 800)
  }

  const triggerSimulation = (scenario) => {
    setLoginError('')
    if (scenario === 'new_register') {
      navigate('/register')
    } else if (scenario === 'staff_portal') {
      navigate('/invite', { state: { biz: '' } })
    } else if (scenario === 'staff_dashboard') {
      navigate('/staff')
    }
  }

  return (
    <div className="min-h-dvh flex items-center justify-center bg-nexoraCanvas relative overflow-x-hidden overflow-y-auto text-nexoraText px-4 py-6 sm:py-10 selection:bg-nexoraBrandSoft selection:text-nexoraBrand">
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

      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-0 items-stretch relative z-10 overflow-hidden rounded-xl border border-nexoraBorder bg-white shadow-premium lg:min-h-[680px]">

        {/* Left Column: Login Card */}
        <div className="lg:col-span-5 flex flex-col justify-between p-5 sm:p-8 xl:p-10 relative overflow-hidden">
          {/* VLINKPAY branding logo */}
          <div className="mb-8 flex items-center gap-3">
            <img src="/assets/nexora-logo.png" alt="Nexora Logo" className="w-11 h-11 object-contain" />
            <div>
              <h2 className="font-sans text-xl font-bold tracking-wide sm:text-2xl">
                NEXORA <span className="ml-1.5 inline-flex align-middle text-nexoraBrand font-sans text-xs tracking-widest font-black uppercase bg-nexoraBrand/10 px-2 py-0.5 rounded border border-nexoraBrand/30">TOUCH</span>
              </h2>
              <p className="text-xs text-nexoraMuted mt-1">{t('login.gateway_sub')}</p>
            </div>
          </div>

          {isLoading ? (
            <div className="py-16 flex flex-col items-center justify-center space-y-4">
              <div className="w-10 h-10 border-4 border-nexoraBrand/20 border-t-nexoraBrand rounded-full animate-spin"></div>
              <p className="text-xs text-nexoraBrand font-semibold uppercase tracking-wider animate-pulse">
                {t('login.connecting_sso')}
              </p>
            </div>
          ) : (
            <form onSubmit={(e) => { e.preventDefault(); handleLoginSubmit(); }} className="space-y-5">
              <div className="space-y-1">
                <p className="text-[11px] font-black uppercase tracking-wider text-nexoraBrand">{t('login.secure_access')}</p>
                <h1 className="text-2xl font-black text-nexoraText sm:text-3xl">{t('login.sign_in_title')}</h1>
              </div>

              {loginError && (
                <div className="p-3 rounded-lg bg-nexoraDanger/10 border border-nexoraDanger/20 text-xs text-nexoraDanger">
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
                      className={`w-full bg-nexoraCanvas border ${fieldErrorKeys.email ? 'border-red-300 focus:border-red-500' : 'border-nexoraBorder focus:border-nexoraBrand focus:bg-white'} rounded-lg pl-10 pr-4 py-2.5 text-sm text-nexoraText focus:outline-none placeholder-nexoraSubtle transition-all`}
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value)
                        if (fieldErrorKeys.email) setFieldErrorKeys(prev => ({ ...prev, email: undefined }))
                      }}
                    />
                  </div>
                  {fieldErrorKeys.email && <span className="text-xs text-nexoraDanger mt-1 block">{t(fieldErrorKeys.email)}</span>}
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-[10px] font-bold text-nexoraText uppercase tracking-wider">{t('login.password_label')}</label>
                    <button
                      type="button"
                      onClick={() => navigate('/forgot-password')}
                      className="text-[10px] font-bold text-nexoraBrand hover:underline focus:outline-none transition-all"
                    >
                      {t('login.forgot_password')}
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 w-4 h-4 text-nexoraSubtle" />
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder={t('login.password_placeholder')}
                      className={`w-full bg-nexoraCanvas border ${fieldErrorKeys.password ? 'border-red-300 focus:border-red-500' : 'border-nexoraBorder focus:border-nexoraBrand focus:bg-white'} rounded-lg pl-10 pr-10 py-2.5 text-sm text-nexoraText focus:outline-none placeholder-nexoraSubtle transition-all`}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value)
                        if (fieldErrorKeys.password) setFieldErrorKeys(prev => ({ ...prev, password: undefined }))
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-nexoraSubtle hover:text-nexoraText focus:outline-none"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {fieldErrorKeys.password && <span className="text-xs text-nexoraDanger mt-1 block">{t(fieldErrorKeys.password)}</span>}
                </div>
              </div>

              <button
                type="submit"
                className="w-full min-h-11 py-2.5 bg-gradient-to-r from-nexoraElectric to-nexoraViolet hover:opacity-90 transition-opacity text-white font-extrabold text-xs uppercase tracking-wider rounded-lg flex items-center justify-center gap-1.5 shadow-[0_4px_14px_rgba(43,89,255,0.25)]"
              >
                {t('login.login_btn')}
              </button>

              <div className="relative hidden py-1 text-center sm:block">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-nexoraBorder"></div></div>
                <span className="relative bg-white px-3 text-[10px] text-nexoraSubtle font-bold uppercase tracking-wider">{t('login.social_auth_divider')}</span>
              </div>

              <div className="flex items-center justify-center gap-3 sm:grid sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => triggerSimulation('sso_with_kyb')}
                  aria-label={t('login.continue_google')}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-nexoraBorder bg-white p-0 text-xs font-bold text-nexoraText shadow-nexora-card transition-all hover:border-nexoraBrand hover:bg-nexoraCanvas sm:min-h-11 sm:w-auto sm:rounded-lg sm:px-4 sm:py-2 sm:shadow-none"
                >
                  <span className="flex items-center justify-center gap-2">
                    <GoogleIcon />
                    <span className="hidden sm:inline">{t('login.continue_google')}</span>
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => triggerSimulation('sso_with_kyb')}
                  aria-label={t('login.continue_apple')}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-nexoraBorder bg-white p-0 text-xs font-bold text-nexoraText shadow-nexora-card transition-all hover:border-nexoraBrand hover:bg-nexoraCanvas sm:min-h-11 sm:w-auto sm:rounded-lg sm:px-4 sm:py-2 sm:shadow-none"
                >
                  <span className="flex items-center justify-center gap-2">
                    <AppleBrandIcon />
                    <span className="hidden sm:inline">{t('login.continue_apple')}</span>
                  </span>
                </button>
              </div>

              {/* Quick login / registration options */}
              <div className="grid grid-cols-1 gap-3">
                <SecondaryButton onClick={() => triggerSimulation('new_register')}>
                  {t('login.register_btn')}
                </SecondaryButton>
              </div>
            </form>
          )}

        </div>

        <div className="hidden p-3 lg:col-span-7 lg:block">
          <AuthGraphicPanel />
        </div>

      </div>
    </div>
  )
}
