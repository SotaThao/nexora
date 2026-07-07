/**
 * taxiqCpaAccessRepository — API implementation for US-10 Phần A (Owner + Staff CPA
 * Access Grant settings). Backend: CpaAccessController (BE US-18) + the
 * GetCpaAccessGrantsQuery list endpoint added alongside this ticket (BE had no list
 * endpoint originally — see US-10-assumptions.md A1).
 */
import httpClient from '../../lib/httpClient'

type HttpClient = typeof httpClient

export const CPA_PACKAGE_TYPES = ['Basic', 'Full', 'CPAReview'] as const
export type CpaPackageType = (typeof CPA_PACKAGE_TYPES)[number]

export const CPA_DATA_MODES = ['Masked', 'FullSensitive'] as const
export type CpaDataMode = (typeof CPA_DATA_MODES)[number]

export const CPA_EXPIRY_DAYS = [7, 30, 90] as const
export type CpaExpiryDays = (typeof CPA_EXPIRY_DAYS)[number]

export interface CpaAccessGrantListItemApiDto {
  id: string
  cpaEmail: string
  packageType: string
  dataMode: string
  expiresAt: string
  revokedAt?: string | null
  status: string
  createdAt: string
}

export interface CpaAccessGrantListItem {
  id: string
  cpaEmail: string
  packageType: string
  dataMode: string
  expiresAt: string
  revokedAt: string | null
  status: string
  createdAt: string
}

function normalizeGrantListItem(dto: CpaAccessGrantListItemApiDto): CpaAccessGrantListItem {
  return {
    id: dto.id,
    cpaEmail: dto.cpaEmail,
    packageType: dto.packageType,
    dataMode: dto.dataMode,
    expiresAt: dto.expiresAt,
    revokedAt: dto.revokedAt ?? null,
    status: dto.status,
    createdAt: dto.createdAt,
  }
}

export interface ListCpaAccessGrantsParams {
  ownerTaxYearId?: string
  staffTaxYearId?: string
}

export interface CreateCpaAccessGrantParams {
  cpaEmail: string
  packageType: CpaPackageType
  dataMode: CpaDataMode
  expiryDays: CpaExpiryDays
  ownerTaxYearId?: string
  staffTaxYearId?: string
  staffConsentConfirmed?: boolean
}

export interface CpaAccessGrantApiDto {
  id: string
  accessToken: string
  cpaEmail: string
  packageType: string
  dataMode: string
  expiresAt: string
}

export interface CpaAccessGrant {
  id: string
  accessToken: string
  cpaEmail: string
  packageType: string
  dataMode: string
  expiresAt: string
}

function normalizeGrant(dto: CpaAccessGrantApiDto): CpaAccessGrant {
  return {
    id: dto.id,
    accessToken: dto.accessToken,
    cpaEmail: dto.cpaEmail,
    packageType: dto.packageType,
    dataMode: dto.dataMode,
    expiresAt: dto.expiresAt,
  }
}

export function createTaxiqCpaAccessRepository(client: HttpClient = httpClient) {
  return {
    async list(params: ListCpaAccessGrantsParams): Promise<CpaAccessGrantListItem[]> {
      const query = new URLSearchParams()
      if (params.ownerTaxYearId) query.set('ownerTaxYearId', params.ownerTaxYearId)
      if (params.staffTaxYearId) query.set('staffTaxYearId', params.staffTaxYearId)
      const data = await client.get<{ items: CpaAccessGrantListItemApiDto[] }>(
        `/api/v1/taxiq/cpa-access?${query.toString()}`,
      )
      return (data?.items ?? []).map(normalizeGrantListItem)
    },

    async create(params: CreateCpaAccessGrantParams): Promise<CpaAccessGrant> {
      const data = await client.post<CpaAccessGrantApiDto>('/api/v1/taxiq/cpa-access', {
        cpaEmail: params.cpaEmail,
        packageType: params.packageType,
        dataMode: params.dataMode,
        expiryDays: params.expiryDays,
        ownerTaxYearId: params.ownerTaxYearId ?? null,
        staffTaxYearId: params.staffTaxYearId ?? null,
        staffConsentConfirmed: params.staffConsentConfirmed ?? false,
      })
      return normalizeGrant(data as CpaAccessGrantApiDto)
    },

    async revoke(grantId: string): Promise<void> {
      await client.del<void>(`/api/v1/taxiq/cpa-access/${encodeURIComponent(grantId)}`)
    },
  }
}

export const taxiqCpaAccessRepository = createTaxiqCpaAccessRepository()
export default taxiqCpaAccessRepository
