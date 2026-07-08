import { isValidPhone } from './validation'

export function getPhoneFieldError(
  phone: string,
  { requireValue = false }: { requireValue?: boolean } = {},
): string {
  const trimmed = String(phone || '').trim()
  if (!trimmed) {
    return requireValue ? 'setup.errors.phone_required' : ''
  }
  if (!isValidPhone(trimmed)) {
    return 'setup.errors.staff_phone_invalid'
  }
  return ''
}

export function getRequiredFieldError(value: string, errorKey: string): string {
  return String(value || '').trim() ? '' : errorKey
}
