import { parsePhoneNumberFromString } from 'libphonenumber-js'

export function formatPhoneDisplay(value?: string | null): string {
  const raw = value?.trim() || ''
  if (!raw) return ''

  const phone = parsePhoneNumberFromString(raw, { defaultCountry: 'US', extract: false })
  if (!phone?.isPossible()) return raw

  const national = String(phone.nationalNumber)
  if (phone.countryCallingCode === '1' && national.length === 10) {
    const extension = phone.ext ? ` ext. ${phone.ext}` : ''
    return `+1 (${national.slice(0, 3)}) ${national.slice(3, 6)}-${national.slice(6)}${extension}`
  }

  return phone.formatInternational()
}
