import {
  CONTACT_REQUEST_MESSAGE_MAX_LENGTH,
  CONTACT_REQUEST_MESSAGE_MIN_LENGTH,
  CONTACT_REQUEST_SUPPORT_TYPE_MIN_LENGTH,
} from '../data/repositories/support'
import { getErrorI18nKey } from '../data/errorCodes'
import { getApiErrorCode, isApiError } from '../types/domain'

export type SupportFormValues = {
  fullName: string
  email: string
  phoneNumber: string
  supportType: string
  message: string
}

export type SupportFormFieldErrors = {
  fullName?: string
  email?: string
  phoneNumber?: string
  supportType?: string
  message?: string
  form?: string
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const API_ERROR_I18N: Record<string, string> = {
  CONTACT_REQUEST_SUPPORT_TYPE_MIN_LENGTH: 'errors.contact_request_support_type_min_length',
  CONTACT_REQUEST_SUPPORT_TYPE_REQUIRED: 'errors.contact_request_support_type_required',
  CONTACT_REQUEST_MESSAGE_MIN_LENGTH: 'errors.contact_request_message_min_length',
  CONTACT_REQUEST_MESSAGE_MAX_LENGTH: 'errors.contact_request_message_max_length',
  CONTACT_REQUEST_MESSAGE_REQUIRED: 'errors.contact_request_message_required',
}

const API_ERROR_FIELD: Record<string, keyof SupportFormFieldErrors> = {
  CONTACT_REQUEST_SUPPORT_TYPE_MIN_LENGTH: 'supportType',
  CONTACT_REQUEST_SUPPORT_TYPE_REQUIRED: 'supportType',
  CONTACT_REQUEST_MESSAGE_MIN_LENGTH: 'message',
  CONTACT_REQUEST_MESSAGE_MAX_LENGTH: 'message',
  CONTACT_REQUEST_MESSAGE_REQUIRED: 'message',
}

export function validateSupportForm(values: SupportFormValues): SupportFormFieldErrors {
  const errors: SupportFormFieldErrors = {}
  const fullName = values.fullName.trim()
  const email = values.email.trim()
  const supportType = values.supportType.trim()
  const message = values.message.trim()

  if (!fullName) {
    errors.fullName = 'dashboard.support.form.full_name_required'
  }

  if (!email) {
    errors.email = 'dashboard.support.form.email_required'
  } else if (!EMAIL_PATTERN.test(email)) {
    errors.email = 'dashboard.support.form.email_invalid'
  }

  if (!supportType) {
    errors.supportType = 'dashboard.support.form.support_type_required'
  } else if (supportType.length < CONTACT_REQUEST_SUPPORT_TYPE_MIN_LENGTH) {
    errors.supportType = 'dashboard.support.form.support_type_min_length'
  }

  if (!message) {
    errors.message = 'dashboard.support.form.message_required'
  } else if (message.length < CONTACT_REQUEST_MESSAGE_MIN_LENGTH) {
    errors.message = 'dashboard.support.form.message_min_length'
  } else if (message.length > CONTACT_REQUEST_MESSAGE_MAX_LENGTH) {
    errors.message = 'dashboard.support.form.message_max_length'
  }

  return errors
}

export function mapSupportApiError(err: unknown): SupportFormFieldErrors {
  const code = getApiErrorCode(err)
  const i18nKey = API_ERROR_I18N[code] || getErrorI18nKey(code)
  const field = API_ERROR_FIELD[code]

  if (field) {
    return { [field]: i18nKey }
  }

  if (isApiError(err) && err.errors) {
    const mapped: SupportFormFieldErrors = {}
    for (const [fieldName, codes] of Object.entries(err.errors)) {
      const firstCode = codes?.[0]
      if (!firstCode) continue
      const mappedKey = API_ERROR_I18N[firstCode] || getErrorI18nKey(firstCode)
      const normalized = fieldName.toLowerCase()
      if (normalized.includes('message')) {
        mapped.message = mappedKey
      } else if (normalized.includes('supporttype')) {
        mapped.supportType = mappedKey
      } else if (normalized.includes('email')) {
        mapped.email = mappedKey
      } else if (normalized.includes('fullname') || normalized.includes('name')) {
        mapped.fullName = mappedKey
      } else if (normalized.includes('phone')) {
        mapped.phoneNumber = mappedKey
      } else {
        mapped.form = mappedKey
      }
    }
    if (Object.keys(mapped).length > 0) return mapped
  }

  return { form: i18nKey }
}

export function getSupportFieldErrorParams(errorKey?: string) {
  if (errorKey === 'dashboard.support.form.support_type_min_length'
    || errorKey === 'errors.contact_request_support_type_min_length') {
    return { min: CONTACT_REQUEST_SUPPORT_TYPE_MIN_LENGTH }
  }
  if (errorKey === 'dashboard.support.form.message_min_length'
    || errorKey === 'errors.contact_request_message_min_length') {
    return { min: CONTACT_REQUEST_MESSAGE_MIN_LENGTH }
  }
  if (errorKey === 'dashboard.support.form.message_max_length'
    || errorKey === 'errors.contact_request_message_max_length') {
    return { max: CONTACT_REQUEST_MESSAGE_MAX_LENGTH }
  }
  return undefined
}
