import React, { useState, useRef, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'

export default function CustomSelect({
  value,
  onChange,
  options,
  className = '',
  buttonClass = '',
  optionsClass = '',
  placeholder = 'Select option...',
  size = 'md',
  disabled = false
}) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const selectedOption = options.find((opt) => opt.value === value)

  const handleSelect = (val) => {
    onChange({ target: { value: val } })
    setIsOpen(false)
  }

  const isSmall = size === 'sm'

  const borderClassStr = buttonClass.includes('border-') ? '' : 'border-nexoraBorder'
  const bgClassStr = buttonClass.includes('bg-') ? '' : 'bg-white'
  const hasTextColor = /\btext-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|black|white|brand)\b/.test(buttonClass)
  const textClassStr = hasTextColor ? '' : 'text-nexoraText'
  const focusBorderClassStr = buttonClass.includes('focus:border-') ? '' : 'focus:border-nexoraBrand'
  const focusRingClassStr = buttonClass.includes('focus:ring-') ? '' : 'focus:ring-1 focus:ring-nexoraBrand/20'
  const hasFontWeight = buttonClass.includes('font-')
  const fontWeightClass = hasFontWeight ? '' : (isSmall ? 'font-semibold' : '')

  return (
    <div className={`relative w-full ${className}`} ref={dropdownRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between border ${borderClassStr} ${textClassStr} ${bgClassStr} focus:outline-none transition-all select-none text-left ${focusBorderClassStr} ${focusRingClassStr}
          ${isSmall ? 'h-9 px-3 text-xs rounded' : 'min-h-[42px] px-4 py-2.5 text-sm rounded-lg'}
          ${fontWeightClass}
          ${disabled ? 'bg-slate-100 text-nexoraSubtle cursor-not-allowed border-slate-200' : 'cursor-pointer'}
          ${buttonClass}`}
      >
        <span className="truncate">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          className={`text-nexoraSubtle shrink-0 transition-transform duration-200 ml-2
            ${isSmall ? 'w-3.5 h-3.5' : 'w-4 h-4'}
            ${isOpen ? 'rotate-180 text-nexoraBrand' : ''}`}
        />
      </button>

      {isOpen && (
        <div 
          className={`absolute left-0 right-0 mt-1.5 z-50 bg-white border border-nexoraBorder rounded-lg shadow-premium max-h-60 overflow-y-auto py-1
            ${optionsClass}`}
        >
          {options.map((opt) => {
            const isSelected = opt.value === value
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleSelect(opt.value)}
                className={`w-full text-left px-4 py-2 text-sm transition-colors cursor-pointer select-none flex items-center justify-between
                  ${
                    isSelected
                      ? 'bg-nexoraBrandSoft text-nexoraBrand font-bold'
                      : 'text-nexoraText hover:bg-nexoraSurfaceMuted'
                  }`}
              >
                <span>{opt.label}</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
