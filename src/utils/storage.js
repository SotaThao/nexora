import { logger } from './logger'

const isTest = typeof process !== 'undefined' && (process.env.NODE_ENV === 'test' || process.env.VITEST)

export const STORAGE_PREFIX = isTest ? '' : 'nexora_v3_'

export const storage = {
  getItem: (key) => {
    const sessionVal = sessionStorage.getItem(STORAGE_PREFIX + key)
    if (sessionVal !== null) return sessionVal
    return localStorage.getItem(STORAGE_PREFIX + key)
  },
  setItem: (key, value) => {
    const fullKey = STORAGE_PREFIX + key
    sessionStorage.setItem(fullKey, value)
    localStorage.setItem(fullKey, value)
  },
  removeItem: (key) => {
    const fullKey = STORAGE_PREFIX + key
    sessionStorage.removeItem(fullKey)
    localStorage.removeItem(fullKey)
  }
}

export const initStorage = () => {
  if (isTest) return

  const currentPrefix = localStorage.getItem('nexora_active_storage_prefix')
  if (currentPrefix !== STORAGE_PREFIX) {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i)
      if (key && (key.startsWith('nexora_') || key.startsWith('vlinkpay_'))) {
        localStorage.removeItem(key)
      }
    }
    for (let i = sessionStorage.length - 1; i >= 0; i--) {
      const key = sessionStorage.key(i)
      if (key && (key.startsWith('nexora_') || key.startsWith('vlinkpay_'))) {
        sessionStorage.removeItem(key)
      }
    }
    localStorage.setItem('nexora_active_storage_prefix', STORAGE_PREFIX)
    logger.info(`Nexora Storage Version upgraded to: ${STORAGE_PREFIX}. Cleared legacy data.`)
  }
}
