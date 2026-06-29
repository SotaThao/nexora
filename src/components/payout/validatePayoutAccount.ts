import { isValidEmail, isValidPhone, isValidZelleAccount } from '../../utils/validation'

/** Returns an i18n key under `components.settings.tabs.ProfileTab.validation.*`, or '' when valid. */
export function validatePayoutAccount(method: string, input: unknown): string {
  const account = String(input ?? '').trim()
  if (!account) return 'required'
  if (method === 'zelle') return isValidZelleAccount(account) ? '' : 'emailOrPhone'
  if (method === 'paypal') return isValidEmail(account) ? '' : 'email'
  if (method === 'venmo') return /^@[A-Za-z0-9_]{2,30}$/.test(account) ? '' : 'venmo'
  if (method === 'applecash') return isValidPhone(account) ? '' : 'phone'
  return account.length >= 3 ? '' : 'invalid'
}

export function getPayoutValidationMessage(
  t: (key: string) => string,
  method: string,
  input: unknown,
): string {
  const key = validatePayoutAccount(method, input)
  if (!key) return ''
  return t(`components.settings.tabs.ProfileTab.validation.${key}`)
}
