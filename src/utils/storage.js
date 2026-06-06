import { isSupabaseConfigured, supabaseSync } from './supabase'
import { logger } from './logger'

const isTest = typeof process !== 'undefined' && (process.env.NODE_ENV === 'test' || process.env.VITEST)

export const STORAGE_PREFIX = isTest ? '' : 'nexora_v3_'

const DYNAMIC_KEYS = [
  'nexora_merchant_setup',
  'nexora_profile_settings',
  'nexora_transactions',
  'nexora_reviews',
  'nexora_notifications',
  'nexora_pending_accounts',
  'nexora_staff_account'
]

const memoryStore = {}

export const storage = {
  getItem: (key) => {
    if (isSupabaseConfigured && !isTest && DYNAMIC_KEYS.includes(key)) {
      return memoryStore[key] || null
    }
    const sessionVal = sessionStorage.getItem(STORAGE_PREFIX + key)
    if (sessionVal !== null) return sessionVal
    return localStorage.getItem(STORAGE_PREFIX + key)
  },
  setItem: (key, value) => {
    const fullKey = STORAGE_PREFIX + key
    
    let valueWithTime = value
    try {
      const parsed = JSON.parse(value)
      if (parsed && typeof parsed === 'object') {
        parsed._client_updated_at = Date.now()
        valueWithTime = JSON.stringify(parsed)
      }
    } catch (e) {}

    if (isSupabaseConfigured && !isTest && DYNAMIC_KEYS.includes(key)) {
      memoryStore[key] = valueWithTime
      supabaseSync.push(fullKey, valueWithTime)
    } else {
      sessionStorage.setItem(fullKey, valueWithTime)
      localStorage.setItem(fullKey, valueWithTime)
      
      // Static keys sync (if applicable)
      if (isSupabaseConfigured && !isTest) {
        supabaseSync.push(fullKey, valueWithTime)
      }
    }
  },
  removeItem: (key) => {
    const fullKey = STORAGE_PREFIX + key
    
    if (isSupabaseConfigured && !isTest && DYNAMIC_KEYS.includes(key)) {
      delete memoryStore[key]
      supabaseSync.remove(fullKey)
    } else {
      sessionStorage.removeItem(fullKey)
      localStorage.removeItem(fullKey)
      
      if (isSupabaseConfigured && !isTest) {
        supabaseSync.remove(fullKey)
      }
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
    logger.info(`Nexora Storage Version upgraded to: ${STORAGE_PREFIX}. Cleared legacy data.`)
  }

  // If Supabase is active, run the migration, pulling, and subscribing logic
  if (isSupabaseConfigured && !isTest) {
    logger.info('Supabase detected! Migrating local storage dynamic data to database and clearing browser storage...')
    
    // 1. Perform Migration for each dynamic key
    DYNAMIC_KEYS.forEach(key => {
      const fullKey = STORAGE_PREFIX + key
      const localVal = localStorage.getItem(fullKey) || sessionStorage.getItem(fullKey)
      if (localVal) {
        // Populate in-memory store
        memoryStore[key] = localVal
        // Push to Supabase to persist in database
        supabaseSync.push(fullKey, localVal)
        // Clean up from native local and session storage
        localStorage.removeItem(fullKey)
        sessionStorage.removeItem(fullKey)
      }
    })

    // 2. Pull remote database values to populate memoryStore for any missing keys
    supabaseSync.pullAll().then((rows) => {
      if (rows && rows.length) {
        rows.forEach(row => {
          // Skip if key doesn't belong to current version prefix
          if (STORAGE_PREFIX && !row.id.startsWith(STORAGE_PREFIX)) return
          
          const rawKey = STORAGE_PREFIX ? row.id.slice(STORAGE_PREFIX.length) : row.id
          const valueStr = typeof row.data === 'object' ? JSON.stringify(row.data) : row.data
          
          if (DYNAMIC_KEYS.includes(rawKey)) {
            // Only update memory store if we don't have a newer migrated local state
            const currentMemVal = memoryStore[rawKey]
            let useRemote = true
            try {
              if (currentMemVal && valueStr) {
                const memParsed = JSON.parse(currentMemVal)
                const remoteParsed = JSON.parse(valueStr)
                if (memParsed && remoteParsed && memParsed._client_updated_at && remoteParsed._client_updated_at) {
                  if (remoteParsed._client_updated_at < memParsed._client_updated_at) {
                    useRemote = false
                  }
                }
              }
            } catch (e) {}
            
            if (useRemote) {
              memoryStore[rawKey] = valueStr
            }
          } else {
            // Static key, write to native storage
            sessionStorage.setItem(row.id, valueStr)
            localStorage.setItem(row.id, valueStr)
          }
        })
      }
      
      // Trigger event to inform Dashboard/App to refresh their state
      window.dispatchEvent(new StorageEvent('storage', { key: null, newValue: null }))
    })

    // 3. Subscribe to postgres realtime changes
    supabaseSync.subscribe((fullKey, valueStr) => {
      // Skip if key doesn't belong to current version prefix
      if (STORAGE_PREFIX && !fullKey.startsWith(STORAGE_PREFIX)) return

      const rawKey = STORAGE_PREFIX ? fullKey.slice(STORAGE_PREFIX.length) : fullKey

      if (valueStr === null) {
        if (DYNAMIC_KEYS.includes(rawKey)) {
          delete memoryStore[rawKey]
        } else {
          sessionStorage.removeItem(fullKey)
          localStorage.removeItem(fullKey)
        }
        window.dispatchEvent(new StorageEvent('storage', { key: rawKey, newValue: null }))
      } else {
        const localVal = DYNAMIC_KEYS.includes(rawKey)
          ? memoryStore[rawKey]
          : localStorage.getItem(fullKey)
        
        // Timestamp guard to prevent older database updates from overwriting newer local state
        try {
          if (localVal && valueStr) {
            const localParsed = JSON.parse(localVal)
            const remoteParsed = JSON.parse(valueStr)
            if (localParsed && remoteParsed && localParsed._client_updated_at && remoteParsed._client_updated_at) {
              if (remoteParsed._client_updated_at < localParsed._client_updated_at) {
                // Ignore older remote state to prevent flickering race condition
                return
              }
            }
          }
        } catch (e) {}

        if (localVal !== valueStr) {
          if (DYNAMIC_KEYS.includes(rawKey)) {
            memoryStore[rawKey] = valueStr
          } else {
            sessionStorage.setItem(fullKey, valueStr)
            localStorage.setItem(fullKey, valueStr)
          }
          window.dispatchEvent(new StorageEvent('storage', { key: rawKey, newValue: valueStr }))
        }
      }
    })
  }
}

