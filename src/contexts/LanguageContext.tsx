import { createContext, useState, useContext, useEffect, type ReactNode } from 'react'
import en from '../locales/en.json'
import vi from '../locales/vi.json'
import {
  APP_LANGUAGE_CHANGE_EVENT,
  getStoredAppLanguage,
  setStoredAppLanguage,
} from '../utils/appLanguage'
import { renderLabel } from '../utils/renderLabel'
import { resolveTranslation } from '../utils/translate'
import type { AppLanguage, LanguageContextValue, TranslationVariables } from '../types/contexts'

const translations = { en, vi }

const LanguageContext = createContext<LanguageContextValue | null>(null)

interface LanguageProviderProps {
  children: ReactNode
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [currentLanguage, setCurrentLanguageState] = useState<AppLanguage>(() =>
    getStoredAppLanguage(),
  )

  useEffect(() => {
    const handleLanguageChange = (event: Event) => {
      const lang = (event as CustomEvent<{ lang: AppLanguage }>).detail?.lang
      if (lang === 'en' || lang === 'vi') {
        setCurrentLanguageState(lang)
      }
    }

    window.addEventListener(APP_LANGUAGE_CHANGE_EVENT, handleLanguageChange)
    return () => window.removeEventListener(APP_LANGUAGE_CHANGE_EVENT, handleLanguageChange)
  }, [])

  const setLanguage = (lang: AppLanguage) => {
    if (lang === 'en' || lang === 'vi') {
      setCurrentLanguageState(lang)
      setStoredAppLanguage(lang)
    }
  }

  // Dot notation + interpolation live in resolveTranslation, shared with screens that pin
  // themselves to one language (see utils/translate.ts).
  const t: LanguageContextValue['t'] = (key, variables: TranslationVariables = {}) =>
    resolveTranslation(translations[currentLanguage] || translations.en, key, variables)

  return (
    <LanguageContext.Provider value={{ currentLanguage, setLanguage, t, renderLabel }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useTranslation() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useTranslation must be used within a LanguageProvider')
  }
  return context
}
