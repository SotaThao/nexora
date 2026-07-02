/**
 * Resolves a raw QR code string to an in-app route path.
 * Returns null when the QR does not match any known app deep link.
 */
export function resolveQrToAppPath(raw: string): string | null {
  let pathname = ''
  let search = ''

  try {
    const url = new URL(raw)
    pathname = url.pathname
    search = url.search
  } catch {
    // Not a valid absolute URL — treat as a path if it starts with /
    if (raw.startsWith('/')) {
      const qIdx = raw.indexOf('?')
      pathname = qIdx >= 0 ? raw.slice(0, qIdx) : raw
      search = qIdx >= 0 ? raw.slice(qIdx) : ''
    } else {
      return null
    }
  }

  // Known in-app deep link patterns
  if (/^\/invite\/public\/[^/]+/.test(pathname)) return pathname + search
  if (/^\/invite\/[^/]+/.test(pathname)) return pathname + search
  if (/^\/join\/[^/]+/.test(pathname)) return pathname + search
  if (/^\/staff\/invite\/[^/]+/.test(pathname)) return pathname + search
  if (/^\/touch\/[^/]+\/[^/]+/.test(pathname)) return pathname + search
  // Payment QR codes: staff direct pay + business direct pay
  if (/^\/pay\/staff\/[^/]+/.test(pathname)) return pathname + search
  if (/^\/pay\/[^/]+/.test(pathname)) return pathname + search
  // Short QR redirect links
  if (/^\/help\/qr\/[^/]+/.test(pathname)) return pathname + search
  if (/^\/qr\/[^/]+/.test(pathname)) return pathname + search

  return null
}
