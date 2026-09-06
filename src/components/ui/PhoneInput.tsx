import { useState } from 'react'
import CountryCodeSelect, {
  formatNationalNumber,
  getNationalPhonePlaceholder,
  normalizePhoneE164,
  parsePhone,
} from '../CountryCodeSelect'

type PhoneInputProps = {
  id: string
  value?: string | null
  onChange: (value: string) => void
  error?: string
  disabled?: boolean
}

export default function PhoneInput({ id, value, onChange, error, disabled = false }: PhoneInputProps) {
  const [emptyCountryCode, setEmptyCountryCode] = useState(() => parsePhone(value).countryCode)
  const { countryCode, nationalNumber } = value?.trim()
    ? parsePhone(value)
    : { countryCode: emptyCountryCode, nationalNumber: '' }

  const updatePhone = (code: string, number: string) => {
    setEmptyCountryCode(code)
    const formatted = formatNationalNumber(number, code)
    onChange(formatted ? `${code} ${formatted}` : '')
  }

  return (
    <div className="mt-1 flex min-w-0 rounded-lg shadow-sm">
      <CountryCodeSelect
        value={countryCode}
        disabled={disabled}
        onChange={(code) => updatePhone(code, nationalNumber)}
      />
      <input
        id={id}
        type="tel"
        inputMode="tel"
        autoComplete="tel-national"
        disabled={disabled}
        className={`h-10 w-full min-w-0 rounded-r-lg border border-l-0 bg-nexoraCanvas px-3.5 text-xs text-nexoraText outline-none transition-all focus:bg-white ${
          error
            ? 'border-rose-500 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/15'
            : 'border-nexoraBorder focus:border-nexoraBrand'
        }`}
        value={formatNationalNumber(nationalNumber, countryCode)}
        placeholder={getNationalPhonePlaceholder(countryCode)}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        onChange={(event) => {
          const normalized = normalizePhoneE164(event.target.value, countryCode)
          const next = normalized ? parsePhone(normalized) : { countryCode, nationalNumber: '' }
          updatePhone(next.countryCode, next.nationalNumber)
        }}
      />
    </div>
  )
}
