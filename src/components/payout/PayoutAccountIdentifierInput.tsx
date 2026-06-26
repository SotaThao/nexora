import { useEffect, useState } from 'react'
import CountryCodeSelect, {
  formatNationalNumber,
  getDefaultDialCode,
} from '../CountryCodeSelect'
import { useTranslation } from '../../contexts/LanguageContext'
import {
  composePayoutPhone,
  isPhoneOnlyPayoutMethod,
  parsePayoutPhoneState,
  shouldUsePayoutPhoneInput,
} from './payoutPhone'

interface PayoutAccountIdentifierInputProps {
  walletKey: string
  value: string
  onChange: (nextValue: string) => void
  disabled?: boolean
  hasError?: boolean
  placeholder?: string
}

export default function PayoutAccountIdentifierInput({
  walletKey,
  value,
  onChange,
  disabled = false,
  hasError = false,
  placeholder = '',
}: PayoutAccountIdentifierInputProps) {
  const { currentLanguage } = useTranslation()
  const fallbackDialCode = getDefaultDialCode(currentLanguage)
  const phoneMode =
    isPhoneOnlyPayoutMethod(walletKey) || shouldUsePayoutPhoneInput(walletKey, value)

  const [dialCode, setDialCode] = useState(fallbackDialCode)
  const [nationalPhone, setNationalPhone] = useState('')

  useEffect(() => {
    if (!phoneMode) return
    const next = parsePayoutPhoneState(value, fallbackDialCode)
    setDialCode(next.dialCode)
    setNationalPhone(next.nationalPhone)
  }, [value, phoneMode, fallbackDialCode])

  const plainInputClass = `w-full bg-slate-50 border border-slate-200 focus:border-nexoraBrand focus:ring-2 focus:ring-nexoraBrand/20 focus:bg-white rounded-xl px-3.5 h-11 text-xs text-slate-800 focus:outline-none transition-all ${
    hasError ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20' : ''
  } ${disabled ? 'bg-slate-100 text-slate-400 cursor-not-allowed border-slate-200' : ''}`

  const phoneInputClass = `h-10 w-full min-w-0 rounded-r-lg border border-l-0 bg-slate-50 px-3.5 text-xs text-slate-800 outline-none focus:border-nexoraBrand focus:bg-white transition-all ${
    hasError
      ? 'border-rose-500 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/15'
      : 'border-slate-200'
  } ${disabled ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : ''}`

  if (!phoneMode) {
    return (
      <input
        type="text"
        disabled={disabled}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={plainInputClass}
      />
    )
  }

  return (
    <div className="flex rounded-lg shadow-sm">
      <CountryCodeSelect
        value={dialCode}
        disabled={disabled}
        onChange={(newCode) => {
          const digits = nationalPhone.replace(/\D/g, '')
          const formatted = formatNationalNumber(digits, newCode)
          setDialCode(newCode)
          setNationalPhone(formatted)
          onChange(composePayoutPhone(newCode, formatted))
        }}
      />
      <input
        type="text"
        disabled={disabled}
        value={nationalPhone}
        placeholder={placeholder}
        className={phoneInputClass}
        onChange={(e) => {
          const raw = e.target.value
          if (walletKey === 'zelle' && (raw.includes('@') || /[a-zA-Z]/.test(raw))) {
            onChange(raw)
            return
          }

          const formatted = formatNationalNumber(raw, dialCode)
          setNationalPhone(formatted)
          onChange(composePayoutPhone(dialCode, formatted))
        }}
      />
    </div>
  )
}
