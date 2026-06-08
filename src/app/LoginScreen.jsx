import React, { useState } from 'react'
import { ShieldCheck, LogIn, Lock, Mail, Sparkles, Eye, EyeOff } from 'lucide-react'

export default function LoginScreen({
  email,
  setEmail,
  password,
  setPassword,
  loginError,
  isLoading,
  currentLanguage,
  setLanguage,
  t,
  onLoginSubmit,
  onTriggerSimulation,
  onQuickDemoLogin,
  setStaffInviteData,
  setView,
  setLoggedInStaffId,
  isDemoToolsEnabled = false,
}) {
  const [showPassword, setShowPassword] = useState(false)
  return (
    <div className="min-h-dvh flex items-center justify-center bg-nexoraCanvas relative overflow-x-hidden overflow-y-auto text-nexoraText px-4 py-6 sm:py-10 selection:bg-nexoraBrandSoft selection:text-nexoraBrand">
      {/* Soft background decorations */}
      <div className="absolute top-1/4 left-1/4 h-56 w-56 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[rgba(66,72,216,0.05)] via-transparent to-transparent blur-3xl pointer-events-none sm:h-96 sm:w-96"></div>
      <div className="absolute bottom-1/4 right-1/4 h-64 w-64 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[rgba(43,89,255,0.03)] via-transparent to-transparent blur-3xl pointer-events-none sm:h-96 sm:w-96"></div>

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
            <form onSubmit={(e) => { e.preventDefault(); onLoginSubmit(); }} className="space-y-5">
              <div className="p-3 rounded-lg bg-nexoraBrandSoft/40 border border-nexoraBrandSoft text-[11px] text-nexoraText leading-relaxed">
                <ShieldCheck className="w-4 h-4 text-nexoraBrand inline mr-1.5 shrink-0" />
                <strong>{t('login.sso_integration_title')}</strong> {t('login.sso_integration_desc')}
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
                      className="w-full bg-nexoraCanvas border border-nexoraBorder focus:border-nexoraBrand focus:bg-white rounded-lg pl-10 pr-4 py-2.5 text-sm text-nexoraText focus:outline-none placeholder-nexoraSubtle transition-all"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-[10px] font-bold text-nexoraText uppercase tracking-wider">{t('login.password_label')}</label>
                    <button
                      type="button"
                      onClick={() => setView('forgot-password')}
                      className="text-[10px] font-bold text-nexoraBrand hover:underline focus:outline-none transition-all"
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 w-4 h-4 text-nexoraSubtle" />
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder={t('login.password_placeholder')}
                      className="w-full bg-nexoraCanvas border border-nexoraBorder focus:border-nexoraBrand focus:bg-white rounded-lg pl-10 pr-10 py-2.5 text-sm text-nexoraText focus:outline-none placeholder-nexoraSubtle transition-all"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-nexoraSubtle hover:text-nexoraText focus:outline-none"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full min-h-11 py-2.5 bg-gradient-to-r from-nexoraElectric to-nexoraViolet hover:opacity-90 transition-opacity text-white font-extrabold text-xs uppercase tracking-wider rounded-lg flex items-center justify-center gap-1.5 shadow-[0_4px_14px_rgba(43,89,255,0.25)]"
              >
                <LogIn className="w-4 h-4 stroke-[3px]" /> {t('login.login_btn')}
              </button>

              {isDemoToolsEnabled && (
                <div className="relative py-2 text-center">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-nexoraBorder"></div></div>
                  <span className="relative bg-white px-3 text-[10px] text-nexoraSubtle font-bold uppercase tracking-wider">{t('login.or_try_demo')}</span>
                </div>
              )}

              {/* Quick login / registration options */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => onTriggerSimulation('new_register')}
                  className="min-h-11 py-2 border border-nexoraBorder hover:border-nexoraBorder/80 bg-nexoraCanvas text-nexoraText text-xs font-semibold rounded-lg transition-all"
                >
                  {t('login.register_btn')}
                </button>

                {isDemoToolsEnabled && (
                  <button
                    type="button"
                    onClick={() => {
                      // Prefill and login directly to Dashboard
                      const demoSetup = {
                      businessInfo: {
                        name: 'Demo Nail Spa',
                        industry: 'Nail Salon',
                        address: '123 Demo Street, Suite 100',
                        phone: '',
                        website: '',
                        logo: null,
                        paymentAccounts: {
                          venmo: '',
                          cashapp: '',
                          zelle: '',
                          vlinkpay: ''
                        }
                      },
                      reviewLinks: {
                        googleReview: '',
                        yelpReview: '',
                        facebookReview: '',
                        feedbackEmail: ''
                      },
                      staffList: [],
                      touchPoints: [
                        { id: 'tp-main', name: 'Business Main Lobby QR', type: 'Business Main' },
                        { id: 'tp-front', name: 'Reception Front Desk', type: 'Front Desk' },
                      ]
                      }
                      onQuickDemoLogin(demoSetup)
                    }}
                    className="min-h-11 py-2 border border-nexoraBrand/20 hover:border-nexoraBrand text-nexoraBrand bg-nexoraBrandSoft/40 hover:bg-nexoraBrandSoft text-xs font-semibold rounded-lg flex items-center justify-center gap-1 transition-all"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-nexoraBrand" /> {t('login.enter_dashboard_btn')}
                  </button>
                )}
              </div>
            </form>
          )}

          <span className="text-[9px] text-nexoraSubtle font-medium tracking-wide mt-6 block text-center uppercase">
            {t('login.sso_security_footer')}
          </span>
        </div>


      </div>
    </div>
  )
}
