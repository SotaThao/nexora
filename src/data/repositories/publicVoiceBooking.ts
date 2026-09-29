/**
 * publicVoiceBookingRepository — anonymous public booking page + submit.
 * Contract: nexora-voice-booking-api.md
 */
import httpClient from '../../lib/httpClient'
import { HOLIDAY_TYPE } from '../../constants/holiday'
import { PosServiceDiscountType } from '../../constants/posDiscount'
import {
  BOOKING_DAY_OF_WEEK,
  OTHER_SERVICES_CATEGORY_ID,
  PUBLIC_VOICE_BOOKING_BASE,
  PUBLIC_VOICE_BOOKING_HEADERS,
  VoiceLeadSource,
  toPublicBookingApiPhone,
  type BookingPageDataDto,
  type CreateOnlineBookingRequest,
  type CreateOnlineBookingResultDto,
  type PublicBookingCreateResult,
  type PublicBookingCustomer,
  type PublicBookingHoliday,
  type PublicBookingOperatingHour,
  type PublicBookingPageData,
  type PublicBookingPromotion,
  type PublicBookingService,
  type PublicBookingServiceCategory,
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

/** Only http(s) photo URLs from the booking page payload; anything else falls back to initials. */
export function toPublicBookingAvatarUrl(value: unknown): string | null {
  const raw = String(value ?? '').trim()
  if (!raw) return null
  try {
    const parsed = new URL(raw)
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null
    return raw
  } catch {
    return null
  }
}

function normalizeService(
  raw: unknown,
  categoryMeta?: { categoryId: string; categoryName: string },
): PublicBookingService | null {
  const dto = asRecord(raw)
  const id = String(readField(dto, 'id', 'Id') ?? '').trim()
  const name = String(readField(dto, 'name', 'Name') ?? '').trim()
  if (!id || !name) return null
  const price = toNumberOrNull(readField(dto, 'price', 'Price'))
  const service: PublicBookingService = {
    id,
    name,
    price,
    priceCents: price == null ? 0 : Math.round(price * 100),
    durationMinutes: toIntOrZero(readField(dto, 'durationMinutes', 'DurationMinutes')),
    note: String(readField(dto, 'note', 'Note') ?? '').trim(),
    icon: String(readField(dto, 'icon', 'Icon') ?? '').trim(),
  }
  if (categoryMeta?.categoryId) {
    service.categoryId = categoryMeta.categoryId
    service.categoryName = categoryMeta.categoryName
  }
  return service
}

function normalizeCategory(raw: unknown): PublicBookingServiceCategory | null {
  const dto = asRecord(raw)
  const id = String(readField(dto, 'id', 'Id') ?? '').trim()
  const name =
    String(readField(dto, 'name', 'Name') ?? '').trim() || 'Other services'
  if (!id) return null
  const isSystemRaw = readField(dto, 'isSystem', 'IsSystem')
  const isSystem =
    isSystemRaw === true || id === OTHER_SERVICES_CATEGORY_ID
  const servicesRaw = readField<unknown[]>(dto, 'services', 'Services')
  const services = Array.isArray(servicesRaw)
    ? (servicesRaw
        .map((item) =>
          normalizeService(item, { categoryId: id, categoryName: name }),
        )
        .filter(Boolean) as PublicBookingService[])
    : []
  if (!services.length) return null
  return {
    id,
    name,
    description: String(readField(dto, 'description', 'Description') ?? '').trim(),
    isSystem,
    services,
  }
}

function normalizeStaff(raw: unknown): PublicBookingStaff | null {
  const dto = asRecord(raw)
  const id = String(readField(dto, 'id', 'Id') ?? '').trim()
  const fullName = String(
    readField(dto, 'fullName', 'FullName') ?? readField(dto, 'name', 'Name') ?? '',
  ).trim()
  if (!id || !fullName) return null
  return {
    id,
    fullName,
    initials: staffInitials(fullName),
    avatarUrl: toPublicBookingAvatarUrl(readField(dto, 'avatarUrl', 'AvatarUrl')),
  }
}

function normalizeOperatingHour(raw: unknown): PublicBookingOperatingHour | null {
  const dto = asRecord(raw)
  const dayOfWeek = String(readField(dto, 'dayOfWeek', 'DayOfWeek') ?? '').trim()
  if (!dayOfWeek) return null
  const isOpenRaw = readField(dto, 'isOpen', 'IsOpen')
  return {
    dayOfWeek,
    // Match merchantVoice: only real boolean true. Boolean("false") would be true.
    isOpen: isOpenRaw === true,
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

function normalizeHoliday(raw: unknown): PublicBookingHoliday | null {
  const dto = asRecord(raw)
  const holidayDate = String(readField(dto, 'holidayDate', 'HolidayDate') ?? '').trim()
  if (!holidayDate) return null
  return {
    holidayDate,
    reason: String(readField(dto, 'reason', 'Reason') ?? '').trim(),
    type: readField(dto, 'type', 'Type') === HOLIDAY_TYPE.ADJUSTED
      ? HOLIDAY_TYPE.ADJUSTED
      : HOLIDAY_TYPE.CLOSED,
    adjustedOpenTime: (() => {
      const v = readField(dto, 'adjustedOpenTime', 'AdjustedOpenTime')
      return v == null || v === '' ? null : String(v)
    })(),
    adjustedCloseTime: (() => {
      const v = readField(dto, 'adjustedCloseTime', 'AdjustedCloseTime')
      return v == null || v === '' ? null : String(v)
    })(),
  }
}

const DISCOUNT_TYPES: readonly PosServiceDiscountType[] = [
  PosServiceDiscountType.Percent,
  PosServiceDiscountType.Amount,
]

/**
 * An offer whose `discountType` we don't recognise is dropped rather than defaulted: rendering
 * a percentage as "$15 off" (or the reverse) misquotes the price to the customer, which is worse
 * than not advertising the offer at all.
 */
function normalizePromotion(raw: unknown): PublicBookingPromotion | null {
  const dto = asRecord(raw)
  const id = String(readField(dto, 'id', 'Id') ?? '').trim()
  const name = String(readField(dto, 'name', 'Name') ?? '').trim()
  if (!id || !name) return null

  const rawType = String(readField(dto, 'discountType', 'DiscountType') ?? '').trim()
  const discountType = DISCOUNT_TYPES.find((value) => value === rawType)
  if (!discountType) return null

  const discountValue = toNumberOrNull(readField(dto, 'discountValue', 'DiscountValue'))
  if (discountValue == null || discountValue <= 0) return null

  const daysRaw = readField<unknown[]>(dto, 'daysOfWeek', 'DaysOfWeek')
  const days = Array.isArray(daysRaw)
    ? daysRaw.map((day) => String(day ?? '').trim())
    : []
  // Sorted into week order here so every caller renders the same run of days.
  const daysOfWeek = BOOKING_DAY_OF_WEEK.filter((day) => days.includes(day))

  const primaryBannerImageUrl = (() => {
    const v =
      readField(dto, 'primaryBannerImageUrl', 'PrimaryBannerImageUrl') ??
      readField(dto, 'photoUrl', 'PhotoUrl')
    const s = v == null ? '' : String(v).trim()
    return s || null
  })()
  const primaryBannerColorHex = (() => {
    const v = readField(dto, 'primaryBannerColorHex', 'PrimaryBannerColorHex')
    const s = v == null ? '' : String(v).trim()
    return s || null
  })()
  const photoUrl = (() => {
    const v = readField(dto, 'photoUrl', 'PhotoUrl')
    const s = v == null ? '' : String(v).trim()
    return s || primaryBannerImageUrl
  })()

  return {
    id,
    name,
    badgeLabel: String(readField(dto, 'badgeLabel', 'BadgeLabel') ?? '').trim(),
    description: String(readField(dto, 'description', 'Description') ?? '').trim() || null,
    discountType,
    discountValue,
    daysOfWeek: [...daysOfWeek],
    startTime: String(readField(dto, 'startTime', 'StartTime') ?? '').trim(),
    endTime: String(readField(dto, 'endTime', 'EndTime') ?? '').trim(),
    primaryBannerColorHex,
    primaryBannerImageUrl,
    photoUrl,
  }
}

function normalizeCustomer(raw: unknown): PublicBookingCustomer | null {
  if (raw == null) return null
  const dto = asRecord(raw)
  const phoneNumber = toPublicBookingApiPhone(
    readField(dto, 'phoneNumber', 'PhoneNumber') as string | null | undefined,
  )
  if (!phoneNumber) return null
  const nameRaw = readField(dto, 'name', 'Name')
  return {
    name: nameRaw == null ? '' : String(nameRaw).trim(),
    phoneNumber,
  }
}

/**
 * Resolve selected service ids against the flat `services` list (authoritative).
 * Falls back to category-embedded services when flat list is empty.
 */
export function resolveSelectedServices(
  data: Pick<PublicBookingPageData, 'services' | 'categories'>,
  selectedIds: string[],
): PublicBookingService[] {
  const byId = new Map<string, PublicBookingService>()
  for (const service of data.services || []) {
    if (service?.id) byId.set(service.id, service)
  }
  if (byId.size === 0) {
    for (const category of data.categories || []) {
      for (const service of category.services || []) {
        if (service?.id && !byId.has(service.id)) byId.set(service.id, service)
      }
    }
  }
  return (Array.isArray(selectedIds) ? selectedIds : [])
    .map((id) => byId.get(String(id || '').trim()))
    .filter(Boolean) as PublicBookingService[]
}

export function normalizeBookingPageData(
  res: BookingPageDataDto | null | undefined,
): PublicBookingPageData {
  const raw = asRecord(res)
  const servicesRaw = readField<unknown[]>(raw, 'services', 'Services')
  const categoriesRaw = readField<unknown[]>(raw, 'categories', 'Categories')
  const staffRaw = readField<unknown[]>(raw, 'staff', 'Staff')
  const hoursRaw = readField<unknown[]>(raw, 'operatingHours', 'OperatingHours')
  const holidaysRaw = readField<unknown[]>(raw, 'holidays', 'Holidays')
  const promotionsRaw = readField<unknown[]>(raw, 'promotions', 'Promotions')

  const categories = Array.isArray(categoriesRaw)
    ? (categoriesRaw.map(normalizeCategory).filter(Boolean) as PublicBookingServiceCategory[])
    : []

  let services = Array.isArray(servicesRaw)
    ? (servicesRaw.map((item) => normalizeService(item)).filter(Boolean) as PublicBookingService[])
    : []

  // Flat list is authoritative; if BE omits it, derive a deduped list from categories.
  if (!services.length && categories.length) {
    const byId = new Map<string, PublicBookingService>()
    for (const category of categories) {
      for (const service of category.services) {
        if (!byId.has(service.id)) {
          byId.set(service.id, {
            id: service.id,
            name: service.name,
            price: service.price,
            priceCents: service.priceCents,
            durationMinutes: service.durationMinutes,
            note: service.note,
            icon: service.icon,
          })
        }
      }
    }
    services = [...byId.values()]
  }

  // Enrich flat services with first matching category label for chips.
  if (categories.length && services.length) {
    const categoryByServiceId = new Map<string, { categoryId: string; categoryName: string }>()
    for (const category of categories) {
      for (const service of category.services) {
        if (!categoryByServiceId.has(service.id)) {
          categoryByServiceId.set(service.id, {
            categoryId: category.id,
            categoryName: category.name,
          })
        }
      }
    }
    services = services.map((service) => {
      const meta = categoryByServiceId.get(service.id)
      if (!meta) return service
      return {
        ...service,
        categoryId: meta.categoryId,
        categoryName: meta.categoryName,
      }
    })
  }

  return {
    businessKey: String(readField(raw, 'businessKey', 'BusinessKey') ?? '').trim(),
    businessName: String(readField(raw, 'businessName', 'BusinessName') ?? '').trim(),
    timeZone: (() => {
      const v = readField(raw, 'timeZone', 'TimeZone')
      return v == null || v === '' ? null : String(v)
    })(),
    services,
    categories,
    staff: Array.isArray(staffRaw)
      ? (staffRaw.map(normalizeStaff).filter(Boolean) as PublicBookingStaff[])
      : [],
    operatingHours: Array.isArray(hoursRaw)
      ? (hoursRaw.map(normalizeOperatingHour).filter(Boolean) as PublicBookingOperatingHour[])
      : [],
    holidays: Array.isArray(holidaysRaw)
      ? (holidaysRaw.map(normalizeHoliday).filter(Boolean) as PublicBookingHoliday[])
      : [],
    promotions: Array.isArray(promotionsRaw)
      ? (promotionsRaw.map(normalizePromotion).filter(Boolean) as PublicBookingPromotion[])
      : [],
    customer: normalizeCustomer(readField(raw, 'customer', 'Customer')),
  }
}

export function normalizeCreateOnlineBookingResult(
  res: CreateOnlineBookingResultDto | null | undefined,
): PublicBookingCreateResult {
  const raw = asRecord(res)
  return {
    leadId: String(readField(raw, 'leadId', 'LeadId') ?? '').trim(),
    customerName: String(readField(raw, 'customerName', 'CustomerName') ?? '').trim(),
    customerPhone: toPublicBookingApiPhone(
      readField(raw, 'customerPhone', 'CustomerPhone') as string | null | undefined,
    ),
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
 * Convert local booking slot to UTC `date` + `startTime` for the create-booking API.
 * Always uses the user's device timezone — never the tenant `timeZone` from page data.
 */
export function toUtcBookingSlot(
  dateIso: string,
  timeHmm: string,
  _timeZone?: string | null,
): { date: string; startTime: string } {
  const date = String(dateIso || '').trim()
  const time = String(timeHmm || '').trim()
  const startTimeLocal = toStartTimeApi(time)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !startTimeLocal) {
    return { date: '', startTime: '' }
  }
  const [hours, minutes] = startTimeLocal.split(':').map(Number)
  const tz =
    typeof Intl !== 'undefined'
      ? Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
      : 'UTC'

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

export function findHolidayForDate(
  dateIso: string,
  holidays: PublicBookingHoliday[],
): PublicBookingHoliday | null {
  if (!Array.isArray(holidays) || holidays.length === 0) return null
  return holidays.find((holiday) => holiday.holidayDate === dateIso) || null
}

export function isDateClosedByHoliday(
  dateIso: string,
  holidays: PublicBookingHoliday[],
): boolean {
  const holiday = findHolidayForDate(dateIso, holidays)
  return holiday != null && holiday.type === HOLIDAY_TYPE.CLOSED
}

export function isSlotWithinOperatingHours(
  dateIso: string,
  timeHmm: string,
  operatingHours: PublicBookingOperatingHour[],
  holidays: PublicBookingHoliday[] = [],
  durationMinutes = 0,
): boolean {
  const holiday = findHolidayForDate(dateIso, holidays)
  const start = timeToMinutes(timeHmm)
  const end = start != null ? start + Math.max(0, durationMinutes) : null

  if (holiday != null) {
    if (holiday.type === HOLIDAY_TYPE.CLOSED) return false
    const open = timeToMinutes(holiday.adjustedOpenTime)
    const close = timeToMinutes(holiday.adjustedCloseTime)
    if (start == null || end == null || open == null || close == null) return false
    return start >= open && end <= close
  }

  if (!Array.isArray(operatingHours) || operatingHours.length === 0) {
    return Boolean(dateIso && timeHmm)
  }
  const hour = findOperatingHourForDate(dateIso, operatingHours)
  if (!hour || !hour.isOpen) return false
  const open = timeToMinutes(hour.openTime)
  const close = timeToMinutes(hour.closeTime)
  if (start == null || end == null || open == null || close == null) return false
  return start >= open && end <= close
}

export function formatServicePrice(price: number | null | undefined): string {
  if (price == null || !Number.isFinite(Number(price))) return '$0'
  const n = Number(price)
  return Number.isInteger(n) ? `$${n}` : `$${n.toFixed(2)}`
}

export function createPublicVoiceBookingRepository(client: HttpClient = httpClient) {
  return {
    async getBookingPageData(
      businessKey: string,
      phone?: string | null,
    ): Promise<PublicBookingPageData> {
      const key = String(businessKey || '').trim()
      const phoneParam = toPublicBookingApiPhone(phone)
      const res = await client.get<BookingPageDataDto>(
        `${PUBLIC_VOICE_BOOKING_BASE}/${encodeURIComponent(key)}/bookings`,
        {
          anonymous: true,
          headers: { ...PUBLIC_VOICE_BOOKING_HEADERS },
          ...(phoneParam ? { params: { phone: phoneParam } } : {}),
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
      const payload: CreateOnlineBookingRequest = {
        ...body,
        customerPhone: toPublicBookingApiPhone(body.customerPhone),
      }
      const res = await client.post<CreateOnlineBookingResultDto>(
        `${PUBLIC_VOICE_BOOKING_BASE}/${encodeURIComponent(key)}/bookings`,
        payload,
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
