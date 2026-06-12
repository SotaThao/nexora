import React, { useState, useEffect } from 'react'
import { Lock, Eye, EyeOff, CheckCircle, ArrowLeft } from 'lucide-react'
import { useTranslation } from '../contexts/LanguageContext'
import { useNavigate, useSearchParams } from 'react-router-dom'
import apiAuthAdapter from '../auth/adapters/apiAuthAdapter'
import { getErrorI18nKey } from '../data/errorCodes'

export default function ResetPassword() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [token, setToken] = useState('')
  const [email, setEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const urlToken = searchParams.get('token')
    const urlEmail = searchParams.get('email')
    if (urlToken) setToken(urlToken)
    if (urlEmail) setEmail(urlEmail)
  }, [searchParams])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!token.trim()) {
      setError('Reset token is required')
      return
    }
    if (!email.trim()) {
      setError(t('register.errors.email_required'))
      return
    }
    if (!newPassword) {
      setError(t('register.errors.password_required'))
      return
    }
    if (newPassword.length < 6) {
      setError(t('register.errors.password_short'))
      return
    }
    if (newPassword !== confirmPassword) {
      setError(t('register.errors.email_mismatch'))
      return
    }

    setIsLoading(true)
    setError('')
    try {
      await apiAuthAdapter.resetPassword({
        token: token.trim(),
        email: email.trim().toLowerCase(),
        newPassword,
        confirmPassword
      })
      setIsSuccess(true)
      setTimeout(() => {
        navigate('/login')
      }, 2500)
    } catch (err) {
      const errorCode = (err as any)?.errorCode || 'unknown_error'
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
            {t('components.ResetPassword.chooseNewPassword')}
          </h2>
          <p className="text-xs text-nexoraSubtle mt-1.5 leading-relaxed">
            {t('components.ResetPassword.description')}
          </p>
        </div>

        {isSuccess ? (
          <div className="space-y-6 text-center animate-fadeIn">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-50 text-green-500 mx-auto border border-green-100 shadow-sm">
              <CheckCircle className="h-6 w-6" />
            </div>
            <div className="p-4 bg-green-50 text-green-800 text-xs rounded-xl border border-green-200 font-medium">
              {t('components.ResetPassword.resetSuccess')}
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200 text-center font-medium">
                {error}
              </div>
            )}

            {/* Email (Hidden or editable if missing) */}
            <div>
              <label className="block text-[10px] font-bold text-nexoraText uppercase tracking-wider mb-2">
                {t('components.ResetPassword.emailAddress')}
              </label>
              <input
                type="email"
                placeholder={t('components.ResetPassword.phEmail')}
                className="w-full bg-nexoraCanvas border border-nexoraBorder focus:border-nexoraBrand focus:bg-white rounded-lg px-4 py-2.5 text-sm text-nexoraText focus:outline-none placeholder-nexoraSubtle transition-all"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
              />
            </div>

            {/* Token */}
            <div>
              <label className="block text-[10px] font-bold text-nexoraText uppercase tracking-wider mb-2">
                {t('components.ResetPassword.resetToken')}
              </label>
              <input
                type="text"
                placeholder={t('components.ResetPassword.phToken')}
                className="w-full bg-nexoraCanvas border border-nexoraBorder focus:border-nexoraBrand focus:bg-white rounded-lg px-4 py-2.5 text-sm text-nexoraText focus:outline-none placeholder-nexoraSubtle font-mono transition-all"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                disabled={isLoading}
              />
            </div>

            {/* New Password */}
            <div>
              <label className="block text-[10px] font-bold text-nexoraText uppercase tracking-wider mb-2">
                {t('components.ResetPassword.newPassword')}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-4 h-4 text-nexoraSubtle" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder={t('components.ResetPassword.phNewPassword')}
                  className="w-full bg-nexoraCanvas border border-nexoraBorder focus:border-nexoraBrand focus:bg-white rounded-lg pl-10 pr-10 py-2.5 text-sm text-nexoraText focus:outline-none placeholder-nexoraSubtle transition-all"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={isLoading}
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

            {/* Confirm Password */}
            <div>
              <label className="block text-[10px] font-bold text-nexoraText uppercase tracking-wider mb-2">
                {t('components.ResetPassword.confirmPassword')}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-4 h-4 text-nexoraSubtle" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder={t('components.ResetPassword.phConfirmPassword')}
                  className="w-full bg-nexoraCanvas border border-nexoraBorder focus:border-nexoraBrand focus:bg-white rounded-lg pl-10 pr-10 py-2.5 text-sm text-nexoraText focus:outline-none placeholder-nexoraSubtle transition-all"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
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
                {t('components.ResetPassword.resetPassword')}
              </button>

              <button
                type="button"
                onClick={() => navigate('/login')}
                className="w-full min-h-11 py-2.5 border border-nexoraBorder hover:bg-nexoraCanvas text-nexoraSubtle hover:text-nexoraText font-semibold text-xs uppercase tracking-wider rounded-lg flex items-center justify-center gap-1.5 transition-all"
              >
                <ArrowLeft className="w-4 h-4" /> {t('components.ResetPassword.backToSignIn')}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
