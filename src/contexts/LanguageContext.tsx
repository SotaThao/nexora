import React, { createContext, useState, useEffect, useContext } from 'react'
import en from '../locales/en.json'
import vi from '../locales/vi.json'

const translations: Record<string, Record<string, unknown>> = { en, vi }

interface LanguageContextValue {
  currentLanguage: 'en' | 'vi'
  setLanguage: (lang: 'en' | 'vi') => void
  t: (key: string, variables?: Record<string, string | number>) => string
  renderLabel: (text: unknown) => React.ReactNode
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [currentLanguage, setCurrentLanguageState] = useState<'en' | 'vi'>(() => {
    const saved = localStorage.getItem('nexora_lang')
    if (saved === 'en' || saved === 'vi') return saved
    const browserLang = navigator.language || (navigator as any).userLanguage
    return browserLang?.startsWith('vi') ? 'vi' : 'en'
  })

  const setLanguage = (lang: 'en' | 'vi') => {
    if (lang === 'en' || lang === 'vi') {
      setCurrentLanguageState(lang)
      localStorage.setItem('nexora_lang', lang)
    }
  }

  const t = (key: string, variables: Record<string, string | number> = {}): string => {
    const dictionary = translations[currentLanguage] || translations['vi']
    const keys = key.split('.')
    let value: unknown = dictionary

    for (const k of keys) {
      if (value && typeof value === 'object' && k in (value as object)) {
        value = (value as Record<string, unknown>)[k]
      } else {
        value = key
        break
      }
    }

    if (typeof value === 'string') {
      return Object.entries(variables).reduce((acc, [k, v]) => {
        return acc.replace(new RegExp(`{${k}}`, 'g'), String(v))
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

export function renderLabel(text: unknown): React.ReactNode {
  if (typeof text !== 'string') return text as React.ReactNode
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

export function useTranslation(): LanguageContextValue {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useTranslation must be used within a LanguageProvider')
  }
  return context
}
