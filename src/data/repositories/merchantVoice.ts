import httpClient from '../../lib/httpClient'
import { BOOKING_HUB_PAGE_SIZE, BOOKING_HUB_STATUS_COLLECT_MAX_PAGES, BOOKING_HUB_STATUS_COLLECT_PAGE_SIZE } from '../../constants/pagination'
import { HOLIDAY_TYPE, type HolidayType } from '../../constants/holiday'
import {
  mapStaffStatusToActivityApi,
  MerchantVoiceBookingSearchField,
  MerchantVoiceConfigLanguage,
  MerchantVoiceDayOfWeek,
  MerchantVoiceDayOfWeekApiValue,
  MerchantVoiceLeadSource,
  MerchantVoiceLeadStatus,
  MerchantVoiceListQueryParam,
  MerchantVoiceStaffActivityStatusApiValue,
  MerchantVoiceStaffStatus,
  MerchantVoiceCallOutcome,
  type MerchantVoiceCallStatusGroupApiValue,
  MerchantVoiceCustomerGroup,
  MerchantVoiceCustomerStatus,
  MerchantVoiceCustomerType,
  OTHER_SERVICES_CATEGORY_ID,
  normalizeMerchantVoiceCallOutcome,
  normalizeMerchantVoiceCustomerGroup,
  normalizeMerchantVoiceCustomerStatus,
  normalizeMerchantVoiceCustomerType,
  normalizeMerchantVoiceLeadSource,
  normalizeMerchantVoiceLeadStatus,
  normalizeMerchantVoiceStaffStatus,
  normalizeVoiceCreditActivityKind,
  normalizeVoiceCreditType,
  normalizeVoicePlanStatus,
  normalizeVoicePlanTier,
  type MerchantVoiceLeadStatusApiValue,
  VoiceCreditType,
  type VoiceCreditActivityKind,
  type VoicePlanStatus,
  type VoicePlanTier,
} from '../merchantVoice/domain'
import { toUtcBookingSlot } from './publicVoiceBooking'

export {
  BookingHubMainTab,
  BookingHubSubTab,
  clampMerchantVoiceServiceDurationMinutes,
  isValidMerchantVoiceServiceDuration,
  MerchantVoiceServiceField,
  MERCHANT_VOICE_BOOKINGS_POLL_INTERVAL_MS,
  MERCHANT_VOICE_SMS_CAMPAIGNS_POLL_INTERVAL_MS,
  MERCHANT_VOICE_SERVICE_MIN_DURATION_MINUTES,
  BookingUiSearchField,
  BookingUiSource,
  BookingUiStatus,
  BOOKING_UI_SEARCH_FIELD_TO_API,
  BOOKING_UI_SOURCE_I18N_KEY,
  CallUiStatus,
  CustomerUiSegment,
  SmsCampaignSegmentId,
  SmsCampaignUiMode,
  SmsCampaignUiStatus,
  SmsCampaignAudience,
  SmsCampaignStatus,
  SmsCampaignScheduleMode,
  SmsCampaignRecipientStatus,
  SmsCreditTransactionType,
  SmsEncoding,
  SmsCreditPackageCode,
  SmsCampaignErrorCode,
  isSmsCampaignEditable,
  isSmsCampaignCancellable,
  isSmsCampaignDeletable,
  isSmsCampaignAutoToggleable,
  isSmsCampaignViewable,
  normalizeSmsCampaignAudience,
  normalizeSmsCampaignStatus,
  normalizeSmsCampaignScheduleMode,
  MerchantVoiceBookingSearchField,
  MerchantVoiceCallOutcome,
  MerchantVoiceCallStatusGroupApi,
  MerchantVoiceConfigLanguage,
  MerchantVoiceCustomerGroup,
  MerchantVoiceCustomerStatus,
  MerchantVoiceCustomerType,
  MerchantVoiceDayOfWeek,
  MerchantVoiceDayOfWeekApi,
  MerchantVoiceErrorCode,
  MerchantVoiceLeadSource,
  MerchantVoiceLeadSourceApi,
  MerchantVoiceLeadStatus,
  MerchantVoiceLeadStatusApi,
  MerchantVoiceListQueryParam,
  OTHER_SERVICES_CATEGORY_ID,
  MerchantVoiceStaffActivityStatusApi,
  MerchantVoiceStaffStatus,
  MerchantVoiceUiLanguage,
  mapCallOutcomeToUiStatus,
  mapCallUiStatusToApiGroup,
  mapConfigLanguageToUiLanguage,
  mapCustomerGroupToUiSegment,
  mapDayOfWeekToApiName,
  mapLeadSourceToUiSource,
  mapLeadStatusToUiStatus,
  mapUiStatusToLeadStatusApi,
  mapStaffStatusToActivityApi,
  mapUiLanguageToConfigLanguage,
  mapUiSegmentToApiGroup,
  mapUiSourceToSourceClass,
  isCustomerStatusActive,
  isStaffStatusActive,
  normalizeMerchantVoiceCallOutcome,
  normalizeMerchantVoiceCustomerGroup,
  normalizeMerchantVoiceCustomerStatus,
  normalizeMerchantVoiceCustomerType,
  normalizeMerchantVoiceDayOfWeek,
  normalizeMerchantVoiceLeadSource,
  normalizeMerchantVoiceLeadStatus,
  normalizeMerchantVoiceStaffStatus,
  normalizeVoiceCreditActivityKind,
  normalizeVoiceCreditType,
  normalizeVoicePlanStatus,
  normalizeVoicePlanTier,
  parseBookingHubMainTab,
  parseBookingHubSubTab,
  isBookingHubMainTabVisible,
  VoiceCreditActivityKind,
  VoiceCreditType,
  VoicePlanStatus,
  VoicePlanTier,
  CreditsUsageHistoryFilter,
  CreditsUsageProduct,
  CREDITS_USAGE_HISTORY_FILTER_TO_CREDIT_TYPE,
  VOICE_CREDIT_TYPE_TO_PRODUCT,
  mapCreditsUsageHistoryFilterToCreditType,
} from '../merchantVoice/domain'

export type {
  MerchantVoiceBookingSearchFieldApiValue,
  MerchantVoiceCallStatusGroupApiValue,
  MerchantVoiceDayOfWeekApiValue,
  MerchantVoiceLeadSourceApiValue,
  MerchantVoiceLeadStatusApiValue,
  MerchantVoiceStaffActivityStatusApiValue,
} from '../merchantVoice/domain'

type HttpClient = typeof httpClient

const MERCHANT_VOICE_BASE = '/api/v1/merchant/nexora-voice'
// Shared Service/Category catalog base — same endpoints POS Settings calls (see posServices.ts,
// posCategories.ts). Service/Category consolidation, 2026-08-01.
const SHARED_CATALOG_BASE = '/api/v1/merchant'
const MERCHANT_VOICE_HEADERS = {
  'x-api-version': '1',
  'x-app-source': 'WebPortal',
}

export interface MerchantVoiceBookingStatisticsDto {
  allBookings: number
  newBookings: number
  confirmedBookings: number
  doneBookings: number
  noShowBookings: number
}

export interface MerchantVoiceBookingDto {
  id: string
  tenantId: string
  source: MerchantVoiceLeadSource
  customerPhone: string | null
  customerName: string | null
  customerEmail: string | null
  service: string | null
  preferredTime: string | null
  notes: string | null
  status: MerchantVoiceLeadStatus
  confirmationSmsSentAt: string | null
  assignedStaffId: string | null
  assignedStaffName: string | null
  assignedStaffEmail: string | null
  assignedStaffPhone: string | null
  requestedStartAtUtc: string | null
  requestedEndAtUtc: string | null
  createdAt: string
  /** UTC when the inbound voice call that created this booking started. */
  callStartedAt: string | null
  /** Voice call length in seconds (null for non-call sources). */
  callDurationSeconds: number | null
}

export interface MerchantVoiceBookingsResponse {
  items: MerchantVoiceBookingDto[]
  pageNumber: number
  totalPages: number
  totalCount: number
  hasPreviousPage: boolean
  hasNextPage: boolean
}

interface MerchantVoiceBookingsApiResponse {
  items?: MerchantVoiceBookingDto[]
  pageNumber?: number
  totalPages?: number
  totalCount?: number
  hasPreviousPage?: boolean
  hasNextPage?: boolean
}

export interface MerchantVoiceStaffScheduleDto {
  dayOfWeek: number | string
  isDayOff: boolean
  startTime: string | null
  endTime: string | null
}

export interface MerchantVoiceStaffDto {
  id: string
  tenantId: string
  fullName: string
  phoneNumber: string
  email: string | null
  skills: string | null
  status: number
  deletedAt: string | null
  createdAt: string
  schedules: MerchantVoiceStaffScheduleDto[]
}

export interface MerchantVoiceStaffResponse {
  items: MerchantVoiceStaffDto[]
  pageNumber: number
  totalPages: number
  totalCount: number
  hasPreviousPage: boolean
  hasNextPage: boolean
}

interface MerchantVoiceStaffApiResponse {
  items?: MerchantVoiceStaffDto[]
  pageNumber?: number
  totalPages?: number
  totalCount?: number
  hasPreviousPage?: boolean
  hasNextPage?: boolean
}

export interface MerchantVoiceBookingsFilter {
  pageNumber?: number
  pageSize?: number
  searchBy?: MerchantVoiceBookingSearchField
  keyword?: string
  dateFrom?: string
  dateTo?: string
}

/** POST `/api/v1/merchant/nexora-voice/bookings` — OpenAPI `CreateMerchantVoiceBookingCommand`.
 * `date` + `startTime` on the wire are UTC (same contract as public online booking).
 * Callers pass the user's local wall-clock selection; `createBooking` converts via browser TZ.
 */
export interface CreateMerchantVoiceBookingRequest {
  customerName: string
  customerPhone: string
  serviceIds: string[]
  staffId?: string | null
  /** Local calendar date `YYYY-MM-DD` as shown in the UI. */
  date: string
  /** Local start time `HH:mm` or `HH:mm:ss` as shown in the UI. */
  startTime: string
  notes?: string | null
  status: MerchantVoiceLeadStatusApiValue
}

export interface CreateMerchantVoiceBookingResultDto {
  leadId: string
  customerName: string | null
  customerPhone: string | null
  serviceName: string | null
  servicePrice: number | null
  staffName: string | null
  requestedTimeLocal: string | null
  status: MerchantVoiceLeadStatus | string
}

export interface MerchantVoiceStaffFilter {
  pageNumber?: number
  pageSize?: number
  status?: number
  searchTerm?: string
}

export interface MerchantVoiceCallDto {
  id: string
  tenantId: string
  tenantName: string | null
  callerName: string | null
  callerPhone: string | null
  outcome: MerchantVoiceCallOutcome
  durationSeconds: number
  notes: string | null
  followUpSmsSentAt: string | null
  isNewCaller: boolean
  createdAt: string
}

export interface MerchantVoiceCallsResponse {
  items: MerchantVoiceCallDto[]
  pageNumber: number
  totalPages: number
  totalCount: number
  hasPreviousPage: boolean
  hasNextPage: boolean
}

interface MerchantVoiceCallsApiResponse {
  items?: MerchantVoiceCallDto[]
  pageNumber?: number
  totalPages?: number
  totalCount?: number
  hasPreviousPage?: boolean
  hasNextPage?: boolean
}

export interface MerchantVoiceCallsFilter {
  pageNumber?: number
  pageSize?: number
  status?: MerchantVoiceCallStatusGroupApiValue
  searchTerm?: string
}

export interface MerchantVoiceCallStatisticsDto {
  callsToday: number
  missedCallsNeedingFollowUp: number
  bookedToday: number
  answerRatePercent: number
}

export interface MerchantVoiceCustomerDto {
  id: string
  businessId: string
  name: string | null
  phoneNumber: string | null
  email: string | null
  address: string | null
  dateOfBirth: string | null
  type: MerchantVoiceCustomerType
  group: MerchantVoiceCustomerGroup | null
  status: MerchantVoiceCustomerStatus
  source: string | null
  totalVisit: number
  lastVisit: string | null
  createdAt: string
}

export interface MerchantVoiceCustomersResponse {
  items: MerchantVoiceCustomerDto[]
  pageNumber: number
  totalPages: number
  totalCount: number
  hasPreviousPage: boolean
  hasNextPage: boolean
}

interface MerchantVoiceCustomersApiResponse {
  items?: MerchantVoiceCustomerDto[]
  pageNumber?: number
  totalPages?: number
  totalCount?: number
  hasPreviousPage?: boolean
  hasNextPage?: boolean
}

export interface MerchantVoiceCustomersFilter {
  pageNumber?: number
  pageSize?: number
  group?: MerchantVoiceCustomerGroup
  searchTerm?: string
}

export interface MerchantVoiceCustomerGroupSummaryDto {
  all: number
  vip: number
  new: number
  days15: number
  days30: number
  days60: number
}

export interface CreateMerchantVoiceCustomerRequest {
  phoneNumber: string
  name?: string | null
  email?: string | null
  address?: string | null
  dateOfBirth?: string | null
  /** VoiceCustomerType — Individual | Business | Vip | Guest | Partner | Internal */
  type?: MerchantVoiceCustomerType
  status?: MerchantVoiceCustomerStatus
}

export interface UpdateMerchantVoiceCustomerRequest {
  phoneNumber: string
  name?: string | null
  email?: string | null
  address?: string | null
  dateOfBirth?: string | null
  /** VoiceCustomerType — Individual | Business | Vip | Guest | Partner | Internal */
  type: MerchantVoiceCustomerType
  status: MerchantVoiceCustomerStatus
}

/** GET `/api/v1/merchant/nexora-voice/credits` — per-wallet summary. */
export interface VoiceCreditSummaryDto {
  tenantId: string
  creditType: VoiceCreditType
  purchasedBalance: number
  grantedBalance: number
  totalBalance: number
  balance: number
  reserved: number
  available: number
  isBlocked: boolean
  isLow: boolean
  grantExpiresAtUtc: string | null
  approxValueUsd: number
  purchasedThisCycle: number
  grantedThisCycle: number
  consumedThisCycle: number
  grantedConsumedThisCycle: number
  purchasedConsumedThisCycle: number
  periodStart: string | null
  periodEnd: string | null
}

/** GET `/api/v1/merchant/nexora-voice/credits` — wallet overview. */
export interface VoiceCreditWalletDto {
  tenantId: string
  smsSegments: VoiceCreditSummaryDto
  callMinutes: VoiceCreditSummaryDto
  planTier: VoicePlanTier | null
  planStatus: VoicePlanStatus | null
  isTrial: boolean
  autoRenew: boolean
  cycleSequence: number | null
  periodStart: string | null
  periodEnd: string | null
}

/** GET `/api/v1/merchant/nexora-voice/usage/activity` — one history row. */
export interface VoiceUsageActivityDto {
  activityKind: VoiceCreditActivityKind
  activityLabel: string | null
  creditType: VoiceCreditType
  units: number
  occurredAt: string
  itemCount: number
  referenceId: string | null
}

export interface MerchantVoiceUsageActivityResponse {
  items: VoiceUsageActivityDto[]
  pageNumber: number
  totalPages: number
  totalCount: number
  hasPreviousPage: boolean
  hasNextPage: boolean
}

export interface MerchantVoiceUsageActivityFilter {
  creditType?: VoiceCreditType
  activityKinds?: VoiceCreditActivityKind[]
  fromUtc?: string
  toUtc?: string
  pageNumber?: number
  pageSize?: number
}

interface MerchantVoiceUsageActivityApiResponse {
  items?: unknown[]
  pageNumber?: number
  totalPages?: number
  totalCount?: number
  hasPreviousPage?: boolean
  hasNextPage?: boolean
}

export interface MerchantVoiceBusinessStaffDto {
  id: string
  fullName: string
  phoneNumber: string | null
  email: string | null
  position: string | null
  photoUrl: string | null
  isAlreadyAdded: boolean
}

export interface MerchantVoiceBusinessStaffFilter {
  searchTerm?: string
}

export interface MerchantVoiceServiceDto {
  id: string
  name: string
  price: number | null
  durationMinutes: number | null
  note: string | null
  icon: string | null
  sortOrder: number
  isActive: boolean
  categoryIds: string[]
}

/** @deprecated Prefer MerchantVoiceServiceDto — alias for create-appointment chips. */
export type MerchantVoiceConfigServiceDto = MerchantVoiceServiceDto

export interface MerchantVoiceServiceCategoryDto {
  id: string
  name: string
  description: string | null
  sortOrder: number
  isSystem: boolean
  totalServices: number
  services: MerchantVoiceServiceDto[]
}

export interface CreateMerchantVoiceServiceCategoryRequest {
  name: string
  description?: string | null
}

export interface UpdateMerchantVoiceServiceCategoryRequest {
  name: string
  description?: string | null
  sortOrder?: number | null
}

export interface CreateMerchantVoiceServiceRequest {
  name: string
  price?: number | null
  durationMinutes?: number | null
  note?: string | null
  icon?: string | null
  isActive?: boolean
  /** Real category ids; Other-only / uncategorised → `null` */
  categoryIds?: string[] | null
}

export interface UpdateMerchantVoiceServiceRequest {
  name: string
  price?: number | null
  durationMinutes?: number | null
  note?: string | null
  icon?: string | null
  isActive?: boolean
  sortOrder?: number | null
  /** Omit = leave categories; null / [] = Other-only clear; array = replace */
  categoryIds?: string[] | null
}

export interface MerchantVoiceOperatingHourDto {
  dayOfWeek: string | number
  isOpen: boolean
  openTime: string | null
  closeTime: string | null
}

export interface MerchantVoiceTenantStatusDto {
  hasVoiceTenant: boolean
  voiceTenantId: string | null
  isActive: boolean
}

/** Linked voice tenant identity for the authenticated merchant (`GET .../my-tenant`). */
export interface MerchantVoiceTenantDto {
  id: string
  businessId: string | null
  businessKey: string
  name: string
  isActive: boolean
}

export interface MerchantVoiceConfigDto {
  id: string
  name: string
  forwardPhoneNumber: string
  aiPhoneNumber: string
  bookingNotifyPhone: string
  address: string
  city: string
  state: string
  zipCode: string
  country: string
  googleReviewUrl: string
  facebookUrl: string
  instagramUrl: string
  yelpUrl: string
  website: string
  description: string
  promotion: string
  promoSms: string
  sendSmsPromoEnabled: boolean
  timeZone: string
  language: string
  welcomeGreeting: string
  operatingHours: MerchantVoiceOperatingHourDto[]
}

export interface UpdateMerchantVoiceConfigRequest {
  name: string
  forwardPhoneNumber: string
  bookingNotifyPhone: string
  address: string
  city: string | null
  state: string | null
  zipCode: string | null
  country: string | null
  googleReviewUrl: string
  facebookUrl: string | null
  instagramUrl: string | null
  yelpUrl: string | null
  website: string | null
  description: string | null
  promotion: string | null
  promoSms: string | null
  sendSmsPromoEnabled: boolean
  timeZone: string | null
  language: MerchantVoiceConfigLanguage
  welcomeGreeting: string
  operatingHours: Array<{
    dayOfWeek: number
    isOpen: boolean
    openTime?: string
    closeTime?: string
  }>
}

export interface MerchantVoiceHolidayDto {
  id: string
  holidayDate: string
  reason: string
  type: HolidayType
  adjustedOpenTime: string | null
  adjustedCloseTime: string | null
  affectedBookingsCount: number
}

export interface CreateMerchantVoiceHolidayRequest {
  holidayDate: string
  reason: string
  type: HolidayType
  adjustedOpenTime?: string | null
  adjustedCloseTime?: string | null
}

export type UpdateMerchantVoiceHolidayRequest = CreateMerchantVoiceHolidayRequest

export interface MerchantVoiceStaffScheduleEntry {
  dayOfWeek: MerchantVoiceDayOfWeek
  isDayOff: boolean
  startTime?: string | null
  endTime?: string | null
}

export interface CreateMerchantVoiceStaffRequest {
  fullName: string
  phoneNumber?: string | null
  email?: string | null
  skills?: string | null
  /** Present when linking an existing business staff profile from the picker. */
  staffProfileId?: string | null
  schedules: MerchantVoiceStaffScheduleEntry[]
}

export interface UpdateMerchantVoiceStaffScheduleEntry {
  dayOfWeek: MerchantVoiceDayOfWeekApiValue
  isDayOff: boolean
  startTime?: string | null
  endTime?: string | null
}

export interface UpdateMerchantVoiceStaffRequest {
  id: string
  fullName: string
  phoneNumber?: string | null
  email?: string | null
  skills: string
  status: MerchantVoiceStaffActivityStatusApiValue
  schedules: UpdateMerchantVoiceStaffScheduleEntry[]
}

function normalizeBusinessStaffItem(item: unknown): MerchantVoiceBusinessStaffDto | null {
  if (!item || typeof item !== 'object') return null
  const row = item as Record<string, unknown>
  const id = String(row.staffProfileId ?? row.id ?? row.staffId ?? '').trim()
  if (!id) return null
  return {
    id,
    fullName: String(row.displayName ?? row.fullName ?? row.name ?? '').trim(),
    phoneNumber: row.phoneNumber ? String(row.phoneNumber) : null,
    email: row.email ? String(row.email) : null,
    position: row.position ? String(row.position) : null,
    photoUrl: row.photoUrl ? String(row.photoUrl) : null,
    isAlreadyAdded: Boolean(row.isAlreadyAdded),
  }
}

function normalizeBusinessStaffResponse(response: unknown): MerchantVoiceBusinessStaffDto[] {
  if (Array.isArray(response)) {
    return response.map(normalizeBusinessStaffItem).filter((item): item is MerchantVoiceBusinessStaffDto => !!item)
  }

  if (response && typeof response === 'object') {
    const body = response as Record<string, unknown>
    const candidate = body.items ?? body.data ?? body.results ?? []
    if (Array.isArray(candidate)) {
      return candidate.map(normalizeBusinessStaffItem).filter((item): item is MerchantVoiceBusinessStaffDto => !!item)
    }
  }

  return []
}

function normalizeTenantStatusResponse(response: unknown): MerchantVoiceTenantStatusDto {
  const data = response && typeof response === 'object'
    ? response as Record<string, unknown>
    : {}

  return {
    hasVoiceTenant: data.hasVoiceTenant === true,
    voiceTenantId: typeof data.voiceTenantId === 'string' ? data.voiceTenantId : null,
    isActive: data.isActive === true,
  }
}

function normalizeMyTenantResponse(response: unknown): MerchantVoiceTenantDto {
  const data = response && typeof response === 'object'
    ? response as Record<string, unknown>
    : {}

  return {
    id: typeof data.id === 'string' ? data.id : '',
    businessId: typeof data.businessId === 'string' ? data.businessId : null,
    businessKey: typeof data.businessKey === 'string' ? data.businessKey : '',
    name: typeof data.name === 'string' ? data.name : '',
    isActive: data.isActive === true,
  }
}

function readConfigString(value: unknown): string {
  if (value == null) return ''
  return String(value)
}

function normalizeConfigResponse(response: unknown): MerchantVoiceConfigDto {
  if (!response || typeof response !== 'object') {
    return {
      id: '',
      name: '',
      forwardPhoneNumber: '',
      aiPhoneNumber: '',
      bookingNotifyPhone: '',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      country: '',
      googleReviewUrl: '',
      facebookUrl: '',
      instagramUrl: '',
      yelpUrl: '',
      website: '',
      description: '',
      promotion: '',
      promoSms: '',
      sendSmsPromoEnabled: true,
      timeZone: '',
      language: MerchantVoiceConfigLanguage.EnUS,
      welcomeGreeting: '',
      operatingHours: [],
    }
  }

  const body = response as Record<string, unknown>
  const operatingHoursRaw = Array.isArray(body.operatingHours) ? body.operatingHours : []
  const firstStringField = (
    obj: Record<string, unknown>,
    keys: string[],
  ): string => {
    for (const key of keys) {
      const value = obj[key]
      if (typeof value === "string") return value
    }
    return ""
  }

  const welcomeGreeting = firstStringField(body, [
    "welcomeGreeting",
    "greeting",
    "greetingScript",
    "welcomeMessage",
  ])
  const operatingHours = operatingHoursRaw.map((item) => {
    const row = (item && typeof item === 'object') ? item as Record<string, unknown> : {}
    return {
      dayOfWeek: String(row.dayOfWeek ?? ''),
      isOpen: row.isOpen === true,
      openTime: row.openTime ? String(row.openTime) : null,
      closeTime: row.closeTime ? String(row.closeTime) : null,
    } satisfies MerchantVoiceOperatingHourDto
  }).filter((row) => row.dayOfWeek)

  const readBool = (value: unknown, fallback: boolean) =>
    typeof value === 'boolean' ? value : fallback

  return {
    id: String(body.id ?? ''),
    name: String(body.name ?? ''),
    forwardPhoneNumber: String(body.forwardPhoneNumber ?? ''),
    aiPhoneNumber: String(body.aiPhoneNumber ?? ''),
    bookingNotifyPhone: String(body.bookingNotifyPhone ?? ''),
    address: String(body.address ?? ''),
    city: readConfigString(body.city),
    state: readConfigString(body.state),
    zipCode: readConfigString(body.zipCode),
    country: readConfigString(body.country),
    googleReviewUrl: readConfigString(body.googleReviewUrl),
    facebookUrl: readConfigString(body.facebookUrl),
    instagramUrl: readConfigString(body.instagramUrl),
    yelpUrl: readConfigString(body.yelpUrl),
    website: readConfigString(body.website),
    description: readConfigString(body.description),
    promotion: readConfigString(body.promotion),
    promoSms: readConfigString(body.promoSms),
    sendSmsPromoEnabled: readBool(body.sendSmsPromoEnabled, true),
    timeZone: readConfigString(body.timeZone),
    language: String(body.language ?? MerchantVoiceConfigLanguage.EnUS),
    welcomeGreeting,
    operatingHours,
  }
}

function normalizeHolidayDto(raw: unknown): MerchantVoiceHolidayDto | null {
  if (!raw || typeof raw !== 'object') return null
  const row = raw as Record<string, unknown>
  return {
    id: String(row.id ?? ''),
    holidayDate: String(row.holidayDate ?? ''),
    reason: String(row.reason ?? ''),
    type: row.type === HOLIDAY_TYPE.ADJUSTED ? HOLIDAY_TYPE.ADJUSTED : HOLIDAY_TYPE.CLOSED,
    adjustedOpenTime: row.adjustedOpenTime ? String(row.adjustedOpenTime) : null,
    adjustedCloseTime: row.adjustedCloseTime ? String(row.adjustedCloseTime) : null,
    affectedBookingsCount: typeof row.affectedBookingsCount === 'number' ? row.affectedBookingsCount : 0,
  }
}

function normalizeHolidaysResponse(response: unknown): MerchantVoiceHolidayDto[] {
  const list = Array.isArray(response) ? response : []
  return list
    .map(normalizeHolidayDto)
    .filter((item): item is MerchantVoiceHolidayDto => item !== null)
}

function sanitizeCategoryIdsForWire(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return [
    ...new Set(
      value
        .filter((id): id is string => typeof id === 'string')
        .map((id) => id.trim())
        .filter(
          (id) =>
            Boolean(id)
            && id !== OTHER_SERVICES_CATEGORY_ID
            && id !== '[object Object]',
        ),
    ),
  ]
}

/** Wire payload: Other-only / empty → `null`; otherwise real category ids. */
function categoryIdsForWire(value: unknown): string[] | null {
  if (value == null) return null
  const ids = sanitizeCategoryIdsForWire(value)
  return ids.length > 0 ? ids : null
}

function normalizeServiceDto(item: unknown, index = 0): MerchantVoiceServiceDto | null {
  if (!item || typeof item !== 'object') return null
  const row = item as Record<string, unknown>
  const name = String(row.name ?? row.Name ?? '').trim()
  if (!name) return null
  const categoryIdsRaw = row.categoryIds ?? row.CategoryIds
  const categoryIds = sanitizeCategoryIdsForWire(categoryIdsRaw)
  return {
    id: String(row.id ?? row.Id ?? ''),
    name,
    price: typeof row.price === 'number' && Number.isFinite(row.price)
      ? row.price
      : typeof row.Price === 'number' && Number.isFinite(row.Price)
        ? row.Price
        : null,
    durationMinutes:
      typeof row.durationMinutes === 'number' && Number.isFinite(row.durationMinutes)
        ? row.durationMinutes
        : typeof row.DurationMinutes === 'number' && Number.isFinite(row.DurationMinutes)
          ? row.DurationMinutes
          : null,
    // `description`/`displayOrder`/`status` are the shared-catalog field names (Service/Category
    // consolidation, 2026-08-01); `note`/`sortOrder`/`isActive` are the pre-consolidation Voice
    // names — read both so this keeps working regardless of which shape the API returns.
    note: (row.note ?? row.Note ?? row.description ?? row.Description)
      ? String(row.note ?? row.Note ?? row.description ?? row.Description)
      : null,
    icon: (row.icon ?? row.Icon) ? String(row.icon ?? row.Icon) : null,
    sortOrder: typeof row.sortOrder === 'number'
      ? row.sortOrder
      : typeof row.SortOrder === 'number'
        ? row.SortOrder
        : typeof row.displayOrder === 'number'
          ? row.displayOrder
          : typeof row.DisplayOrder === 'number'
            ? row.DisplayOrder
            : index,
    isActive:
      row.isActive !== false && row.IsActive !== false
      && row.status !== 'Inactive' && row.Status !== 'Inactive'
      && row.status !== 1 && row.Status !== 1,
    categoryIds,
  }
}

function unwrapListPayload(response: unknown): unknown[] {
  if (Array.isArray(response)) return response
  if (response && typeof response === 'object') {
    const body = response as Record<string, unknown>
    const candidate = body.items ?? body.data ?? body.results ?? body.Items ?? body.Data
    if (Array.isArray(candidate)) return candidate
  }
  return []
}

function normalizeServiceCategoriesResponse(response: unknown): MerchantVoiceServiceCategoryDto[] {
  const rows = unwrapListPayload(response)
  return rows.map((item, index) => {
    const row = (item && typeof item === 'object') ? item as Record<string, unknown> : {}
    const servicesRaw = Array.isArray(row.services)
      ? row.services
      : Array.isArray(row.Services)
        ? row.Services
        : []
    const services = servicesRaw
      .map((service, serviceIndex) => normalizeServiceDto(service, serviceIndex))
      .filter((service): service is MerchantVoiceServiceDto => !!service)
    const id = String(row.id ?? row.Id ?? '')
    return {
      id,
      name: String(row.name ?? row.Name ?? '').trim() || (id === OTHER_SERVICES_CATEGORY_ID ? 'Other services' : ''),
      description: (row.description ?? row.Description)
        ? String(row.description ?? row.Description)
        : null,
      sortOrder: typeof row.sortOrder === 'number'
        ? row.sortOrder
        : typeof row.SortOrder === 'number'
          ? row.SortOrder
          : typeof row.displayOrder === 'number'
            ? row.displayOrder
            : typeof row.DisplayOrder === 'number'
              ? row.DisplayOrder
              : index,
      isSystem: row.isSystem === true || row.IsSystem === true || id === OTHER_SERVICES_CATEGORY_ID,
      totalServices: typeof row.totalServices === 'number'
        ? row.totalServices
        : typeof row.TotalServices === 'number'
          ? row.TotalServices
          : services.length,
      services,
    } satisfies MerchantVoiceServiceCategoryDto
  }).filter((category) => category.id && category.name)
}

function normalizeServicesResponse(response: unknown): MerchantVoiceServiceDto[] {
  const rows = unwrapListPayload(response)
  return rows
    .map((item, index) => normalizeServiceDto(item, index))
    .filter((item): item is MerchantVoiceServiceDto => !!item)
}

/**
 * Builds the multipart body the shared `/merchant/services` endpoint expects — Price and
 * DurationMinutes are required there (unlike the pre-consolidation Voice-only fields), so a
 * missing value defaults to 0/30 rather than being omitted.
 */
function buildSharedServiceFormData(
  body: CreateMerchantVoiceServiceRequest | UpdateMerchantVoiceServiceRequest,
): FormData {
  const formData = new FormData()
  formData.append('name', body.name.trim())
  formData.append('price', String(body.price ?? 0))
  formData.append('durationMinutes', String(body.durationMinutes ?? 30))
  const description = body.note?.trim()
  if (description) formData.append('description', description)
  const icon = body.icon?.trim()
  if (icon) formData.append('icon', icon)
  ;(body.categoryIds ?? []).forEach((categoryId) => formData.append('categoryIds', categoryId))
  formData.append('status', body.isActive === false ? 'Inactive' : 'Active')
  return formData
}

function readField<T>(raw: Record<string, unknown>, camel: string, pascal: string): T | undefined {
  return (raw[camel] ?? raw[pascal]) as T | undefined
}

/** Coerce API numeric fields; invalid values must not leak NaN/Infinity into paging or KPI UI. */
function toFiniteNumber(value: unknown, fallback: number): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function readNullableString(raw: Record<string, unknown>, camel: string, pascal: string): string | null {
  const value = readField<unknown>(raw, camel, pascal)
  if (value == null) return null
  const trimmed = String(value).trim()
  return trimmed || null
}

function normalizeBookingDto(item: MerchantVoiceBookingDto | Record<string, unknown>): MerchantVoiceBookingDto {
  const raw = (item ?? {}) as Record<string, unknown>
  const durationRaw = readField<unknown>(raw, 'callDurationSeconds', 'CallDurationSeconds')
  const duration = durationRaw == null ? null : Number(durationRaw)

  return {
    id: String(readField<unknown>(raw, 'id', 'Id') ?? ''),
    tenantId: String(readField<unknown>(raw, 'tenantId', 'TenantId') ?? ''),
    source: normalizeMerchantVoiceLeadSource(readField(raw, 'source', 'Source')),
    customerPhone: readNullableString(raw, 'customerPhone', 'CustomerPhone'),
    customerName: readNullableString(raw, 'customerName', 'CustomerName'),
    customerEmail: readNullableString(raw, 'customerEmail', 'CustomerEmail'),
    service: readNullableString(raw, 'service', 'Service'),
    preferredTime: readNullableString(raw, 'preferredTime', 'PreferredTime'),
    notes: readNullableString(raw, 'notes', 'Notes'),
    status: normalizeMerchantVoiceLeadStatus(readField(raw, 'status', 'Status')),
    confirmationSmsSentAt: readNullableString(raw, 'confirmationSmsSentAt', 'ConfirmationSmsSentAt'),
    assignedStaffId: readNullableString(raw, 'assignedStaffId', 'AssignedStaffId'),
    assignedStaffName: readNullableString(raw, 'assignedStaffName', 'AssignedStaffName'),
    assignedStaffEmail: readNullableString(raw, 'assignedStaffEmail', 'AssignedStaffEmail'),
    assignedStaffPhone: readNullableString(raw, 'assignedStaffPhone', 'AssignedStaffPhone'),
    requestedStartAtUtc: readNullableString(raw, 'requestedStartAtUtc', 'RequestedStartAtUtc'),
    requestedEndAtUtc: readNullableString(raw, 'requestedEndAtUtc', 'RequestedEndAtUtc'),
    createdAt: String(readField<unknown>(raw, 'createdAt', 'CreatedAt') ?? ''),
    callStartedAt: readNullableString(raw, 'callStartedAt', 'CallStartedAt'),
    callDurationSeconds: duration != null && Number.isFinite(duration) ? duration : null,
  }
}

function buildMerchantVoicePagingParams(pageNumber?: number, pageSize?: number) {
  return {
    [MerchantVoiceListQueryParam.PageNumber]: pageNumber ?? 1,
    [MerchantVoiceListQueryParam.PageSize]: pageSize ?? BOOKING_HUB_PAGE_SIZE,
  }
}

function normalizeBookingsResponse(
  response: MerchantVoiceBookingsApiResponse | MerchantVoiceBookingDto[] | Record<string, unknown>,
  pageNumber = 1,
): MerchantVoiceBookingsResponse {
  if (Array.isArray(response)) {
    const items = response.map((item) => normalizeBookingDto(item))
    return {
      items,
      pageNumber,
      totalPages: 1,
      totalCount: items.length,
      hasPreviousPage: false,
      hasNextPage: false,
    }
  }

  const raw = (response ?? {}) as Record<string, unknown>
  const rawItems = readField<unknown>(raw, 'items', 'Items')
  const list = Array.isArray(rawItems) ? rawItems : []
  const items = list.map((item) => normalizeBookingDto(item as Record<string, unknown>))
  const resolvedPage = Number(readField<unknown>(raw, 'pageNumber', 'PageNumber') ?? pageNumber)
  const totalPages = Math.max(1, toFiniteNumber(readField<unknown>(raw, 'totalPages', 'TotalPages') ?? 1, 1))
  const totalCount = Number(readField<unknown>(raw, 'totalCount', 'TotalCount') ?? items.length)
  const hasPreviousPage = Boolean(
    readField<unknown>(raw, 'hasPreviousPage', 'HasPreviousPage') ?? resolvedPage > 1,
  )
  const hasNextPage = Boolean(
    readField<unknown>(raw, 'hasNextPage', 'HasNextPage') ?? resolvedPage < totalPages,
  )

  return {
    items,
    pageNumber: Number.isFinite(resolvedPage) ? resolvedPage : pageNumber,
    totalPages,
    totalCount: Number.isFinite(totalCount) ? totalCount : items.length,
    hasPreviousPage,
    hasNextPage,
  }
}

function normalizeStaffResponse(
  response: MerchantVoiceStaffApiResponse | MerchantVoiceStaffDto[],
  pageNumber = 1,
): MerchantVoiceStaffResponse {
  if (Array.isArray(response)) {
    return {
      items: response,
      pageNumber,
      totalPages: 1,
      totalCount: response.length,
      hasPreviousPage: false,
      hasNextPage: false,
    }
  }

  const items = response?.items ?? []
  return {
    items,
    pageNumber: response?.pageNumber ?? pageNumber,
    totalPages: response?.totalPages ?? 1,
    totalCount: response?.totalCount ?? items.length,
    hasPreviousPage: response?.hasPreviousPage ?? false,
    hasNextPage: response?.hasNextPage ?? false,
  }
}

function normalizeStaffStatus(status: unknown): MerchantVoiceStaffStatus {
  return normalizeMerchantVoiceStaffStatus(status)
}

function normalizeCallDto(item: MerchantVoiceCallDto): MerchantVoiceCallDto {
  return {
    ...item,
    outcome: normalizeMerchantVoiceCallOutcome(item.outcome),
  }
}

function normalizeCallsResponse(
  response: MerchantVoiceCallsApiResponse | MerchantVoiceCallDto[],
  pageNumber = 1,
): MerchantVoiceCallsResponse {
  if (Array.isArray(response)) {
    const items = response.map(normalizeCallDto)
    return {
      items,
      pageNumber,
      totalPages: 1,
      totalCount: items.length,
      hasPreviousPage: false,
      hasNextPage: false,
    }
  }

  const items = (response?.items ?? []).map(normalizeCallDto)
  return {
    items,
    pageNumber: response?.pageNumber ?? pageNumber,
    totalPages: response?.totalPages ?? 1,
    totalCount: response?.totalCount ?? items.length,
    hasPreviousPage: response?.hasPreviousPage ?? false,
    hasNextPage: response?.hasNextPage ?? false,
  }
}

function normalizeCustomerDto(item: unknown): MerchantVoiceCustomerDto {
  const raw = (item ?? {}) as Record<string, unknown>
  return {
    id: String(readField<unknown>(raw, 'id', 'Id') ?? ''),
    businessId: String(readField<unknown>(raw, 'businessId', 'BusinessId') ?? ''),
    name: (readField<string | null>(raw, 'name', 'Name') ?? null),
    phoneNumber: (readField<string | null>(raw, 'phoneNumber', 'PhoneNumber') ?? null),
    email: (readField<string | null>(raw, 'email', 'Email') ?? null),
    address: (readField<string | null>(raw, 'address', 'Address') ?? null),
    dateOfBirth: (readField<string | null>(raw, 'dateOfBirth', 'DateOfBirth') ?? null),
    type: normalizeMerchantVoiceCustomerType(readField(raw, 'type', 'Type')),
    group: normalizeMerchantVoiceCustomerGroup(readField(raw, 'group', 'Group')),
    status: normalizeMerchantVoiceCustomerStatus(readField(raw, 'status', 'Status')),
    source: (readField<string | null>(raw, 'source', 'Source') ?? null),
    totalVisit: toFiniteNumber(readField<unknown>(raw, 'totalVisit', 'TotalVisit') ?? 0, 0),
    lastVisit: (readField<string | null>(raw, 'lastVisit', 'LastVisit') ?? null),
    createdAt: String(readField<unknown>(raw, 'createdAt', 'CreatedAt') ?? ''),
  }
}

function normalizeCustomersResponse(
  response: MerchantVoiceCustomersApiResponse | MerchantVoiceCustomerDto[],
  pageNumber = 1,
): MerchantVoiceCustomersResponse {
  if (Array.isArray(response)) {
    const items = response.map(normalizeCustomerDto)
    return {
      items,
      pageNumber,
      totalPages: 1,
      totalCount: items.length,
      hasPreviousPage: false,
      hasNextPage: false,
    }
  }

  const items = (response?.items ?? []).map(normalizeCustomerDto)
  return {
    items,
    pageNumber: response?.pageNumber ?? pageNumber,
    totalPages: response?.totalPages ?? 1,
    totalCount: response?.totalCount ?? items.length,
    hasPreviousPage: response?.hasPreviousPage ?? false,
    hasNextPage: response?.hasNextPage ?? false,
  }
}

function toApiBoolean(value: unknown): boolean {
  if (value === true || value === 1) return true
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()
    return normalized === 'true' || normalized === '1'
  }
  return false
}

function normalizeVoiceCreditSummaryDto(
  item: unknown,
  fallbackType: VoiceCreditType,
): VoiceCreditSummaryDto {
  const raw = (item ?? {}) as Record<string, unknown>
  const creditType = normalizeVoiceCreditType(
    readField(raw, 'creditType', 'CreditType') ?? fallbackType,
  )
  const totalBalance = toFiniteNumber(
    readField<unknown>(raw, 'totalBalance', 'TotalBalance')
      ?? readField<unknown>(raw, 'balance', 'Balance')
      ?? 0,
    0,
  )
  return {
    tenantId: String(readField<unknown>(raw, 'tenantId', 'TenantId') ?? ''),
    creditType,
    purchasedBalance: toFiniteNumber(readField<unknown>(raw, 'purchasedBalance', 'PurchasedBalance') ?? 0, 0),
    grantedBalance: toFiniteNumber(readField<unknown>(raw, 'grantedBalance', 'GrantedBalance') ?? 0, 0),
    totalBalance,
    balance: toFiniteNumber(readField<unknown>(raw, 'balance', 'Balance') ?? totalBalance, totalBalance),
    reserved: toFiniteNumber(readField<unknown>(raw, 'reserved', 'Reserved') ?? 0, 0),
    available: toFiniteNumber(readField<unknown>(raw, 'available', 'Available') ?? totalBalance, totalBalance),
    isBlocked: toApiBoolean(readField<unknown>(raw, 'isBlocked', 'IsBlocked')),
    isLow: toApiBoolean(readField<unknown>(raw, 'isLow', 'IsLow')),
    grantExpiresAtUtc: readNullableString(raw, 'grantExpiresAtUtc', 'GrantExpiresAtUtc'),
    approxValueUsd: toFiniteNumber(readField<unknown>(raw, 'approxValueUsd', 'ApproxValueUsd') ?? 0, 0),
    purchasedThisCycle: toFiniteNumber(readField<unknown>(raw, 'purchasedThisCycle', 'PurchasedThisCycle') ?? 0, 0),
    grantedThisCycle: toFiniteNumber(readField<unknown>(raw, 'grantedThisCycle', 'GrantedThisCycle') ?? 0, 0),
    consumedThisCycle: toFiniteNumber(readField<unknown>(raw, 'consumedThisCycle', 'ConsumedThisCycle') ?? 0, 0),
    grantedConsumedThisCycle: toFiniteNumber(
      readField<unknown>(raw, 'grantedConsumedThisCycle', 'GrantedConsumedThisCycle') ?? 0,
      0,
    ),
    purchasedConsumedThisCycle: toFiniteNumber(
      readField<unknown>(raw, 'purchasedConsumedThisCycle', 'PurchasedConsumedThisCycle') ?? 0,
      0,
    ),
    periodStart: readNullableString(raw, 'periodStart', 'PeriodStart'),
    periodEnd: readNullableString(raw, 'periodEnd', 'PeriodEnd'),
  }
}

function normalizeVoiceCreditWalletDto(response: unknown): VoiceCreditWalletDto {
  const raw = (response ?? {}) as Record<string, unknown>
  const cycleRaw = readField<unknown>(raw, 'cycleSequence', 'CycleSequence')
  const cycleParsed = cycleRaw == null ? null : Number(cycleRaw)
  return {
    tenantId: String(readField<unknown>(raw, 'tenantId', 'TenantId') ?? ''),
    smsSegments: normalizeVoiceCreditSummaryDto(
      readField(raw, 'smsSegments', 'SmsSegments'),
      VoiceCreditType.SmsSegment,
    ),
    callMinutes: normalizeVoiceCreditSummaryDto(
      readField(raw, 'callMinutes', 'CallMinutes'),
      VoiceCreditType.CallMinute,
    ),
    planTier: normalizeVoicePlanTier(readField(raw, 'planTier', 'PlanTier')),
    planStatus: normalizeVoicePlanStatus(readField(raw, 'planStatus', 'PlanStatus')),
    isTrial: Boolean(readField<unknown>(raw, 'isTrial', 'IsTrial')),
    autoRenew: Boolean(readField<unknown>(raw, 'autoRenew', 'AutoRenew')),
    cycleSequence: cycleParsed != null && Number.isFinite(cycleParsed) ? cycleParsed : null,
    periodStart: readNullableString(raw, 'periodStart', 'PeriodStart'),
    periodEnd: readNullableString(raw, 'periodEnd', 'PeriodEnd'),
  }
}

function normalizeVoiceUsageActivityDto(item: unknown): VoiceUsageActivityDto {
  const raw = (item ?? {}) as Record<string, unknown>
  return {
    activityKind: normalizeVoiceCreditActivityKind(readField(raw, 'activityKind', 'ActivityKind')),
    activityLabel: readNullableString(raw, 'activityLabel', 'ActivityLabel'),
    creditType: normalizeVoiceCreditType(readField(raw, 'creditType', 'CreditType')),
    units: toFiniteNumber(readField<unknown>(raw, 'units', 'Units') ?? 0, 0),
    occurredAt: String(readField<unknown>(raw, 'occurredAt', 'OccurredAt') ?? ''),
    itemCount: toFiniteNumber(readField<unknown>(raw, 'itemCount', 'ItemCount') ?? 1, 1),
    referenceId: readNullableString(raw, 'referenceId', 'ReferenceId'),
  }
}

function normalizeUsageActivityResponse(
  response: MerchantVoiceUsageActivityApiResponse | unknown[],
  pageNumber = 1,
): MerchantVoiceUsageActivityResponse {
  if (Array.isArray(response)) {
    const items = response.map(normalizeVoiceUsageActivityDto)
    return {
      items,
      pageNumber,
      totalPages: 1,
      totalCount: items.length,
      hasPreviousPage: false,
      hasNextPage: false,
    }
  }

  const items = (response?.items ?? []).map(normalizeVoiceUsageActivityDto)
  return {
    items,
    pageNumber: response?.pageNumber ?? pageNumber,
    totalPages: response?.totalPages ?? 1,
    totalCount: response?.totalCount ?? items.length,
    hasPreviousPage: response?.hasPreviousPage ?? false,
    hasNextPage: response?.hasNextPage ?? false,
  }
}

function buildUsageActivityParams(filters: MerchantVoiceUsageActivityFilter = {}) {
  const params: Record<string, string | number | string[]> = {
    ...buildMerchantVoicePagingParams(filters.pageNumber, filters.pageSize),
  }
  if (filters.creditType) {
    params[MerchantVoiceListQueryParam.CreditType] = filters.creditType
  }
  if (filters.activityKinds?.length) {
    params[MerchantVoiceListQueryParam.ActivityKinds] = filters.activityKinds
  }
  if (filters.fromUtc) {
    params[MerchantVoiceListQueryParam.FromUtc] = filters.fromUtc
  }
  if (filters.toUtc) {
    params[MerchantVoiceListQueryParam.ToUtc] = filters.toUtc
  }
  return params
}

export function createMerchantVoiceRepository(client: HttpClient = httpClient) {
  return {
    async getBookingStatistics(): Promise<MerchantVoiceBookingStatisticsDto> {
      const response = await client.get<MerchantVoiceBookingStatisticsDto>(
        `${MERCHANT_VOICE_BASE}/bookings/statistics`,
        { headers: MERCHANT_VOICE_HEADERS },
      )

      const raw = (response ?? {}) as Record<string, unknown>
      return {
        allBookings: toFiniteNumber(readField<unknown>(raw, 'allBookings', 'AllBookings') ?? 0, 0),
        newBookings: toFiniteNumber(readField<unknown>(raw, 'newBookings', 'NewBookings') ?? 0, 0),
        confirmedBookings: toFiniteNumber(
          readField<unknown>(raw, 'confirmedBookings', 'ConfirmedBookings') ?? 0,
          0,
        ),
        doneBookings: toFiniteNumber(readField<unknown>(raw, 'doneBookings', 'DoneBookings') ?? 0, 0),
        noShowBookings: toFiniteNumber(
          readField<unknown>(raw, 'noShowBookings', 'NoShowBookings') ?? 0,
          0,
        ),
      }
    },

    async getBookings(filters: MerchantVoiceBookingsFilter = {}): Promise<MerchantVoiceBookingsResponse> {
      const response = await client.get<MerchantVoiceBookingsApiResponse | MerchantVoiceBookingDto[]>(
        `${MERCHANT_VOICE_BASE}/bookings`,
        {
          headers: MERCHANT_VOICE_HEADERS,
          params: {
            ...buildMerchantVoicePagingParams(filters.pageNumber, filters.pageSize),
            [MerchantVoiceListQueryParam.SearchBy]: filters.searchBy,
            [MerchantVoiceListQueryParam.Keyword]: filters.keyword,
            [MerchantVoiceListQueryParam.DateFrom]: filters.dateFrom,
            [MerchantVoiceListQueryParam.DateTo]: filters.dateTo,
          },
        },
      )
      return normalizeBookingsResponse(response, filters.pageNumber ?? 1)
    },

    /**
     * Walk booking pages until exhausted (or max pages).
     * Used when UI status chips need a full list to paginate client-side
     * (GET /bookings has no Status query in Swagger).
     */
    async getBookingsCollected(
      filters: Omit<MerchantVoiceBookingsFilter, 'pageNumber' | 'pageSize'> = {},
      options: { pageSize?: number; maxPages?: number } = {},
    ): Promise<MerchantVoiceBookingsResponse> {
      const pageSize = options.pageSize ?? BOOKING_HUB_STATUS_COLLECT_PAGE_SIZE
      const maxPages = options.maxPages ?? BOOKING_HUB_STATUS_COLLECT_MAX_PAGES
      const items: MerchantVoiceBookingDto[] = []
      let pageNumber = 1

      const toCollectedResponse = (): MerchantVoiceBookingsResponse => ({
        items,
        pageNumber: 1,
        totalPages: 1,
        totalCount: items.length,
        hasPreviousPage: false,
        hasNextPage: false,
      })

      while (pageNumber <= maxPages) {
        const page = await this.getBookings({
          ...filters,
          pageNumber,
          pageSize,
        })
        items.push(...page.items)
        if (!page.hasNextPage || page.items.length === 0) {
          return toCollectedResponse()
        }
        pageNumber += 1
      }

      return toCollectedResponse()
    },

    async createBooking(
      body: CreateMerchantVoiceBookingRequest,
    ): Promise<CreateMerchantVoiceBookingResultDto> {
      // UI is client-local; BE stores requestedStartAtUtc — convert like public booking.
      const utcSlot = toUtcBookingSlot(body.date, body.startTime)
      const payload: CreateMerchantVoiceBookingRequest = {
        ...body,
        date: utcSlot.date || body.date,
        startTime: utcSlot.startTime || body.startTime,
      }
      const response = await client.post<CreateMerchantVoiceBookingResultDto>(
        `${MERCHANT_VOICE_BASE}/bookings`,
        payload,
        { headers: MERCHANT_VOICE_HEADERS },
      )
      const raw = (response ?? {}) as Record<string, unknown>
      return {
        leadId: String(readField(raw, 'leadId', 'LeadId') ?? ''),
        customerName: (readField(raw, 'customerName', 'CustomerName') as string | null) ?? null,
        customerPhone: (readField(raw, 'customerPhone', 'CustomerPhone') as string | null) ?? null,
        serviceName: (readField(raw, 'serviceName', 'ServiceName') as string | null) ?? null,
        servicePrice: (() => {
          const value = readField(raw, 'servicePrice', 'ServicePrice')
          return typeof value === 'number' ? value : null
        })(),
        staffName: (readField(raw, 'staffName', 'StaffName') as string | null) ?? null,
        requestedTimeLocal:
          (readField(raw, 'requestedTimeLocal', 'RequestedTimeLocal') as string | null) ?? null,
        status: normalizeMerchantVoiceLeadStatus(readField(raw, 'status', 'Status')),
      }
    },

    async updateBookingStatus(id: string, status: MerchantVoiceLeadStatus.Done | MerchantVoiceLeadStatus.NoShow): Promise<void> {
      await client.put<void>(
        `${MERCHANT_VOICE_BASE}/bookings/${encodeURIComponent(id)}/status`,
        { status },
        { headers: MERCHANT_VOICE_HEADERS },
      )
    },

    async sendBookingConfirmationSms(id: string): Promise<void> {
      await client.post<void>(
        `${MERCHANT_VOICE_BASE}/bookings/${encodeURIComponent(id)}/send-confirmation-sms`,
        undefined,
        { headers: MERCHANT_VOICE_HEADERS },
      )
    },

    async getStaff(filters: MerchantVoiceStaffFilter = {}): Promise<MerchantVoiceStaffResponse> {
      const response = await client.get<MerchantVoiceStaffApiResponse | MerchantVoiceStaffDto[]>(
        `${MERCHANT_VOICE_BASE}/staff`,
        {
          headers: MERCHANT_VOICE_HEADERS,
          params: {
            ...buildMerchantVoicePagingParams(filters.pageNumber, filters.pageSize),
            [MerchantVoiceListQueryParam.Status]: filters.status,
            [MerchantVoiceListQueryParam.SearchTerm]: filters.searchTerm,
          },
        },
      )
      return normalizeStaffResponse(response, filters.pageNumber ?? 1)
    },

    async createStaff(body: CreateMerchantVoiceStaffRequest): Promise<MerchantVoiceStaffDto> {
      return await client.post<MerchantVoiceStaffDto>(
        `${MERCHANT_VOICE_BASE}/staff`,
        body,
        { headers: MERCHANT_VOICE_HEADERS },
      )
    },

    async updateStaff(body: UpdateMerchantVoiceStaffRequest): Promise<MerchantVoiceStaffDto> {
      return await client.put<MerchantVoiceStaffDto>(
        `${MERCHANT_VOICE_BASE}/staff/${encodeURIComponent(body.id)}`,
        body,
        { headers: MERCHANT_VOICE_HEADERS },
      )
    },

    async getStaffById(id: string): Promise<MerchantVoiceStaffDto> {
      return await client.get<MerchantVoiceStaffDto>(
        `${MERCHANT_VOICE_BASE}/staff/${encodeURIComponent(id)}`,
        { headers: MERCHANT_VOICE_HEADERS },
      )
    },

    async getBusinessStaff(filters: MerchantVoiceBusinessStaffFilter = {}): Promise<MerchantVoiceBusinessStaffDto[]> {
      const response = await client.get<unknown>(
        `${MERCHANT_VOICE_BASE}/staff/business-staff`,
        {
          headers: MERCHANT_VOICE_HEADERS,
          params: {
            [MerchantVoiceListQueryParam.BusinessStaffSearchTerm]:
              filters.searchTerm?.trim() || undefined,
          },
        },
      )
      return normalizeBusinessStaffResponse(response)
    },

    async getTenantStatus(): Promise<MerchantVoiceTenantStatusDto> {
      const response = await client.get<unknown>(
        `${MERCHANT_VOICE_BASE}/tenant/status`,
        { headers: MERCHANT_VOICE_HEADERS },
      )
      return normalizeTenantStatusResponse(response)
    },

    async getMyTenant(): Promise<MerchantVoiceTenantDto> {
      const response = await client.get<unknown>(
        `${MERCHANT_VOICE_BASE}/my-tenant`,
        { headers: MERCHANT_VOICE_HEADERS },
      )
      return normalizeMyTenantResponse(response)
    },

    async getConfig(): Promise<MerchantVoiceConfigDto> {
      const response = await client.get<unknown>(
        `${MERCHANT_VOICE_BASE}/config`,
        { headers: MERCHANT_VOICE_HEADERS },
      )
      return normalizeConfigResponse(response)
    },

    async updateConfig(body: UpdateMerchantVoiceConfigRequest): Promise<void> {
      await client.put<void>(
        `${MERCHANT_VOICE_BASE}/config`,
        body,
        { headers: MERCHANT_VOICE_HEADERS },
      )
    },

    async getHolidays(): Promise<MerchantVoiceHolidayDto[]> {
      const response = await client.get<unknown>(
        `${SHARED_CATALOG_BASE}/business-holidays`,
        { headers: MERCHANT_VOICE_HEADERS },
      )
      return normalizeHolidaysResponse(response)
    },

    async getAffectedBookingsCount(date: string): Promise<number> {
      const response = await client.get<unknown>(
        `${SHARED_CATALOG_BASE}/business-holidays/affected-bookings-count?date=${encodeURIComponent(date)}`,
        { headers: MERCHANT_VOICE_HEADERS },
      )
      const body = (response && typeof response === 'object') ? response as Record<string, unknown> : {}
      return typeof body.count === 'number' ? body.count : 0
    },

    async createHoliday(body: CreateMerchantVoiceHolidayRequest): Promise<MerchantVoiceHolidayDto> {
      const response = await client.post<unknown>(
        `${SHARED_CATALOG_BASE}/business-holidays`,
        body,
        { headers: MERCHANT_VOICE_HEADERS },
      )
      return normalizeHolidayDto(response) ?? {
        id: '',
        holidayDate: body.holidayDate,
        reason: body.reason,
        type: body.type,
        adjustedOpenTime: body.adjustedOpenTime ?? null,
        adjustedCloseTime: body.adjustedCloseTime ?? null,
        affectedBookingsCount: 0,
      }
    },

    async updateHoliday(id: string, body: UpdateMerchantVoiceHolidayRequest): Promise<MerchantVoiceHolidayDto> {
      const response = await client.put<unknown>(
        `${SHARED_CATALOG_BASE}/business-holidays/${encodeURIComponent(id)}`,
        body,
        { headers: MERCHANT_VOICE_HEADERS },
      )
      return normalizeHolidayDto(response) ?? {
        id,
        holidayDate: body.holidayDate,
        reason: body.reason,
        type: body.type,
        adjustedOpenTime: body.adjustedOpenTime ?? null,
        adjustedCloseTime: body.adjustedCloseTime ?? null,
        affectedBookingsCount: 0,
      }
    },

    async deleteHoliday(id: string): Promise<void> {
      await client.del<void>(
        `${SHARED_CATALOG_BASE}/business-holidays/${encodeURIComponent(id)}`,
        { headers: MERCHANT_VOICE_HEADERS },
      )
    },

    // Service/Category catalog moved off the Voice-specific `${MERCHANT_VOICE_BASE}/service-categories|services`
    // endpoints onto the shared catalog used by both Booking Hub Settings and POS Settings
    // (Service/Category consolidation, 2026-08-01) — same table, so edits made from either
    // screen show up in both immediately. See SHARED_CATALOG_BASE below.
    async getServiceCategories(): Promise<MerchantVoiceServiceCategoryDto[]> {
      const response = await client.get<unknown>(
        `${SHARED_CATALOG_BASE}/categories`,
        { headers: MERCHANT_VOICE_HEADERS },
      )
      return normalizeServiceCategoriesResponse(response)
    },

    async createServiceCategory(body: CreateMerchantVoiceServiceCategoryRequest): Promise<string> {
      const response = await client.post<unknown>(
        `${SHARED_CATALOG_BASE}/categories`,
        {
          name: body.name.trim(),
          description: body.description?.trim() || null,
        },
        { headers: MERCHANT_VOICE_HEADERS },
      )
      return String(response ?? '').trim()
    },

    async updateServiceCategory(
      id: string,
      body: UpdateMerchantVoiceServiceCategoryRequest,
    ): Promise<void> {
      await client.put<void>(
        `${SHARED_CATALOG_BASE}/categories/${encodeURIComponent(id)}`,
        {
          name: body.name.trim(),
          description: body.description?.trim() || null,
        },
        { headers: MERCHANT_VOICE_HEADERS },
      )
    },

    async deleteServiceCategory(id: string): Promise<void> {
      await client.del<void>(
        `${SHARED_CATALOG_BASE}/categories/${encodeURIComponent(id)}`,
        { headers: MERCHANT_VOICE_HEADERS },
      )
    },

    async getServices(): Promise<MerchantVoiceServiceDto[]> {
      const response = await client.get<unknown>(
        `${SHARED_CATALOG_BASE}/services`,
        { headers: MERCHANT_VOICE_HEADERS },
      )
      return normalizeServicesResponse(response)
    },

    // The shared endpoint accepts multipart form data (it also handles POS's photo upload),
    // even though Booking Hub's own service form has no photo field yet.
    async createService(body: CreateMerchantVoiceServiceRequest): Promise<string> {
      const formData = buildSharedServiceFormData(body)
      return await client.upload<string>(`${SHARED_CATALOG_BASE}/services`, formData, 'POST')
    },

    async updateService(id: string, body: UpdateMerchantVoiceServiceRequest): Promise<void> {
      const formData = buildSharedServiceFormData(body)
      await client.upload<void>(
        `${SHARED_CATALOG_BASE}/services/${encodeURIComponent(id)}`,
        formData,
        'PUT',
      )
    },

    async deleteService(id: string): Promise<void> {
      await client.del<void>(
        `${SHARED_CATALOG_BASE}/services/${encodeURIComponent(id)}`,
        { headers: MERCHANT_VOICE_HEADERS },
      )
    },

    async toggleStaffStatus(id: string): Promise<MerchantVoiceStaffStatus> {
      const response = await client.patch<
        number | string | { status?: number | string | boolean } | null
      >(
        `${MERCHANT_VOICE_BASE}/staff/${encodeURIComponent(id)}/status`,
        undefined,
        { headers: MERCHANT_VOICE_HEADERS },
      )
      if (response && typeof response === 'object' && 'status' in response) {
        return normalizeStaffStatus(response.status)
      }
      return normalizeStaffStatus(response)
    },

    async getCalls(filters: MerchantVoiceCallsFilter = {}): Promise<MerchantVoiceCallsResponse> {
      const response = await client.get<MerchantVoiceCallsApiResponse | MerchantVoiceCallDto[]>(
        `${MERCHANT_VOICE_BASE}/calls`,
        {
          headers: MERCHANT_VOICE_HEADERS,
          params: {
            ...buildMerchantVoicePagingParams(filters.pageNumber, filters.pageSize),
            [MerchantVoiceListQueryParam.Status]: filters.status,
            [MerchantVoiceListQueryParam.SearchTerm]: filters.searchTerm,
          },
        },
      )
      return normalizeCallsResponse(response, filters.pageNumber ?? 1)
    },

    async getCallStatistics(): Promise<MerchantVoiceCallStatisticsDto> {
      const response = await client.get<MerchantVoiceCallStatisticsDto>(
        `${MERCHANT_VOICE_BASE}/calls/statistics`,
        { headers: MERCHANT_VOICE_HEADERS },
      )
      return {
        callsToday: response?.callsToday ?? 0,
        missedCallsNeedingFollowUp: response?.missedCallsNeedingFollowUp ?? 0,
        bookedToday: response?.bookedToday ?? 0,
        answerRatePercent: response?.answerRatePercent ?? 0,
      }
    },

    async sendCallFollowUpSms(id: string): Promise<boolean> {
      const response = await client.post<boolean>(
        `${MERCHANT_VOICE_BASE}/calls/${encodeURIComponent(id)}/send-follow-up-sms`,
        {},
        { headers: MERCHANT_VOICE_HEADERS },
      )
      return response === true
    },

    async getCustomers(filters: MerchantVoiceCustomersFilter = {}): Promise<MerchantVoiceCustomersResponse> {
      const response = await client.get<MerchantVoiceCustomersApiResponse | MerchantVoiceCustomerDto[]>(
        `${MERCHANT_VOICE_BASE}/customers`,
        {
          headers: MERCHANT_VOICE_HEADERS,
          params: {
            ...buildMerchantVoicePagingParams(filters.pageNumber, filters.pageSize),
            [MerchantVoiceListQueryParam.Group]: filters.group,
            [MerchantVoiceListQueryParam.SearchTerm]: filters.searchTerm,
          },
        },
      )
      return normalizeCustomersResponse(response, filters.pageNumber ?? 1)
    },

    async getCustomerSummary(): Promise<MerchantVoiceCustomerGroupSummaryDto> {
      const response = await client.get<MerchantVoiceCustomerGroupSummaryDto>(
        `${MERCHANT_VOICE_BASE}/customers/summary`,
        { headers: MERCHANT_VOICE_HEADERS },
      )
      return {
        all: response?.all ?? 0,
        vip: response?.vip ?? 0,
        new: response?.new ?? 0,
        days15: response?.days15 ?? 0,
        days30: response?.days30 ?? 0,
        days60: response?.days60 ?? 0,
      }
    },

    /**
     * POST `/api/v1/merchant/nexora-voice/customers`
     * Body: CreateMerchantVoiceCustomerCommand
     * `{ phoneNumber, name, email, address, dateOfBirth, type, status }`
     */
    async createCustomer(body: CreateMerchantVoiceCustomerRequest): Promise<MerchantVoiceCustomerDto> {
      const command: CreateMerchantVoiceCustomerRequest = {
        phoneNumber: String(body.phoneNumber ?? '').trim(),
        name: body.name?.trim() ? body.name.trim() : null,
        email: body.email?.trim() ? body.email.trim() : null,
        address: body.address?.trim() ? body.address.trim() : null,
        dateOfBirth: body.dateOfBirth?.trim() ? body.dateOfBirth.trim() : null,
        type: body.type ?? MerchantVoiceCustomerType.Individual,
        status: body.status ?? MerchantVoiceCustomerStatus.Active,
      }

      const response = await client.post<unknown>(
        `${MERCHANT_VOICE_BASE}/customers`,
        command,
        { headers: MERCHANT_VOICE_HEADERS },
      )
      return normalizeCustomerDto(response)
    },

    async updateCustomer(id: string, body: UpdateMerchantVoiceCustomerRequest): Promise<void> {
      const command: UpdateMerchantVoiceCustomerRequest = {
        phoneNumber: String(body.phoneNumber ?? '').trim(),
        name: body.name?.trim() ? body.name.trim() : null,
        email: body.email?.trim() ? body.email.trim() : null,
        address: body.address?.trim() ? body.address.trim() : null,
        dateOfBirth: body.dateOfBirth?.trim() ? body.dateOfBirth.trim() : null,
        type: body.type,
        status: body.status,
      }
      await client.put<void>(
        `${MERCHANT_VOICE_BASE}/customers/${encodeURIComponent(id)}`,
        command,
        { headers: MERCHANT_VOICE_HEADERS },
      )
    },

    /** GET `/api/v1/merchant/nexora-voice/credits` */
    async getCreditWallet(): Promise<VoiceCreditWalletDto> {
      const response = await client.get<unknown>(
        `${MERCHANT_VOICE_BASE}/credits`,
        { headers: MERCHANT_VOICE_HEADERS },
      )
      return normalizeVoiceCreditWalletDto(response)
    },

    /** GET `/api/v1/merchant/nexora-voice/usage/activity` */
    async getUsageActivity(
      filters: MerchantVoiceUsageActivityFilter = {},
    ): Promise<MerchantVoiceUsageActivityResponse> {
      const response = await client.get<MerchantVoiceUsageActivityApiResponse | unknown[]>(
        `${MERCHANT_VOICE_BASE}/usage/activity`,
        {
          headers: MERCHANT_VOICE_HEADERS,
          params: buildUsageActivityParams(filters),
        },
      )
      return normalizeUsageActivityResponse(response, filters.pageNumber ?? 1)
    },
  }
}

export const merchantVoiceRepository = createMerchantVoiceRepository()

