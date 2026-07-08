/** Returns an i18n key under `components.settings.tabs.ProfileTab.validation.*`, or '' when valid. */
export function validatePayoutAccount(_method: string, input: unknown): string {
  const account = String(input ?? '').trim()
  if (!account) return 'required'
  return ''
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
