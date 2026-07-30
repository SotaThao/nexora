import {
  formatNationalNumber,
  isValidPhoneE164,
  normalizePhoneE164,
  parsePhone,
  PhoneDialCode,
} from '../../CountryCodeSelect'
import {
  findOperatingHourForDate,
  isSlotWithinOperatingHours,
  toUtcBookingSlot,
} from '../../../data/repositories/publicVoiceBooking'
import {
  PUBLIC_BOOKING_ANY_STAFF_ID,
  PUBLIC_BOOKING_EM_DASH,
  PUBLIC_BOOKING_LANG,
  PUBLIC_BOOKING_ROUTE,
  PUBLIC_BOOKING_STEP,
  PUBLIC_BOOKING_VALIDATION_ERROR,
} from './constants'

export function pad(value) {
  return String(value).padStart(2, '0')
}

export function localDateIso(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function getDefaultBookingSlot(now = new Date()) {
  const defaultSlot = new Date(now)
  defaultSlot.setMinutes(defaultSlot.getMinutes() + 30)
  return {
    date: localDateIso(defaultSlot),
    time: `${pad(defaultSlot.getHours())}:${pad(defaultSlot.getMinutes())}`,
  }
}

export function moneyFromCents(cents) {
  return `$${(Number(cents || 0) / 100).toFixed(0)}`
}

/** Match HTML: zero / missing price → contact label. */
export function formatServiceChoicePrice(service, contactLabel) {
  const cents = Number(service?.priceCents || 0)
  if (cents <= 0) return contactLabel || 'Contact'
  return moneyFromCents(cents)
}

export function selectedServiceChipLabel(service, otherCategoryName) {
  const category =
    String(service?.categoryName || '').trim() ||
    otherCategoryName ||
    'Other services'
  return `${category} - ${service?.name || ''}`.trim()
}

export function bookingLocaleFromLang(lang) {
  return String(lang).toLowerCase() === PUBLIC_BOOKING_LANG.vi ? 'vi-VN' : 'en-US'
}

export function formatCustomerPhoneDisplay(value) {
  const raw = String(value || '').trim()
  if (!raw) return ''
  const parsed = parsePhone(raw)
  const national = String(parsed.nationalNumber || '').replace(/\D/g, '')
  if (!national) return parsed.countryCode || ''
  return `${parsed.countryCode} ${parsed.nationalNumber}`.trim()
}

/** Format YYYY-MM-DD using booking language (same as SMS campaign schedule). */
export function formatBookingDateDisplay(isoDate, locale) {
  const [year, month, day] = String(isoDate || '').split('-').map(Number)
  if (!year || !month || !day) return isoDate || ''
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(year, month - 1, day))
}

/** Format HH:mm as 12h AM/PM (or locale SA/CH) — always hour12, same as SMS campaign. */
export function formatBookingTimeDisplay(hhmm, locale) {
  const [hours, minutes] = String(hhmm || '').split(':').map(Number)
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return hhmm || ''
  const date = new Date(1970, 0, 1, hours, minutes, 0, 0)
  return new Intl.DateTimeFormat(locale, {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    hourCycle: 'h12',
  }).format(date)
}

export function openDateTimePicker(input) {
  if (!input || input.disabled) return
  input.focus()
  if (typeof input.showPicker === 'function') {
    try {
      input.showPicker()
    } catch {
      // Browser may block showPicker without a trusted user gesture.
    }
  }
}

export function parseBookingTime(value) {
  const input = String(value ?? '').trim()
  const twelveHour = input.match(/^(\d{1,2}):([0-5]\d)\s*(AM|PM)$/i)
  if (twelveHour) {
    const hour = Number(twelveHour[1])
    if (hour < 1 || hour > 12) return ''
    const normalizedHour =
      (hour % 12) + (twelveHour[3].toUpperCase() === 'PM' ? 12 : 0)
    return `${pad(normalizedHour)}:${twelveHour[2]}`
  }
  const twentyFourHour = input.match(/^([01]\d|2[0-3]):([0-5]\d)$/)
  return twentyFourHour ? `${twentyFourHour[1]}:${twentyFourHour[2]}` : ''
}

export function formatBookingSlot(date, time, locale = 'en-US') {
  if (!date || !time) return PUBLIC_BOOKING_EM_DASH
  return `${formatBookingDateDisplay(date, locale)} · ${formatBookingTimeDisplay(time, locale)}`
}

export function isBookableDate(value, minDate, operatingHours = []) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ''))) return false
  const date = new Date(`${value}T12:00:00`)
  if (Number.isNaN(date.getTime()) || localDateIso(date) !== value) return false
  if (value < minDate) return false
  if (!Array.isArray(operatingHours) || operatingHours.length === 0) return true
  const hour = findOperatingHourForDate(value, operatingHours)
  return Boolean(hour?.isOpen)
}

export function validateBookingDraft(draft, catalog, minDate) {
  const errors = []
  const customer = draft?.customer || {}
  const phoneRaw = String(customer.phone || '').trim()
  const dialCode = parsePhone(phoneRaw).countryCode || PhoneDialCode.US
  const name = String(customer.name || '').trim()
  const selectedServiceIds = Array.isArray(draft?.selectedServiceIds)
    ? draft.selectedServiceIds.map((id) => String(id || '').trim()).filter(Boolean)
    : []
  const staffId = String(draft?.selectedStaffId || '').trim()
  const services = catalog?.services || []
  const staff = catalog?.staff || []
  const operatingHours = catalog?.operatingHours || []
  const catalogIds = new Set(services.map((service) => service.id))

  if (!isValidPhoneE164(phoneRaw, dialCode)) {
    errors.push(PUBLIC_BOOKING_VALIDATION_ERROR.phone)
  }
  if (!name) errors.push(PUBLIC_BOOKING_VALIDATION_ERROR.name)
  if (
    selectedServiceIds.length === 0 ||
    selectedServiceIds.some((id) => !catalogIds.has(id))
  ) {
    errors.push(PUBLIC_BOOKING_VALIDATION_ERROR.services)
  }

  if (staff.length > 0) {
    const isAny = staffId === PUBLIC_BOOKING_ANY_STAFF_ID
    if (!staffId) {
      errors.push(PUBLIC_BOOKING_VALIDATION_ERROR.staff)
    } else if (!isAny && !staff.some((member) => member.id === staffId)) {
      errors.push(PUBLIC_BOOKING_VALIDATION_ERROR.staff)
    }
  }

  if (!draft?.selectedDate) {
    errors.push(PUBLIC_BOOKING_VALIDATION_ERROR.slot)
  } else if (!isBookableDate(draft.selectedDate, minDate, operatingHours)) {
    const hour = findOperatingHourForDate(draft.selectedDate, operatingHours)
    if (hour && !hour.isOpen) errors.push(PUBLIC_BOOKING_VALIDATION_ERROR.closedDay)
    else errors.push(PUBLIC_BOOKING_VALIDATION_ERROR.slot)
  } else if (!draft?.selectedTime) {
    errors.push(PUBLIC_BOOKING_VALIDATION_ERROR.slot)
  } else if (
    !isSlotWithinOperatingHours(
      draft.selectedDate,
      draft.selectedTime,
      operatingHours,
    )
  ) {
    errors.push(PUBLIC_BOOKING_VALIDATION_ERROR.slot)
  }

  return { ok: errors.length === 0, errors }
}

/**
 * Build POST body for `CreateOnlineBookingRequest` (OpenAPI: `serviceIds` array).
 * Slot conversion always uses the device timezone (ignores tenant timeZone).
 */
export function buildCreateBookingBody(draft) {
  const staffId = String(draft?.selectedStaffId || '').trim()
  const notes = String(draft?.note || '').trim()
  const phoneRaw = String(draft?.customer?.phone || '').trim()
  const dialCode = parsePhone(phoneRaw).countryCode || PhoneDialCode.US

  const serviceIds = Array.isArray(draft?.selectedServiceIds)
    ? draft.selectedServiceIds.map((id) => String(id || '').trim()).filter(Boolean)
    : []

  // UI keeps local selectedDate/selectedTime; API payload is UTC in device TZ.
  const utcSlot = toUtcBookingSlot(draft?.selectedDate, draft?.selectedTime)

  const body = {
    customerName: String(draft?.customer?.name || '').trim(),
    customerPhone: normalizePhoneE164(phoneRaw, dialCode),
    serviceIds,
    date: utcSlot.date,
    startTime: utcSlot.startTime,
  }

  if (staffId && staffId !== PUBLIC_BOOKING_ANY_STAFF_ID) body.staffId = staffId
  if (notes) body.notes = notes
  return body
}

/** Prefer locally selected names, then API `serviceNames`, then single `serviceName`. */
export function resolveBookingServiceNames(booking, selectedNames = []) {
  if (Array.isArray(selectedNames) && selectedNames.length > 0) return selectedNames
  if (Array.isArray(booking?.serviceNames) && booking.serviceNames.length > 0) {
    return booking.serviceNames
  }
  const single = String(booking?.serviceName || '').trim()
  return single ? [single] : []
}

/** Map validation error keys → field-level copy for the form step. */
export function resolveBookingFieldErrors(errorKeys, draft, copy) {
  const errors = Array.isArray(errorKeys) ? errorKeys : []
  const has = (key) => errors.includes(key)
  const selectedDate = draft?.selectedDate
  const selectedTime = draft?.selectedTime

  let dateError = ''
  if (has(PUBLIC_BOOKING_VALIDATION_ERROR.closedDay)) {
    dateError = copy.closedDayError
  } else if (has(PUBLIC_BOOKING_VALIDATION_ERROR.slot) && !selectedDate) {
    dateError = copy.dateError
  }

  let timeError = ''
  if (has(PUBLIC_BOOKING_VALIDATION_ERROR.slot)) {
    if (selectedDate && !selectedTime) timeError = copy.timeError
    else if (selectedDate && selectedTime) timeError = copy.slotUnavailable
  }

  return {
    phoneError: has(PUBLIC_BOOKING_VALIDATION_ERROR.phone) ? copy.phoneError : '',
    nameError: has(PUBLIC_BOOKING_VALIDATION_ERROR.name) ? copy.nameError : '',
    serviceError: has(PUBLIC_BOOKING_VALIDATION_ERROR.services) ? copy.serviceError : '',
    staffError: has(PUBLIC_BOOKING_VALIDATION_ERROR.staff) ? copy.staffError : '',
    dateError,
    timeError,
    reviewError: errors.length ? copy.reviewError : '',
  }
}

export function createDefaultBookingState(defaultSlot) {
  return {
    step: PUBLIC_BOOKING_STEP.form,
    customer: { phone: '', name: '' },
    selectedServiceIds: [],
    selectedStaffId: PUBLIC_BOOKING_ANY_STAFF_ID,
    selectedDate: defaultSlot.date,
    selectedTime: defaultSlot.time,
    note: '',
    booking: null,
  }
}

/** Normalize `?phone=` into the same dial+national shape the form edits. */
export function formatBookingPrefillPhone(raw) {
  const value = String(raw || '').trim()
  if (!value) return ''
  const parsed = parsePhone(value)
  const dialCode = parsed.countryCode || PhoneDialCode.US
  const national = formatNationalNumber(parsed.nationalNumber, dialCode)
  if (!String(national || '').replace(/\D/g, '')) return ''
  return `${dialCode} ${national}`.trim()
}

/**
 * Read optional SMS deep-link prefill (`phone`, `name`) from the booking URL.
 * @param {URLSearchParams | { get: (key: string) => string | null }} searchParams
 */
export function readBookingCustomerPrefill(searchParams) {
  if (!searchParams || typeof searchParams.get !== 'function') {
    return { phone: '', name: '' }
  }
  return {
    phone: formatBookingPrefillPhone(searchParams.get(PUBLIC_BOOKING_ROUTE.phoneQuery)),
    name: String(searchParams.get(PUBLIC_BOOKING_ROUTE.nameQuery) || '').trim(),
  }
}

/** Case-insensitive service name match for public booking search. */
export function serviceMatchesSearchQuery(serviceName, query) {
  const needle = String(query || '').trim().toLowerCase()
  if (!needle) return false
  return String(serviceName || '')
    .toLowerCase()
    .includes(needle)
}

/**
 * Split a service name into plain / highlight segments for search UI.
 * @returns {Array<{ text: string, highlight: boolean }>}
 */
export function getServiceNameHighlightParts(serviceName, query) {
  const name = String(serviceName || '')
  const needle = String(query || '').trim()
  if (!name || !needle) return [{ text: name, highlight: false }]

  const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const parts = name.split(new RegExp(`(${escaped})`, 'ig'))
  return parts
    .filter((part) => part.length > 0)
    .map((part) => ({
      text: part,
      highlight: part.toLowerCase() === needle.toLowerCase(),
    }))
}
