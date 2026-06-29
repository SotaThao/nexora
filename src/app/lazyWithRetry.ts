import { lazy, type ComponentType, type LazyExoticComponent } from 'react'

const CHUNK_RELOAD_KEY = 'nexora-chunk-reload'

function isChunkLoadError(error: unknown) {
  const message = String((error as Error)?.message || error || '')
  return (
    message.includes('Failed to fetch dynamically imported module')
    || message.includes('Importing a module script failed')
    || message.includes('error loading dynamically imported module')
  )
}

type LazyModule<T extends ComponentType<unknown>> = { default: T }

/**
 * Wrap React.lazy so a stale app shell after deploy auto-reloads once
 * instead of showing a permanent error screen.
 */
export default function lazyWithRetry<T extends ComponentType<unknown>>(
  factory: () => Promise<LazyModule<T>>,
): LazyExoticComponent<T> {
  return lazy(async () => {
    try {
      const module = await factory()
      sessionStorage.removeItem(CHUNK_RELOAD_KEY)
      return module
    } catch (error) {
      if (!isChunkLoadError(error)) throw error

      const hasRetried = sessionStorage.getItem(CHUNK_RELOAD_KEY) === '1'
      if (!hasRetried) {
        sessionStorage.setItem(CHUNK_RELOAD_KEY, '1')
        window.location.reload()
        return new Promise(() => {})
      }

      throw error
    }
  })
}
