/** Public Nexora Voice online booking — domain types & route helpers. */

export const PUBLIC_VOICE_BOOKING_BASE = '/api/v1/public/nexora-voice'

export const PUBLIC_VOICE_BOOKING_HEADERS = {
  'x-api-version': '1',
  'x-app-source': 'WebPortal',
} as const

/**
 * Public booking wire phone — strip spaces and leading `+`
 * (API stores/matches without `+`, e.g. `14155552671`).
 */
export function toPublicBookingApiPhone(value: string | null | undefined): string {
  return String(value ?? '')
    .replace(/\s+/g, '')
    .replace(/^\+/, '')
    .trim()
}

export enum VoiceLeadSource {
  Call = 'Call',
  Web = 'Web',
  Api = 'Api',
  Sms = 'Sms',
  Email = 'Email',
  Chat = 'Chat',
  SocialMedia = 'SocialMedia',
  Other = 'Other',
}

export enum VoiceLeadStatus {
  New = 'New',
  Done = 'Done',
  Confirmed = 'Confirmed',
  NoShow = 'NoShow',
}

export const BOOKING_DAY_OF_WEEK = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const

export type BookingDayOfWeek = (typeof BOOKING_DAY_OF_WEEK)[number]

export interface BookingServiceDto {
  id: string
  name: string
  price: number | null
  durationMinutes: number | null
  note: string | null
  icon: string | null
}

/** Fixed id of the virtual "Other services" group — never send it back to the API. */
export const OTHER_SERVICES_CATEGORY_ID =
  '00000000-0000-0000-0000-000000000001'

export interface BookingServiceCategoryDto {
  id: string
  name: string
  description: string | null
  /** True only for the virtual "Other services" group (no DB row). */
  isSystem: boolean
  services: BookingServiceDto[]
}

export interface BookingStaffDto {
  id: string
  fullName: string
}

export interface BookingOperatingHourDto {
  dayOfWeek: BookingDayOfWeek | string
  isOpen: boolean
  openTime: string | null
  closeTime: string | null
}

export interface BookingCustomerDto {
  name: string | null
  phoneNumber: string
}

export interface BookingPageDataDto {
  businessKey: string
  businessName: string
  timeZone: string | null
  services: BookingServiceDto[]
  categories: BookingServiceCategoryDto[]
  staff: BookingStaffDto[]
  operatingHours: BookingOperatingHourDto[]
  holidays?: BookingHolidayDto[]
  /** Recognised active customer when `phone` query matches; otherwise null/omitted. */
  customer?: BookingCustomerDto | null
}

export interface BookingHolidayDto {
  holidayDate: string
  reason: string
  type: string
  adjustedOpenTime: string | null
  adjustedCloseTime: string | null
}

/** Public create body — matches OpenAPI `CreateOnlineBookingRequest`. */
export interface CreateOnlineBookingRequest {
  customerName: string
  customerPhone: string
  serviceIds: string[]
  staffId?: string | null
  date: string
  startTime: string
  notes?: string | null
  // SMS consent (A2P 10DLC / TCPA) — see CreatePublicBookingPayload for the contract.
  transactionalConsent?: boolean
  marketingConsent?: boolean
  disclosureVersion?: string
  locale?: string
  sourceUrl?: string
}

export interface CreateOnlineBookingResultDto {
  leadId: string
  customerName: string | null
  customerPhone: string | null
  serviceName: string | null
  serviceNames?: string[] | null
  servicePrice: number | null
  staffName: string | null
  requestedTimeLocal: string | null
  status: VoiceLeadStatus | string
}

/** Normalized UI shapes used by the public booking page. */
export interface PublicBookingService {
  id: string
  name: string
  price: number | null
  priceCents: number
  durationMinutes: number
  note: string
  icon: string
  categoryId?: string
  categoryName?: string
}

export interface PublicBookingServiceCategory {
  id: string
  name: string
  description: string
  isSystem: boolean
  services: PublicBookingService[]
}

export interface PublicBookingStaff {
  id: string
  fullName: string
  initials: string
}

export interface PublicBookingOperatingHour {
  dayOfWeek: BookingDayOfWeek | string
  isOpen: boolean
  openTime: string | null
  closeTime: string | null
}

export interface PublicBookingCustomer {
  name: string
  phoneNumber: string
}

export interface PublicBookingHoliday {
  holidayDate: string
  reason: string
  type: string
  adjustedOpenTime: string | null
  adjustedCloseTime: string | null
}

export interface PublicBookingPageData {
  businessKey: string
  businessName: string
  timeZone: string | null
  services: PublicBookingService[]
  categories: PublicBookingServiceCategory[]
  staff: PublicBookingStaff[]
  operatingHours: PublicBookingOperatingHour[]
  holidays: PublicBookingHoliday[]
  customer: PublicBookingCustomer | null
}

export interface PublicBookingCreateResult {
  leadId: string
  customerName: string
  customerPhone: string
  serviceName: string
  serviceNames: string[]
  servicePrice: number | null
  staffName: string
  requestedTimeLocal: string
  status: string
}
