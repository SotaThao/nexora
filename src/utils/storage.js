import { isSupabaseConfigured, supabaseSync } from './supabase'

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
    
    // Non-blocking sync to Supabase
    if (isSupabaseConfigured && !isTest) {
      supabaseSync.push(fullKey, value)
    }
  },
  removeItem: (key) => {
    const fullKey = STORAGE_PREFIX + key
    sessionStorage.removeItem(fullKey)
    localStorage.removeItem(fullKey)
    
    // Non-blocking remove from Supabase
    if (isSupabaseConfigured && !isTest) {
      supabaseSync.remove(fullKey)
    }
  }
}

// Clean up old nexora versions and initialize prefix detection
export const initStorage = () => {
  if (isTest) return // Skip cleanup during unit tests
  
  const currentPrefix = localStorage.getItem('nexora_active_storage_prefix')
  if (currentPrefix !== STORAGE_PREFIX) {
    // Prefix changed or uninitialized! Clean up all old nexora keys
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i)
      if (key && (key.startsWith('nexora_') || key.startsWith('vlinkpay_'))) {
        localStorage.removeItem(key)
      }
    }
    // Also clean up sessionStorage
    for (let i = sessionStorage.length - 1; i >= 0; i--) {
      const key = sessionStorage.key(i)
      if (key && (key.startsWith('nexora_') || key.startsWith('vlinkpay_'))) {
        sessionStorage.removeItem(key)
      }
    }
    // Set the new prefix key
    localStorage.setItem('nexora_active_storage_prefix', STORAGE_PREFIX)
    console.log(`Nexora Storage Version upgraded to: ${STORAGE_PREFIX}. Cleared legacy data.`)
  }

  // If Supabase is active, run the pulling and real-time subscribing logic
  if (isSupabaseConfigured && !isTest) {
    console.log('Supabase detected! Syncing demo database...')
    supabaseSync.pullAll().then(() => {
      // Trigger event to inform Dashboard/App to refresh their state
      window.dispatchEvent(new StorageEvent('storage', { key: null, newValue: null }))
    })

    supabaseSync.subscribe((fullKey, valueStr) => {
      // Skip if key doesn't belong to current version prefix
      if (STORAGE_PREFIX && !fullKey.startsWith(STORAGE_PREFIX)) return

      const rawKey = STORAGE_PREFIX ? fullKey.slice(STORAGE_PREFIX.length) : fullKey

      if (valueStr === null) {
        sessionStorage.removeItem(fullKey)
        localStorage.removeItem(fullKey)
        window.dispatchEvent(new StorageEvent('storage', { key: rawKey, newValue: null }))
      } else {
        const localVal = localStorage.getItem(fullKey)
        if (localVal !== valueStr) {
          sessionStorage.setItem(fullKey, valueStr)
          localStorage.setItem(fullKey, valueStr)
          window.dispatchEvent(new StorageEvent('storage', { key: rawKey, newValue: valueStr }))
        }
      }
    })
  }
}
