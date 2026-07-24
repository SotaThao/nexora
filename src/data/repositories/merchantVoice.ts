import httpClient from '../../lib/httpClient'
import { BOOKING_HUB_PAGE_SIZE } from '../../constants/pagination'
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
  normalizeMerchantVoiceCallOutcome,
  normalizeMerchantVoiceCustomerGroup,
  normalizeMerchantVoiceCustomerStatus,
  normalizeMerchantVoiceCustomerType,
  normalizeMerchantVoiceLeadSource,
  normalizeMerchantVoiceLeadStatus,
  normalizeMerchantVoiceStaffStatus,
} from '../merchantVoice/domain'

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
  parseBookingHubMainTab,
  parseBookingHubSubTab,
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
  tenantId: string
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

export interface UpdateMerchantVoiceCustomerRequest {
  name?: string | null
  email?: string | null
  address?: string | null
  dateOfBirth?: string | null
  /** VoiceCustomerType — Individual | Business | Vip | Guest | Partner | Internal */
  type: MerchantVoiceCustomerType
  status: MerchantVoiceCustomerStatus
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

export interface MerchantVoiceConfigServiceDto {
  id: string
  name: string
  price: number | null
  durationMinutes: number | null
  note: string | null
  icon: string | null
  sortOrder: number
  isActive: boolean
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
  googleReviewUrl: string
  promotion: string
  language: string
  welcomeGreeting: string
  operatingHours: MerchantVoiceOperatingHourDto[]
  services: MerchantVoiceConfigServiceDto[]
}

export interface UpdateMerchantVoiceConfigRequest {
  name: string
  forwardPhoneNumber: string
  bookingNotifyPhone: string
  address: string
  googleReviewUrl: string
  promotion: string | null
  language: MerchantVoiceConfigLanguage
  welcomeGreeting: string
  operatingHours: Array<{
    dayOfWeek: number
    isOpen: boolean
    openTime?: string
    closeTime?: string
  }>
  services: Array<{
    id: string
    name: string
    price: number
    durationMinutes: number
    note: string | null
    icon: string | null
    isActive: boolean
  }>
}

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

function normalizeConfigResponse(response: unknown): MerchantVoiceConfigDto {
  if (!response || typeof response !== 'object') {
    return {
      id: '',
      name: '',
      forwardPhoneNumber: '',
      aiPhoneNumber: '',
      bookingNotifyPhone: '',
      address: '',
      googleReviewUrl: '',
      promotion: '',
      language: MerchantVoiceConfigLanguage.EnUS,
      welcomeGreeting: '',
      operatingHours: [],
      services: [],
    }
  }

  const body = response as Record<string, unknown>
  const operatingHoursRaw = Array.isArray(body.operatingHours) ? body.operatingHours : []
  const operatingHours = operatingHoursRaw.map((item) => {
    const row = (item && typeof item === 'object') ? item as Record<string, unknown> : {}
    return {
      dayOfWeek: String(row.dayOfWeek ?? ''),
      isOpen: row.isOpen === true,
      openTime: row.openTime ? String(row.openTime) : null,
      closeTime: row.closeTime ? String(row.closeTime) : null,
    } satisfies MerchantVoiceOperatingHourDto
  }).filter((row) => row.dayOfWeek)

  const servicesRaw = body.services ?? body.serviceNames ?? body.availableServices ?? body.skills ?? []
  const services = Array.isArray(servicesRaw) ? servicesRaw.map((item, index) => {
    if (item && typeof item === 'object') {
      const row = item as Record<string, unknown>
      return {
        id: String(row.id ?? ''),
        name: String(row.name ?? '').trim(),
        price: typeof row.price === 'number' ? row.price : null,
        durationMinutes: typeof row.durationMinutes === 'number' ? row.durationMinutes : null,
        note: row.note ? String(row.note) : null,
        icon: row.icon ? String(row.icon) : null,
        sortOrder: typeof row.sortOrder === 'number' ? row.sortOrder : index,
        isActive: row.isActive !== false,
      } satisfies MerchantVoiceConfigServiceDto
    }
    return {
      id: String(index),
      name: String(item ?? '').trim(),
      price: null,
      durationMinutes: null,
      note: null,
      icon: null,
      sortOrder: index,
      isActive: true,
    } satisfies MerchantVoiceConfigServiceDto
  }).filter((item) => item.name) : []

  return {
    id: String(body.id ?? ''),
    name: String(body.name ?? ''),
    forwardPhoneNumber: String(body.forwardPhoneNumber ?? ''),
    aiPhoneNumber: String(body.aiPhoneNumber ?? ''),
    bookingNotifyPhone: String(body.bookingNotifyPhone ?? ''),
    address: String(body.address ?? ''),
    googleReviewUrl: String(body.googleReviewUrl ?? ''),
    promotion: String(body.promotion ?? ''),
    language: String(body.language ?? MerchantVoiceConfigLanguage.EnUS),
    welcomeGreeting: String(body.welcomeGreeting ?? ''),
    operatingHours,
    services,
  }
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

function normalizeCustomerDto(item: MerchantVoiceCustomerDto): MerchantVoiceCustomerDto {
  return {
    ...item,
    type: normalizeMerchantVoiceCustomerType(item.type),
    group: normalizeMerchantVoiceCustomerGroup(item.group),
    status: normalizeMerchantVoiceCustomerStatus(item.status),
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

    async updateCustomer(id: string, body: UpdateMerchantVoiceCustomerRequest): Promise<void> {
      await client.put<void>(
        `${MERCHANT_VOICE_BASE}/customers/${encodeURIComponent(id)}`,
        body,
        { headers: MERCHANT_VOICE_HEADERS },
      )
    },
  }
}

export const merchantVoiceRepository = createMerchantVoiceRepository()

