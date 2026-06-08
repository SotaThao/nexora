import { storage } from '../utils/storage'

let subscribers = []

export const tokenStore = {
  /**
   * Retrieves the stored tokens from localStorage.
   * @returns {{ accessToken: string, refreshToken: string, tokenType?: string, expiresIn?: number }|null}
   */
  get() {
    const raw = storage.getItem('nexora_auth_tokens')
    if (!raw) return null
    try {
      return JSON.parse(raw)
    } catch (e) {
      return null
    }
  },

  /**
   * Stores the token object in localStorage.
   * @param {{ accessToken: string, refreshToken: string, tokenType?: string, expiresIn?: number }} tokens
   */
  set(tokens) {
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
  subscribe(fn) {
    subscribers.push(fn)
    return () => {
      subscribers = subscribers.filter((s) => s !== fn)
    }
  },
}

export default tokenStore
