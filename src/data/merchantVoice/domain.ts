/** Virtual "Other services" category id — not mutable via category CRUD. */
export const OTHER_SERVICES_CATEGORY_ID = '00000000-0000-0000-0000-000000000001'

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
  SmsCampaigns = 'sms-campaigns',
  Plans = 'plans',
  Settings = 'settings',
}

/** Wire enum — SMS campaign status (API). */
export enum SmsCampaignStatus {
  Draft = 'Draft',
  Scheduled = 'Scheduled',
  Sending = 'Sending',
  Sent = 'Sent',
  PartiallyFailed = 'PartiallyFailed',
  Failed = 'Failed',
  Cancelled = 'Cancelled',
  Active = 'Active',
  Paused = 'Paused',
}

/** Wire enum — SMS campaign schedule mode (API). */
export enum SmsCampaignScheduleMode {
  SendNow = 'SendNow',
  Scheduled = 'Scheduled',
  Auto = 'Auto',
}

/** Wire enum — SMS campaign audience segment (API). */
export enum SmsCampaignAudience {
  New = 'New',
  Days15 = 'Days15',
  Days30 = 'Days30',
  Days60 = 'Days60',
  Vip = 'Vip',
  Birthday = 'Birthday',
}

/** Wire enum — SMS campaign recipient status (API). */
export enum SmsCampaignRecipientStatus {
  Pending = 'Pending',
  Sent = 'Sent',
  Failed = 'Failed',
  Cancelled = 'Cancelled',
}

/** Wire enum — SMS credit transaction type (API). */
export enum SmsCreditTransactionType {
  Purchase = 'Purchase',
  Consumption = 'Consumption',
  Adjustment = 'Adjustment',
  Refund = 'Refund',
}

/** Wire enum — SMS text encoding (API). */
export enum SmsEncoding {
  Gsm7 = 'Gsm7',
  Ucs2 = 'Ucs2',
}

/** Known SMS credit package codes (server catalog). */
export enum SmsCreditPackageCode {
  Sms500 = 'SMS_500',
  Sms1500 = 'SMS_1500',
  Sms3000 = 'SMS_3000',
  Sms6000 = 'SMS_6000',
}

/** SMS campaign / credit API error codes. */
export enum SmsCampaignErrorCode {
  NotFound = 'SMS_CAMPAIGN_NOT_FOUND',
  InvalidStatusTransition = 'SMS_CAMPAIGN_INVALID_STATUS_TRANSITION',
  NotEditable = 'SMS_CAMPAIGN_NOT_EDITABLE',
  NotAutoCampaign = 'SMS_CAMPAIGN_NOT_AUTO_CAMPAIGN',
  NoRecipients = 'SMS_CAMPAIGN_NO_RECIPIENTS',
  InsufficientCredits = 'SMS_CAMPAIGN_INSUFFICIENT_CREDITS',
  MessageBodyRequired = 'SMS_CAMPAIGN_MESSAGE_BODY_REQUIRED',
  ScheduledAtRequired = 'SMS_CAMPAIGN_SCHEDULED_AT_REQUIRED',
  ScheduledAtInPast = 'SMS_CAMPAIGN_SCHEDULED_AT_IN_PAST',
  InvalidPackage = 'SMS_CREDIT_INVALID_PACKAGE',
  UserNotMerchant = 'USER_NOT_MERCHANT',
  VoiceTenantNotFound = 'VOICE_TENANT_NOT_FOUND',
}

/** @deprecated Prefer SmsCampaignAudience — kept as alias for gradual migration. */
export type SmsCampaignSegmentId = SmsCampaignAudience
export const SmsCampaignSegmentId = SmsCampaignAudience

/** @deprecated Prefer SmsCampaignStatus */
export type SmsCampaignUiStatus = SmsCampaignStatus
export const SmsCampaignUiStatus = SmsCampaignStatus

/** @deprecated Prefer SmsCampaignScheduleMode */
export enum SmsCampaignUiMode {
  Now = SmsCampaignScheduleMode.SendNow,
  Scheduled = SmsCampaignScheduleMode.Scheduled,
  Automated = SmsCampaignScheduleMode.Auto,
}

export function normalizeSmsCampaignStatus(value: unknown): SmsCampaignStatus {
  const normalized = String(value ?? '').trim()
  const match = Object.values(SmsCampaignStatus).find(
    (status) => status.toLowerCase() === normalized.toLowerCase(),
  )
  return match ?? SmsCampaignStatus.Draft
}

export function normalizeSmsCampaignScheduleMode(value: unknown): SmsCampaignScheduleMode {
  const normalized = String(value ?? '').trim()
  const match = Object.values(SmsCampaignScheduleMode).find(
    (mode) => mode.toLowerCase() === normalized.toLowerCase(),
  )
  return match ?? SmsCampaignScheduleMode.SendNow
}

export function normalizeSmsCampaignAudience(value: unknown): SmsCampaignAudience {
  const normalized = String(value ?? '').trim().toLowerCase()
  if (normalized === 'day15' || normalized === 'days15') return SmsCampaignAudience.Days15
  if (normalized === 'day30' || normalized === 'days30') return SmsCampaignAudience.Days30
  if (normalized === 'day60' || normalized === 'days60') return SmsCampaignAudience.Days60
  if (normalized === 'vip') return SmsCampaignAudience.Vip
  if (normalized === 'birthday') return SmsCampaignAudience.Birthday
  if (normalized === 'new') return SmsCampaignAudience.New
  const match = Object.values(SmsCampaignAudience).find(
    (audience) => audience.toLowerCase() === normalized,
  )
  return match ?? SmsCampaignAudience.New
}

export function normalizeSmsCampaignRecipientStatus(value: unknown): SmsCampaignRecipientStatus {
  const normalized = String(value ?? '').trim()
  const match = Object.values(SmsCampaignRecipientStatus).find(
    (status) => status.toLowerCase() === normalized.toLowerCase(),
  )
  return match ?? SmsCampaignRecipientStatus.Pending
}

export function normalizeSmsCreditTransactionType(value: unknown): SmsCreditTransactionType {
  const normalized = String(value ?? '').trim()
  const match = Object.values(SmsCreditTransactionType).find(
    (type) => type.toLowerCase() === normalized.toLowerCase(),
  )
  return match ?? SmsCreditTransactionType.Purchase
}

export function normalizeSmsEncoding(value: unknown): SmsEncoding {
  const normalized = String(value ?? '').trim()
  const match = Object.values(SmsEncoding).find(
    (encoding) => encoding.toLowerCase() === normalized.toLowerCase(),
  )
  return match ?? SmsEncoding.Gsm7
}

/** Recipients modal — every persisted campaign status can open the list. */
const SMS_CAMPAIGN_VIEWABLE_STATUSES = new Set<SmsCampaignStatus>(
  Object.values(SmsCampaignStatus),
)

export function isSmsCampaignViewable(status: SmsCampaignStatus): boolean {
  return SMS_CAMPAIGN_VIEWABLE_STATUSES.has(status)
}

export function isSmsCampaignEditable(status: SmsCampaignStatus): boolean {
  return (
    status === SmsCampaignStatus.Scheduled
    || status === SmsCampaignStatus.Active
  )
}

export function isSmsCampaignCancellable(status: SmsCampaignStatus): boolean {
  return (
    status === SmsCampaignStatus.Scheduled
    || status === SmsCampaignStatus.Active
  )
}

/** Delete only after cancel — never alongside Cancel on Scheduled/Active. */
export function isSmsCampaignDeletable(status: SmsCampaignStatus, _totalSent = 0): boolean {
  return status === SmsCampaignStatus.Cancelled
}

export function isSmsCampaignAutoToggleable(
  scheduleMode: SmsCampaignScheduleMode,
  status: SmsCampaignStatus,
): boolean {
  return (
    scheduleMode === SmsCampaignScheduleMode.Auto
    && (status === SmsCampaignStatus.Active || status === SmsCampaignStatus.Paused)
  )
}

export enum BookingHubSubTab {
  Today = 'today',
  Calendar = 'calendar',
  Team = 'team',
}

/** Poll interval when Booking Hub Today tab is active. */
export const MERCHANT_VOICE_BOOKINGS_POLL_INTERVAL_MS = 30_000

/** Poll interval when Booking Hub SMS Campaigns tab is active. */
export const MERCHANT_VOICE_SMS_CAMPAIGNS_POLL_INTERVAL_MS = 15_000

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
  Web = 'Web',
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
  Auto = 'auto',
  ViVN = 'vi-VN',
  EnUS = 'en-US',
}

export enum MerchantVoiceUiLanguage {
  Auto = 'auto',
  Vi = 'vi',
  En = 'en',
}

/** Legacy / alternate wire values that still map to Auto. */
const MERCHANT_VOICE_CONFIG_LANGUAGE_AUTO_ALIASES = new Set<string>([
  MerchantVoiceConfigLanguage.Auto,
  MerchantVoiceUiLanguage.Auto,
  'auto-detect',
  'bilingual',
])

const MERCHANT_VOICE_UI_TO_CONFIG_LANGUAGE: Record<
  MerchantVoiceUiLanguage,
  MerchantVoiceConfigLanguage
> = {
  [MerchantVoiceUiLanguage.Auto]: MerchantVoiceConfigLanguage.Auto,
  [MerchantVoiceUiLanguage.Vi]: MerchantVoiceConfigLanguage.ViVN,
  [MerchantVoiceUiLanguage.En]: MerchantVoiceConfigLanguage.EnUS,
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

/** Case-insensitive aliases when API sends non-canonical source strings. */
const LEAD_SOURCE_ALIAS_TO_ENUM: Record<string, MerchantVoiceLeadSource> = {
  web: MerchantVoiceLeadSource.LandingPage,
  landingpage: MerchantVoiceLeadSource.LandingPage,
  'landing page': MerchantVoiceLeadSource.LandingPage,
  call: MerchantVoiceLeadSource.Voice,
  voice: MerchantVoiceLeadSource.Voice,
  api: MerchantVoiceLeadSource.SMS,
  sms: MerchantVoiceLeadSource.SMS,
  qr: MerchantVoiceLeadSource.QR,
}

/** API `Web` normalizes to LandingPage — booking hub badge shows Web. */
const LEAD_SOURCE_TO_UI_SOURCE: Record<MerchantVoiceLeadSource, BookingUiSource> = {
  [MerchantVoiceLeadSource.Voice]: BookingUiSource.Voice,
  [MerchantVoiceLeadSource.LandingPage]: BookingUiSource.Web,
  [MerchantVoiceLeadSource.SMS]: BookingUiSource.SMS,
  [MerchantVoiceLeadSource.QR]: BookingUiSource.QR,
}

const BOOKING_UI_SOURCE_CLASS: Record<BookingUiSource, string> = {
  [BookingUiSource.Voice]: 'booking-source-voice',
  [BookingUiSource.Web]: 'booking-source-web',
  [BookingUiSource.LandingPage]: 'booking-source-web',
  [BookingUiSource.SMS]: 'booking-source-sms',
  [BookingUiSource.QR]: 'booking-source-qr',
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
    const trimmed = value.trim()
    const exact = LEAD_SOURCE_API_TO_ENUM[trimmed]
    if (exact !== undefined) return exact
    const alias = LEAD_SOURCE_ALIAS_TO_ENUM[trimmed.toLowerCase()]
    if (alias !== undefined) return alias
  }

  return MerchantVoiceLeadSource.Voice
}

const LEAD_STATUS_TO_UI_STATUS: Record<MerchantVoiceLeadStatus, BookingUiStatus> = {
  [MerchantVoiceLeadStatus.New]: BookingUiStatus.New,
  [MerchantVoiceLeadStatus.Confirmed]: BookingUiStatus.SmsSent,
  [MerchantVoiceLeadStatus.Done]: BookingUiStatus.Done,
  [MerchantVoiceLeadStatus.NoShow]: BookingUiStatus.NoShow,
}

const UI_STATUS_TO_LEAD_STATUS_API: Record<BookingUiStatus, MerchantVoiceLeadStatusApiValue> = {
  [BookingUiStatus.New]: MerchantVoiceLeadStatusApi.New,
  [BookingUiStatus.SmsSent]: MerchantVoiceLeadStatusApi.Confirmed,
  [BookingUiStatus.Done]: MerchantVoiceLeadStatusApi.Done,
  [BookingUiStatus.NoShow]: MerchantVoiceLeadStatusApi.NoShow,
}

export function mapLeadStatusToUiStatus(status: MerchantVoiceLeadStatus): BookingUiStatus {
  return LEAD_STATUS_TO_UI_STATUS[status] ?? BookingUiStatus.New
}

/** UI status → OpenAPI `VoiceLeadStatus` string for create/update booking payloads. */
export function mapUiStatusToLeadStatusApi(
  status: BookingUiStatus,
): MerchantVoiceLeadStatusApiValue {
  return UI_STATUS_TO_LEAD_STATUS_API[status] ?? MerchantVoiceLeadStatusApi.New
}

export function mapLeadSourceToUiSource(source: MerchantVoiceLeadSource): BookingUiSource {
  return LEAD_SOURCE_TO_UI_SOURCE[source] ?? BookingUiSource.Voice
}

export function mapUiSourceToSourceClass(source: BookingUiSource): string {
  return BOOKING_UI_SOURCE_CLASS[source] ?? BOOKING_UI_SOURCE_CLASS[BookingUiSource.Voice]
}

export const BOOKING_UI_SOURCE_I18N_KEY: Record<BookingUiSource, string> = {
  [BookingUiSource.Voice]: 'sources.voice',
  [BookingUiSource.Web]: 'sources.web',
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
  if (MERCHANT_VOICE_CONFIG_LANGUAGE_AUTO_ALIASES.has(normalized)) {
    return MerchantVoiceUiLanguage.Auto
  }
  if (
    normalized === MerchantVoiceConfigLanguage.ViVN.toLowerCase()
    || normalized === MerchantVoiceUiLanguage.Vi
    || normalized.startsWith('vi')
  ) {
    return MerchantVoiceUiLanguage.Vi
  }
  if (
    normalized === MerchantVoiceConfigLanguage.EnUS.toLowerCase()
    || normalized === MerchantVoiceUiLanguage.En
    || normalized.startsWith('en')
  ) {
    return MerchantVoiceUiLanguage.En
  }
  // Unknown values default to Auto (HTML Settings default).
  return MerchantVoiceUiLanguage.Auto
}

export function mapUiLanguageToConfigLanguage(language: MerchantVoiceUiLanguage): MerchantVoiceConfigLanguage {
  return MERCHANT_VOICE_UI_TO_CONFIG_LANGUAGE[language] ?? MerchantVoiceConfigLanguage.EnUS
}

export function parseBookingHubMainTab(value: string | null): BookingHubMainTab {
  if (value === BookingHubMainTab.Customers) return BookingHubMainTab.Customers
  if (value === BookingHubMainTab.CallLog) return BookingHubMainTab.CallLog
  if (value === BookingHubMainTab.SmsCampaigns) return BookingHubMainTab.SmsCampaigns
  if (value === BookingHubMainTab.Plans) return BookingHubMainTab.Plans
  if (value === BookingHubMainTab.Settings) return BookingHubMainTab.Settings
  return BookingHubMainTab.Booking
}

const BOOKING_HUB_SUB_TAB_VALUES = new Set<string>(Object.values(BookingHubSubTab))

export function parseBookingHubSubTab(value: string | null): BookingHubSubTab {
  if (value && BOOKING_HUB_SUB_TAB_VALUES.has(value)) {
    return value as BookingHubSubTab
  }
  return BookingHubSubTab.Today
}
