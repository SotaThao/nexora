/**
 * Adapter factory — selects the concrete adapter once at module-load time.
 *
 * VITE_DATA_SOURCE=storage  (default) → storageAdapter  (current phase)
 * VITE_DATA_SOURCE=api               → apiAdapter       (next phase)
 *
 * Repositories import `adapter` (the resolved singleton) rather than calling
 * getAdapter() themselves, so the selection happens exactly once.
 */
import { storageAdapter } from './storageAdapter'
import { apiAdapter } from './apiAdapter'

export function getAdapter() {
  if (import.meta.env.VITE_DATA_SOURCE === 'api') {
    return apiAdapter
  }
  return storageAdapter
}

/** Resolved singleton — import this in repositories. */
export const adapter = getAdapter()
