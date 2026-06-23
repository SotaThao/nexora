// LanguageSwitcher — original stacked globe + language code button, opens a dropdown on click.
import { useState, useRef, useEffect } from 'react'
import { Globe, Check } from 'lucide-react'
import { useTranslation } from '../../contexts/LanguageContext'

const LANGUAGE_OPTIONS = [
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'vi', label: 'Tiếng Việt', flag: '🇻🇳' },
]

export default function LanguageSwitcher({ className = '' }) {
  const { currentLanguage, setLanguage } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Original stacked button style */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Select language"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        className="flex flex-col items-center justify-center rounded-lg border border-nexoraBorder bg-nexoraSurfaceMuted px-2 py-1 leading-none text-nexoraText transition hover:bg-nexoraCanvas"
      >
        <Globe className="h-4 w-4 text-nexoraMuted" />
        <span className="mt-0.5 text-[9px] font-bold uppercase tracking-wide">{currentLanguage}</span>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div
          role="listbox"
          aria-label="Language selection"
          className="absolute right-0 top-full z-50 mt-1.5 min-w-[160px] overflow-hidden rounded-xl border border-nexoraBorder bg-white shadow-lg animate-fadeIn dark:bg-nexoraSidebar dark:border-white/10"
        >
          {LANGUAGE_OPTIONS.map((lang) => {
            const isSelected = currentLanguage === lang.code
            return (
              <button
                key={lang.code}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  setLanguage(lang.code)
                  setIsOpen(false)
                }}
                className={`flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-sm font-medium transition ${
                  isSelected
                    ? 'bg-nexoraBrand/5 text-nexoraBrand dark:bg-white/10 dark:text-white'
                    : 'text-nexoraText hover:bg-nexoraSurfaceMuted dark:text-white/75 dark:hover:bg-white/5'
                }`}
              >
                <span className="text-base">{lang.flag}</span>
                <span className="flex-1">{lang.label}</span>
                {isSelected && <Check className="h-4 w-4 text-nexoraBrand dark:text-brandCyan" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
