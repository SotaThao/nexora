// LanguageSwitcher — grouped globe icon with the active language label below it.
// Single control that toggles between VI and EN (the two supported languages).
import { Globe } from 'lucide-react'
import { useTranslation } from '../../contexts/LanguageContext'

export default function LanguageSwitcher({ className = '' }) {
  const { currentLanguage, setLanguage } = useTranslation()
  const next = currentLanguage === 'vi' ? 'en' : 'vi'

  return (
    <button
      type="button"
      onClick={() => setLanguage(next)}
      aria-label={`Switch language to ${next.toUpperCase()}`}
      title={`Switch language to ${next.toUpperCase()}`}
      className={`flex flex-col items-center justify-center rounded-lg border border-nexoraBorder bg-nexoraSurfaceMuted px-2 py-1 leading-none text-nexoraText transition hover:bg-nexoraCanvas ${className}`}
    >
      <Globe className="h-4 w-4 text-nexoraMuted" />
      <span className="mt-0.5 text-[9px] font-bold uppercase tracking-wide">{currentLanguage}</span>
    </button>
  )
}
