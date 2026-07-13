import React, { useEffect, useMemo, useState } from 'react'
import CountryCodeSelect, {
  formatNationalNumber,
  getDefaultDialCode,
  isValidPhoneE164,
  normalizePhoneE164,
  parsePhone,
  PHONE_NATIONAL_PLACEHOLDER,
} from '../../CountryCodeSelect'
import { useTranslation } from '../../../contexts/LanguageContext'
import { useNotification } from '../../../contexts/NotificationContext'
import { useSubmitVoiceTrialRequest } from '../../../data/hooks/useSubmitVoiceTrialRequest'
import { getErrorI18nKey } from '../../../data/errorCodes'
import {
  formatTrialTimeLabelToApi,
  mapDayKeysToApiOpeningDays,
  type SubmitVoiceTrialRequest,
} from '../../../data/voiceTrial/domain'
import { getApiErrorCode } from '../../../types/domain'

const TK = 'components.dashboard.views.BookingHubView.plans.trial'

const SERVICE_CHIPS = [
  'Gel Manicure',
  'Acrylic Full Set',
  'Dip Powder',
  'Pedicure',
  'Pedi + Gel',
  'Nail Art',
  'Waxing',
  'Eyelash',
  'Facial',
]

const DEFAULT_ACTIVE_SERVICES = new Set(['Gel Manicure', 'Acrylic Full Set', 'Pedicure'])

const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const
const DEFAULT_ACTIVE_DAYS = new Set(['mon', 'tue', 'wed', 'thu', 'fri', 'sat'])

function buildTwentyFourHourOptions(stepMinutes = 30): string[] {
  const options: string[] = []
  for (let total = 0; total < 24 * 60; total += stepMinutes) {
    const hours = Math.floor(total / 60)
    const minutes = total % 60
    options.push(`${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`)
  }
  return options
}

const SERVICE_HOUR_OPTIONS = buildTwentyFourHourOptions()
const DEFAULT_OPEN_TIME = '09:00'
const DEFAULT_CLOSE_TIME = '19:00'

function compareTime24h(left: string, right: string): number {
  const [leftHours, leftMinutes] = left.split(':').map((part) => Number.parseInt(part, 10))
  const [rightHours, rightMinutes] = right.split(':').map((part) => Number.parseInt(part, 10))
  return (leftHours * 60 + leftMinutes) - (rightHours * 60 + rightMinutes)
}

const PAIN_POINT_KEYS = {
  missed: `${TK}.painMissed`,
  retention: `${TK}.painRetention`,
  reviews: `${TK}.painReviews`,
  manual: `${TK}.painManual`,
  sms: `${TK}.painSms`,
} as const

type PainPointValue = keyof typeof PAIN_POINT_KEYS

type TrialFieldKey = 'salon' | 'owner' | 'phone' | 'email' | 'services' | 'openingDays' | 'serviceHours' | 'painPoint'

type TrialFormErrors = Partial<Record<TrialFieldKey, string>>

interface TrialFormState {
  salon: string
  owner: string
  phone: string
  email: string
  city: string
  referral: string
  openTime: string
  closeTime: string
  painPoint: string
  activeServices: Set<string>
  activeDays: Set<string>
  customServices: string[]
  customServiceInput: string
  showCustomServiceInput: boolean
}

function createInitialTrialForm(): TrialFormState {
  return {
    salon: '',
    owner: '',
    phone: '',
    email: '',
    city: '',
    referral: '',
    openTime: DEFAULT_OPEN_TIME,
    closeTime: DEFAULT_CLOSE_TIME,
    painPoint: '',
    activeServices: new Set(DEFAULT_ACTIVE_SERVICES),
    activeDays: new Set(DEFAULT_ACTIVE_DAYS),
    customServices: [],
    customServiceInput: '',
    showCustomServiceInput: false,
  }
}

function TrialFieldError({ message }: { message?: string }) {
  return (
    <span className="trial-field-error-slot" aria-live="polite">
      {message ? <span className="trial-field-error">{message}</span> : null}
    </span>
  )
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" width="14" height="14">
      <path d="m4 4 8 8M12 4 4 12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" width="12" height="12">
      <path d="m3.5 8.5 3 3 6-6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function GiftIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" width="12" height="12">
      <rect x="2.5" y="6" width="11" height="8" rx="1.2" stroke="currentColor" strokeWidth="1.3" />
      <path d="M8 6V14M2.5 6h11M5.5 6C4.5 6 3.5 5.2 3.5 4.2S4.3 2.5 5.5 2.5 7.5 3.5 7.5 4.5M10.5 6c1 0 2-.8 2-1.8S11.7 2.5 10.5 2.5 8.5 3.5 8.5 4.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  )
}

function RocketIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" width="14" height="14">
      <path d="M8 13.5s3.5-1.5 3.5-5V4.5L8 2.5 4.5 4.5v4c0 3.5 3.5 5 3.5 5Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
      <circle cx="8" cy="7" r="1.2" fill="currentColor" />
    </svg>
  )
}

interface BookingTrialModalProps {
  open: boolean
  onClose: () => void
}

export default function BookingTrialModal({ open, onClose }: BookingTrialModalProps) {
  const { t, currentLanguage } = useTranslation()
  const { showToast } = useNotification()
  const submitTrial = useSubmitVoiceTrialRequest()
  const [form, setForm] = useState<TrialFormState>(createInitialTrialForm)
  const [errors, setErrors] = useState<TrialFormErrors>({})
  const [phoneTouched, setPhoneTouched] = useState(false)

  const phoneParsed = useMemo(() => parsePhone(form.phone), [form.phone])

  const getPhoneFieldError = (phoneValue: string, dialCode: string): string | undefined => {
    const parsed = parsePhone(phoneValue)
    if (!parsed.nationalNumber.trim()) {
      return t(`${TK}.validationPhoneRequired`)
    }
    if (!isValidPhoneE164(phoneValue, dialCode)) {
      return t(`${TK}.validationPhoneInvalid`)
    }
    return undefined
  }

  const applyPhoneFieldError = (phoneValue: string, dialCode: string) => {
    const phoneError = getPhoneFieldError(phoneValue, dialCode)
    setErrors((prev) => {
      const next = { ...prev }
      if (phoneError) next.phone = phoneError
      else delete next.phone
      return next
    })
  }

  const clearFieldError = (field: TrialFieldKey) => {
    setErrors((prev) => {
      if (!prev[field]) return prev
      const next = { ...prev }
      delete next[field]
      return next
    })
  }

  const patchForm = <K extends keyof TrialFormState>(key: K, value: TrialFormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const patchFormField = (
    key: keyof Pick<TrialFormState, 'salon' | 'owner' | 'phone' | 'email' | 'city' | 'referral' | 'openTime' | 'closeTime' | 'painPoint' | 'customServiceInput'>,
    value: string,
    errorField?: TrialFieldKey,
  ) => {
    patchForm(key, value)
    if (errorField) clearFieldError(errorField)
  }

  const resetForm = () => {
    setForm(createInitialTrialForm())
    setErrors({})
    setPhoneTouched(false)
  }

  const serviceChips = [...SERVICE_CHIPS, ...form.customServices]

  const addCustomService = () => {
    const value = form.customServiceInput.trim()
    if (!value) {
      patchForm('showCustomServiceInput', false)
      return
    }

    const exists = serviceChips.some((chip) => chip.toLowerCase() === value.toLowerCase())
    const nextCustomServices = exists
      ? form.customServices
      : [...form.customServices, value]

    const matched = serviceChips.find((chip) => chip.toLowerCase() === value.toLowerCase())
    const nextActiveServices = new Set(form.activeServices)
    nextActiveServices.add(matched ?? value)

    setForm((prev) => ({
      ...prev,
      customServices: nextCustomServices,
      activeServices: nextActiveServices,
      customServiceInput: '',
      showCustomServiceInput: false,
    }))
    clearFieldError('services')
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const toggleChip = (
    field: 'activeServices' | 'activeDays',
    value: string,
    errorField?: TrialFieldKey,
  ) => {
    setForm((prev) => {
      const next = new Set(prev[field])
      if (next.has(value)) next.delete(value)
      else next.add(value)
      return { ...prev, [field]: next }
    })
    if (errorField) clearFieldError(errorField)
  }

  const validateForm = (): TrialFormErrors => {
    const shopName = form.salon.trim()
    const ownerName = form.owner.trim()
    const emailValue = form.email.trim()
    const services = [...form.activeServices]
    const openingDays = mapDayKeysToApiOpeningDays(form.activeDays)
    const painKey = PAIN_POINT_KEYS[form.painPoint as PainPointValue]
    const nextErrors: TrialFormErrors = {}

    if (!shopName) nextErrors.salon = t(`${TK}.validationSalonRequired`)
    if (!ownerName) nextErrors.owner = t(`${TK}.validationOwnerRequired`)
    const phoneError = getPhoneFieldError(form.phone, phoneParsed.countryCode)
    if (phoneError) nextErrors.phone = phoneError
    if (!emailValue) nextErrors.email = t(`${TK}.validationEmailRequired`)
    else if (!emailValue.includes('@')) nextErrors.email = t(`${TK}.validationEmailInvalid`)
    if (services.length === 0) nextErrors.services = t(`${TK}.validationServicesRequired`)
    if (openingDays.length === 0) nextErrors.openingDays = t(`${TK}.validationDaysRequired`)
    if (compareTime24h(form.closeTime, form.openTime) <= 0) {
      nextErrors.serviceHours = t(`${TK}.validationHoursInvalid`)
    }
    if (!painKey) nextErrors.painPoint = t(`${TK}.validationPainRequired`)

    return nextErrors
  }

  const buildPayload = (): SubmitVoiceTrialRequest | null => {
    const formErrors = validateForm()
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors)
      return null
    }

    setErrors({})

    const shopName = form.salon.trim()
    const ownerName = form.owner.trim()
    const phoneNumber = normalizePhoneE164(form.phone, phoneParsed.countryCode)
    const emailValue = form.email.trim()
    const services = [...form.activeServices]
    const openingDays = mapDayKeysToApiOpeningDays(form.activeDays)
    const painKey = PAIN_POINT_KEYS[form.painPoint as PainPointValue]!
    const cityArea = form.city.trim()
    const referralCode = form.referral.trim()

    return {
      shopName,
      ownerName,
      phoneNumber,
      email: emailValue,
      cityArea: cityArea || null,
      services,
      openingDays,
      serviceHoursFrom: formatTrialTimeLabelToApi(form.openTime),
      serviceHoursTo: formatTrialTimeLabelToApi(form.closeTime),
      biggestProblem: t(painKey),
      referralCode: referralCode || null,
    }
  }

  const handleSubmit = async () => {
    setPhoneTouched(true)
    const payload = buildPayload()
    if (!payload) return

    try {
      await submitTrial.mutateAsync(payload)
      showToast(t(`${TK}.submitSuccess`), 'success')
      handleClose()
    } catch (error) {
      showToast(t(getErrorI18nKey(getApiErrorCode(error))), 'error')
    }
  }

  const handlePhoneBlur = () => {
    setPhoneTouched(true)
    applyPhoneFieldError(form.phone, phoneParsed.countryCode)
  }

  useEffect(() => {
    if (!phoneTouched) return
    applyPhoneFieldError(form.phone, phoneParsed.countryCode)
  }, [form.phone, phoneParsed.countryCode, phoneTouched])

  useEffect(() => {
    if (!open) return
    const defaultDialCode = getDefaultDialCode(currentLanguage)
    setForm((prev) => {
      if (prev.phone.trim()) return prev
      return { ...prev, phone: defaultDialCode }
    })
    setPhoneTouched(false)
    setErrors({})
  }, [open, currentLanguage])

  useEffect(() => {
    if (!open) {
      document.body.style.overflow = ''
      return undefined
    }
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  if (!open) return null

  return (
    <div className="trial-modal" role="dialog" aria-modal="true" aria-labelledby="trial-modal-title">
      <div className="trial-dialog">
        <button className="trial-close" type="button" aria-label={t(`${TK}.close`)} onClick={handleClose}>
          <CloseIcon />
        </button>

        <div className="trial-step">
            <div className="trial-head">
              <div className="trial-brand"><GiftIcon /> {t(`${TK}.brandBadge`)}</div>
              <h2 className="trial-title" id="trial-modal-title">
                {t(`${TK}.titleLead`)}
                <strong>{t(`${TK}.titleHighlight`)}</strong>
              </h2>
              <p className="trial-subtitle">{t(`${TK}.subtitle`)}</p>
            </div>

            <div className="trial-benefits">
              <div className="trial-benefit"><CheckIcon /> {t(`${TK}.benefitSetup`)}</div>
              <div className="trial-benefit"><CheckIcon /> {t(`${TK}.benefitCancel`)}</div>
              <div className="trial-benefit"><CheckIcon /> {t(`${TK}.benefitVietnamese`)}</div>
            </div>

            <div className="trial-body">
              <div className="trial-grid">
                <div className={`trial-field trial-span-2 ${errors.salon ? 'has-error' : ''}`}>
                  <label className="trial-label" htmlFor="trial-salon">{t(`${TK}.salonLabel`)} <span>*</span></label>
                  <input
                    className={`trial-input ${errors.salon ? 'has-error' : ''}`}
                    id="trial-salon"
                    type="text"
                    value={form.salon}
                    placeholder={t(`${TK}.salonPlaceholder`)}
                    onChange={(e) => patchFormField('salon', e.target.value, 'salon')}
                  />
                  <TrialFieldError message={errors.salon} />
                </div>
                <div className={`trial-field ${errors.owner ? 'has-error' : ''}`}>
                  <label className="trial-label" htmlFor="trial-owner">{t(`${TK}.ownerLabel`)} <span>*</span></label>
                  <input
                    className={`trial-input ${errors.owner ? 'has-error' : ''}`}
                    id="trial-owner"
                    type="text"
                    value={form.owner}
                    placeholder={t(`${TK}.ownerPlaceholder`)}
                    onChange={(e) => patchFormField('owner', e.target.value, 'owner')}
                  />
                  <TrialFieldError message={errors.owner} />
                </div>
                <div className={`trial-field ${errors.phone ? 'has-error' : ''}`}>
                  <label className="trial-label" htmlFor="trial-phone">{t(`${TK}.phoneLabel`)} <span>*</span></label>
                  <span className="phone-input-shell trial-phone-input-shell">
                    <CountryCodeSelect
                      value={phoneParsed.countryCode}
                      embedded
                      onChange={(nextCode) => {
                        const formatted = formatNationalNumber(phoneParsed.nationalNumber, nextCode)
                        const nextPhone = `${nextCode} ${formatted}`.trim()
                        patchForm('phone', nextPhone)
                        if (phoneTouched) {
                          applyPhoneFieldError(nextPhone, nextCode)
                        } else {
                          clearFieldError('phone')
                        }
                      }}
                    />
                    <input
                      className="trial-input phone-mask-input"
                      id="trial-phone"
                      type="tel"
                      value={formatNationalNumber(phoneParsed.nationalNumber, phoneParsed.countryCode)}
                      aria-invalid={Boolean(errors.phone)}
                      placeholder={PHONE_NATIONAL_PLACEHOLDER}
                      inputMode="numeric"
                      autoComplete="tel-national"
                      onBlur={handlePhoneBlur}
                      onChange={(event) => {
                        const formatted = formatNationalNumber(event.target.value, phoneParsed.countryCode)
                        patchFormField('phone', `${phoneParsed.countryCode} ${formatted}`.trim(), 'phone')
                      }}
                    />
                  </span>
                  <TrialFieldError message={errors.phone} />
                </div>
                <div className={`trial-field trial-span-2 ${errors.email ? 'has-error' : ''}`}>
                  <label className="trial-label" htmlFor="trial-email">{t(`${TK}.emailLabel`)} <span>*</span></label>
                  <input
                    className={`trial-input ${errors.email ? 'has-error' : ''}`}
                    id="trial-email"
                    type="email"
                    value={form.email}
                    placeholder={t(`${TK}.emailPlaceholder`)}
                    onChange={(e) => patchFormField('email', e.target.value, 'email')}
                  />
                  {!errors.email ? <div className="trial-note">{t(`${TK}.emailNote`)}</div> : null}
                  <TrialFieldError message={errors.email} />
                </div>
                <div className="trial-field trial-span-2">
                  <label className="trial-label" htmlFor="trial-city">
                    {t(`${TK}.cityLabel`)} <span className="trial-optional">{t(`${TK}.optional`)}</span>
                  </label>
                  <input className="trial-input" id="trial-city" type="text" value={form.city} placeholder={t(`${TK}.cityPlaceholder`)} onChange={(e) => patchFormField('city', e.target.value)} />
                </div>
                <div className={`trial-field trial-span-2 ${errors.services ? 'has-error' : ''}`}>
                  <div className="trial-label">
                    {t(`${TK}.servicesLabel`)} <span>*</span>{' '}
                    <span className="trial-optional">{t(`${TK}.tapToSelect`)}</span>
                  </div>
                  <div className="trial-chip-list">
                    {serviceChips.map((chip) => (
                      <button
                        key={chip}
                        className={`trial-chip ${form.activeServices.has(chip) ? 'is-active' : ''}`}
                        type="button"
                        onClick={() => toggleChip('activeServices', chip, 'services')}
                      >
                        {chip}
                      </button>
                    ))}
                    <button
                      className="trial-chip trial-chip-add"
                      type="button"
                      aria-label={t(`${TK}.addService`)}
                      title={t(`${TK}.addService`)}
                      onClick={() => patchForm('showCustomServiceInput', true)}
                    >
                      +
                    </button>
                  </div>
                  {form.showCustomServiceInput ? (
                    <div className="trial-custom-service-row">
                      <input
                        className="trial-input trial-custom-service-input"
                        type="text"
                        value={form.customServiceInput}
                        placeholder={t(`${TK}.customServicePlaceholder`)}
                        autoFocus
                        onChange={(event) => patchFormField('customServiceInput', event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') {
                            event.preventDefault()
                            addCustomService()
                          }
                          if (event.key === 'Escape') {
                            patchForm('customServiceInput', '')
                            patchForm('showCustomServiceInput', false)
                          }
                        }}
                      />
                      <button className="trial-custom-service-add" type="button" onClick={addCustomService}>
                        {t(`${TK}.addService`)}
                      </button>
                    </div>
                  ) : null}
                  <TrialFieldError message={errors.services} />
                </div>
                <div className={`trial-field trial-span-2 ${errors.openingDays ? 'has-error' : ''}`}>
                  <div className="trial-label">{t(`${TK}.openDaysLabel`)}</div>
                  <div className="trial-day-list">
                    {DAY_KEYS.map((day) => (
                      <button
                        key={day}
                        className={`trial-day ${form.activeDays.has(day) ? 'is-active' : ''}`}
                        type="button"
                        onClick={() => toggleChip('activeDays', day, 'openingDays')}
                      >
                        {t(`${TK}.days.${day}`)}
                      </button>
                    ))}
                  </div>
                  <TrialFieldError message={errors.openingDays} />
                </div>
                <div className={`trial-field trial-span-2 ${errors.serviceHours ? 'has-error' : ''}`}>
                  <div className="trial-label">{t(`${TK}.hoursLabel`)}</div>
                  <div className="trial-time-row">
                    <select
                      className={`trial-select ${errors.serviceHours ? 'has-error' : ''}`}
                      aria-label={t(`${TK}.openTimeLabel`)}
                      value={form.openTime}
                      onChange={(e) => patchFormField('openTime', e.target.value, 'serviceHours')}
                    >
                      {SERVICE_HOUR_OPTIONS.map((time) => <option key={`open-${time}`} value={time}>{time}</option>)}
                    </select>
                    <span className="trial-time-separator">→</span>
                    <select
                      className={`trial-select ${errors.serviceHours ? 'has-error' : ''}`}
                      aria-label={t(`${TK}.closeTimeLabel`)}
                      value={form.closeTime}
                      onChange={(e) => patchFormField('closeTime', e.target.value, 'serviceHours')}
                    >
                      {SERVICE_HOUR_OPTIONS.map((time) => <option key={`close-${time}`} value={time}>{time}</option>)}
                    </select>
                  </div>
                  <TrialFieldError message={errors.serviceHours} />
                </div>
                <div className={`trial-field trial-span-2 ${errors.painPoint ? 'has-error' : ''}`}>
                  <label className="trial-label" htmlFor="trial-pain">
                    {t(`${TK}.painLabel`)}{' '}
                    <span className="trial-optional">{t(`${TK}.painHint`)}</span>
                  </label>
                  <select
                    className={`trial-select ${errors.painPoint ? 'has-error' : ''}`}
                    id="trial-pain"
                    value={form.painPoint}
                    onChange={(e) => patchFormField('painPoint', e.target.value, 'painPoint')}
                  >
                    <option value="">{t(`${TK}.painDefault`)}</option>
                    <option value="missed">{t(`${TK}.painMissed`)}</option>
                    <option value="retention">{t(`${TK}.painRetention`)}</option>
                    <option value="reviews">{t(`${TK}.painReviews`)}</option>
                    <option value="manual">{t(`${TK}.painManual`)}</option>
                    <option value="sms">{t(`${TK}.painSms`)}</option>
                  </select>
                  <TrialFieldError message={errors.painPoint} />
                </div>
                <div className="trial-field trial-span-2">
                  <label className="trial-label" htmlFor="trial-ref">
                    {t(`${TK}.referralLabel`)} <span className="trial-optional">{t(`${TK}.optional`)}</span>
                  </label>
                  <input
                    className="trial-input trial-input-uppercase"
                    id="trial-ref"
                    type="text"
                    value={form.referral}
                    placeholder={t(`${TK}.referralPlaceholder`)}
                    onChange={(e) => patchFormField('referral', e.target.value.toUpperCase())}
                  />
                  <div className="trial-credit"><GiftIcon /> {t(`${TK}.referralCredit`)}</div>
                </div>
              </div>

              <button
                className="trial-submit"
                type="button"
                disabled={submitTrial.isPending}
                onClick={handleSubmit}
              >
                <RocketIcon />
                {submitTrial.isPending ? t(`${TK}.submitting`) : t(`${TK}.submit`)}
              </button>
              <div className="trial-footer">{t(`${TK}.footer`)}</div>
            </div>

            <div className="trial-contact">
              {t(`${TK}.contactLine`)}
              <br />
              <strong>832-979-5559</strong> ({t(`${TK}.contactTry`)}) ·{' '}
              <a href="https://nexoratouch.com" target="_blank" rel="noreferrer">nexoratouch.com</a>
            </div>
          </div>
      </div>
    </div>
  )
}
