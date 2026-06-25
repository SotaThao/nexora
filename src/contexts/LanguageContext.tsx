import React, { createContext, useState, useContext, useEffect, type ReactNode } from 'react'
import en from '../locales/en.json'
import vi from '../locales/vi.json'
import {
  APP_LANGUAGE_CHANGE_EVENT,
  getStoredAppLanguage,
  setStoredAppLanguage,
} from '../utils/appLanguage'
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

  // Translation helper with dot notation and interpolation support
  const t: LanguageContextValue['t'] = (key, variables: TranslationVariables = {}) => {
    const dictionary = translations[currentLanguage] || translations.en
    const keys = key.split('.')
    let value: unknown = dictionary
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in (value as Record<string, unknown>)) {
        value = (value as Record<string, unknown>)[k]
      } else {
        value = key
        break
      }
    }

    if (typeof value === 'string') {
      return Object.entries(variables).reduce((acc, [k, v]) => {
        const replacement = String(v)
        // Support both {{key}} (i18next-style) and {key} placeholders.
        return acc
          .replace(new RegExp(`{{\\s*${k}\\s*}}`, 'g'), replacement)
          .replace(new RegExp(`{\\s*${k}\\s*}`, 'g'), replacement)
      }, value)
    }

    return String(value)
  }

  return (
    <LanguageContext.Provider value={{ currentLanguage, setLanguage, t, renderLabel }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function renderLabel(text: ReactNode): ReactNode {
  if (typeof text !== 'string') return text
  if (text.includes('*')) {
    const parts = text.split('*')
    return (
      <>
        {parts.map((part, idx) => (
          <React.Fragment key={idx}>
            {part}
            {idx < parts.length - 1 && (
              <span className="text-red-500 font-bold ml-0.5">*</span>
            )}
          </React.Fragment>
        ))}
      </>
    )
  }
  return text
}

export function useTranslation() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useTranslation must be used within a LanguageProvider')
  }
  return context
}
