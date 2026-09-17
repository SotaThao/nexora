import {
  getSettingsCountryLabel,
  SETTINGS_COUNTRY_OPTIONS,
  type LocationParts,
} from './settingsLocationDetect'

const US_STATES = new Set((
  'AL|Alabama|AK|Alaska|AZ|Arizona|AR|Arkansas|CA|California|CO|Colorado|CT|Connecticut|DE|Delaware|DC|District of Columbia|'
  + 'FL|Florida|GA|Georgia|HI|Hawaii|ID|Idaho|IL|Illinois|IN|Indiana|IA|Iowa|KS|Kansas|KY|Kentucky|LA|Louisiana|'
  + 'ME|Maine|MD|Maryland|MA|Massachusetts|MI|Michigan|MN|Minnesota|MS|Mississippi|MO|Missouri|MT|Montana|'
  + 'NE|Nebraska|NV|Nevada|NH|New Hampshire|NJ|New Jersey|NM|New Mexico|NY|New York|NC|North Carolina|'
  + 'ND|North Dakota|OH|Ohio|OK|Oklahoma|OR|Oregon|PA|Pennsylvania|RI|Rhode Island|SC|South Carolina|'
  + 'SD|South Dakota|TN|Tennessee|TX|Texas|UT|Utah|VT|Vermont|VA|Virginia|WA|Washington|WV|West Virginia|WI|Wisconsin|WY|Wyoming'
).toLowerCase().split('|'))

const CANADIAN_PROVINCES = new Set((
  'AB|Alberta|BC|British Columbia|MB|Manitoba|NB|New Brunswick|NL|Newfoundland and Labrador|NS|Nova Scotia|'
  + 'NT|Northwest Territories|NU|Nunavut|ON|Ontario|PE|Prince Edward Island|QC|Quebec|SK|Saskatchewan|YT|Yukon'
).toLowerCase().split('|'))

const US_POSTAL_TAIL = /^(.+?)\s+(\d{5}(?:-\d{4})?)$/
const CANADIAN_POSTAL_TAIL = /^(.+?)\s+([ABCEGHJ-NPRSTVXY]\d[ABCEGHJ-NPRSTV-Z]\s?\d[ABCEGHJ-NPRSTV-Z]\d)$/i
const UK_POSTAL_TAIL = /^(?:(.+?)\s+)?([A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2})$/i
const JAPANESE_POSTAL_TAIL = /^(?:(.+?)\s+)?(\d{3}-\d{4})$/
const NUMERIC_POSTAL_TAIL = /^(?:(.+?)\s+)?(\d{4,6})$/

export function emptyCustomerLocation(): LocationParts {
  return { street: '', city: '', state: '', zip: '', country: 'US' }
}

function explicitCountry(value: string): string | undefined {
  const normalized = value.trim().toLowerCase()
  return SETTINGS_COUNTRY_OPTIONS.find(option =>
    option.value.toLowerCase() === normalized || option.label.toLowerCase() === normalized,
  )?.value
}

/** Legacy customer addresses have no structure; only split an unambiguous postal tail. */
export function splitCustomerAddress(raw: string): LocationParts {
  const text = raw.trim()
  const fallback = { ...emptyCustomerLocation(), street: text }
  const chunks = text.split(',').map(part => part.trim())
  const country = explicitCountry(chunks[chunks.length - 1] || '')
  const addressChunks = country ? chunks.slice(0, -1) : chunks
  if (addressChunks.length < 3 || addressChunks.some(part => !part)) return fallback

  const tail = addressChunks[addressChunks.length - 1]
  const usMatch = (!country || country === 'US') ? US_POSTAL_TAIL.exec(tail) : null
  const caMatch = (!country || country === 'CA') ? CANADIAN_POSTAL_TAIL.exec(tail) : null
  const internationalMatch = country && country !== 'US' && country !== 'CA'
    ? (country === 'GB' ? UK_POSTAL_TAIL : country === 'JP' ? JAPANESE_POSTAL_TAIL : NUMERIC_POSTAL_TAIL).exec(tail)
    : null
  const match = usMatch && US_STATES.has(usMatch[1].toLowerCase())
    ? { groups: usMatch, country: 'US' }
    : caMatch && CANADIAN_PROVINCES.has(caMatch[1].toLowerCase())
      ? { groups: caMatch, country: 'CA' }
      : internationalMatch && country
        ? { groups: internationalMatch, country }
        : null
  if (!match) return fallback

  return {
    street: addressChunks.slice(0, -2).join(', '),
    city: addressChunks[addressChunks.length - 2],
    state: match.groups[1] || '',
    zip: match.groups[2],
    country: match.country,
  }
}

export function formatCustomerAddress(location: LocationParts): string {
  return [
    location.street.trim(),
    location.city.trim(),
    [location.state.trim(), location.zip.trim()].filter(Boolean).join(' '),
    location.country.trim() ? getSettingsCountryLabel(location.country) : '',
  ].filter(Boolean).join(', ')
}

function escapedWords(value: string): string {
  return value.trim().split(/\s+/).map(part => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('\\s+')
}

/** Remove detected locality suffixes only; never replace words inside the road or unit. */
export function customerStreetFromGeocode(query: string, location: LocationParts): string {
  const original = query.trim()
  const parsed = splitCustomerAddress(original)
  if (parsed.city && parsed.zip) return parsed.street

  let street = original
  let removedLocality = false
  let removedCommaCountry = false
  let removedSuffixes = 0
  const removeSuffix = (value: string, kind: 'country' | 'postal' | 'locality') => {
    if (!value.trim()) return false
    const pattern = kind === 'postal'
      ? value.replace(/\s/g, '').split('').map(escapedWords).join('\\s*')
      : escapedWords(value)
    const match = new RegExp(`([,\\s]+)${pattern}$`, 'i').exec(street)
    if (!match) return false
    const next = street.slice(0, match.index).trim()
    if (!next) return false
    street = next
    if (kind === 'locality' && (removedSuffixes > 0 || match[1].includes(','))) removedLocality = true
    if (kind === 'country' && match[1].includes(',')) removedCommaCountry = true
    removedSuffixes += 1
    return true
  }

  if (location.country.trim()) {
    if (!removeSuffix(getSettingsCountryLabel(location.country), 'country')) {
      removeSuffix(location.country, 'country')
    }
  }
  const streetWithoutCountry = street
  removeSuffix(location.zip, 'postal')
  if (!removeSuffix(location.state, 'locality')) {
    const states = [...(location.country === 'CA' ? CANADIAN_PROVINCES : US_STATES)]
    const stateIndex = states.indexOf(location.state.trim().toLowerCase())
    if (stateIndex >= 0) removeSuffix(states[stateIndex % 2 === 0 ? stateIndex + 1 : stateIndex - 1], 'locality')
  }
  removeSuffix(location.city, 'locality')
  if (removedLocality) return street
  return removedCommaCountry ? streetWithoutCountry : original
}
