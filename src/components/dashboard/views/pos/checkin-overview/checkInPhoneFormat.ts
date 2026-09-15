const US_NATIONAL_PHONE_PATTERN = /^(\d{3})(\d{3})(\d{4})$/

export function formatCheckInPhone(nationalNumber: string): string | null {
  const digits = nationalNumber.replace(/\D/g, '')
  const match = US_NATIONAL_PHONE_PATTERN.exec(
    digits.length === 11 && digits.startsWith('1') ? digits.slice(1) : digits,
  )
  return match ? `(${match[1]}) ${match[2]}-${match[3]}` : null
}
