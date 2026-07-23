import httpClient from '../../lib/httpClient'
import { BOOKING_HUB_PAGE_SIZE } from '../../constants/pagination'
import type { PaginatedResponse } from '../../types/domain'
import {
  normalizeSmsCampaignAudience,
  normalizeSmsCampaignRecipientStatus,
  normalizeSmsCampaignScheduleMode,
  normalizeSmsCampaignStatus,
  normalizeSmsCreditTransactionType,
  normalizeSmsEncoding,
  SmsCampaignAudience,
  SmsCampaignRecipientStatus,
  SmsCampaignScheduleMode,
  SmsCampaignStatus,
  SmsCreditPackageCode,
  SmsCreditTransactionType,
  SmsEncoding,
} from '../merchantVoice/domain'

type HttpClient = typeof httpClient

const SMS_CAMPAIGNS_BASE = '/api/v1/merchant/nexora-voice/sms-campaigns'
const SMS_CAMPAIGN_HEADERS = {
  'x-api-version': '1',
  'x-app-source': 'WebPortal',
}

export interface SmsCampaignDashboardDto {
  totalCustomers: number
  smsSentThisMonth: number
  campaignsSentThisMonth: number
  activeAutoCampaigns: number
  creditBalance: number
  estimatedCostUsd: number
}

export interface SmsCampaignAudienceSummaryDto {
  new: number
  days15: number
  days30: number
  days60: number
  vip: number
  birthdayThisMonth: number
}

export interface SmsCampaignListItemDto {
  id: string
  name: string
  audienceSegment: SmsCampaignAudience
  scheduleMode: SmsCampaignScheduleMode
  status: SmsCampaignStatus
  scheduledAtUtc: string | null
  totalRecipients: number
  totalSent: number
  totalFailed: number
  createdAt: string
}

export interface SmsCampaignDto {
  id: string
  tenantId: string
  name: string
  audienceSegment: SmsCampaignAudience
  messageBody: string
  linkUrl: string | null
  scheduleMode: SmsCampaignScheduleMode
  scheduledAtUtc: string | null
  autoCooldownDays: number | null
  lastAutoRunAtUtc: string | null
  status: SmsCampaignStatus
  estimatedRecipients: number
  estimatedSegmentsPerMessage: number
  totalRecipients: number
  totalSent: number
  totalFailed: number
  startedAtUtc: string | null
  completedAtUtc: string | null
  createdAt: string
  lastModified: string | null
}

export interface SmsCampaignRecipientDto {
  id: string
  voiceCustomerId: string | null
  phoneNumber: string
  customerName: string | null
  status: SmsCampaignRecipientStatus
  segments: number
  errorMessage: string | null
  sentAtUtc: string | null
  createdAt: string
}

export interface SmsSegmentBreakdownDto {
  index: number
  characterCount: number
  maxCharacters: number
}

export interface SmsCampaignCostEstimateDto {
  recipients: number
  segmentsPerMessage: number
  totalSegments: number
  creditBalance: number
  hasEnoughCredits: boolean
  estimatedCostUsd: number
  encoding: SmsEncoding
  characterCount: number
  maxCharactersPerSegment: number
  charactersRemainingInLastSegment: number
  segments: SmsSegmentBreakdownDto[]
}

export interface SmsTextEstimateDto {
  encoding: SmsEncoding
  characterCount: number
  segmentCount: number
  maxCharactersPerSegment: number
  charactersRemainingInLastSegment: number
  estimatedCostUsd: number
  segments: SmsSegmentBreakdownDto[]
}

export interface SmsCreditSummaryDto {
  tenantId: string
  balance: number
  reserved: number
  available: number
  approxValueUsd: number
  purchasedThisCycle: number
  consumedThisCycle: number
  cycleYear: number
  cycleMonth: number
}

export interface SmsCreditTransactionDto {
  id: string
  amount: number
  type: SmsCreditTransactionType
  balanceAfter: number
  referenceId: string | null
  description: string | null
  createdAt: string
}

export interface MerchantSmsCampaignsFilter {
  pageNumber?: number
  pageSize?: number
  status?: SmsCampaignStatus
  scheduleMode?: SmsCampaignScheduleMode
  searchTerm?: string
}

export interface MerchantSmsCampaignRecipientsFilter {
  pageNumber?: number
  pageSize?: number
  status?: SmsCampaignRecipientStatus
}

export interface MerchantSmsCreditHistoryFilter {
  pageNumber?: number
  pageSize?: number
  type?: SmsCreditTransactionType
}

export interface EstimateSmsCampaignRequest {
  audienceSegment: SmsCampaignAudience
  messageBody: string
  linkUrl?: string
}

export interface AnalyzeSmsTextRequest {
  text: string
}

export interface CreateSmsCampaignRequest {
  name: string
  audienceSegment: SmsCampaignAudience
  messageBody: string
  linkUrl?: string
  scheduleMode: SmsCampaignScheduleMode
  scheduledAtUtc?: string
  autoCooldownDays?: number
}

export interface UpdateSmsCampaignRequest {
  name: string
  audienceSegment: SmsCampaignAudience
  messageBody: string
  linkUrl?: string
  scheduledAtUtc?: string
  autoCooldownDays?: number
}

export interface CreateSmsCreditPurchaseRequest {
  packageCode: SmsCreditPackageCode | string
}

export type SmsCampaignsPage = PaginatedResponse<SmsCampaignListItemDto>
export type SmsCampaignRecipientsPage = PaginatedResponse<SmsCampaignRecipientDto>
export type SmsCreditHistoryPage = PaginatedResponse<SmsCreditTransactionDto>

function asRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>
  }
  return {}
}

function asNumber(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback
}

function asNullableString(value: unknown): string | null {
  return typeof value === 'string' ? value : null
}

function normalizeSegmentBreakdown(value: unknown): SmsSegmentBreakdownDto {
  const row = asRecord(value)
  return {
    index: asNumber(row.index, 1),
    characterCount: asNumber(row.characterCount),
    maxCharacters: asNumber(row.maxCharacters),
  }
}

function normalizePaginated<T>(
  response: unknown,
  pageNumber: number,
  mapItem: (item: unknown) => T | null,
): PaginatedResponse<T> {
  if (Array.isArray(response)) {
    const items = response.map(mapItem).filter((item): item is T => item != null)
    return {
      items,
      pageNumber,
      totalPages: 1,
      totalCount: items.length,
      hasPreviousPage: false,
      hasNextPage: false,
    }
  }

  const body = asRecord(response)
  const rawItems = Array.isArray(body.items) ? body.items : []
  const items = rawItems.map(mapItem).filter((item): item is T => item != null)
  return {
    items,
    pageNumber: asNumber(body.pageNumber, pageNumber),
    totalPages: asNumber(body.totalPages, 1),
    totalCount: asNumber(body.totalCount, items.length),
    hasPreviousPage: body.hasPreviousPage === true,
    hasNextPage: body.hasNextPage === true,
  }
}

function normalizeDashboard(response: unknown): SmsCampaignDashboardDto {
  const data = asRecord(response)
  return {
    totalCustomers: asNumber(data.totalCustomers),
    smsSentThisMonth: asNumber(data.smsSentThisMonth),
    campaignsSentThisMonth: asNumber(data.campaignsSentThisMonth),
    activeAutoCampaigns: asNumber(data.activeAutoCampaigns),
    creditBalance: asNumber(data.creditBalance),
    estimatedCostUsd: asNumber(data.estimatedCostUsd),
  }
}

function normalizeAudienceSummary(response: unknown): SmsCampaignAudienceSummaryDto {
  const data = asRecord(response)
  return {
    new: asNumber(data.new),
    days15: asNumber(data.days15),
    days30: asNumber(data.days30),
    days60: asNumber(data.days60),
    vip: asNumber(data.vip),
    birthdayThisMonth: asNumber(data.birthdayThisMonth),
  }
}

function normalizeListItem(value: unknown): SmsCampaignListItemDto | null {
  const row = asRecord(value)
  const id = asString(row.id)
  if (!id) return null
  return {
    id,
    name: asString(row.name),
    audienceSegment: normalizeSmsCampaignAudience(row.audienceSegment),
    scheduleMode: normalizeSmsCampaignScheduleMode(row.scheduleMode),
    status: normalizeSmsCampaignStatus(row.status),
    scheduledAtUtc: asNullableString(row.scheduledAtUtc),
    totalRecipients: asNumber(row.totalRecipients),
    totalSent: asNumber(row.totalSent),
    totalFailed: asNumber(row.totalFailed),
    createdAt: asString(row.createdAt),
  }
}

function normalizeCampaign(response: unknown): SmsCampaignDto {
  const row = asRecord(response)
  return {
    id: asString(row.id),
    tenantId: asString(row.tenantId),
    name: asString(row.name),
    audienceSegment: normalizeSmsCampaignAudience(row.audienceSegment),
    messageBody: asString(row.messageBody),
    linkUrl: asNullableString(row.linkUrl),
    scheduleMode: normalizeSmsCampaignScheduleMode(row.scheduleMode),
    scheduledAtUtc: asNullableString(row.scheduledAtUtc),
    autoCooldownDays: typeof row.autoCooldownDays === 'number' ? row.autoCooldownDays : null,
    lastAutoRunAtUtc: asNullableString(row.lastAutoRunAtUtc),
    status: normalizeSmsCampaignStatus(row.status),
    estimatedRecipients: asNumber(row.estimatedRecipients),
    estimatedSegmentsPerMessage: asNumber(row.estimatedSegmentsPerMessage, 1),
    totalRecipients: asNumber(row.totalRecipients),
    totalSent: asNumber(row.totalSent),
    totalFailed: asNumber(row.totalFailed),
    startedAtUtc: asNullableString(row.startedAtUtc),
    completedAtUtc: asNullableString(row.completedAtUtc),
    createdAt: asString(row.createdAt),
    lastModified: asNullableString(row.lastModified),
  }
}

function normalizeRecipient(value: unknown): SmsCampaignRecipientDto | null {
  const row = asRecord(value)
  const id = asString(row.id)
  if (!id) return null
  return {
    id,
    voiceCustomerId: asNullableString(row.voiceCustomerId),
    phoneNumber: asString(row.phoneNumber),
    customerName: asNullableString(row.customerName),
    status: normalizeSmsCampaignRecipientStatus(row.status),
    segments: asNumber(row.segments, 1),
    errorMessage: asNullableString(row.errorMessage),
    sentAtUtc: asNullableString(row.sentAtUtc),
    createdAt: asString(row.createdAt),
  }
}

function normalizeCostEstimate(response: unknown): SmsCampaignCostEstimateDto {
  const data = asRecord(response)
  const segments = Array.isArray(data.segments)
    ? data.segments.map(normalizeSegmentBreakdown)
    : []
  return {
    recipients: asNumber(data.recipients),
    segmentsPerMessage: asNumber(data.segmentsPerMessage, 1),
    totalSegments: asNumber(data.totalSegments),
    creditBalance: asNumber(data.creditBalance),
    hasEnoughCredits: data.hasEnoughCredits === true,
    estimatedCostUsd: asNumber(data.estimatedCostUsd),
    encoding: normalizeSmsEncoding(data.encoding),
    characterCount: asNumber(data.characterCount),
    maxCharactersPerSegment: asNumber(data.maxCharactersPerSegment, 160),
    charactersRemainingInLastSegment: asNumber(data.charactersRemainingInLastSegment),
    segments,
  }
}

function normalizeTextEstimate(response: unknown): SmsTextEstimateDto {
  const data = asRecord(response)
  const segments = Array.isArray(data.segments)
    ? data.segments.map(normalizeSegmentBreakdown)
    : []
  return {
    encoding: normalizeSmsEncoding(data.encoding),
    characterCount: asNumber(data.characterCount),
    segmentCount: asNumber(data.segmentCount, 1),
    maxCharactersPerSegment: asNumber(data.maxCharactersPerSegment, 160),
    charactersRemainingInLastSegment: asNumber(data.charactersRemainingInLastSegment),
    estimatedCostUsd: asNumber(data.estimatedCostUsd),
    segments,
  }
}

function normalizeCreditSummary(response: unknown): SmsCreditSummaryDto {
  const data = asRecord(response)
  return {
    tenantId: asString(data.tenantId),
    balance: asNumber(data.balance),
    reserved: asNumber(data.reserved),
    available: asNumber(data.available),
    approxValueUsd: asNumber(data.approxValueUsd),
    purchasedThisCycle: asNumber(data.purchasedThisCycle),
    consumedThisCycle: asNumber(data.consumedThisCycle),
    cycleYear: asNumber(data.cycleYear),
    cycleMonth: asNumber(data.cycleMonth),
  }
}

function normalizeCreditTransaction(value: unknown): SmsCreditTransactionDto | null {
  const row = asRecord(value)
  const id = asString(row.id)
  if (!id) return null
  return {
    id,
    amount: asNumber(row.amount),
    type: normalizeSmsCreditTransactionType(row.type),
    balanceAfter: asNumber(row.balanceAfter),
    referenceId: asNullableString(row.referenceId),
    description: asNullableString(row.description),
    createdAt: asString(row.createdAt),
  }
}

function buildListParams(filters: MerchantSmsCampaignsFilter) {
  return {
    pageNumber: filters.pageNumber ?? 1,
    pageSize: filters.pageSize ?? BOOKING_HUB_PAGE_SIZE,
    status: filters.status,
    scheduleMode: filters.scheduleMode,
    searchTerm: filters.searchTerm,
  }
}

export function createMerchantVoiceSmsCampaignsRepository(client: HttpClient = httpClient) {
  return {
    async getDashboard(): Promise<SmsCampaignDashboardDto> {
      const response = await client.get<unknown>(`${SMS_CAMPAIGNS_BASE}/dashboard`, {
        headers: SMS_CAMPAIGN_HEADERS,
      })
      return normalizeDashboard(response)
    },

    async getAudienceSummary(): Promise<SmsCampaignAudienceSummaryDto> {
      const response = await client.get<unknown>(`${SMS_CAMPAIGNS_BASE}/audience-summary`, {
        headers: SMS_CAMPAIGN_HEADERS,
      })
      return normalizeAudienceSummary(response)
    },

    async getCampaigns(filters: MerchantSmsCampaignsFilter = {}): Promise<SmsCampaignsPage> {
      const pageNumber = filters.pageNumber ?? 1
      const response = await client.get<unknown>(SMS_CAMPAIGNS_BASE, {
        headers: SMS_CAMPAIGN_HEADERS,
        params: buildListParams(filters),
      })
      return normalizePaginated(response, pageNumber, normalizeListItem)
    },

    async getCampaignById(id: string): Promise<SmsCampaignDto> {
      const response = await client.get<unknown>(
        `${SMS_CAMPAIGNS_BASE}/${encodeURIComponent(id)}`,
        { headers: SMS_CAMPAIGN_HEADERS },
      )
      return normalizeCampaign(response)
    },

    async getCampaignRecipients(
      id: string,
      filters: MerchantSmsCampaignRecipientsFilter = {},
    ): Promise<SmsCampaignRecipientsPage> {
      const pageNumber = filters.pageNumber ?? 1
      const response = await client.get<unknown>(
        `${SMS_CAMPAIGNS_BASE}/${encodeURIComponent(id)}/recipients`,
        {
          headers: SMS_CAMPAIGN_HEADERS,
          params: {
            pageNumber,
            pageSize: filters.pageSize ?? BOOKING_HUB_PAGE_SIZE,
            status: filters.status,
          },
        },
      )
      return normalizePaginated(response, pageNumber, normalizeRecipient)
    },

    async estimateCampaign(body: EstimateSmsCampaignRequest): Promise<SmsCampaignCostEstimateDto> {
      const response = await client.post<unknown>(`${SMS_CAMPAIGNS_BASE}/estimate`, body, {
        headers: SMS_CAMPAIGN_HEADERS,
      })
      return normalizeCostEstimate(response)
    },

    async analyzeSmsText(body: AnalyzeSmsTextRequest): Promise<SmsTextEstimateDto> {
      const response = await client.post<unknown>(`${SMS_CAMPAIGNS_BASE}/sms-tools/analyze`, body, {
        headers: SMS_CAMPAIGN_HEADERS,
      })
      return normalizeTextEstimate(response)
    },

    async createCampaign(body: CreateSmsCampaignRequest): Promise<string> {
      const response = await client.post<string | { id?: string }>(SMS_CAMPAIGNS_BASE, body, {
        headers: SMS_CAMPAIGN_HEADERS,
      })
      if (typeof response === 'string') return response
      return asString(asRecord(response).id)
    },

    async updateCampaign(id: string, body: UpdateSmsCampaignRequest): Promise<void> {
      await client.put<void>(
        `${SMS_CAMPAIGNS_BASE}/${encodeURIComponent(id)}`,
        body,
        { headers: SMS_CAMPAIGN_HEADERS },
      )
    },

    async sendCampaignNow(id: string): Promise<void> {
      await client.post<void>(
        `${SMS_CAMPAIGNS_BASE}/${encodeURIComponent(id)}/send`,
        {},
        { headers: SMS_CAMPAIGN_HEADERS },
      )
    },

    async cancelCampaign(id: string): Promise<void> {
      await client.post<void>(
        `${SMS_CAMPAIGNS_BASE}/${encodeURIComponent(id)}/cancel`,
        {},
        { headers: SMS_CAMPAIGN_HEADERS },
      )
    },

    async toggleCampaignActive(id: string): Promise<SmsCampaignStatus> {
      const response = await client.post<unknown>(
        `${SMS_CAMPAIGNS_BASE}/${encodeURIComponent(id)}/toggle-active`,
        {},
        { headers: SMS_CAMPAIGN_HEADERS },
      )
      if (typeof response === 'string') return normalizeSmsCampaignStatus(response)
      return normalizeSmsCampaignStatus(asRecord(response).status ?? response)
    },

    async deleteCampaign(id: string): Promise<void> {
      await client.del<void>(
        `${SMS_CAMPAIGNS_BASE}/${encodeURIComponent(id)}`,
        { headers: SMS_CAMPAIGN_HEADERS },
      )
    },

    async getCreditSummary(): Promise<SmsCreditSummaryDto> {
      const response = await client.get<unknown>(`${SMS_CAMPAIGNS_BASE}/credits/summary`, {
        headers: SMS_CAMPAIGN_HEADERS,
      })
      return normalizeCreditSummary(response)
    },

    async getCreditHistory(filters: MerchantSmsCreditHistoryFilter = {}): Promise<SmsCreditHistoryPage> {
      const pageNumber = filters.pageNumber ?? 1
      const response = await client.get<unknown>(`${SMS_CAMPAIGNS_BASE}/credits/history`, {
        headers: SMS_CAMPAIGN_HEADERS,
        params: {
          pageNumber,
          pageSize: filters.pageSize ?? BOOKING_HUB_PAGE_SIZE,
          type: filters.type,
        },
      })
      return normalizePaginated(response, pageNumber, normalizeCreditTransaction)
    },

    async createCreditPurchase(body: CreateSmsCreditPurchaseRequest): Promise<string> {
      const response = await client.post<string | { id?: string }>(
        `${SMS_CAMPAIGNS_BASE}/credits/purchase`,
        body,
        { headers: SMS_CAMPAIGN_HEADERS },
      )
      if (typeof response === 'string') return response
      return asString(asRecord(response).id)
    },
  }
}

export const merchantVoiceSmsCampaignsRepository = createMerchantVoiceSmsCampaignsRepository()
