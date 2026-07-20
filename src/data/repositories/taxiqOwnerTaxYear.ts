/**
 * taxiqOwnerTaxYearRepository — API implementation for TaxIQ OwnerTaxYear (onboarding,
 * module config). See openspec/changes/integrate-taxiq-owner-onboarding/design.md.
 */
import httpClient from '../../lib/httpClient'

type HttpClient = typeof httpClient

export interface OwnerTaxYearEmployeeTypeConfig {
  hasW2?: boolean
  hasContractor1099?: boolean
  hasBoothRenter?: boolean
}

export interface OwnerTaxYearApiDto {
  id: string
  businessId: string
  taxYear: number
  status: string
  salonName?: string | null
  employeeTypeConfig?: string | null
  businessEntityType?: string | null
  officeSqFt?: number | null
  totalHomeSqFt?: number | null
  enabledModules?: string[]
  lockedAt?: string | null
  exportedAt?: string | null
  createdAt: string
  lastModified?: string | null
}

interface OwnerTaxYearListApiResponse {
  items: OwnerTaxYearApiDto[]
  totalCount?: number
}

export interface OwnerTaxYear {
  id: string
  businessId: string
  taxYear: number
  status: string
  salonName: string
  employeeTypeConfig: OwnerTaxYearEmployeeTypeConfig
  businessEntityType: string | null
  officeSqFt: number | null
  totalHomeSqFt: number | null
  enabledModules: string[]
  lockedAt: string | null
  exportedAt: string | null
  createdAt: string
  lastModified: string | null
}

export interface OwnerTaxYearListPage {
  items: OwnerTaxYear[]
  totalCount: number
}

export interface CreateOwnerTaxYearParams {
  businessId: string
  taxYear: number
  salonName: string
  employeeTypeConfig: OwnerTaxYearEmployeeTypeConfig
  businessEntityType?: string | null
  officeSqFt?: number | null
  totalHomeSqFt?: number | null
  enabledModules: string[]
}

export interface UpdateOwnerTaxYearModulesParams {
  employeeTypeConfig: OwnerTaxYearEmployeeTypeConfig
  businessEntityType?: string | null
  officeSqFt?: number | null
  totalHomeSqFt?: number | null
  enabledModules: string[]
}

function normalizeOwnerTaxYear(dto: OwnerTaxYearApiDto): OwnerTaxYear {
  let employeeTypeConfig: OwnerTaxYearEmployeeTypeConfig = {}
  if (dto.employeeTypeConfig) {
    try {
      employeeTypeConfig = JSON.parse(dto.employeeTypeConfig)
    } catch {
      employeeTypeConfig = {}
    }
  }
  return {
    id: dto.id,
    businessId: dto.businessId,
    taxYear: dto.taxYear,
    status: dto.status,
    salonName: dto.salonName ?? '',
    employeeTypeConfig,
    businessEntityType: dto.businessEntityType ?? null,
    officeSqFt: dto.officeSqFt ?? null,
    totalHomeSqFt: dto.totalHomeSqFt ?? null,
    enabledModules: dto.enabledModules ?? [],
    lockedAt: dto.lockedAt ?? null,
    exportedAt: dto.exportedAt ?? null,
    createdAt: dto.createdAt,
    lastModified: dto.lastModified ?? null,
  }
}

export function createTaxiqOwnerTaxYearRepository(client: HttpClient = httpClient) {
  return {
    // GET /tax-years?businessId=&taxYear= — the only endpoint that represents
    // "no OwnerTaxYear yet" without throwing (200 + empty items). Used to gate
    // onboarding wizard vs Tax IQ Home; see design.md D1.
    async listByBusiness(businessId: string, taxYear: number): Promise<OwnerTaxYearListPage> {
      const params = new URLSearchParams({ businessId, taxYear: String(taxYear) })
      const data = await client.get<OwnerTaxYearApiDto[] | OwnerTaxYearListApiResponse>(
        `/api/v1/taxiq/owner/tax-years?${params.toString()}`,
      )
      const page = Array.isArray(data) ? null : data
      const items = Array.isArray(data) ? data : (page?.items ?? [])
      return {
        items: items.map(normalizeOwnerTaxYear),
        totalCount: page?.totalCount ?? items.length,
      }
    },

    async getById(id: string): Promise<OwnerTaxYear> {
      const dto = await client.get<OwnerTaxYearApiDto>(
        `/api/v1/taxiq/owner/tax-years/${encodeURIComponent(id)}`,
      )
      return normalizeOwnerTaxYear(dto)
    },

    // Response body shape unconfirmed (Open Question 1 in design.md) — handle both a
    // full DTO and an empty 201/204 response; callers should not assume a non-null result.
    async create(params: CreateOwnerTaxYearParams): Promise<OwnerTaxYear | null> {
      const dto = await client.post<OwnerTaxYearApiDto | null>('/api/v1/taxiq/owner/tax-years', {
        businessId: params.businessId,
        taxYear: params.taxYear,
        salonName: params.salonName,
        employeeTypeConfig: JSON.stringify(params.employeeTypeConfig ?? {}),
        businessEntityType: params.businessEntityType ?? null,
        officeSqFt: params.officeSqFt ?? null,
        totalHomeSqFt: params.totalHomeSqFt ?? null,
        enabledModules: params.enabledModules,
      })
      return dto ? normalizeOwnerTaxYear(dto) : null
    },

    async updateModules(id: string, params: UpdateOwnerTaxYearModulesParams): Promise<void> {
      await client.put(`/api/v1/taxiq/owner/tax-years/${encodeURIComponent(id)}/modules`, {
        employeeTypeConfig: JSON.stringify(params.employeeTypeConfig ?? {}),
        businessEntityType: params.businessEntityType ?? null,
        officeSqFt: params.officeSqFt ?? null,
        totalHomeSqFt: params.totalHomeSqFt ?? null,
        enabledModules: params.enabledModules,
      })
    },

    async updateBusinessEin(businessId: string, ein: string): Promise<void> {
      await client.put(`/api/v1/taxiq/owner/business/${encodeURIComponent(businessId)}/ein`, {
        businessId,
        ein,
      })
    },
  }
}

export const taxiqOwnerTaxYearRepository = createTaxiqOwnerTaxYearRepository()
export default taxiqOwnerTaxYearRepository
