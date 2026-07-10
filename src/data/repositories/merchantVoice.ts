import httpClient from '../../lib/httpClient'
import {
  mapStaffStatusToActivityApi,
  MerchantVoiceBookingSearchField,
  MerchantVoiceConfigLanguage,
  MerchantVoiceDayOfWeek,
  MerchantVoiceDayOfWeekApiValue,
  MerchantVoiceLeadSource,
  MerchantVoiceLeadStatus,
  MerchantVoiceStaffActivityStatusApiValue,
  MerchantVoiceStaffStatus,
  normalizeMerchantVoiceLeadSource,
  normalizeMerchantVoiceLeadStatus,
  normalizeMerchantVoiceStaffStatus,
} from '../merchantVoice/domain'

export {
  BookingHubMainTab,
  BookingHubSubTab,
  BookingUiSearchField,
  BookingUiSource,
  BookingUiStatus,
  BOOKING_UI_SEARCH_FIELD_TO_API,
  BOOKING_UI_SOURCE_I18N_KEY,
  MerchantVoiceBookingSearchField,
  MerchantVoiceConfigLanguage,
  MerchantVoiceDayOfWeek,
  MerchantVoiceDayOfWeekApi,
  MerchantVoiceErrorCode,
  MerchantVoiceLeadSource,
  MerchantVoiceLeadSourceApi,
  MerchantVoiceLeadStatus,
  MerchantVoiceLeadStatusApi,
  MerchantVoiceStaffActivityStatusApi,
  MerchantVoiceStaffStatus,
  MerchantVoiceUiLanguage,
  mapConfigLanguageToUiLanguage,
  mapDayOfWeekToApiName,
  mapLeadSourceToUiSource,
  mapLeadStatusToUiStatus,
  mapStaffStatusToActivityApi,
  mapUiLanguageToConfigLanguage,
  mapUiSourceToSourceClass,
  isStaffStatusActive,
  normalizeMerchantVoiceDayOfWeek,
  normalizeMerchantVoiceLeadSource,
  normalizeMerchantVoiceLeadStatus,
  normalizeMerchantVoiceStaffStatus,
  parseBookingHubMainTab,
  parseBookingHubSubTab,
} from '../merchantVoice/domain'

export type {
  MerchantVoiceBookingSearchFieldApiValue,
  MerchantVoiceDayOfWeek,
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

export interface MerchantVoiceConfigDto {
  id: string
  name: string
  forwardPhoneNumber: string
  aiPhoneNumber: string
  bookingNotifyPhone: string
  address: string
  googleReviewUrl: string
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
  phoneNumber: string
  email?: string | null
  skills?: string | null
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
  phoneNumber: string
  email: string
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
      language: 'en-US',
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
    language: String(body.language ?? 'en-US'),
    welcomeGreeting: String(body.welcomeGreeting ?? ''),
    operatingHours,
    services,
  }
}

function normalizeBookingDto(item: MerchantVoiceBookingDto): MerchantVoiceBookingDto {
  return {
    ...item,
    source: normalizeMerchantVoiceLeadSource(item.source),
    status: normalizeMerchantVoiceLeadStatus(item.status),
  }
}

function normalizeBookingsResponse(
  response: MerchantVoiceBookingsApiResponse | MerchantVoiceBookingDto[],
  pageNumber = 1,
): MerchantVoiceBookingsResponse {
  if (Array.isArray(response)) {
    const items = response.map(normalizeBookingDto)
    return {
      items,
      pageNumber,
      totalPages: 1,
      totalCount: items.length,
      hasPreviousPage: false,
      hasNextPage: false,
    }
  }

  const items = (response?.items ?? []).map(normalizeBookingDto)
  return {
    items,
    pageNumber: response?.pageNumber ?? pageNumber,
    totalPages: response?.totalPages ?? 1,
    totalCount: response?.totalCount ?? items.length,
    hasPreviousPage: response?.hasPreviousPage ?? false,
    hasNextPage: response?.hasNextPage ?? false,
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

export function createMerchantVoiceRepository(client: HttpClient = httpClient) {
  return {
    async getBookingStatistics(): Promise<MerchantVoiceBookingStatisticsDto> {
      const response = await client.get<MerchantVoiceBookingStatisticsDto>(
        `${MERCHANT_VOICE_BASE}/bookings/statistics`,
        { headers: MERCHANT_VOICE_HEADERS },
      )

      return {
        allBookings: response?.allBookings ?? 0,
        newBookings: response?.newBookings ?? 0,
        confirmedBookings: response?.confirmedBookings ?? 0,
        doneBookings: response?.doneBookings ?? 0,
        noShowBookings: response?.noShowBookings ?? 0,
      }
    },

    async getBookings(filters: MerchantVoiceBookingsFilter = {}): Promise<MerchantVoiceBookingsResponse> {
      const response = await client.get<MerchantVoiceBookingsApiResponse | MerchantVoiceBookingDto[]>(
        `${MERCHANT_VOICE_BASE}/bookings`,
        {
          headers: MERCHANT_VOICE_HEADERS,
          params: {
            pageNumber: filters.pageNumber ?? 1,
            pageSize: filters.pageSize ?? 200,
            searchBy: filters.searchBy,
            keyword: filters.keyword,
            dateFrom: filters.dateFrom,
            dateTo: filters.dateTo,
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
            pageNumber: filters.pageNumber ?? 1,
            pageSize: filters.pageSize ?? 200,
            status: filters.status,
            searchTerm: filters.searchTerm,
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
            searchTerm: filters.searchTerm?.trim() || undefined,
          },
        },
      )
      return normalizeBusinessStaffResponse(response)
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
  }
}

export const merchantVoiceRepository = createMerchantVoiceRepository()

