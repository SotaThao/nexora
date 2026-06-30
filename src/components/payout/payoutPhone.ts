import {
  formatNationalNumber,
  parsePhone,
} from '../CountryCodeSelect'
import { isValidEmail } from '../../utils/validation'

export function isPhoneOnlyPayoutMethod(walletKey: string): boolean {
  return walletKey === 'applecash'
}

/** Whether the payout identifier should use CountryCodeSelect + formatted national input. */
export function shouldUsePayoutPhoneInput(walletKey: string, value: string): boolean {
  if (isPhoneOnlyPayoutMethod(walletKey)) return true
  if (walletKey !== 'zelle') return false

  const trimmed = String(value || '').trim()
  if (!trimmed) return false
  if (trimmed.includes('@')) return false
  if (isValidEmail(trimmed)) return false

  return /^[\d+\s().\- ]+$/.test(trimmed) || trimmed.startsWith('+')
}

export function composePayoutPhone(dialCode: string, nationalFormatted: string): string {
  return `${dialCode} ${nationalFormatted}`.trim()
}

export function formatPayoutPhoneDisplay(accountInfo?: string | null): string {
  const trimmed = String(accountInfo || '').trim()
  if (!trimmed || trimmed.includes('@') || isValidEmail(trimmed)) return trimmed

  const parsed = parsePhone(trimmed)
  const national = formatNationalNumber(parsed.nationalNumber, parsed.countryCode)
  if (!national) return trimmed

  return composePayoutPhone(parsed.countryCode, national)
}

export function parsePayoutPhoneState(
  value: string,
  fallbackDialCode: string,
): { dialCode: string; nationalPhone: string } {
  const trimmed = String(value || '').trim()
  if (!trimmed) {
    return { dialCode: fallbackDialCode, nationalPhone: '' }
  }

  const parsed = parsePhone(trimmed.startsWith('+') ? trimmed : `${fallbackDialCode} ${trimmed}`)
  return {
    dialCode: parsed.countryCode || fallbackDialCode,
    nationalPhone: formatNationalNumber(parsed.nationalNumber, parsed.countryCode || fallbackDialCode),
  }
}
