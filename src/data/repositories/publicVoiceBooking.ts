/**
 * publicVoiceBookingRepository — anonymous public booking page + submit.
 * Contract: nexora-voice-booking-api.md
 */
import httpClient from '../../lib/httpClient'
import {
  BOOKING_DAY_OF_WEEK,
  PUBLIC_VOICE_BOOKING_BASE,
  PUBLIC_VOICE_BOOKING_HEADERS,
  VoiceLeadSource,
  type BookingPageDataDto,
  type CreateOnlineBookingRequest,
  type CreateOnlineBookingResultDto,
  type PublicBookingCreateResult,
  type PublicBookingOperatingHour,
  type PublicBookingPageData,
  type PublicBookingService,
  type PublicBookingStaff,
} from '../publicVoiceBooking/domain'

type HttpClient = typeof httpClient

function readField<T>(
  dto: Record<string, unknown>,
  camel: string,
  pascal: string,
): T | undefined {
  return (dto[camel] ?? dto[pascal]) as T | undefined
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {}
}

function toNumberOrNull(value: unknown): number | null {
  if (value == null || value === '') return null
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

function toIntOrZero(value: unknown): number {
  const n = toNumberOrNull(value)
  return n == null ? 0 : Math.max(0, Math.round(n))
}

function staffInitials(fullName: string): string {
  const parts = String(fullName || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  if (!parts.length) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0] ?? ''}${parts[parts.length - 1][0] ?? ''}`.toUpperCase()
}

function normalizeService(raw: unknown): PublicBookingService | null {
  const dto = asRecord(raw)
  const id = String(readField(dto, 'id', 'Id') ?? '').trim()
  const name = String(readField(dto, 'name', 'Name') ?? '').trim()
  if (!id || !name) return null
  const price = toNumberOrNull(readField(dto, 'price', 'Price'))
  return {
    id,
    name,
    price,
    priceCents: price == null ? 0 : Math.round(price * 100),
    durationMinutes: toIntOrZero(readField(dto, 'durationMinutes', 'DurationMinutes')),
    note: String(readField(dto, 'note', 'Note') ?? '').trim(),
    icon: String(readField(dto, 'icon', 'Icon') ?? '').trim(),
  }
}

function normalizeStaff(raw: unknown): PublicBookingStaff | null {
  const dto = asRecord(raw)
  const id = String(readField(dto, 'id', 'Id') ?? '').trim()
  const fullName = String(
    readField(dto, 'fullName', 'FullName') ?? readField(dto, 'name', 'Name') ?? '',
  ).trim()
  if (!id || !fullName) return null
  return { id, fullName, initials: staffInitials(fullName) }
}

function normalizeOperatingHour(raw: unknown): PublicBookingOperatingHour | null {
  const dto = asRecord(raw)
  const dayOfWeek = String(readField(dto, 'dayOfWeek', 'DayOfWeek') ?? '').trim()
  if (!dayOfWeek) return null
  const isOpenRaw = readField(dto, 'isOpen', 'IsOpen')
  return {
    dayOfWeek,
    isOpen: Boolean(isOpenRaw),
    openTime: (() => {
      const v = readField(dto, 'openTime', 'OpenTime')
      return v == null || v === '' ? null : String(v)
    })(),
    closeTime: (() => {
      const v = readField(dto, 'closeTime', 'CloseTime')
      return v == null || v === '' ? null : String(v)
    })(),
  }
}

export function normalizeBookingPageData(
  res: BookingPageDataDto | null | undefined,
): PublicBookingPageData {
  const raw = asRecord(res)
  const servicesRaw = readField<unknown[]>(raw, 'services', 'Services')
  const staffRaw = readField<unknown[]>(raw, 'staff', 'Staff')
  const hoursRaw = readField<unknown[]>(raw, 'operatingHours', 'OperatingHours')

  return {
    businessKey: String(readField(raw, 'businessKey', 'BusinessKey') ?? '').trim(),
    businessName: String(readField(raw, 'businessName', 'BusinessName') ?? '').trim(),
    timeZone: (() => {
      const v = readField(raw, 'timeZone', 'TimeZone')
      return v == null || v === '' ? null : String(v)
    })(),
    services: Array.isArray(servicesRaw)
      ? servicesRaw.map(normalizeService).filter(Boolean) as PublicBookingService[]
      : [],
    staff: Array.isArray(staffRaw)
      ? staffRaw.map(normalizeStaff).filter(Boolean) as PublicBookingStaff[]
      : [],
    operatingHours: Array.isArray(hoursRaw)
      ? hoursRaw.map(normalizeOperatingHour).filter(Boolean) as PublicBookingOperatingHour[]
      : [],
  }
}

export function normalizeCreateOnlineBookingResult(
  res: CreateOnlineBookingResultDto | null | undefined,
): PublicBookingCreateResult {
  const raw = asRecord(res)
  return {
    leadId: String(readField(raw, 'leadId', 'LeadId') ?? '').trim(),
    customerName: String(readField(raw, 'customerName', 'CustomerName') ?? '').trim(),
    customerPhone: String(readField(raw, 'customerPhone', 'CustomerPhone') ?? '').trim(),
    serviceName: String(readField(raw, 'serviceName', 'ServiceName') ?? '').trim(),
    serviceNames: (() => {
      const names = readField(raw, 'serviceNames', 'ServiceNames')
      if (Array.isArray(names)) {
        return names.map((name) => String(name ?? '').trim()).filter(Boolean)
      }
      const single = String(readField(raw, 'serviceName', 'ServiceName') ?? '').trim()
      if (!single) return []
      if (/[,·|]/.test(single)) {
        return single
          .split(/[,·|]/)
          .map((name) => name.trim())
          .filter(Boolean)
      }
      return [single]
    })(),
    servicePrice: toNumberOrNull(readField(raw, 'servicePrice', 'ServicePrice')),
    staffName: String(readField(raw, 'staffName', 'StaffName') ?? '').trim(),
    requestedTimeLocal: String(
      readField(raw, 'requestedTimeLocal', 'RequestedTimeLocal') ?? '',
    ).trim(),
    status: String(readField(raw, 'status', 'Status') ?? '').trim(),
  }
}

/** `HH:mm` or `HH:mm:ss` → minutes from midnight; invalid → null */
export function timeToMinutes(value: string | null | undefined): number | null {
  const match = String(value ?? '')
    .trim()
    .match(/^([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/)
  if (!match) return null
  return Number(match[1]) * 60 + Number(match[2])
}

export function toStartTimeApi(value: string): string {
  const input = String(value ?? '').trim()
  if (/^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/.test(input)) return input
  if (/^([01]\d|2[0-3]):([0-5]\d)$/.test(input)) return `${input}:00`
  return ''
}

function readTimeZoneParts(date: Date, timeZone: string) {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  })
  const parts: Record<string, string> = {}
  for (const part of formatter.formatToParts(date)) {
    if (part.type !== 'literal') parts[part.type] = part.value
  }
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour === '24' ? '0' : parts.hour),
    minute: Number(parts.minute),
    second: Number(parts.second),
  }
}

/** Wall-clock `YYYY-MM-DD` + `HH:mm` in `timeZone` → UTC millis. */
export function zonedWallTimeToUtcMillis(
  dateIso: string,
  hour: number,
  minute: number,
  timeZone: string,
): number | null {
  const [year, month, day] = String(dateIso)
    .split('-')
    .map(Number)
  if (!year || !month || !day || !Number.isFinite(hour) || !Number.isFinite(minute)) {
    return null
  }
  let utc = Date.UTC(year, month - 1, day, hour, minute, 0)
  for (let i = 0; i < 3; i += 1) {
    const parts = readTimeZoneParts(new Date(utc), timeZone)
    const asUtc = Date.UTC(
      parts.year,
      parts.month - 1,
      parts.day,
      parts.hour,
      parts.minute,
      parts.second,
    )
    const target = Date.UTC(year, month - 1, day, hour, minute, 0)
    const diff = target - asUtc
    if (diff === 0) return utc
    utc += diff
  }
  return utc
}

/**
 * Convert local booking slot (business TZ, else browser TZ) to UTC `date` + `startTime`
 * for the create-booking API body.
 */
export function toUtcBookingSlot(
  dateIso: string,
  timeHmm: string,
  timeZone?: string | null,
): { date: string; startTime: string } {
  const date = String(dateIso || '').trim()
  const time = String(timeHmm || '').trim()
  const startTimeLocal = toStartTimeApi(time)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !startTimeLocal) {
    return { date: '', startTime: '' }
  }
  const [hours, minutes] = startTimeLocal.split(':').map(Number)
  const tz =
    String(timeZone || '').trim() ||
    (typeof Intl !== 'undefined'
      ? Intl.DateTimeFormat().resolvedOptions().timeZone
      : 'UTC')

  const utcMillis = zonedWallTimeToUtcMillis(date, hours, minutes || 0, tz)
  if (utcMillis == null) {
    return { date, startTime: startTimeLocal }
  }
  const utc = new Date(utcMillis)
  const pad = (value: number) => String(value).padStart(2, '0')
  return {
    date: `${utc.getUTCFullYear()}-${pad(utc.getUTCMonth() + 1)}-${pad(utc.getUTCDate())}`,
    startTime: `${pad(utc.getUTCHours())}:${pad(utc.getUTCMinutes())}:${pad(utc.getUTCSeconds())}`,
  }
}

export function dayOfWeekFromIsoDate(dateIso: string): string {
  const date = new Date(`${dateIso}T12:00:00`)
  if (Number.isNaN(date.getTime())) return ''
  return BOOKING_DAY_OF_WEEK[date.getDay()] || ''
}

export function findOperatingHourForDate(
  dateIso: string,
  operatingHours: PublicBookingOperatingHour[],
): PublicBookingOperatingHour | null {
  const day = dayOfWeekFromIsoDate(dateIso)
  if (!day) return null
  return (
    operatingHours.find(
      (hour) => String(hour.dayOfWeek).toLowerCase() === day.toLowerCase(),
    ) || null
  )
}

export function isSlotWithinOperatingHours(
  dateIso: string,
  timeHmm: string,
  operatingHours: PublicBookingOperatingHour[],
): boolean {
  if (!Array.isArray(operatingHours) || operatingHours.length === 0) {
    return Boolean(dateIso && timeHmm)
  }
  const hour = findOperatingHourForDate(dateIso, operatingHours)
  if (!hour || !hour.isOpen) return false
  const start = timeToMinutes(timeHmm)
  const open = timeToMinutes(hour.openTime)
  const close = timeToMinutes(hour.closeTime)
  if (start == null || open == null || close == null) return false
  return start >= open && start < close
}

export function formatServicePrice(price: number | null | undefined): string {
  if (price == null || !Number.isFinite(Number(price))) return '$0'
  const n = Number(price)
  return Number.isInteger(n) ? `$${n}` : `$${n.toFixed(2)}`
}

export function createPublicVoiceBookingRepository(client: HttpClient = httpClient) {
  return {
    async getBookingPageData(businessKey: string): Promise<PublicBookingPageData> {
      const key = String(businessKey || '').trim()
      const res = await client.get<BookingPageDataDto>(
        `${PUBLIC_VOICE_BOOKING_BASE}/${encodeURIComponent(key)}/bookings`,
        {
          anonymous: true,
          headers: { ...PUBLIC_VOICE_BOOKING_HEADERS },
        },
      )
      return normalizeBookingPageData(res)
    },

    async createOnlineBooking(
      businessKey: string,
      body: CreateOnlineBookingRequest,
      source: string = VoiceLeadSource.Web,
    ): Promise<PublicBookingCreateResult> {
      const key = String(businessKey || '').trim()
      const sourceValue = String(source || '').trim() || VoiceLeadSource.Web
      const res = await client.post<CreateOnlineBookingResultDto>(
        `${PUBLIC_VOICE_BOOKING_BASE}/${encodeURIComponent(key)}/bookings`,
        body,
        {
          anonymous: true,
          headers: { ...PUBLIC_VOICE_BOOKING_HEADERS },
          params: { source: sourceValue },
        },
      )
      return normalizeCreateOnlineBookingResult(res)
    },
  }
}

export const publicVoiceBookingRepository = createPublicVoiceBookingRepository()
export default publicVoiceBookingRepository
