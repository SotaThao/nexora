/** Query param names for merchant `/nexora-voice/*` list endpoints (Swagger PascalCase). */
export const MerchantVoiceListQueryParam = {
  PageNumber: 'PageNumber',
  PageSize: 'PageSize',
  Status: 'Status',
  SearchTerm: 'SearchTerm',
  /** OpenAPI for `GET .../staff/business-staff` only (camelCase). */
  BusinessStaffSearchTerm: 'searchTerm',
  Group: 'Group',
  SearchBy: 'SearchBy',
  Keyword: 'Keyword',
  DateFrom: 'DateFrom',
  DateTo: 'DateTo',
} as const

/** Booking Hub route query values (not API enums). */
export enum BookingHubMainTab {
  Booking = 'booking',
  Customers = 'customers',
  CallLog = 'calllog',
  Plans = 'plans',
  Settings = 'settings',
}

export enum BookingHubSubTab {
  Today = 'today',
  Team = 'team',
}

/** Poll interval when Booking Hub Today tab is active. */
export const MERCHANT_VOICE_BOOKINGS_POLL_INTERVAL_MS = 30_000

/** Minimum service duration (minutes) in Booking Hub settings. */
export const MERCHANT_VOICE_SERVICE_MIN_DURATION_MINUTES = 1

export enum MerchantVoiceServiceField {
  Name = 'name',
  Price = 'price',
  Duration = 'duration',
}

export function clampMerchantVoiceServiceDurationMinutes(duration: number): number {
  return Number.isFinite(duration) && duration >= MERCHANT_VOICE_SERVICE_MIN_DURATION_MINUTES
    ? duration
    : MERCHANT_VOICE_SERVICE_MIN_DURATION_MINUTES
}

export function isValidMerchantVoiceServiceDuration(duration: number): boolean {
  return Number.isFinite(duration) && duration >= MERCHANT_VOICE_SERVICE_MIN_DURATION_MINUTES
}

/** UI-only booking list status (derived from API lead status). */
export enum BookingUiStatus {
  New = 'new',
  SmsSent = 'sms-sent',
  Done = 'done',
  NoShow = 'noshow',
}

/** UI display labels for booking source badges. */
export enum BookingUiSource {
  Voice = 'Voice',
  LandingPage = 'Landing Page',
  SMS = 'SMS',
  QR = 'QR',
}

export enum BookingUiSearchField {
  All = 'all',
  Name = 'name',
  Phone = 'phone',
  Email = 'email',
  Service = 'service',
}

export enum MerchantVoiceLeadStatus {
  New = 0,
  Done = 1,
  Confirmed = 2,
  NoShow = 3,
}

export const MerchantVoiceLeadStatusApi = {
  New: 'New',
  Done: 'Done',
  Confirmed: 'Confirmed',
  NoShow: 'NoShow',
} as const

export type MerchantVoiceLeadStatusApiValue =
  typeof MerchantVoiceLeadStatusApi[keyof typeof MerchantVoiceLeadStatusApi]

export enum MerchantVoiceLeadSource {
  Voice = 0,
  LandingPage = 1,
  SMS = 2,
  QR = 3,
}

export const MerchantVoiceLeadSourceApi = {
  Call: 'Call',
  Web: 'Web',
  Api: 'Api',
} as const

export type MerchantVoiceLeadSourceApiValue =
  typeof MerchantVoiceLeadSourceApi[keyof typeof MerchantVoiceLeadSourceApi]

export enum MerchantVoiceBookingSearchField {
  Name = 0,
  Phone = 1,
  Email = 2,
  Service = 3,
}

export const MerchantVoiceBookingSearchFieldApi = {
  Name: 'Name',
  Phone: 'Phone',
  Email: 'Email',
  Service: 'Service',
} as const

export type MerchantVoiceBookingSearchFieldApiValue =
  typeof MerchantVoiceBookingSearchFieldApi[keyof typeof MerchantVoiceBookingSearchFieldApi]

export enum MerchantVoiceDayOfWeek {
  Sunday = 0,
  Monday = 1,
  Tuesday = 2,
  Wednesday = 3,
  Thursday = 4,
  Friday = 5,
  Saturday = 6,
}

export const MerchantVoiceDayOfWeekApi = {
  Sunday: 'Sunday',
  Monday: 'Monday',
  Tuesday: 'Tuesday',
  Wednesday: 'Wednesday',
  Thursday: 'Thursday',
  Friday: 'Friday',
  Saturday: 'Saturday',
} as const

export type MerchantVoiceDayOfWeekApiValue =
  typeof MerchantVoiceDayOfWeekApi[keyof typeof MerchantVoiceDayOfWeekApi]

export enum MerchantVoiceStaffStatus {
  Active = 0,
  Inactive = 1,
}

export const MerchantVoiceStaffActivityStatusApi = {
  Active: 'Active',
  Inactive: 'Inactive',
} as const

export type MerchantVoiceStaffActivityStatusApiValue =
  typeof MerchantVoiceStaffActivityStatusApi[keyof typeof MerchantVoiceStaffActivityStatusApi]

export enum MerchantVoiceConfigLanguage {
  ViVN = 'vi-VN',
  EnUS = 'en-US',
}

export enum MerchantVoiceUiLanguage {
  Vi = 'vi',
  En = 'en',
}

export enum MerchantVoiceErrorCode {
  ConfirmationSmsAlreadySent = 'VOICE_LEAD_CONFIRMATION_SMS_ALREADY_SENT',
  StaffPhoneNumberRequired = 'VOICE_TENANT_STAFF_PHONE_NUMBER_REQUIRED',
  StaffPhoneNumberAlreadyExists = 'VOICE_TENANT_STAFF_PHONE_NUMBER_ALREADY_EXISTS',
  CallNotMissedCall = 'VOICE_CALL_NOT_MISSED_CALL',
  CallFollowUpSmsAlreadySent = 'VOICE_CALL_FOLLOW_UP_SMS_ALREADY_SENT',
  CallCallerPhoneMissing = 'VOICE_CALL_CALLER_PHONE_MISSING',
  CallNotFound = 'VOICE_CALL_NOT_FOUND',
  CustomerNotFound = 'VOICE_CUSTOMER_NOT_FOUND',
}

/** Call outcome as returned by GET /calls (serialized as string on the wire). */
export enum MerchantVoiceCallOutcome {
  Unknown = 'Unknown',
  Missed = 'Missed',
  Inquiry = 'Inquiry',
  Booking = 'Booking',
  Ticket = 'Ticket',
}

/** Status-group filter accepted by GET /calls?status=. */
export const MerchantVoiceCallStatusGroupApi = {
  Missed: 'Missed',
  Answered: 'Answered',
  Booked: 'Booked',
} as const

export type MerchantVoiceCallStatusGroupApiValue =
  typeof MerchantVoiceCallStatusGroupApi[keyof typeof MerchantVoiceCallStatusGroupApi]

/** UI-only call status derived from outcome for filter chips + badges. */
export enum CallUiStatus {
  Answered = 'answered',
  Missed = 'missed',
  Booked = 'booked',
}

export function normalizeMerchantVoiceCallOutcome(value: unknown): MerchantVoiceCallOutcome {
  const normalized = String(value ?? '').trim()
  const match = Object.values(MerchantVoiceCallOutcome).find(
    (outcome) => outcome.toLowerCase() === normalized.toLowerCase(),
  )
  return match ?? MerchantVoiceCallOutcome.Unknown
}

export function mapCallOutcomeToUiStatus(outcome: MerchantVoiceCallOutcome): CallUiStatus {
  if (outcome === MerchantVoiceCallOutcome.Missed) return CallUiStatus.Missed
  if (outcome === MerchantVoiceCallOutcome.Booking) return CallUiStatus.Booked
  return CallUiStatus.Answered
}

export function mapCallUiStatusToApiGroup(status: CallUiStatus): MerchantVoiceCallStatusGroupApiValue {
  if (status === CallUiStatus.Missed) return MerchantVoiceCallStatusGroupApi.Missed
  if (status === CallUiStatus.Booked) return MerchantVoiceCallStatusGroupApi.Booked
  return MerchantVoiceCallStatusGroupApi.Answered
}

/** Customer group as returned by GET /customers (computed; not stored / not editable). */
export enum MerchantVoiceCustomerGroup {
  Active = 'Active',
  New = 'New',
  Days15 = 'Days15',
  Days30 = 'Days30',
  Days60 = 'Days60',
  Vip = 'Vip',
}

const CUSTOMER_GROUP_BY_API_VALUE: MerchantVoiceCustomerGroup[] = [
  MerchantVoiceCustomerGroup.Active,
  MerchantVoiceCustomerGroup.New,
  MerchantVoiceCustomerGroup.Days15,
  MerchantVoiceCustomerGroup.Days30,
  MerchantVoiceCustomerGroup.Days60,
  MerchantVoiceCustomerGroup.Vip,
]

/** UI-only segment id used for filter chips + badges — Active has no chip (shown as "—"). */
export enum CustomerUiSegment {
  New = 'new',
  Day15 = 'day15',
  Day30 = 'day30',
  Day60 = 'day60',
  Vip = 'vip',
}

export function normalizeMerchantVoiceCustomerGroup(value: unknown): MerchantVoiceCustomerGroup | null {
  if (typeof value === 'number' && Number.isInteger(value)) {
    return CUSTOMER_GROUP_BY_API_VALUE[value] ?? null
  }

  const normalized = String(value ?? '').trim()
  if (!normalized) return null

  const asNumber = Number(normalized)
  if (!Number.isNaN(asNumber) && Number.isInteger(asNumber) && String(asNumber) === normalized) {
    return CUSTOMER_GROUP_BY_API_VALUE[asNumber] ?? null
  }

  const match = Object.values(MerchantVoiceCustomerGroup).find(
    (group) => group.toLowerCase() === normalized.toLowerCase(),
  )
  return match ?? null
}

/** UI filter chips ↔ API customer group (Active has no chip). */
const CUSTOMER_GROUP_UI_PAIRS = [
  [MerchantVoiceCustomerGroup.New, CustomerUiSegment.New],
  [MerchantVoiceCustomerGroup.Days15, CustomerUiSegment.Day15],
  [MerchantVoiceCustomerGroup.Days30, CustomerUiSegment.Day30],
  [MerchantVoiceCustomerGroup.Days60, CustomerUiSegment.Day60],
  [MerchantVoiceCustomerGroup.Vip, CustomerUiSegment.Vip],
] as const satisfies ReadonlyArray<readonly [MerchantVoiceCustomerGroup, CustomerUiSegment]>

const CUSTOMER_GROUP_TO_UI_SEGMENT: Partial<Record<MerchantVoiceCustomerGroup, CustomerUiSegment>> =
  Object.fromEntries(CUSTOMER_GROUP_UI_PAIRS)

const UI_SEGMENT_TO_CUSTOMER_GROUP: Record<CustomerUiSegment, MerchantVoiceCustomerGroup> =
  Object.fromEntries(
    CUSTOMER_GROUP_UI_PAIRS.map(([group, segment]) => [segment, group]),
  ) as Record<CustomerUiSegment, MerchantVoiceCustomerGroup>

export function mapCustomerGroupToUiSegment(group: MerchantVoiceCustomerGroup | null): CustomerUiSegment | null {
  if (!group) return null
  return CUSTOMER_GROUP_TO_UI_SEGMENT[group] ?? null
}

export function mapUiSegmentToApiGroup(segment: CustomerUiSegment): MerchantVoiceCustomerGroup {
  return UI_SEGMENT_TO_CUSTOMER_GROUP[segment]
}

/**
 * Customer classification stored on VoiceCustomer and editable via PUT /customers/{id}.
 * Setting type=Vip makes the computed list group Vip (see VoiceCustomerGroup cascade).
 */
export enum MerchantVoiceCustomerType {
  Individual = 'Individual',
  Business = 'Business',
  Vip = 'Vip',
  Guest = 'Guest',
  Partner = 'Partner',
  Internal = 'Internal',
}

export function normalizeMerchantVoiceCustomerType(value: unknown): MerchantVoiceCustomerType {
  const normalized = String(value ?? '').trim()
  const match = Object.values(MerchantVoiceCustomerType).find(
    (type) => type.toLowerCase() === normalized.toLowerCase(),
  )
  return match ?? MerchantVoiceCustomerType.Individual
}

export enum MerchantVoiceCustomerStatus {
  Active = 'Active',
  InActive = 'InActive',
}

export function normalizeMerchantVoiceCustomerStatus(value: unknown): MerchantVoiceCustomerStatus {
  const normalized = String(value ?? '').trim().toLowerCase()
  if (normalized === MerchantVoiceCustomerStatus.InActive.toLowerCase() || normalized === 'inactive') {
    return MerchantVoiceCustomerStatus.InActive
  }
  return MerchantVoiceCustomerStatus.Active
}

export function isCustomerStatusActive(status: unknown): boolean {
  return normalizeMerchantVoiceCustomerStatus(status) === MerchantVoiceCustomerStatus.Active
}

const LEAD_STATUS_API_TO_ENUM: Record<string, MerchantVoiceLeadStatus> = {
  [MerchantVoiceLeadStatusApi.New]: MerchantVoiceLeadStatus.New,
  [MerchantVoiceLeadStatusApi.Done]: MerchantVoiceLeadStatus.Done,
  [MerchantVoiceLeadStatusApi.Confirmed]: MerchantVoiceLeadStatus.Confirmed,
  [MerchantVoiceLeadStatusApi.NoShow]: MerchantVoiceLeadStatus.NoShow,
}

const LEAD_SOURCE_API_TO_ENUM: Record<string, MerchantVoiceLeadSource> = {
  [MerchantVoiceLeadSourceApi.Call]: MerchantVoiceLeadSource.Voice,
  [MerchantVoiceLeadSourceApi.Web]: MerchantVoiceLeadSource.LandingPage,
  [MerchantVoiceLeadSourceApi.Api]: MerchantVoiceLeadSource.SMS,
}

export function normalizeMerchantVoiceLeadStatus(value: unknown): MerchantVoiceLeadStatus {
  if (value === MerchantVoiceLeadStatus.New || value === '0') return MerchantVoiceLeadStatus.New
  if (value === MerchantVoiceLeadStatus.Done || value === '1') return MerchantVoiceLeadStatus.Done
  if (value === MerchantVoiceLeadStatus.Confirmed || value === '2') return MerchantVoiceLeadStatus.Confirmed
  if (value === MerchantVoiceLeadStatus.NoShow || value === '3') return MerchantVoiceLeadStatus.NoShow

  if (typeof value === 'string') {
    const mapped = LEAD_STATUS_API_TO_ENUM[value]
    if (mapped !== undefined) return mapped
  }

  return MerchantVoiceLeadStatus.New
}

export function normalizeMerchantVoiceLeadSource(value: unknown): MerchantVoiceLeadSource {
  if (value === MerchantVoiceLeadSource.Voice || value === '0') return MerchantVoiceLeadSource.Voice
  if (value === MerchantVoiceLeadSource.LandingPage || value === '1') return MerchantVoiceLeadSource.LandingPage
  if (value === MerchantVoiceLeadSource.SMS || value === '2') return MerchantVoiceLeadSource.SMS
  if (value === MerchantVoiceLeadSource.QR || value === '3') return MerchantVoiceLeadSource.QR

  if (typeof value === 'string') {
    const mapped = LEAD_SOURCE_API_TO_ENUM[value]
    if (mapped !== undefined) return mapped
  }

  return MerchantVoiceLeadSource.Voice
}

export function mapLeadStatusToUiStatus(status: MerchantVoiceLeadStatus): BookingUiStatus {
  if (status === MerchantVoiceLeadStatus.Done) return BookingUiStatus.Done
  if (status === MerchantVoiceLeadStatus.Confirmed) return BookingUiStatus.SmsSent
  if (status === MerchantVoiceLeadStatus.NoShow) return BookingUiStatus.NoShow
  return BookingUiStatus.New
}

export function mapLeadSourceToUiSource(source: MerchantVoiceLeadSource): BookingUiSource {
  if (source === MerchantVoiceLeadSource.LandingPage) return BookingUiSource.LandingPage
  if (source === MerchantVoiceLeadSource.SMS) return BookingUiSource.SMS
  if (source === MerchantVoiceLeadSource.QR) return BookingUiSource.QR
  return BookingUiSource.Voice
}

export function mapUiSourceToSourceClass(source: BookingUiSource): string {
  if (source === BookingUiSource.LandingPage) return 'booking-source-lp'
  if (source === BookingUiSource.SMS) return 'booking-source-sms'
  if (source === BookingUiSource.QR) return 'booking-source-qr'
  return 'booking-source-voice'
}

export const BOOKING_UI_SOURCE_I18N_KEY: Record<BookingUiSource, string> = {
  [BookingUiSource.Voice]: 'sources.voice',
  [BookingUiSource.LandingPage]: 'sources.landingPage',
  [BookingUiSource.SMS]: 'sources.sms',
  [BookingUiSource.QR]: 'sources.qr',
}

export const BOOKING_UI_SEARCH_FIELD_TO_API: Record<
  BookingUiSearchField,
  MerchantVoiceBookingSearchField | undefined
> = {
  [BookingUiSearchField.All]: undefined,
  [BookingUiSearchField.Name]: MerchantVoiceBookingSearchField.Name,
  [BookingUiSearchField.Phone]: MerchantVoiceBookingSearchField.Phone,
  [BookingUiSearchField.Email]: MerchantVoiceBookingSearchField.Email,
  [BookingUiSearchField.Service]: MerchantVoiceBookingSearchField.Service,
}

export function normalizeMerchantVoiceStaffStatus(value: unknown): MerchantVoiceStaffStatus {
  if (
    value === MerchantVoiceStaffStatus.Active
    || value === '0'
    || value === MerchantVoiceStaffActivityStatusApi.Active
    || value === 'active'
    || value === true
  ) {
    return MerchantVoiceStaffStatus.Active
  }

  if (
    value === MerchantVoiceStaffStatus.Inactive
    || value === '1'
    || value === MerchantVoiceStaffActivityStatusApi.Inactive
    || value === 'inactive'
    || value === false
  ) {
    return MerchantVoiceStaffStatus.Inactive
  }

  return MerchantVoiceStaffStatus.Active
}

export function mapStaffStatusToActivityApi(
  status: MerchantVoiceStaffStatus,
): MerchantVoiceStaffActivityStatusApiValue {
  return status === MerchantVoiceStaffStatus.Inactive
    ? MerchantVoiceStaffActivityStatusApi.Inactive
    : MerchantVoiceStaffActivityStatusApi.Active
}

export function isStaffStatusActive(status: unknown): boolean {
  return normalizeMerchantVoiceStaffStatus(status) === MerchantVoiceStaffStatus.Active
}

export function normalizeMerchantVoiceDayOfWeek(value: unknown): MerchantVoiceDayOfWeek | null {
  if (value === null || value === undefined || value === '') return null

  if (typeof value === 'number' && value >= 0 && value <= 6) {
    return value as MerchantVoiceDayOfWeek
  }

  const trimmed = String(value).trim()
  const numeric = Number(trimmed)
  if (!Number.isNaN(numeric) && numeric >= 0 && numeric <= 6) {
    return numeric as MerchantVoiceDayOfWeek
  }

  const apiEntry = Object.entries(MerchantVoiceDayOfWeekApi).find(
    ([name]) => name.toLowerCase() === trimmed.toLowerCase(),
  )
  if (!apiEntry) return null

  const dayName = apiEntry[0] as keyof typeof MerchantVoiceDayOfWeekApi
  return MerchantVoiceDayOfWeek[dayName]
}

export function mapDayOfWeekToApiName(day: MerchantVoiceDayOfWeek): MerchantVoiceDayOfWeekApiValue {
  return MerchantVoiceDayOfWeekApi[MerchantVoiceDayOfWeek[day] as keyof typeof MerchantVoiceDayOfWeekApi]
}

export function mapConfigLanguageToUiLanguage(language: string | null | undefined): MerchantVoiceUiLanguage {
  const normalized = String(language ?? '').trim().toLowerCase()
  if (
    normalized === MerchantVoiceConfigLanguage.ViVN.toLowerCase()
    || normalized === MerchantVoiceUiLanguage.Vi
    || normalized.startsWith('vi')
  ) {
    return MerchantVoiceUiLanguage.Vi
  }
  // Treat unknown values as English — UI only exposes VI + EN.
  return MerchantVoiceUiLanguage.En
}

export function mapUiLanguageToConfigLanguage(language: MerchantVoiceUiLanguage): MerchantVoiceConfigLanguage {
  return language === MerchantVoiceUiLanguage.Vi
    ? MerchantVoiceConfigLanguage.ViVN
    : MerchantVoiceConfigLanguage.EnUS
}

export function parseBookingHubMainTab(value: string | null): BookingHubMainTab {
  if (value === BookingHubMainTab.Customers) return BookingHubMainTab.Customers
  if (value === BookingHubMainTab.CallLog) return BookingHubMainTab.CallLog
  if (value === BookingHubMainTab.Plans) return BookingHubMainTab.Plans
  if (value === BookingHubMainTab.Settings) return BookingHubMainTab.Settings
  return BookingHubMainTab.Booking
}

export function parseBookingHubSubTab(value: string | null): BookingHubSubTab {
  if (value === BookingHubSubTab.Team) return BookingHubSubTab.Team
  return BookingHubSubTab.Today
}
