import React, { useState, useRef, useEffect } from 'react'
import { ChevronDown, Search } from 'lucide-react'
import { useTranslation } from '../contexts/LanguageContext'
import { isValidPhone } from '../utils/validation'
import { AsYouType, isPossiblePhoneNumber, validatePhoneNumberLength } from 'libphonenumber-js'

/** Narrow gap between phone digit groups in inputs (thinner than a normal space). */
export const PHONE_GROUP_SEP = '\u2009'

export const COUNTRY_CODES = [
  { name: 'United States', code: 'US', dialCode: '+1', flag: '🇺🇸' },
  { name: 'Canada', code: 'CA', dialCode: '+1', flag: '🇨🇦' },
  { name: 'Vietnam', code: 'VN', dialCode: '+84', flag: '🇻🇳' },
  { name: 'United Kingdom', code: 'GB', dialCode: '+44', flag: '🇬🇧' },
  { name: 'Australia', code: 'AU', dialCode: '+61', flag: '🇦🇺' },
  { name: 'Singapore', code: 'SG', dialCode: '+65', flag: '🇸🇬' },
  { name: 'Japan', code: 'JP', dialCode: '+81', flag: '🇯🇵' },
  { name: 'South Korea', code: 'KR', dialCode: '+82', flag: '🇰🇷' },
  { name: 'Germany', code: 'DE', dialCode: '+49', flag: '🇩🇪' },
  { name: 'France', code: 'FR', dialCode: '+33', flag: '🇫🇷' },
  { name: 'India', code: 'IN', dialCode: '+91', flag: '🇮🇳' },
  { name: 'China', code: 'CN', dialCode: '+86', flag: '🇨🇳' },
  { name: 'Brazil', code: 'BR', dialCode: '+55', flag: '🇧🇷' },
  { name: 'Mexico', code: 'MX', dialCode: '+52', flag: '🇲🇽' },
  { name: 'Hong Kong', code: 'HK', dialCode: '+852', flag: '🇭🇰' },
  { name: 'Taiwan', code: 'TW', dialCode: '+886', flag: '🇹🇼' },
  { name: 'Malaysia', code: 'MY', dialCode: '+60', flag: '🇲🇾' },
  { name: 'Thailand', code: 'TH', dialCode: '+66', flag: '🇹🇭' },
  { name: 'Philippines', code: 'PH', dialCode: '+63', flag: '🇵🇭' },
  { name: 'Indonesia', code: 'ID', dialCode: '+62', flag: '🇮🇩' },
]

export const parsePhone = (phoneStr) => {
  if (!phoneStr) return { countryCode: '+1', nationalNumber: '' }
  const normalized = String(phoneStr).trim()
  
  // Sort country codes by dialCode length descending to match longest prefix first
  const sortedList = [...COUNTRY_CODES].sort((a, b) => b.dialCode.length - a.dialCode.length)
  for (const item of sortedList) {
    if (normalized.startsWith(item.dialCode)) {
      return { countryCode: item.dialCode, nationalNumber: normalized.slice(item.dialCode.length).trim() }
    }
  }
  
  // Fallback: if it starts with +, try to parse it
  if (normalized.startsWith('+')) {
    const match = normalized.match(/^(\+\d+)\s*(.*)$/)
    if (match) {
      return { countryCode: match[1], nationalNumber: match[2] }
    }
  }

  const digits = normalized.replace(/\D/g, '')
  // API can return VN local numbers (e.g. 0385478857) without +84.
  // For +84 UI, show national number without trunk '0' to avoid duplication.
  if (digits.startsWith('0') && digits.length >= 9 && digits.length <= 11) {
    return { countryCode: '+84', nationalNumber: digits.slice(1) }
  }

  return { countryCode: '+1', nationalNumber: normalized }
}

export const getCountryByDialCode = (dialCode) => {
  return COUNTRY_CODES.find(c => c.dialCode === dialCode) || COUNTRY_CODES.find(c => c.code === 'US')
}

export const getDefaultDialCode = (appLanguage) => {
  if (appLanguage === 'vi') return '+84'
  if (typeof navigator === 'undefined') return '+1'

  const locale = (navigator.language || 'en-US').toLowerCase()
  const region = locale.split('-')[1]?.toUpperCase()
  if (region) {
    const matched = COUNTRY_CODES.find((country) => country.code === region)
    if (matched) return matched.dialCode
  }
  if (locale.startsWith('vi')) return '+84'

  return '+1'
}

export const getMaxNationalDigits = (dialCode: string) => {
  const fallback = () => {
    const codeDigits = dialCode.replace(/\D/g, '').length
    return Math.max(4, Math.min(12, 15 - codeDigits))
  }

  const country = getCountryByDialCode(dialCode)
  if (!country?.code) return fallback()

  // Derive the maximum possible national digits from libphonenumber metadata
  // instead of maintaining a hardcoded per-country switch.
  let maxDigits = 0
  for (let length = 4; length <= 15; length += 1) {
    const probe = `${dialCode}${'9'.repeat(length)}`
    const result = validatePhoneNumberLength(
      probe,
      country.code as import('libphonenumber-js').CountryCode,
    )

    if (result === 'TOO_LONG') break
    if (result !== 'INVALID_COUNTRY') {
      maxDigits = length
    }
  }

  return maxDigits > 0 ? maxDigits : fallback()
}

export const getE164MaxNationalDigits = (dialCode: string) => {
  if (dialCode === '+84') return 9
  return getMaxNationalDigits(dialCode)
}

/** Strip domestic trunk prefix (e.g. leading 0 for +84) before E.164 payload. */
export const stripTrunkPrefixNational = (nationalDigits: string, dialCode: string) => {
  const digits = nationalDigits.replace(/\D/g, '')
  if (dialCode === '+84' && digits.startsWith('0')) {
    return digits.slice(1)
  }
  return digits
}

export const normalizePhoneE164 = (value: string, fallbackDialCode: string) => {
  const trimmed = value.trim()
  if (!trimmed) return ''

  const parsed = parsePhone(
    trimmed.startsWith('+') ? trimmed : `${fallbackDialCode}${trimmed.replace(/\D/g, '')}`,
  )
  const digits = stripTrunkPrefixNational(parsed.nationalNumber, parsed.countryCode).slice(
    0,
    getE164MaxNationalDigits(parsed.countryCode),
  )

  if (!digits) return ''
  return `${parsed.countryCode}${digits}`
}

/** BE stores VN phones with leading 0; US keeps E.164 (+1...). */
export const normalizePhoneForApi = (value: string, fallbackDialCode: string) => {
  const e164 = normalizePhoneE164(value, fallbackDialCode)
  if (!e164) return ''

  const { countryCode, nationalNumber } = parsePhone(e164)
  const nationalDigits = stripTrunkPrefixNational(nationalNumber, countryCode)

  if (countryCode === '+84') {
    return `0${nationalDigits}`
  }

  return e164
}

export const getDisplayMaxNationalDigits = (dialCode: string, nationalDigits = '') => {
  if (dialCode === '+84') {
    return nationalDigits.replace(/\D/g, '').startsWith('0') ? 10 : 9
  }
  return getMaxNationalDigits(dialCode)
}

export const isValidPhoneE164 = (value: string, fallbackDialCode: string) => {
  const e164 = normalizePhoneE164(value, fallbackDialCode)
  if (!e164) return false

  const { countryCode, nationalNumber } = parsePhone(e164)
  const nationalDigits = stripTrunkPrefixNational(nationalNumber, countryCode)

  const maxDigits = getE164MaxNationalDigits(countryCode)
  if (nationalDigits.length !== maxDigits) return false

  try {
    return isPossiblePhoneNumber(e164)
  } catch {
    return nationalDigits.length === maxDigits
  }
}

export const formatNationalNumber = (nationalNumber, dialCode) => {
  let digits = nationalNumber.replace(/\D/g, '')

  if (dialCode === '+1') {
    digits = digits.slice(0, getMaxNationalDigits(dialCode))
    if (digits.length <= 3) return digits
    if (digits.length <= 6) return `${digits.slice(0, 3)}-${digits.slice(3)}`
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6, 10)}`
  }

  if (dialCode === '+84') {
    const hasTrunkZero = digits.startsWith('0')
    const maxDigits = hasTrunkZero ? 10 : 9
    digits = digits.slice(0, maxDigits)

    if (hasTrunkZero) {
      if (digits.length <= 4) return digits
      if (digits.length <= 7) return `${digits.slice(0, 4)}${PHONE_GROUP_SEP}${digits.slice(4)}`
      return `${digits.slice(0, 4)}${PHONE_GROUP_SEP}${digits.slice(4, 7)}${PHONE_GROUP_SEP}${digits.slice(7, 10)}`
    }

    if (digits.length <= 3) return digits
    if (digits.length <= 6) return `${digits.slice(0, 3)}${PHONE_GROUP_SEP}${digits.slice(3)}`
    return `${digits.slice(0, 3)}${PHONE_GROUP_SEP}${digits.slice(3, 6)}${PHONE_GROUP_SEP}${digits.slice(6, 9)}`
  }

  digits = digits.slice(0, getMaxNationalDigits(dialCode))
  const country = getCountryByDialCode(dialCode)
  const formatter = new AsYouType(country.code as import('libphonenumber-js').CountryCode)
  return formatter.input(digits)
}

export const isPhoneValid = isValidPhone

export default function CountryCodeSelect({
  value,
  onChange = (_code: string) => {},
  disabled = false,
  showSearch = true,
}: {
  value: string
  onChange?: (code: string) => void
  disabled?: boolean
  showSearch?: boolean
}) {
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const dropdownRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  useEffect(() => {
    if (!showSearch) {
      setSearch('')
    }
  }, [showSearch, isOpen])

  const selectedCountry = COUNTRY_CODES.find(c => c.dialCode === value) || COUNTRY_CODES[0]

  const filteredCountries = showSearch
    ? COUNTRY_CODES.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.dialCode.includes(search) ||
        c.code.toLowerCase().includes(search.toLowerCase())
      )
    : COUNTRY_CODES

  return (
    <div className="relative shrink-0 flex" ref={dropdownRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`h-10 flex items-center gap-1.5 px-3 border border-nexoraBorder border-r-0 rounded-l-lg text-xs font-bold text-nexoraText transition-colors focus:outline-none select-none
          ${disabled ? 'bg-slate-100 text-nexoraSubtle cursor-not-allowed border-slate-200' : 'bg-slate-50 hover:bg-slate-100 cursor-pointer'}`}
      >
        <span className="text-xs font-bold leading-none">{selectedCountry.code}</span>
        <span className="font-bold font-mono leading-none">{selectedCountry.dialCode}</span>
        <ChevronDown 
          className={`w-3.5 h-3.5 text-nexoraMuted shrink-0 transition-transform duration-200
            ${isOpen ? 'rotate-180 text-nexoraBrand' : ''}`} 
        />
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-11 z-50 w-64 bg-white border border-nexoraBorder rounded-lg shadow-premium flex flex-col overflow-hidden animate-fadeIn">
          {showSearch ? (
            <div className="p-2 bg-slate-50 flex items-center gap-1.5">
              <Search className="w-3.5 h-3.5 text-nexoraSubtle shrink-0" />
              <input
                type="text"
                autoFocus
                placeholder={t('components.CountryCodeSelect.phSearch')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="country-code-search-input w-full text-xs bg-transparent border-0 outline-none p-0 shadow-none focus:ring-0 focus:outline-none text-nexoraText placeholder-nexoraSubtle"
              />
            </div>
          ) : null}
          <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 py-1">
            {filteredCountries.length === 0 ? (
              <div className="p-3 text-[10px] text-nexoraSubtle text-center font-medium">No countries found</div>
            ) : (
              filteredCountries.map((country) => {
                const isSelected = country.dialCode === value && country.code === selectedCountry.code
                return (
                  <button
                    key={`${country.code}-${country.dialCode}`}
                    type="button"
                    onClick={() => {
                      onChange(country.dialCode)
                      setIsOpen(false)
                    }}
                    className={`w-full flex items-center justify-between px-4 py-2.5 text-xs text-left hover:bg-nexoraSurfaceMuted transition-colors cursor-pointer select-none
                      ${isSelected ? 'bg-nexoraBrandSoft text-nexoraBrand font-bold' : 'text-nexoraText'}`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="truncate font-medium">{country.name}</span>
                    </div>
                    <span className="text-nexoraMuted shrink-0 font-mono font-bold">{country.dialCode}</span>
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
