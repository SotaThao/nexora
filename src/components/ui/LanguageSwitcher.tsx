// LanguageSwitcher — original stacked globe + language code button, opens a dropdown on click.
import { useState, useRef, useEffect } from 'react'
import { Check, ChevronDown, Globe } from 'lucide-react'
import { useTranslation } from '../../contexts/LanguageContext'

const LANGUAGE_OPTIONS = [
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'vi', label: 'Tiếng Việt', flag: '🇻🇳' },
] as const

export default function LanguageSwitcher({ className = '', variant = 'header' }) {
  const { currentLanguage, setLanguage, t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef(null)
  const isSidebar = variant === 'sidebar'
  const currentLanguageLabel = LANGUAGE_OPTIONS.find((language) => language.code === currentLanguage)?.label
    ?? currentLanguage.toUpperCase()

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
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Select language"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        className={isSidebar
          ? 'flex h-9 w-full items-center gap-2.5 rounded-lg px-3 text-left text-xs font-bold text-white/75 transition hover:bg-white/5 hover:text-white'
          : 'flex flex-col items-center justify-center rounded-lg border border-nexoraBorder bg-nexoraSurfaceMuted px-2 py-1 leading-none text-nexoraText transition hover:bg-nexoraCanvas'}
      >
        {isSidebar ? (
          <>
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-white/30" />
            <span className="flex-1">
              {t('staff_dashboard.profile.menu_language')}: {currentLanguageLabel}
            </span>
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </>
        ) : (
          <>
            <Globe className="h-4 w-4 text-nexoraMuted" />
            <span className="mt-0.5 text-[9px] font-bold uppercase tracking-wide">{currentLanguage}</span>
          </>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div
          role="listbox"
          aria-label="Language selection"
          className={`absolute top-full z-50 mt-1.5 min-w-[160px] overflow-hidden rounded-xl border border-nexoraBorder bg-white shadow-lg animate-fadeIn dark:bg-nexoraSidebar dark:border-white/10 ${
            isSidebar ? 'left-0 right-0' : 'right-0'
          }`}
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
