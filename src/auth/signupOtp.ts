const SIGNUP_OTP_KEYS = [
  'otp',
  'otpCode',
  'verificationCode',
  'verificationOtp',
  'verificationToken',
  'emailVerificationToken',
  'token',
]

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function readString(value: unknown): string {
  return typeof value === 'string' || typeof value === 'number' ? String(value).trim() : ''
}

export function getSignupOtp(response: unknown): string {
  if (!isObject(response)) return ''

  for (const key of SIGNUP_OTP_KEYS) {
    const directValue = readString(response[key])
    if (directValue) return directValue
  }

  const nestedCandidates = [response.data, response.result, response.payload]
  for (const candidate of nestedCandidates) {
    if (!isObject(candidate)) continue
    for (const key of SIGNUP_OTP_KEYS) {
      const nestedValue = readString(candidate[key])
      if (nestedValue) return nestedValue
    }
  }

  return ''
}
