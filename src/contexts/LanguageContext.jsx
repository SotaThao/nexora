import React, { createContext, useState, useEffect, useContext } from 'react'
import en from '../locales/en.json'
import vi from '../locales/vi.json'

const translations = { en, vi }

const LanguageContext = createContext()

export function LanguageProvider({ children }) {
  const [currentLanguage, setCurrentLanguageState] = useState(() => {
    const saved = localStorage.getItem('nexora_lang')
    if (saved === 'en' || saved === 'vi') return saved
    // Fallback to browser language or default to 'vi'
    const browserLang = navigator.language || navigator.userLanguage
    return browserLang?.startsWith('vi') ? 'vi' : 'en'
  })

  const setLanguage = (lang) => {
    if (lang === 'en' || lang === 'vi') {
      setCurrentLanguageState(lang)
      localStorage.setItem('nexora_lang', lang)
    }
  }

  // Translation helper with dot notation and interpolation support
  const t = (key, variables = {}) => {
    const dictionary = translations[currentLanguage] || translations['vi']
    const keys = key.split('.')
    let value = dictionary
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k]
      } else {
        value = key
        break
      }
    }

    if (typeof value === 'string') {
      return Object.entries(variables).reduce((acc, [k, v]) => {
        return acc.replace(new RegExp(`{${k}}`, 'g'), v)
      }, value)
    }
    
    return value
  }

  return (
    <LanguageContext.Provider value={{ currentLanguage, setLanguage, t }}>
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
