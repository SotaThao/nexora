export interface MapAddressParts {
  street?: string
  city?: string
  state?: string
  zipCode?: string
  country?: string
}

/** Join profile address fields into a single geocoding query string. */
export function formatAddressForMap(parts: MapAddressParts): string {
  return [parts.street, parts.city, parts.state, parts.zipCode, parts.country]
    .map((value) => String(value ?? '').trim())
    .filter(Boolean)
    .join(', ')
}

/** Google Maps embed URL for an address query, or null when query is empty. */
export function buildGoogleMapsEmbedUrl(query: string): string | null {
  const trimmed = query.trim()
  if (!trimmed) return null
  return `https://maps.google.com/maps?q=${encodeURIComponent(trimmed)}&t=&z=14&ie=UTF8&iwloc=&output=embed`
}
