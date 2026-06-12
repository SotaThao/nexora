import { storage } from '../utils/storage'
import type { AuthTokens } from '../types/domain'

type TokenSubscriber = (tokens: AuthTokens | null) => void

let subscribers: TokenSubscriber[] = []

export const tokenStore = {
  /**
   * Retrieves the stored tokens from localStorage.
   * @returns {{ accessToken: string, refreshToken: string, tokenType?: string, expiresIn?: number }|null}
   */
  get(): AuthTokens | null {
    const raw = storage.getItem('nexora_auth_tokens')
    if (!raw) return null
    try {
      return JSON.parse(raw) as AuthTokens
    } catch (e) {
      return null
    }
  },

  /**
   * Stores the token object in localStorage.
   * @param {{ accessToken: string, refreshToken: string, tokenType?: string, expiresIn?: number }} tokens
   */
  set(tokens: AuthTokens | null) {
    if (!tokens) {
      this.clear()
      return
    }
    storage.setItem('nexora_auth_tokens', JSON.stringify(tokens))
    const currentSubscribers = [...subscribers]
    for (const fn of currentSubscribers) {
      try {
        fn(tokens)
      } catch (err) {
        // Prevent subscriber errors from halting execution
      }
    }
  },

  /**
   * Clears the stored tokens and notifies all subscribers.
   */
  clear() {
    storage.removeItem('nexora_auth_tokens')
    const currentSubscribers = [...subscribers]
    for (const fn of currentSubscribers) {
      try {
        fn(null)
      } catch (err) {
        // Prevent subscriber errors from halting execution
      }
    }
  },

  /**
   * Subscribes a listener to token changes (specifically clear events).
   * @param {() => void} fn
   * @returns {() => void} unsubscribe function
   */
  subscribe(fn: TokenSubscriber): () => void {
    subscribers.push(fn)
    return () => {
      subscribers = subscribers.filter((s) => s !== fn)
    }
  },
}

export default tokenStore
