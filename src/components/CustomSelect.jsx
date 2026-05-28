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
  size = 'md'
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

  return (
    <div className={`relative w-full ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between border border-nexoraBorder rounded-lg text-nexoraText bg-white focus:outline-none transition-all cursor-pointer select-none text-left focus:border-nexoraBrand focus:ring-1 focus:ring-nexoraBrand/20
          ${isSmall ? 'h-9 px-3 text-xs font-semibold' : 'min-h-[42px] px-4 py-2.5 text-sm'}
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
