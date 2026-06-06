import React, { useState, useRef, useEffect } from 'react'
import { ChevronDown, Search } from 'lucide-react'

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
  
  // Sort country codes by dialCode length descending to match longest prefix first
  const sortedList = [...COUNTRY_CODES].sort((a, b) => b.dialCode.length - a.dialCode.length)
  for (const item of sortedList) {
    if (phoneStr.startsWith(item.dialCode)) {
      return { countryCode: item.dialCode, nationalNumber: phoneStr.slice(item.dialCode.length).trim() }
    }
  }
  
  // Fallback: if it starts with +, try to parse it
  if (phoneStr.startsWith('+')) {
    const match = phoneStr.match(/^(\+\d+)\s*(.*)$/)
    if (match) {
      return { countryCode: match[1], nationalNumber: match[2] }
    }
  }
  return { countryCode: '+1', nationalNumber: phoneStr }
}

export default function CountryCodeSelect({ value, onChange, disabled = false }) {
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

  const selectedCountry = COUNTRY_CODES.find(c => c.dialCode === value) || COUNTRY_CODES[0]

  const filteredCountries = COUNTRY_CODES.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.dialCode.includes(search) || 
    c.code.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="relative shrink-0 flex" ref={dropdownRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`h-10 flex items-center gap-1.5 px-3 border border-nexoraBorder border-r-0 bg-nexoraCanvas rounded-l-lg text-xs font-bold text-nexoraText hover:bg-slate-100 transition-colors focus:outline-none select-none
          ${disabled ? 'bg-slate-100 text-nexoraSubtle cursor-not-allowed border-slate-200' : 'cursor-pointer'}`}
      >
        <span className="text-sm">{selectedCountry.flag}</span>
        <span className="font-bold font-mono">{selectedCountry.dialCode}</span>
        <ChevronDown 
          className={`w-3.5 h-3.5 text-nexoraMuted shrink-0 transition-transform duration-200
            ${isOpen ? 'rotate-180 text-nexoraBrand' : ''}`} 
        />
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-11 z-50 w-64 bg-white border border-nexoraBorder rounded-lg shadow-premium flex flex-col overflow-hidden animate-fadeIn">
          <div className="p-2 border-b border-nexoraRule bg-slate-50 flex items-center gap-1.5">
            <Search className="w-3.5 h-3.5 text-nexoraSubtle shrink-0" />
            <input
              type="text"
              autoFocus
              placeholder="Search country or code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs bg-transparent border-0 outline-none p-0 focus:ring-0 text-nexoraText placeholder-nexoraSubtle"
            />
          </div>
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
                      <span className="text-sm shrink-0">{country.flag}</span>
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
