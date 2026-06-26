/** Shared app language persistence — used by homepage and dashboard. */
export const APP_LANG_STORAGE_KEY = 'nexora_lang'
const LEGACY_HOMEPAGE_LANG_STORAGE_KEY = 'nexora_homepage_lang'
export const APP_LANGUAGE_CHANGE_EVENT = 'nexora:language-change'

/**
 * @returns {'en' | 'vi'}
 */
export function getStoredAppLanguage() {
  try {
    const saved = localStorage.getItem(APP_LANG_STORAGE_KEY)
    if (saved === 'en' || saved === 'vi') return saved

    const legacy = localStorage.getItem(LEGACY_HOMEPAGE_LANG_STORAGE_KEY)
    if (legacy === 'en' || legacy === 'vi') {
      localStorage.setItem(APP_LANG_STORAGE_KEY, legacy)
      return legacy
    }
  } catch {
    // localStorage unavailable (SSR/tests)
  }
  return 'en'
}

/**
 * @param {'en' | 'vi'} lang
 */
export function setStoredAppLanguage(lang) {
  if (lang !== 'en' && lang !== 'vi') return

  try {
    localStorage.setItem(APP_LANG_STORAGE_KEY, lang)
  } catch {
    // ignore
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent(APP_LANGUAGE_CHANGE_EVENT, { detail: { lang } }),
    )
  }
}
