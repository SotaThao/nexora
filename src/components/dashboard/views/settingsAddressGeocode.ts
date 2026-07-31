import tzlookup from "@photostructure/tz-lookup"
import {
  mapToSettingsTimeZone,
  parseFreeformAddressHints,
  resolveCountryFromGeocode,
  type LocationParts,
} from "./settingsLocationDetect"

const MIN_ADDRESS_QUERY_LENGTH = 8

type GoogleAddressComponent = {
  long_name?: string
  short_name?: string
  types?: string[]
}

type GoogleGeocodeResult = {
  formatted_address?: string
  address_components?: GoogleAddressComponent[]
  geometry?: {
    location?: { lat?: number; lng?: number }
  }
}

type GoogleGeocodeResponse = {
  status?: string
  results?: GoogleGeocodeResult[]
  error_message?: string
}

type NominatimAddress = {
  road?: string
  house_number?: string
  suburb?: string
  neighbourhood?: string
  city?: string
  town?: string
  village?: string
  municipality?: string
  county?: string
  state?: string
  postcode?: string
  country_code?: string
  country?: string
}

type NominatimResult = {
  lat?: string
  lon?: string
  display_name?: string
  address?: NominatimAddress
}

export type GeocodedSalonAddress = {
  location: LocationParts
  /** Display name for country (used when appending to dropdown). */
  countryLabel: string
  timeZone: string | null
  formattedAddress: string
  lat: number
  lng: number
}

export function getGoogleMapsApiKey(): string {
  return String(import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "").trim()
}

export function canGeocodeSalonAddress(): boolean {
  return true
}

export function isGeocodeAddressQueryReady(query: string): boolean {
  return query.trim().length >= MIN_ADDRESS_QUERY_LENGTH
}

function normalizeAddressTypos(query: string): string {
  return query
    .replace(/\bsuit\b/gi, "suite")
    .replace(/\bste\b/gi, "suite")
    .replace(/\s+/g, " ")
    .trim()
}

function stripUnitDesignator(query: string): string {
  return query
    .replace(/\b(?:suite|suit|ste|unit|apt|#)\s*[A-Za-z0-9-]+\b/gi, " ")
    .replace(/\s+/g, " ")
    .replace(/\s+,/g, ",")
    .trim()
}

/** Build Nominatim/Google-friendly query shapes from free-form input. */
function buildGeocodeQueryCandidates(query: string): string[] {
  const trimmed = query.trim()
  const normalized = normalizeAddressTypos(trimmed)
  const withoutUnit = stripUnitDesignator(normalized)
  const candidates: string[] = [trimmed, normalized, withoutUnit]

  // Drop leading house number for a place-level fallback.
  const withoutHouseNo = withoutUnit.replace(/^\d+[A-Za-z./-]*\s+/, "").trim()
  if (withoutHouseNo && withoutHouseNo !== withoutUnit) {
    candidates.push(withoutHouseNo)
  }

  const hints = parseFreeformAddressHints(normalized)
  if (hints.city && hints.state && hints.zip) {
    candidates.push(`${hints.city}, ${hints.state} ${hints.zip}`)
    candidates.push(`${hints.city} ${hints.state} ${hints.zip}`)
    const streetOnly = withoutUnit
      .replace(new RegExp(`\\b${hints.zip}\\b`, "i"), " ")
      .replace(new RegExp(`\\b${hints.state}\\b`, "i"), " ")
      .replace(new RegExp(`\\b${hints.city}\\b`, "i"), " ")
      .replace(/[,\s]+/g, " ")
      .trim()
    if (streetOnly) {
      candidates.push(
        `${streetOnly}, ${hints.city}, ${hints.state} ${hints.zip}`,
      )
    }
  } else if (hints.city && hints.zip) {
    candidates.push(`${hints.city} ${hints.zip}`)
  } else if (hints.city && hints.state) {
    candidates.push(`${hints.city}, ${hints.state}`)
  } else if (hints.zip) {
    candidates.push(hints.zip)
  }

  return [...new Set(candidates.filter(Boolean))]
}

function componentByType(
  components: GoogleAddressComponent[],
  type: string,
): GoogleAddressComponent | undefined {
  return components.find((item) => item.types?.includes(type))
}

function componentText(
  component: GoogleAddressComponent | undefined,
  preferShort = false,
): string {
  if (!component) return ""
  if (preferShort) {
    return String(component.short_name || component.long_name || "").trim()
  }
  return String(component.long_name || component.short_name || "").trim()
}

function hasLatinLetters(value: string) {
  return /[A-Za-z]/.test(value)
}

function preferReadableLabel(preferred: string, fallback: string) {
  const a = preferred.trim()
  const b = fallback.trim()
  if (a && hasLatinLetters(a)) return a
  if (b && hasLatinLetters(b)) return b
  return a || b
}

function mergeLocationWithFreeformHints(
  location: LocationParts,
  query: string,
): LocationParts {
  const hints = parseFreeformAddressHints(query)
  return {
    street: query.trim(),
    city: preferReadableLabel(hints.city || "", location.city),
    state: preferReadableLabel(hints.state || "", location.state),
    zip: hints.zip || location.zip,
    country: location.country || hints.country || "US",
  }
}

function parseGoogleLocationParts(
  components: GoogleAddressComponent[],
  fallbackStreet: string,
): { location: LocationParts; countryLabel: string } {
  const city =
    componentText(componentByType(components, "locality")) ||
    componentText(componentByType(components, "postal_town")) ||
    componentText(componentByType(components, "sublocality")) ||
    componentText(componentByType(components, "administrative_area_level_2"))

  const state = componentText(
    componentByType(components, "administrative_area_level_1"),
    true,
  )
  const zip = componentText(componentByType(components, "postal_code"))
  const countryMeta =
    resolveCountryFromGeocode(
      componentText(componentByType(components, "country"), true),
      componentText(componentByType(components, "country")),
    ) || { code: "US", label: "United States" }

  return {
    location: mergeLocationWithFreeformHints(
      {
        street: fallbackStreet.trim(),
        city,
        state,
        zip,
        country: countryMeta.code,
      },
      fallbackStreet,
    ),
    countryLabel: countryMeta.label,
  }
}

function parseNominatimLocationParts(
  address: NominatimAddress | undefined,
  fallbackStreet: string,
): { location: LocationParts; countryLabel: string } {
  const city =
    address?.city ||
    address?.town ||
    address?.village ||
    address?.municipality ||
    ""
  const state =
    address?.state ||
    address?.suburb ||
    address?.county ||
    address?.neighbourhood ||
    ""
  const zip = address?.postcode || ""
  const countryMeta =
    resolveCountryFromGeocode(address?.country_code, address?.country) || {
      code: "US",
      label: "United States",
    }

  return {
    location: mergeLocationWithFreeformHints(
      {
        street: fallbackStreet.trim(),
        city: String(city).trim(),
        state: String(state).trim(),
        zip: String(zip).trim(),
        country: countryMeta.code,
      },
      fallbackStreet,
    ),
    countryLabel: countryMeta.label,
  }
}

function resolveTimeZone(lat: number, lng: number): string | null {
  try {
    return mapToSettingsTimeZone(tzlookup(lat, lng))
  } catch {
    return null
  }
}

async function geocodeWithGoogle(
  query: string,
  signal?: AbortSignal,
): Promise<GeocodedSalonAddress | null> {
  const key = getGoogleMapsApiKey()
  if (!key) return null

  for (const candidate of buildGeocodeQueryCandidates(query)) {
    if (signal?.aborted) return null

    const url = new URL("https://maps.googleapis.com/maps/api/geocode/json")
    url.searchParams.set("address", candidate)
    url.searchParams.set("key", key)

    const response = await fetch(url.toString(), { signal })
    if (!response.ok) continue

    const payload = (await response.json()) as GoogleGeocodeResponse
    if (payload.status !== "OK" || !payload.results?.length) continue

    const top = payload.results[0]
    const lat = Number(top.geometry?.location?.lat)
    const lng = Number(top.geometry?.location?.lng)
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue

    const parsed = parseGoogleLocationParts(
      top.address_components || [],
      query,
    )
    const timeZone = resolveTimeZone(lat, lng)

    return {
      location: parsed.location,
      countryLabel: parsed.countryLabel,
      timeZone,
      formattedAddress: String(top.formatted_address || query).trim(),
      lat,
      lng,
    }
  }

  return null
}

async function geocodeWithNominatim(
  query: string,
  signal?: AbortSignal,
): Promise<GeocodedSalonAddress | null> {
  const candidates = buildGeocodeQueryCandidates(query)
  // Only bias countrycodes when freeform already resolved an ISO2 (e.g. US).
  // Otherwise search worldwide so KR/IT/TH/... work without hardcoding.
  const hints = parseFreeformAddressHints(query)
  const countrycodes = hints.country?.toLowerCase() || ""

  for (const candidate of candidates) {
    if (signal?.aborted) return null

    const url = new URL("https://nominatim.openstreetmap.org/search")
    url.searchParams.set("q", candidate)
    url.searchParams.set("format", "json")
    url.searchParams.set("addressdetails", "1")
    url.searchParams.set("limit", "1")
    if (countrycodes) url.searchParams.set("countrycodes", countrycodes)

    const response = await fetch(url.toString(), {
      signal,
      headers: {
        Accept: "application/json",
        "Accept-Language": "en",
      },
    })
    if (!response.ok) continue

    const payload = (await response.json()) as NominatimResult[]
    if (!Array.isArray(payload) || payload.length === 0) continue

    const top = payload[0]
    const lat = Number(top.lat)
    const lng = Number(top.lon)
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue

    const parsed = parseNominatimLocationParts(top.address, query)
    const timeZone = resolveTimeZone(lat, lng)

    return {
      location: parsed.location,
      countryLabel: parsed.countryLabel,
      timeZone,
      formattedAddress: String(top.display_name || query).trim(),
      lat,
      lng,
    }
  }

  return null
}

/**
 * Geocode a free-form address → structured fields + IANA timezone.
 * Country/timezone come from the geocoder + lat/lng, not a hardcoded map.
 */
export async function geocodeSalonAddress(
  query: string,
  signal?: AbortSignal,
): Promise<GeocodedSalonAddress | null> {
  const address = query.trim()
  if (!isGeocodeAddressQueryReady(address)) return null

  const fromGoogle = await geocodeWithGoogle(address, signal)
  if (fromGoogle) return fromGoogle
  if (signal?.aborted) return null

  return geocodeWithNominatim(address, signal)
}
