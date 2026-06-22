import React, { useEffect, useState } from 'react'
import { Lock, Eye, EyeOff, CheckCircle, ArrowLeft, Loader2, Mail } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { useTranslation } from '../contexts/LanguageContext'
import { useNavigate, useSearchParams } from 'react-router-dom'
import apiAuthAdapter from '../auth/adapters/apiAuthAdapter'
import { getErrorI18nKey } from '../data/errorCodes'
import { getApiErrorCode, isApiError } from '../types/domain'

const RESET_LINK_ERROR_CODES = new Set([
  'USER_FAILED_TO_RESET_PASSWORD',
  'USER_PASSWORD_RESET_TOKEN_EXPIRED',
  'USER_PASSWORD_RESET_TOKEN_REQUIRED',
])

type ResetPasswordFormValues = {
  token: string
  email: string
  newPassword: string
  confirmPassword: string
}

const EMAIL_PATTERN = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/

export default function ResetPassword() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [showPassword, setShowPassword] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [apiError, setApiError] = useState('')
  const [apiErrorCode, setApiErrorCode] = useState('')

  const urlToken = searchParams.get('token') || ''
  const urlEmail = searchParams.get('email') || ''
  const hasPrefilledCredentials = Boolean(urlToken && urlEmail)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormValues>({
    defaultValues: {
      token: urlToken,
      email: urlEmail,
      newPassword: '',
      confirmPassword: '',
    },
  })

  useEffect(() => {
    if (urlToken) setValue('token', urlToken)
    if (urlEmail) setValue('email', urlEmail)
  }, [urlToken, urlEmail, setValue])

  const onSubmit = async (values: ResetPasswordFormValues) => {
    setApiError('')
    setApiErrorCode('')
    const resetToken = (hasPrefilledCredentials ? urlToken : values.token).trim()
    const resetEmail = (hasPrefilledCredentials ? urlEmail : values.email).trim().toLowerCase()

    try {
      await apiAuthAdapter.resetPassword({
        token: resetToken,
        email: resetEmail,
        newPassword: values.newPassword,
        confirmPassword: values.confirmPassword,
      })
      setIsSuccess(true)
      setTimeout(() => {
        navigate('/login')
      }, 2500)
    } catch (err: unknown) {
      const errorCode = getApiErrorCode(err, 'unknown_error')
      const i18nKey = getErrorI18nKey(errorCode)
      const translated = t(i18nKey)
      const fallbackMessage = isApiError(err) && err.message ? err.message : ''
      setApiErrorCode(errorCode)
      setApiError(i18nKey !== 'errors.unknown_error' ? translated : (fallbackMessage || translated))
    }
  }

  const inputErrorClass = (hasError: boolean) =>
    hasError
      ? 'border-red-300 focus:border-red-500'
      : 'border-nexoraBorder focus:border-nexoraBrand focus:bg-white'

  return (
    <div className="min-h-dvh flex items-center justify-center bg-nexoraCanvas text-nexoraText font-sans px-4 pt-[max(1rem,env(safe-area-inset-top,0px))] pb-[max(1rem,env(safe-area-inset-bottom,0px))] relative overflow-hidden">
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
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            {apiError && (
              <div className="space-y-2">
                <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200 text-center font-medium">
                  {apiError}
                </div>
                {RESET_LINK_ERROR_CODES.has(apiErrorCode) && (
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => navigate('/forgot-password')}
                    className="w-full text-center text-xs font-bold text-nexoraBrand hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {t('components.ResetPassword.requestNewLink')}
                  </button>
                )}
              </div>
            )}

            {hasPrefilledCredentials ? (
              <div>
                <label className="block text-[10px] font-bold text-nexoraText uppercase tracking-wider mb-2">
                  {t('components.ResetPassword.emailAddress')}
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-4 h-4 text-nexoraSubtle" />
                  <input
                    type="email"
                    readOnly
                    value={urlEmail}
                    className="w-full bg-nexoraCanvas border border-nexoraBorder rounded-lg pl-10 pr-4 py-2.5 text-sm text-nexoraSubtle focus:outline-none cursor-default"
                  />
                </div>
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-[10px] font-bold text-nexoraText uppercase tracking-wider mb-2">
                    {t('components.ResetPassword.emailAddress')}
                  </label>
                  <input
                    type="email"
                    autoComplete="email"
                    placeholder={t('components.ResetPassword.phEmail')}
                    disabled={isSubmitting}
                    className={`w-full bg-nexoraCanvas border rounded-lg px-4 py-2.5 text-sm text-nexoraText focus:outline-none placeholder-nexoraSubtle transition-all disabled:opacity-60 ${inputErrorClass(Boolean(errors.email))}`}
                    {...register('email', {
                      required: t('register.errors.email_required'),
                      pattern: {
                        value: EMAIL_PATTERN,
                        message: t('register.errors.email_invalid'),
                      },
                    })}
                  />
                  {errors.email && (
                    <span className="text-xs text-nexoraDanger mt-1 block">{errors.email.message}</span>
                  )}
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-nexoraText uppercase tracking-wider mb-2">
                    {t('components.ResetPassword.resetToken')}
                  </label>
                  <input
                    type="text"
                    autoComplete="off"
                    placeholder={t('components.ResetPassword.phToken')}
                    disabled={isSubmitting}
                    className={`w-full bg-nexoraCanvas border rounded-lg px-4 py-2.5 text-sm text-nexoraText focus:outline-none placeholder-nexoraSubtle font-mono transition-all disabled:opacity-60 ${inputErrorClass(Boolean(errors.token))}`}
                    {...register('token', {
                      required: t('components.ResetPassword.token_required'),
                    })}
                  />
                  {errors.token && (
                    <span className="text-xs text-nexoraDanger mt-1 block">{errors.token.message}</span>
                  )}
                </div>
              </>
            )}

            <div>
              <label className="block text-[10px] font-bold text-nexoraText uppercase tracking-wider mb-2">
                {t('components.ResetPassword.newPassword')}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-4 h-4 text-nexoraSubtle" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder={t('components.ResetPassword.phNewPassword')}
                  disabled={isSubmitting}
                  className={`w-full bg-nexoraCanvas border rounded-lg pl-10 pr-10 py-2.5 text-sm text-nexoraText focus:outline-none placeholder-nexoraSubtle transition-all disabled:opacity-60 ${inputErrorClass(Boolean(errors.newPassword))}`}
                  {...register('newPassword', {
                    required: t('register.errors.password_required'),
                    minLength: {
                      value: 6,
                      message: t('register.errors.password_short'),
                    },
                  })}
                />
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-nexoraSubtle hover:text-nexoraText focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.newPassword && (
                <span className="text-xs text-nexoraDanger mt-1 block">{errors.newPassword.message}</span>
              )}
            </div>

            <div>
              <label className="block text-[10px] font-bold text-nexoraText uppercase tracking-wider mb-2">
                {t('components.ResetPassword.confirmPassword')}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-4 h-4 text-nexoraSubtle" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder={t('components.ResetPassword.phConfirmPassword')}
                  disabled={isSubmitting}
                  className={`w-full bg-nexoraCanvas border rounded-lg pl-10 pr-10 py-2.5 text-sm text-nexoraText focus:outline-none placeholder-nexoraSubtle transition-all disabled:opacity-60 ${inputErrorClass(Boolean(errors.confirmPassword))}`}
                  {...register('confirmPassword', {
                    required: t('register.errors.password_required'),
                    validate: (value) =>
                      value === watch('newPassword') || t('errors.auth_passwords_do_not_match'),
                  })}
                />
              </div>
              {errors.confirmPassword && (
                <span className="text-xs text-nexoraDanger mt-1 block">{errors.confirmPassword.message}</span>
              )}
            </div>

            <div className="pt-2 space-y-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full min-h-11 py-2.5 bg-gradient-to-r from-nexoraElectric to-nexoraViolet hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed text-white font-extrabold text-xs uppercase tracking-wider rounded-lg flex items-center justify-center gap-1.5 shadow-[0_4px_12px_rgba(43,89,255,0.25)] transition-all"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {t('common.loading')}
                  </>
                ) : (
                  t('components.ResetPassword.resetPassword')
                )}
              </button>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => navigate('/login')}
                className="w-full min-h-11 py-2.5 border border-nexoraBorder hover:bg-nexoraCanvas text-nexoraSubtle hover:text-nexoraText font-semibold text-xs uppercase tracking-wider rounded-lg flex items-center justify-center gap-1.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
