import React, { useEffect, useMemo, useState } from 'react'
import {
  HelpCircle,
  Send,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Loader2
} from 'lucide-react'
import { useTranslation } from '../contexts/LanguageContext'
import { useAuth } from '../auth/useAuth'
import { useProfileSettings } from '../data/hooks/useProfileSettings'
import { useSubmitContactRequest } from '../data/hooks/useSupport'
import {
  CONTACT_REQUEST_MESSAGE_MAX_LENGTH,
  CONTACT_REQUEST_MESSAGE_MIN_LENGTH,
} from '../data/repositories/support'
import { SUPPORT_TYPE_I18N_KEYS, SUPPORT_TYPE_OPTIONS, SupportType } from '../constants/supportType'
import CustomSelect from './CustomSelect'
import {
  getSupportFieldErrorParams,
  mapSupportApiError,
  validateSupportForm,
  type SupportFormFieldErrors,
} from '../utils/supportContactValidation'
import { logger } from '../utils/logger'

function Panel({ children, className = '' }) {
  return (
    <section className={`bg-white dark:bg-luxuryCoal border border-nexoraBorder dark:border-luxuryGold/18 rounded-flox-cards shadow-premium ${className}`}>
      {children}
    </section>
  )
}

function fieldInputClass(hasError: boolean) {
  return [
    'w-full rounded-flox-inputs border bg-white px-3 text-base text-nexoraText outline-none disabled:opacity-60',
    hasError
      ? 'border-nexoraDanger focus:border-nexoraDanger'
      : 'border-nexoraBorder dark:border-luxuryGold/18 focus:border-nexoraBrand dark:focus:border-luxuryGold',
  ].join(' ')
}

export default function SupportView() {
  const { t } = useTranslation()
  const { session } = useAuth()
  const { data: profile } = useProfileSettings()
  const submitContactRequestMutation = useSubmitContactRequest()

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [supportType, setSupportType] = useState<string>(SupportType.Other)
  const [message, setMessage] = useState('')
  const [fieldErrors, setFieldErrors] = useState<SupportFormFieldErrors>({})
  const [formError, setFormError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [openFaqIndex, setOpenFaqIndex] = useState<any | null>(null)
  const [profilePrefilled, setProfilePrefilled] = useState(false)

  const supportTypeOptions = useMemo(
    () =>
      SUPPORT_TYPE_OPTIONS.map((value) => ({
        value,
        label: t(`dashboard.support.form.support_options.${SUPPORT_TYPE_I18N_KEYS[value]}`),
      })),
    [t],
  )

  useEffect(() => {
    if (profilePrefilled || !profile) return

    const profileFullName =
      profile.fullName?.trim() ||
      [profile.firstName, profile.lastName].filter(Boolean).join(' ').trim() ||
      session?.displayName?.trim() ||
      ''

    setFullName(profileFullName)
    setEmail(profile.email?.trim() || session?.email?.trim() || '')
    setPhoneNumber(profile.phoneNumber?.trim() || profile.phone?.trim() || '')
    setProfilePrefilled(true)
  }, [profile, profilePrefilled, session?.displayName, session?.email])

  const renderLengthCounter = (value: string, min: number, max?: number) => {
    const count = value.trim().length
    const met = count >= min && (!max || count <= max)
    const counterKey = max
      ? 'dashboard.support.form.length_counter_with_max'
      : 'dashboard.support.form.length_counter'

    return (
      <p className={`text-[10px] font-semibold ${met ? 'text-nexoraSuccess' : 'text-nexoraMuted'}`}>
        {t(counterKey, { min, max, count })}
      </p>
    )
  }

  const renderFieldError = (errorKey?: string) => {
    if (!errorKey) return null
    return (
      <span className="text-xs text-nexoraDanger mt-1 block">
        {t(errorKey, getSupportFieldErrorParams(errorKey))}
      </span>
    )
  }

  const clearFieldError = (field: keyof SupportFormFieldErrors) => {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev
      const next = { ...prev }
      delete next[field]
      return next
    })
  }

  const resetForm = () => {
    setSupportType(SupportType.Other)
    setMessage('')
    setFieldErrors({})
    setFormError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormError('')
    setSuccessMsg('')

    const formValues = {
      fullName,
      email,
      phoneNumber,
      supportType,
      message,
    }

    const validationErrors = validateSupportForm(formValues)
    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors)
      setFormError(t('dashboard.support.form.error_msg'))
      return
    }

    setFieldErrors({})

    try {
      await submitContactRequestMutation.mutateAsync({
        fullName: fullName.trim(),
        email: email.trim(),
        phoneNumber: phoneNumber.trim() || null,
        supportType: supportType.trim(),
        message: message.trim(),
        captchaToken: '',
        sourceFrom: 'merchant_dashboard',
      })

      setSuccessMsg(t('dashboard.support.form.success_msg'))
      resetForm()
    } catch (err) {
      logger.error('[SupportView] Failed to submit contact request', err)
      const apiErrors = mapSupportApiError(err)
      setFieldErrors(apiErrors)
      setFormError(
        apiErrors.form
          ? t(apiErrors.form, getSupportFieldErrorParams(apiErrors.form))
          : t('dashboard.support.form.error_msg'),
      )
    }
  }

  const faqItems = [
    {
      question: t('dashboard.support.faq.q1'),
      answer: t('dashboard.support.faq.a1')
    },
    {
      question: t('dashboard.support.faq.q2'),
      answer: t('dashboard.support.faq.a2')
    },
    {
      question: t('dashboard.support.faq.q3'),
      answer: t('dashboard.support.faq.a3')
    },
    {
      question: t('dashboard.support.faq.q4'),
      answer: t('dashboard.support.faq.a4')
    }
  ]

  const toggleFaq = (index) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index)
  }

  const isSubmitting = submitContactRequestMutation.isPending

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h2 className="text-xl font-extrabold text-nexoraText flex items-center gap-2">
          <HelpCircle className="h-5 w-5 text-nexoraBrand dark:text-luxuryGold" />
          <span>{t('dashboard.menu.support')}</span>
        </h2>
        <p className="mt-1 text-xs text-nexoraMuted">
          {t('dashboard.support.subtitle')}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Panel className="p-6 flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="text-base font-extrabold text-nexoraText border-b border-nexoraRule pb-2">
              {t('dashboard.support.form.title')}
            </h3>

            {formError && (
              <div className="p-3.5 bg-nexoraDanger/10 border border-nexoraDanger/20 text-nexoraDanger text-xs font-semibold rounded-lg">
                {formError}
              </div>
            )}

            {successMsg && (
              <div className="p-3.5 bg-nexoraSuccess/10 border border-nexoraSuccess/20 text-nexoraSuccess text-xs font-semibold rounded-lg flex items-center gap-2">
                <CheckCircle2 className="h-4.5 w-4.5 text-nexoraSuccess shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div className="space-y-1.5">
                <label className="text-[11px] font-black uppercase tracking-wider text-nexoraSubtle">
                  {t('dashboard.support.form.full_name_label')}
                  <span className="text-nexoraDanger ml-0.5" aria-hidden="true">*</span>
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => {
                    setFullName(e.target.value)
                    clearFieldError('fullName')
                    setFormError('')
                  }}
                  placeholder={t('dashboard.support.form.full_name_placeholder')}
                  disabled={isSubmitting}
                  required
                  aria-invalid={Boolean(fieldErrors.fullName)}
                  className={`h-11 ${fieldInputClass(Boolean(fieldErrors.fullName))}`}
                />
                {renderFieldError(fieldErrors.fullName)}
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-black uppercase tracking-wider text-nexoraSubtle">
                  {t('dashboard.support.form.email_label')}
                  <span className="text-nexoraDanger ml-0.5" aria-hidden="true">*</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    clearFieldError('email')
                    setFormError('')
                  }}
                  placeholder={t('dashboard.support.form.email_placeholder')}
                  disabled={isSubmitting}
                  required
                  aria-invalid={Boolean(fieldErrors.email)}
                  className={`h-11 ${fieldInputClass(Boolean(fieldErrors.email))}`}
                />
                {renderFieldError(fieldErrors.email)}
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-black uppercase tracking-wider text-nexoraSubtle">
                  {t('dashboard.support.form.phone_label')}
                </label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => {
                    setPhoneNumber(e.target.value)
                    clearFieldError('phoneNumber')
                    setFormError('')
                  }}
                  placeholder={t('dashboard.support.form.phone_placeholder')}
                  disabled={isSubmitting}
                  aria-invalid={Boolean(fieldErrors.phoneNumber)}
                  className={`h-11 ${fieldInputClass(Boolean(fieldErrors.phoneNumber))}`}
                />
                {renderFieldError(fieldErrors.phoneNumber)}
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-black uppercase tracking-wider text-nexoraSubtle">
                  {t('dashboard.support.form.support_type_label')}
                  <span className="text-nexoraDanger ml-0.5" aria-hidden="true">*</span>
                </label>
                <CustomSelect
                  value={supportType}
                  onChange={(e) => {
                    setSupportType(e.target.value)
                    clearFieldError('supportType')
                    setFormError('')
                  }}
                  options={supportTypeOptions}
                  placeholder={t('dashboard.support.form.support_type_placeholder')}
                  disabled={isSubmitting}
                  buttonClass={fieldErrors.supportType ? 'border-nexoraDanger' : ''}
                />
                {renderFieldError(fieldErrors.supportType)}
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-black uppercase tracking-wider text-nexoraSubtle">
                  {t('dashboard.support.form.message_label')}
                  <span className="text-nexoraDanger ml-0.5" aria-hidden="true">*</span>
                </label>
                <textarea
                  value={message}
                  onChange={(e) => {
                    setMessage(e.target.value)
                    clearFieldError('message')
                    setFormError('')
                  }}
                  placeholder={t('dashboard.support.form.message_placeholder')}
                  rows={4}
                  disabled={isSubmitting}
                  required
                  minLength={CONTACT_REQUEST_MESSAGE_MIN_LENGTH}
                  maxLength={CONTACT_REQUEST_MESSAGE_MAX_LENGTH}
                  aria-invalid={Boolean(fieldErrors.message)}
                  className={`p-3 resize-none ${fieldInputClass(Boolean(fieldErrors.message))}`}
                />
                <p className="text-[10px] text-nexoraMuted">
                  {t('dashboard.support.form.message_helper', {
                    min: CONTACT_REQUEST_MESSAGE_MIN_LENGTH,
                    max: CONTACT_REQUEST_MESSAGE_MAX_LENGTH,
                  })}
                </p>
                {renderLengthCounter(message, CONTACT_REQUEST_MESSAGE_MIN_LENGTH, CONTACT_REQUEST_MESSAGE_MAX_LENGTH)}
                {renderFieldError(fieldErrors.message)}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-flox-buttons bg-nexoraBrand dark:bg-luxuryGold hover:bg-nexoraBrandDark dark:hover:bg-luxuryGoldLight text-white dark:text-luxuryBlack font-bold text-xs transition-all shadow-md mt-2 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Send className="h-3.5 w-3.5" />
                )}
                <span>
                  {isSubmitting
                    ? t('dashboard.support.form.submitting_btn')
                    : t('dashboard.support.form.submit_btn')}
                </span>
              </button>
            </form>
          </div>
        </Panel>

        <Panel className="p-6 space-y-4">
          <h3 className="text-base font-extrabold text-nexoraText border-b border-nexoraRule pb-2">
            {t('dashboard.support.faq.title')}
          </h3>

          <div className="space-y-3">
            {faqItems.map((item, index) => {
              const isOpen = openFaqIndex === index
              return (
                <div
                  key={index}
                  className="border border-nexoraBorder dark:border-luxuryGold/18 rounded-lg overflow-hidden transition-all duration-200"
                >
                  <button
                    type="button"
                    onClick={() => toggleFaq(index)}
                    className="w-full flex items-center justify-between p-4 text-left font-bold text-xs sm:text-sm text-nexoraText hover:bg-nexoraSurfaceMuted transition min-h-[44px]"
                  >
                    <span>{item.question}</span>
                    {isOpen ? (
                      <ChevronUp className="h-4.5 w-4.5 text-nexoraSubtle shrink-0 ml-2" />
                    ) : (
                      <ChevronDown className="h-4.5 w-4.5 text-nexoraSubtle shrink-0 ml-2" />
                    )}
                  </button>

                  {isOpen && (
                    <div className="p-4 pt-0 text-xs sm:text-sm text-nexoraMuted leading-relaxed border-t border-nexoraRule bg-nexoraSurfaceMuted/30">
                      {item.answer}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </Panel>
      </div>
    </div>
  )
}
