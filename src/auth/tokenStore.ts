import { storage } from '../utils/storage'
import type { AuthTokens } from '../types/auth'

type TokenSubscriber = (tokens: AuthTokens | null) => void
interface TokenStoreSetOptions {
  silent?: boolean
}

let subscribers: TokenSubscriber[] = []

export const tokenStore = {
  get(): AuthTokens | null {
    const raw = storage.getItem('nexora_auth_tokens')
    if (!raw) return null
    try {
      return JSON.parse(raw) as AuthTokens
    } catch {
      return null
    }
  },

  set(tokens: AuthTokens | null | undefined, options: TokenStoreSetOptions = {}) {
    if (!tokens) {
      this.clear()
      return
    }
    storage.setItem('nexora_auth_tokens', JSON.stringify(tokens))
    if (options.silent) {
      return
    }
    const currentSubscribers = [...subscribers]
    for (const fn of currentSubscribers) {
      try {
        fn(tokens)
      } catch {
        // Prevent subscriber errors from halting execution
      }
    }
  },

  clear() {
    storage.removeItem('nexora_auth_tokens')
    const currentSubscribers = [...subscribers]
    for (const fn of currentSubscribers) {
      try {
        fn(null)
      } catch {
        // Prevent subscriber errors from halting execution
      }
    }
  },

  subscribe(fn: TokenSubscriber) {
    subscribers.push(fn)
    return () => {
      subscribers = subscribers.filter((s) => s !== fn)
    }
  },
}

export default tokenStore
