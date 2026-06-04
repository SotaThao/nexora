/**
 * Auth adapter factory — mirrors the data-layer adapter selection pattern.
 *
 * VITE_DATA_SOURCE=storage (default) → mockAuthAdapter
 * VITE_DATA_SOURCE=api              → apiAuthAdapter
 */
import { mockAuthAdapter } from './mockAuthAdapter'
import { apiAuthAdapter } from './apiAuthAdapter'

export function getAuthAdapter() {
  if (import.meta.env.VITE_DATA_SOURCE === 'api') {
    return apiAuthAdapter
  }
  return mockAuthAdapter
}

/** Resolved singleton — import this in AuthProvider. */
export const authAdapter = getAuthAdapter()

export default authAdapter
