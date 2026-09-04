/**
 * UUID v4 generator that survives browsers without `crypto.randomUUID`.
 *
 * Safari exposes `crypto.randomUUID` only from 15.4 AND only in a secure
 * context — over plain http (LAN IP, a host without TLS) the call throws
 * "crypto.randomUUID is not a function" and takes the whole screen down.
 * Falls back to `crypto.getRandomValues`, then to Math.random as a last resort
 * (ids here are client-side keys/session ids, not secrets).
 */
export function randomUuid(): string {
  const cryptoObj: Crypto | undefined =
    typeof globalThis === 'undefined' ? undefined : globalThis.crypto

  if (cryptoObj && typeof cryptoObj.randomUUID === 'function') {
    return cryptoObj.randomUUID()
  }

  const bytes = new Uint8Array(16)
  if (cryptoObj && typeof cryptoObj.getRandomValues === 'function') {
    cryptoObj.getRandomValues(bytes)
  } else {
    for (let index = 0; index < bytes.length; index += 1) {
      bytes[index] = Math.floor(Math.random() * 256)
    }
  }

  bytes[6] = (bytes[6] & 0x0f) | 0x40 // version 4
  bytes[8] = (bytes[8] & 0x3f) | 0x80 // variant 10xx

  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0'))
  return [
    hex.slice(0, 4).join(''),
    hex.slice(4, 6).join(''),
    hex.slice(6, 8).join(''),
    hex.slice(8, 10).join(''),
    hex.slice(10, 16).join(''),
  ].join('-')
}

export default randomUuid

/** Client-only cache placeholder. Never send this to the API as a line id. */
export const OPTIMISTIC_ID_PREFIX = 'optimistic-'

export function isOptimisticId(id?: string | null): boolean {
  return typeof id === 'string' && id.startsWith(OPTIMISTIC_ID_PREFIX)
}

export function isPersistedLineId(id?: string | null): boolean {
  return Boolean(id) && !isOptimisticId(id)
}

export function unlessOptimisticId<T>(
  id: string | null | undefined,
  request: () => Promise<T>,
  skipped: T,
): Promise<T> {
  if (isOptimisticId(id)) return Promise.resolve(skipped)
  return request()
}
