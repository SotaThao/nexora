import { COUNTRY_CODES } from "../../../constants/countries"

export type SettingsCountryOption = {
  value: string
  label: string
  flag?: string
}

/** Base list = New Appointment phone countries. Geocode may add more. */
export const SETTINGS_COUNTRY_OPTIONS: SettingsCountryOption[] =
  COUNTRY_CODES.map((country) => ({
    value: country.code,
    label: country.name,
    flag: country.flag,
  }))

/** ISO2 country code — base list or geocode-discovered. */
export type SettingsCountryCode = string

const SETTINGS_COUNTRY_BY_CODE = new Map(
  COUNTRY_CODES.map((country) => [country.code, country] as const),
)

export type LocationParts = {
  street: string
  city: string
  state: string
  zip: string
  country: SettingsCountryCode
}

export const EMPTY_LOCATION: LocationParts = {
  street: "",
  city: "",
  state: "",
  zip: "",
  country: "US",
}

/** Common presets for the select; any geocoded IANA can be added dynamically. */
export const SETTINGS_TIMEZONE_OPTIONS = [
  "America/Los_Angeles",
  "America/Denver",
  "America/Chicago",
  "America/New_York",
  "America/Anchorage",
  "Pacific/Honolulu",
  "America/Toronto",
  "America/Vancouver",
  "America/Edmonton",
  "America/Winnipeg",
  "America/Mexico_City",
  "America/Tijuana",
  "Asia/Ho_Chi_Minh",
] as const

export type SettingsTimeZone = (typeof SETTINGS_TIMEZONE_OPTIONS)[number]

export const DEFAULT_SETTINGS_TIMEZONE: SettingsTimeZone = "America/Chicago"

const US_ZIP_IN_TEXT_RE = /\b(\d{5})(?:-\d{4})?\b/
const CA_POSTAL_IN_TEXT_RE =
  /\b([ABCEGHJ-NPRSTVXY]\d[ABCEGHJ-NPRSTV-Z]\s?\d[ABCEGHJ-NPRSTV-Z]\d)\b/i

const US_STATE_NAME_TO_CODE: Record<string, string> = {
  ALABAMA: "AL",
  ALASKA: "AK",
  ARIZONA: "AZ",
  ARKANSAS: "AR",
  CALIFORNIA: "CA",
  COLORADO: "CO",
  CONNECTICUT: "CT",
  DELAWARE: "DE",
  FLORIDA: "FL",
  GEORGIA: "GA",
  HAWAII: "HI",
  IDAHO: "ID",
  ILLINOIS: "IL",
  INDIANA: "IN",
  IOWA: "IA",
  KANSAS: "KS",
  KENTUCKY: "KY",
  LOUISIANA: "LA",
  MAINE: "ME",
  MARYLAND: "MD",
  MASSACHUSETTS: "MA",
  MICHIGAN: "MI",
  MINNESOTA: "MN",
  MISSISSIPPI: "MS",
  MISSOURI: "MO",
  MONTANA: "MT",
  NEBRASKA: "NE",
  NEVADA: "NV",
  "NEW HAMPSHIRE": "NH",
  "NEW JERSEY": "NJ",
  "NEW MEXICO": "NM",
  "NEW YORK": "NY",
  "NORTH CAROLINA": "NC",
  "NORTH DAKOTA": "ND",
  OHIO: "OH",
  OKLAHOMA: "OK",
  OREGON: "OR",
  PENNSYLVANIA: "PA",
  "RHODE ISLAND": "RI",
  "SOUTH CAROLINA": "SC",
  "SOUTH DAKOTA": "SD",
  TENNESSEE: "TN",
  TEXAS: "TX",
  UTAH: "UT",
  VERMONT: "VT",
  VIRGINIA: "VA",
  WASHINGTON: "WA",
  "WEST VIRGINIA": "WV",
  WISCONSIN: "WI",
  WYOMING: "WY",
}

const US_STATE_TIMEZONES: Array<{
  timeZone: SettingsTimeZone
  states: string[]
}> = [
  {
    timeZone: "America/Los_Angeles",
    states: [
      "CA",
      "CALIFORNIA",
      "NV",
      "NEVADA",
      "OR",
      "OREGON",
      "WA",
      "WASHINGTON",
    ],
  },
  {
    timeZone: "America/Denver",
    states: [
      "AZ",
      "ARIZONA",
      "CO",
      "COLORADO",
      "ID",
      "IDAHO",
      "MT",
      "MONTANA",
      "NM",
      "NEW MEXICO",
      "UT",
      "UTAH",
      "WY",
      "WYOMING",
    ],
  },
  {
    timeZone: "America/New_York",
    states: [
      "CT",
      "CONNECTICUT",
      "DE",
      "DELAWARE",
      "FL",
      "FLORIDA",
      "GA",
      "GEORGIA",
      "ME",
      "MAINE",
      "MD",
      "MARYLAND",
      "MA",
      "MASSACHUSETTS",
      "NH",
      "NEW HAMPSHIRE",
      "NJ",
      "NEW JERSEY",
      "NY",
      "NEW YORK",
      "NC",
      "NORTH CAROLINA",
      "OH",
      "OHIO",
      "PA",
      "PENNSYLVANIA",
      "RI",
      "RHODE ISLAND",
      "SC",
      "SOUTH CAROLINA",
      "VT",
      "VERMONT",
      "VA",
      "VIRGINIA",
      "WV",
      "WEST VIRGINIA",
    ],
  },
  {
    timeZone: "America/Chicago",
    states: [
      "AL",
      "ALABAMA",
      "AR",
      "ARKANSAS",
      "IA",
      "IOWA",
      "IL",
      "ILLINOIS",
      "KS",
      "KANSAS",
      "KY",
      "KENTUCKY",
      "LA",
      "LOUISIANA",
      "MN",
      "MINNESOTA",
      "MS",
      "MISSISSIPPI",
      "MO",
      "MISSOURI",
      "NE",
      "NEBRASKA",
      "ND",
      "NORTH DAKOTA",
      "OK",
      "OKLAHOMA",
      "SD",
      "SOUTH DAKOTA",
      "TN",
      "TENNESSEE",
      "TX",
      "TEXAS",
      "WI",
      "WISCONSIN",
    ],
  },
  {
    timeZone: "America/Anchorage",
    states: ["AK", "ALASKA"],
  },
  {
    timeZone: "Pacific/Honolulu",
    states: ["HI", "HAWAII"],
  },
]

/** Map uncommon US IANA zones onto the preset select options. */
const TIMEZONE_ALIASES: Record<string, SettingsTimeZone> = {
  "America/Phoenix": "America/Denver",
  "America/Boise": "America/Denver",
  "America/Detroit": "America/New_York",
  "America/Indiana/Indianapolis": "America/New_York",
  "America/Kentucky/Louisville": "America/New_York",
  "America/Montreal": "America/Toronto",
  "America/Creston": "America/Vancouver",
  "America/Whitehorse": "America/Vancouver",
  "America/Halifax": "America/Toronto",
  "America/St_Johns": "America/Toronto",
  "America/Regina": "America/Edmonton",
  "America/Cancun": "America/Mexico_City",
  "America/Merida": "America/Mexico_City",
  "America/Monterrey": "America/Mexico_City",
  "America/Mazatlan": "America/Mexico_City",
  "America/Chihuahua": "America/Mexico_City",
  "Asia/Saigon": "Asia/Ho_Chi_Minh",
}

/**
 * Resolve any geocoder country (ISO2 + optional English name).
 * Unknown ISO codes are kept as-is so the UI can append them to the dropdown.
 */
export function resolveCountryFromGeocode(
  isoCode?: string | null,
  countryName?: string | null,
): { code: string; label: string } | null {
  const code = String(isoCode || "")
    .trim()
    .toUpperCase()
  if (!/^[A-Z]{2}$/.test(code)) return null

  const known = SETTINGS_COUNTRY_BY_CODE.get(code as (typeof COUNTRY_CODES)[number]["code"])
  const label =
    known?.name ||
    String(countryName || "").trim() ||
    code

  return { code, label }
}

export function tryParseSettingsCountry(
  value: string,
): SettingsCountryCode | null {
  const raw = value.trim()
  if (!raw) return null
  const upper = raw.toUpperCase()

  if (SETTINGS_COUNTRY_BY_CODE.has(upper as (typeof COUNTRY_CODES)[number]["code"])) {
    return upper
  }

  const byName = COUNTRY_CODES.find(
    (country) => country.name.toUpperCase() === upper,
  )
  if (byName) return byName.code

  // Any ISO-3166 alpha-2 from geocoders / config.
  if (/^[A-Z]{2}$/.test(upper)) return upper

  return null
}

export function normalizeSettingsCountry(value: string): SettingsCountryCode {
  return tryParseSettingsCountry(value) || "US"
}

export function isKnownSettingsCountryCode(value: string): boolean {
  return SETTINGS_COUNTRY_BY_CODE.has(
    value.trim().toUpperCase() as (typeof COUNTRY_CODES)[number]["code"],
  )
}

export function getSettingsCountryLabel(code: string, fallbackName?: string) {
  const upper = code.trim().toUpperCase()
  const known = SETTINGS_COUNTRY_BY_CODE.get(
    upper as (typeof COUNTRY_CODES)[number]["code"],
  )
  if (known) return known.name
  const name = String(fallbackName || "").trim()
  if (name) return name
  return upper
}

export function isSettingsCountryCode(
  value: string,
): value is SettingsCountryCode {
  return Boolean(tryParseSettingsCountry(value))
}

export function isSettingsTimeZone(value: string): value is SettingsTimeZone {
  return (SETTINGS_TIMEZONE_OPTIONS as readonly string[]).includes(value)
}

/** Prefer preset alias when available; otherwise keep the exact IANA id. */
export function mapToSettingsTimeZone(
  iana: string | null | undefined,
): string | null {
  const zone = String(iana || "").trim()
  if (!zone) return null
  if (isSettingsTimeZone(zone)) return zone
  if (TIMEZONE_ALIASES[zone]) return TIMEZONE_ALIASES[zone]
  return zone
}

/**
 * Offline fallback from Address text only (US state / CA province patterns).
 * Primary path is always geocode → lat/lng → tz-lookup.
 */
export function detectTimeZoneFromAddressText(
  address: string,
): string | null {
  const text = address.trim()
  if (!text) return null

  const usState = findUsStateInText(text)
  if (usState) {
    for (const entry of US_STATE_TIMEZONES) {
      if (entry.states.includes(usState.code)) return entry.timeZone
    }
  }

  const upper = text.toUpperCase()
  if (/\b(BC|BRITISH COLUMBIA|VANCOUVER)\b/.test(upper)) {
    return "America/Vancouver"
  }
  if (/\b(AB|ALBERTA|SK|SASKATCHEWAN|CALGARY|EDMONTON)\b/.test(upper)) {
    return "America/Edmonton"
  }
  if (/\b(MB|MANITOBA|WINNIPEG)\b/.test(upper)) return "America/Winnipeg"
  if (/\b(ON|ONTARIO|TORONTO|QC|QUEBEC|MONTREAL)\b/.test(upper)) {
    return "America/Toronto"
  }

  return null
}

/** Best-effort split of a stored address into HTML location fields. */
export function splitSettingsAddress(raw: string): LocationParts {
  const text = String(raw || "").trim()
  if (!text) return { ...EMPTY_LOCATION }
  const chunks = text
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
  if (chunks.length >= 4) {
    const country = normalizeSettingsCountry(chunks[chunks.length - 1])
    const stateZip = chunks[chunks.length - 2]
    const city = chunks[chunks.length - 3]
    const street = chunks.slice(0, -3).join(", ")
    const [state, ...zipParts] = stateZip.split(/\s+/).filter(Boolean)
    return {
      street,
      city,
      state: state || "",
      zip: zipParts.join(" "),
      country,
    }
  }
  if (chunks.length === 3) {
    const stateZip = chunks[2]
    const [state, ...zipParts] = stateZip.split(/\s+/).filter(Boolean)
    return {
      street: chunks[0],
      city: chunks[1],
      state: state || "",
      zip: zipParts.join(" "),
      country: "US",
    }
  }
  return { ...EMPTY_LOCATION, street: text }
}

function normalizeStateToken(value: string) {
  return value.trim().toUpperCase().replace(/\./g, "")
}

function findUsStateInText(text: string): { code: string; match: string } | null {
  const upper = text.toUpperCase().replace(/,/g, " ")
  const names = Object.keys(US_STATE_NAME_TO_CODE).sort(
    (a, b) => b.length - a.length,
  )
  for (const name of names) {
    const re = new RegExp(`\\b${name}\\b`)
    if (re.test(upper)) {
      return { code: US_STATE_NAME_TO_CODE[name], match: name }
    }
  }
  for (const code of Object.values(US_STATE_NAME_TO_CODE)) {
    const re = new RegExp(`\\b${code}\\b`)
    if (re.test(upper)) return { code, match: code }
  }
  return null
}

/**
 * Structural hints from free-form address text (zip / US state / commas).
 * Does not hardcode country names — country comes from geocode.
 */
export function parseFreeformAddressHints(
  street: string,
): Partial<LocationParts> {
  const text = street.trim()
  if (!text) return {}

  const hints: Partial<LocationParts> = {}
  const usZip = text.match(US_ZIP_IN_TEXT_RE)
  const caPostal = text.match(CA_POSTAL_IN_TEXT_RE)

  if (usZip) {
    hints.zip = usZip[1]
  } else if (caPostal) {
    hints.zip = caPostal[1].toUpperCase().replace(/\s+/, " ")
  }

  const usState = findUsStateInText(text)
  if (usState) {
    hints.state = usState.code
    hints.country = "US"

    const beforeState = text
      .replace(new RegExp(`[,\\s]+${usState.match}\\b.*$`, "i"), "")
      .replace(/\b(?:suite|suit|ste|unit|apt|#)\s*[A-Za-z0-9-]+\b/gi, " ")
      .replace(/^\d+[A-Za-z]?\s+/, "")
      .replace(
        /\b(?:rd|road|st|street|ave|avenue|blvd|dr|drive|ln|lane|hwy|highway|pkwy|parkway|ct|court|cir|circle|way|trl|trail)\b\.?/gi,
        " ",
      )
      .replace(/[,\s]+/g, " ")
      .trim()
    const cityTokens = beforeState.split(/\s+/).filter(Boolean)
    if (cityTokens.length > 0) {
      hints.city = cityTokens[cityTokens.length - 1]
    }
  }

  const chunks = text
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
  if (chunks.length >= 2) {
    let cursor = chunks.length - 1
    const lastAsCountry = tryParseSettingsCountry(chunks[cursor])
    // Only treat trailing token as country when it matches a known name/ISO
    // from the base list (or a plain ISO2). Avoid inventing countries here.
    if (
      lastAsCountry &&
      (isKnownSettingsCountryCode(lastAsCountry) ||
        /^[A-Z]{2}$/.test(chunks[cursor].trim().toUpperCase())) &&
      !/^\d/.test(chunks[cursor])
    ) {
      if (
        isKnownSettingsCountryCode(lastAsCountry) ||
        chunks[cursor].trim().length === 2
      ) {
        hints.country = lastAsCountry
        cursor -= 1
      }
    }

    if (cursor >= 0) {
      const cityChunk = chunks[cursor]
      const intlZip = cityChunk.match(/\b(\d{4,6}(?:-\d{4})?)\b/)
      if (intlZip && !hints.zip) hints.zip = intlZip[1]

      const cityWithoutZip = cityChunk
        .replace(/\b\d{4,6}(?:-\d{4})?\b/g, "")
        .replace(/\b[A-Z]{2}\b/g, " ")
        .replace(/[.]/g, " ")
        .replace(/\s+/g, " ")
        .trim()

      const stateInChunk = findUsStateInText(cityWithoutZip)
      if (stateInChunk && cityWithoutZip.length <= 24) {
        hints.state = hints.state || stateInChunk.code
        hints.country = hints.country || "US"
        if (cursor >= 1 && !hints.city) hints.city = chunks[cursor - 1]
      } else if (cityWithoutZip) {
        if (!hints.city) hints.city = cityWithoutZip
        if (cursor >= 1 && !hints.state) {
          const prev = chunks[cursor - 1]
          if (
            !/^\d/.test(prev) &&
            !/\b(via|rue|rd|st|street|road|ave|blvd)\b/i.test(prev)
          ) {
            hints.state = prev
          }
        }
      } else if (cursor >= 1 && !hints.city) {
        hints.city = chunks[cursor - 1]
      }
    }
  }

  return hints
}

/**
 * @deprecated Prefer detectTimeZoneFromAddressText — timezone ignores country/zip fields.
 */
export function detectSettingsTimeZone(
  parts: LocationParts,
): string | null {
  return detectTimeZoneFromAddressText(parts.street)
}
