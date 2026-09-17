import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ArrowLeft, ChevronDown, UserRound } from 'lucide-react'
import CountryCodeSelect, {
  formatNationalNumber,
  getNationalPhonePlaceholder,
  isValidPhoneE164,
  normalizePhoneE164,
  parsePhone,
  PhoneDialCode,
} from '../../CountryCodeSelect'
import { useTranslation } from '../../../contexts/LanguageContext'
import { useNotification } from '../../../contexts/NotificationContext'
import { getErrorI18nKey } from '../../../data/errorCodes'
import { getApiErrorCode } from '../../../types/domain'
import { isValidEmail } from '../../../utils/validation'
import {
  MerchantVoiceCustomerStatus,
  MerchantVoiceCustomerType,
  normalizeMerchantVoiceCustomerStatus,
  type MerchantVoiceCustomerDto,
  type UpdateMerchantVoiceCustomerRequest,
} from '../../../data/repositories/merchantVoice'
import { openNativeDateTimePicker } from './bookingHubFormatters'
import { applyAiHubProgressiveValidation } from './bookingHubDialogValidation'
import { CheckLgIcon, SpinnerIcon, XLgIcon } from './BookingHubIcons'
import BookingCustomerAddressFields from './BookingCustomerAddressFields'
import './booking-hub.css'

const TK = 'components.dashboard.views.BookingHubView.customers'
const TK_HUB = 'components.dashboard.views.BookingHubView'

type CustomerFormProfile = Pick<MerchantVoiceCustomerDto,
  'id' | 'name' | 'phoneNumber' | 'email' | 'address' | 'dateOfBirth' | 'type' | 'status'
>

interface CustomerDraft {
  id: string | null
  name: string
  phone: string
  email: string
  address: string
  dateOfBirth: string
  type: MerchantVoiceCustomerType
  status: MerchantVoiceCustomerStatus
}

interface CustomerFormErrors {
  name?: string
  phone?: string
  email?: string
  dateOfBirth?: string
  address?: string
  [key: string]: string | undefined
}

const EMAIL_MAX_LENGTH = 320
const NAME_MAX_LENGTH = 200
const ADDRESS_MAX_LENGTH = 300
/** Reasonable customer age window for the date picker. */
const DOB_MAX_AGE_YEARS = 120

function toLocalDateInputValue(date = new Date()): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getDobBounds(now = new Date()) {
  const max = toLocalDateInputValue(now)
  const minDate = new Date(now.getFullYear() - DOB_MAX_AGE_YEARS, now.getMonth(), now.getDate())
  return {
    min: toLocalDateInputValue(minDate),
    max,
  }
}

/** Empty DOB is allowed; otherwise must be a real calendar date within the age window. */
function isValidDateOfBirth(value: string, bounds = getDobBounds()): boolean {
  const trimmed = value.trim()
  if (!trimmed) return true
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return false

  const [year, month, day] = trimmed.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  if (
    date.getFullYear() !== year
    || date.getMonth() !== month - 1
    || date.getDate() !== day
  ) {
    return false
  }

  return trimmed >= bounds.min && trimmed <= bounds.max
}

/** PUT/POST customer type — VoiceCustomerType (not VoiceCustomerGroup). */
const CUSTOMER_TYPE_OPTIONS: MerchantVoiceCustomerType[] = [
  MerchantVoiceCustomerType.Individual,
  MerchantVoiceCustomerType.Business,
  MerchantVoiceCustomerType.Vip,
  MerchantVoiceCustomerType.Guest,
  MerchantVoiceCustomerType.Partner,
  MerchantVoiceCustomerType.Internal,
]

function emptyDraft(defaultDialCode: string): CustomerDraft {
  return {
    id: null,
    name: '',
    phone: defaultDialCode,
    email: '',
    address: '',
    dateOfBirth: '',
    type: MerchantVoiceCustomerType.Individual,
    status: MerchantVoiceCustomerStatus.Active,
  }
}

function toDraft(customer: CustomerFormProfile): CustomerDraft {
  return {
    id: customer.id,
    name: customer.name ?? '',
    phone: customer.phoneNumber ?? '',
    email: customer.email ?? '',
    address: customer.address ?? '',
    dateOfBirth: customer.dateOfBirth ? customer.dateOfBirth.slice(0, 10) : '',
    type: customer.type,
    status: normalizeMerchantVoiceCustomerStatus(customer.status),
  }
}

export default function BookingCustomerModal({
  customer,
  onClose,
  onBack,
  onSave,
}: {
  customer?: CustomerFormProfile | null
  /** Ends the whole flow: fires on X/Cancel/overlay/Escape and after a successful save. */
  onClose: () => void
  /** When provided, renders a Back button that returns to the caller's previous view instead of closing. */
  onBack?: () => void
  onSave: (body: UpdateMerchantVoiceCustomerRequest) => Promise<unknown>
}) {
  const { t } = useTranslation()
  const { showToast } = useNotification()
  const titleId = useId()
  const [draft, setDraft] = useState(() => customer ? toDraft(customer) : emptyDraft(PhoneDialCode.US))
  const [formErrors, setFormErrors] = useState<CustomerFormErrors>({})
  const [isSaving, setIsSaving] = useState(false)
  const savingRef = useRef(false)
  const custModalRef = useRef<HTMLDivElement>(null)
  const dobBounds = useMemo(() => getDobBounds(), [])
  const phoneParsed = useMemo(() => parsePhone(draft.phone || PhoneDialCode.US), [draft.phone])
  const isCreateMode = !customer

  const closeModal = () => {
    if (!savingRef.current) onClose()
  }

  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null
    custModalRef.current?.querySelector<HTMLInputElement>('input')?.focus()
    return () => previousFocus?.focus()
  }, [])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation()
        if (!savingRef.current) onClose()
      }
      if (event.key === 'Tab') {
        const fields = custModalRef.current?.querySelectorAll<HTMLElement>(
          'button:not(:disabled), input:not(:disabled), select:not(:disabled), [tabindex="0"]',
        )
        if (!fields?.length) {
          event.preventDefault()
          return
        }
        const first = fields[0]
        const last = fields[fields.length - 1]
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault()
          last.focus()
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault()
          first.focus()
        }
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  const saveModal = async () => {
    if (savingRef.current) return

    const trimmedEmail = draft.email.trim()
    const trimmedName = draft.name.trim()
    const trimmedAddress = draft.address.trim()
    const nextErrors: CustomerFormErrors = {}
    const dialCode = phoneParsed.countryCode

    if (!trimmedName) {
      nextErrors.name = t(`${TK}.invalidNameRequired`)
    } else if (trimmedName.length > NAME_MAX_LENGTH) {
      nextErrors.name = t(`${TK}.invalidNameMaxLength`)
    }

    let phoneForApi = draft.phone
    const hasPhoneInput = Boolean(phoneParsed.nationalNumber.trim())
    if (isCreateMode && !hasPhoneInput) {
      nextErrors.phone = t(`${TK}.invalidPhoneRequired`)
    } else if (isCreateMode) {
      phoneForApi = normalizePhoneE164(draft.phone, dialCode)
      if (!isValidPhoneE164(phoneForApi, dialCode)) {
        nextErrors.phone = t(`${TK}.invalidPhone`)
      }
    }

    if (trimmedEmail) {
      if (trimmedEmail.length > EMAIL_MAX_LENGTH) {
        nextErrors.email = t(`${TK}.invalidEmailMaxLength`)
      } else if (!isValidEmail(trimmedEmail)) {
        nextErrors.email = t(`${TK}.invalidEmail`)
      }
    }

    if (trimmedAddress.length > ADDRESS_MAX_LENGTH) {
      nextErrors.address = t(`${TK}.invalidAddressMaxLength`)
    }

    if (draft.dateOfBirth.trim() && !isValidDateOfBirth(draft.dateOfBirth, dobBounds)) {
      nextErrors.dateOfBirth = t(`${TK}.invalidBirthday`)
    }

    if (
      applyAiHubProgressiveValidation({
        allErrors: nextErrors,
        root: custModalRef.current,
        setErrors: setFormErrors,
        showToast,
        fieldLabels: {
          name: t(`${TK}.fieldName`),
          phone: t(`${TK}.fieldPhone`),
          email: t(`${TK}.fieldEmail`),
          dateOfBirth: t(`${TK}.fieldBirthday`),
          address: t(`${TK}.fieldAddress`),
        },
        hubTk: TK_HUB,
        t,
      })
    ) {
      return
    }

    savingRef.current = true
    setIsSaving(true)
    try {
      const customerBody = {
        phoneNumber: phoneForApi,
        name: trimmedName || null,
        email: trimmedEmail || null,
        address: trimmedAddress || null,
        dateOfBirth: draft.dateOfBirth.trim() || null,
        type: draft.type,
        status: draft.status,
      }
      await onSave(customerBody)
      showToast(t(isCreateMode ? `${TK}.createSuccess` : `${TK}.saveSuccess`), 'success')
      onClose()
    } catch (error) {
      showToast(
        t(getErrorI18nKey(getApiErrorCode(error)))
          || t(isCreateMode ? `${TK}.createError` : `${TK}.saveError`),
        'error',
      )
    } finally {
      savingRef.current = false
      setIsSaving(false)
    }
  }

  return createPortal(
    <div className="booking-hub-view customer-modal-scope">
      <div
        className="cust-modal-overlay"
        role="presentation"
        onClick={(event) => {
          if (event.target === event.currentTarget && !isSaving) closeModal()
        }}
      >
        <div
          ref={custModalRef}
          className="cust-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          onClick={(event) => event.stopPropagation()}
        >
          <div className="cust-modal-head">
            <div className="cust-modal-heading">
              {onBack ? (
                <button
                  type="button"
                  className="booking-mini-button"
                  onClick={onBack}
                  disabled={isSaving}
                >
                  <ArrowLeft aria-hidden="true" />
                  <span className="booking-mini-label">{t(`${TK}.back`)}</span>
                </button>
              ) : null}
              <span className="cust-modal-icon" aria-hidden="true"><UserRound /></span>
              <h3 id={titleId}>
                {isCreateMode ? t(`${TK}.createModalTitle`) : t(`${TK}.modalTitle`)}
              </h3>
            </div>
            <button
              className="cust-modal-close"
              type="button"
              aria-label={t(`${TK}.close`)}
              onClick={closeModal}
              disabled={isSaving}
            >
              <XLgIcon />
            </button>
          </div>

          <div className="cust-modal-body">
            <label className="cust-field" data-ai-hub-field="name">
              <span className="cust-field-label">{t(`${TK}.fieldName`)}</span>
              <input
                className={`booking-input ${formErrors.name ? 'has-error' : ''}`}
                type="text"
                value={draft.name}
                disabled={isSaving}
                placeholder={t(`${TK}.fieldNamePlaceholder`)}
                autoComplete="name"
                aria-invalid={Boolean(formErrors.name)}
                onChange={(event) => {
                  setDraft({ ...draft, name: event.target.value })
                  if (formErrors.name) setFormErrors((prev) => ({ ...prev, name: undefined }))
                }}
              />
              {formErrors.name ? (
                <span className="cust-field-error" aria-live="polite">{formErrors.name}</span>
              ) : null}
            </label>

            <label className="cust-field cust-field-birthday" data-ai-hub-field="dateOfBirth">
              <span className="cust-field-label">{t(`${TK}.fieldBirthday`)}</span>
              <span className="cust-date-shell">
                <input
                  className={`booking-input cust-date-input ${formErrors.dateOfBirth ? 'has-error' : ''}`}
                  type="date"
                  value={draft.dateOfBirth}
                  disabled={isSaving}
                  min={dobBounds.min}
                  max={dobBounds.max}
                  aria-invalid={Boolean(formErrors.dateOfBirth)}
                  onClick={(event) => openNativeDateTimePicker(event.currentTarget)}
                  onChange={(event) => {
                    const nextValue = event.target.value
                    setDraft({ ...draft, dateOfBirth: nextValue })
                    setFormErrors((prev) => ({
                      ...prev,
                      dateOfBirth: nextValue && !isValidDateOfBirth(nextValue, dobBounds)
                        ? t(`${TK}.invalidBirthday`)
                        : undefined,
                    }))
                  }}
                />
              </span>
              {formErrors.dateOfBirth ? (
                <span className="cust-field-error" aria-live="polite">{formErrors.dateOfBirth}</span>
              ) : null}
            </label>

            <label className="cust-field" data-ai-hub-field="phone">
              <span className="cust-field-label">{t(`${TK}.fieldPhone`)}</span>
              <span className="phone-input-shell" data-disabled={isSaving || !isCreateMode}>
                <CountryCodeSelect
                  value={phoneParsed.countryCode}
                  embedded
                  disabled={isSaving || !isCreateMode}
                  onChange={(nextCode) => {
                    const formatted = formatNationalNumber(phoneParsed.nationalNumber, nextCode)
                    setDraft({ ...draft, phone: `${nextCode} ${formatted}`.trim() })
                    if (formErrors.phone) setFormErrors((prev) => ({ ...prev, phone: undefined }))
                  }}
                />
                <input
                  className={`booking-input phone-mask-input ${formErrors.phone ? 'has-error' : ''}`}
                  type="tel"
                  value={formatNationalNumber(phoneParsed.nationalNumber, phoneParsed.countryCode)}
                  placeholder={getNationalPhonePlaceholder(phoneParsed.countryCode)}
                  inputMode="numeric"
                  autoComplete="tel-national"
                  readOnly={!isCreateMode}
                  disabled={isSaving || !isCreateMode}
                  aria-invalid={Boolean(formErrors.phone)}
                  onChange={(event) => {
                    const formatted = formatNationalNumber(event.target.value, phoneParsed.countryCode)
                    setDraft({ ...draft, phone: `${phoneParsed.countryCode} ${formatted}`.trim() })
                    if (formErrors.phone) setFormErrors((prev) => ({ ...prev, phone: undefined }))
                  }}
                />
              </span>
              {formErrors.phone ? (
                <span className="cust-field-error" aria-live="polite">{formErrors.phone}</span>
              ) : null}
            </label>

            <label className="cust-field" data-ai-hub-field="email">
              <span className="cust-field-label">{t(`${TK}.fieldEmail`)}</span>
              <input
                className={`booking-input ${formErrors.email ? 'has-error' : ''}`}
                type="email"
                value={draft.email}
                disabled={isSaving}
                placeholder={t(`${TK}.fieldEmailPlaceholder`)}
                aria-invalid={Boolean(formErrors.email)}
                onChange={(event) => {
                  setDraft({ ...draft, email: event.target.value })
                  if (formErrors.email) setFormErrors((prev) => ({ ...prev, email: undefined }))
                }}
              />
              {formErrors.email ? (
                <span className="cust-field-error" aria-live="polite">{formErrors.email}</span>
              ) : null}
            </label>

            <BookingCustomerAddressFields
              initialAddress={draft.address}
              disabled={isSaving}
              error={formErrors.address}
              onChange={(address) => {
                setDraft((prev) => ({ ...prev, address }))
                setFormErrors((prev) => ({ ...prev, address: undefined }))
              }}
            />

            <div className="cust-type-status-row cust-field-full">
              <label className="cust-field">
                <span className="cust-field-label">{t(`${TK}.fieldType`)}</span>
                <span className="cust-select-shell">
                  <select
                    className="booking-input cust-select-input"
                    value={draft.type}
                    disabled={isSaving}
                    onChange={(event) => setDraft({
                      ...draft,
                      type: event.target.value as MerchantVoiceCustomerType,
                    })}
                  >
                    {CUSTOMER_TYPE_OPTIONS.map((type) => (
                      <option key={type} value={type}>{t(`${TK}.types.${type}`)}</option>
                    ))}
                  </select>
                  <ChevronDown className="cust-select-chevron" aria-hidden="true" />
                </span>
              </label>

              <div className="cust-field">
                <span className="cust-field-label">{t(`${TK}.fieldStatus`)}</span>
                <div className="cust-status-toggle">
                  <button
                    className={`toggle-pill ${draft.status === MerchantVoiceCustomerStatus.Active ? 'is-on' : ''}`}
                    type="button"
                    disabled={isSaving}
                    role="switch"
                    aria-checked={draft.status === MerchantVoiceCustomerStatus.Active}
                    aria-label={t(`${TK}.toggleStatusAria`)}
                    onClick={() => setDraft({
                      ...draft,
                      status: draft.status === MerchantVoiceCustomerStatus.Active
                        ? MerchantVoiceCustomerStatus.InActive
                        : MerchantVoiceCustomerStatus.Active,
                    })}
                  />
                  <span>
                    {draft.status === MerchantVoiceCustomerStatus.Active
                      ? t(`${TK}.statusActive`)
                      : t(`${TK}.statusInactive`)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="cust-modal-foot">
            <button className="booking-mini-button" type="button" onClick={closeModal} disabled={isSaving}>
              {t(`${TK}.cancel`)}
            </button>
            <button className="booking-mini-button primary" type="button" onClick={saveModal} disabled={isSaving}>
              {isSaving ? <SpinnerIcon className="booking-inline-spinner" /> : <CheckLgIcon />}
              <span className="booking-mini-label">{t(`${TK}.save`)}</span>
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}
