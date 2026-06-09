import React, { useState } from 'react'
import { Mail, ArrowLeft, Send } from 'lucide-react'
import { useTranslation } from '../contexts/LanguageContext'
import apiAuthAdapter from '../auth/adapters/apiAuthAdapter'
import { getErrorI18nKey } from '../data/errorCodes'

export default function ForgotPassword({ setView }) {
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email.trim()) {
      setError(t('register.errors.email_required'))
      return
    }

    setIsLoading(true)
    setError('')
    try {
      await apiAuthAdapter.forgotPassword({ email: email.trim().toLowerCase() })
      setIsSubmitted(true)
    } catch (err) {
      const errorCode = err?.errorCode || 'unknown_error'
      const i18nKey = getErrorI18nKey(errorCode)
      setError(t(i18nKey))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-dvh flex items-center justify-center bg-nexoraCanvas text-nexoraText font-sans p-4 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-1/4 left-1/4 h-56 w-56 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[rgba(66,72,216,0.04)] via-transparent to-transparent blur-3xl pointer-events-none sm:h-96 sm:w-96"></div>
      <div className="absolute bottom-1/4 right-1/4 h-64 w-64 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[rgba(43,89,255,0.02)] via-transparent to-transparent blur-3xl pointer-events-none sm:h-[450px] sm:w-[450px]"></div>

      <div className="max-w-md w-full bg-white rounded-2xl border border-nexoraBorder shadow-premium p-6 sm:p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[rgba(70,72,216,0.03)] via-transparent to-transparent rounded-full pointer-events-none"></div>

        <div className="text-center mb-6">
          <h2 className="font-sans text-xl font-bold tracking-wide sm:text-2xl">
            Reset Password
          </h2>
          <p className="text-xs text-nexoraSubtle mt-1.5 leading-relaxed">
            Enter your email address and we'll send you a link to reset your password.
          </p>
        </div>

        {isSubmitted ? (
          <div className="space-y-6 text-center">
            <div className="p-4 bg-green-50 text-green-800 text-xs rounded-xl border border-green-200 leading-relaxed">
              If an account is registered with <span className="font-semibold">{email}</span>, you will receive a password reset link shortly. Please check your inbox and spam folder.
            </div>

            <button
              onClick={() => setView('login')}
              className="w-full min-h-11 py-2.5 border border-nexoraBorder hover:bg-nexoraCanvas text-nexoraSubtle hover:text-nexoraText font-semibold text-xs uppercase tracking-wider rounded-lg flex items-center justify-center gap-1.5 transition-all"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Sign In
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200 text-center font-medium">
                {error}
              </div>
            )}

            <div>
              <label className="block text-[10px] font-bold text-nexoraText uppercase tracking-wider mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-4 h-4 text-nexoraSubtle" />
                <input
                  type="email"
                  placeholder={t('components.ForgotPassword.phExampleEmail')}
                  className="w-full bg-nexoraCanvas border border-nexoraBorder focus:border-nexoraBrand focus:bg-white rounded-lg pl-10 pr-4 py-2.5 text-sm text-nexoraText focus:outline-none placeholder-nexoraSubtle transition-all"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="pt-2 space-y-3">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full min-h-11 py-2.5 bg-gradient-to-r from-nexoraElectric to-nexoraViolet hover:opacity-90 disabled:opacity-50 text-white font-extrabold text-xs uppercase tracking-wider rounded-lg flex items-center justify-center gap-1.5 shadow-[0_4px_12px_rgba(43,89,255,0.25)] transition-all"
              >
                <Send className="w-4 h-4" />
                Send Reset Link
              </button>

              <button
                type="button"
                onClick={() => setView('login')}
                className="w-full min-h-11 py-2.5 border border-nexoraBorder hover:bg-nexoraCanvas text-nexoraSubtle hover:text-nexoraText font-semibold text-xs uppercase tracking-wider rounded-lg flex items-center justify-center gap-1.5 transition-all"
              >
                <ArrowLeft className="w-4 h-4" /> Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
