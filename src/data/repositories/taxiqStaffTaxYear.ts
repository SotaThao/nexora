/**
 * taxiqStaffTaxYearRepository — API implementation for TaxIQ StaffTaxYear (onboarding,
 * dashboard, module config). See openspec/changes/integrate-taxiq-staff-nav-onboarding/design.md.
 */
import httpClient from '../../lib/httpClient'

type HttpClient = typeof httpClient

export interface StaffTaxYearApiDto {
  id: string
  taxYear: number
  status: string
  contractType: string
  w9Status: string
  enabledModules?: string[]
  createdAt: string
  lastModified?: string | null
}

interface StaffTaxYearListApiResponse {
  items: StaffTaxYearApiDto[]
  totalCount?: number
}

export interface StaffTaxYear {
  id: string
  taxYear: number
  status: string
  contractType: string
  w9Status: string
  enabledModules: string[]
  createdAt: string
  lastModified: string | null
}

export interface StaffTaxYearListPage {
  items: StaffTaxYear[]
  totalCount: number
}

export interface CreateStaffTaxYearParams {
  taxYear: number
  contractType: string
  w9Status: string
  enabledModules: string[]
}

export interface UpdateStaffTaxYearModulesParams {
  enabledModules: string[]
  contractType?: string
  w9Status?: string
}

export interface StaffDashboardApiDto {
  staffTaxYearId: string
  taxYear: number
  contractType: string
  w9Status: string
  status: string
  enabledModules?: string[]
  ownerReportedIncome: number
  selfReportedIncome: number
  cashTipTotal: number
  grossIncome: number
  pendingPayoutsCount: number
  totalDeductions: number
  estimatedNetIncome: number
}

export interface StaffDashboard {
  staffTaxYearId: string
  taxYear: number
  contractType: string
  w9Status: string
  status: string
  enabledModules: string[]
  ownerReportedIncome: number
  selfReportedIncome: number
  cashTipTotal: number
  grossIncome: number
  pendingPayoutsCount: number
  totalDeductions: number
  estimatedNetIncome: number
}

function normalizeStaffTaxYear(dto: StaffTaxYearApiDto): StaffTaxYear {
  return {
    id: dto.id,
    taxYear: dto.taxYear,
    status: dto.status,
    contractType: dto.contractType,
    w9Status: dto.w9Status,
    enabledModules: dto.enabledModules ?? [],
    createdAt: dto.createdAt,
    lastModified: dto.lastModified ?? null,
  }
}

function normalizeStaffDashboard(dto: StaffDashboardApiDto): StaffDashboard {
  return {
    staffTaxYearId: dto.staffTaxYearId,
    taxYear: dto.taxYear,
    contractType: dto.contractType,
    w9Status: dto.w9Status,
    status: dto.status,
    enabledModules: dto.enabledModules ?? [],
    ownerReportedIncome: dto.ownerReportedIncome ?? 0,
    selfReportedIncome: dto.selfReportedIncome ?? 0,
    cashTipTotal: dto.cashTipTotal ?? 0,
    grossIncome: dto.grossIncome ?? 0,
    pendingPayoutsCount: dto.pendingPayoutsCount ?? 0,
    totalDeductions: dto.totalDeductions ?? 0,
    estimatedNetIncome: dto.estimatedNetIncome ?? 0,
  }
}

export function createTaxiqStaffTaxYearRepository(client: HttpClient = httpClient) {
  return {
    // GET /tax-years?TaxYear= — scoped by the caller's JWT userId server-side, no
    // businessId needed. Returns 200 + empty items when no StaffTaxYear exists yet;
    // used to gate onboarding wizard vs Staff Tax IQ Home.
    async listByYear(taxYear: number): Promise<StaffTaxYearListPage> {
      const params = new URLSearchParams({ TaxYear: String(taxYear) })
      const data = await client.get<StaffTaxYearApiDto[] | StaffTaxYearListApiResponse>(
        `/api/v1/taxiq/staff/tax-years?${params.toString()}`,
      )
      const page = Array.isArray(data) ? null : data
      const items = Array.isArray(data) ? data : (page?.items ?? [])
      return {
        items: items.map(normalizeStaffTaxYear),
        totalCount: page?.totalCount ?? items.length,
      }
    },

    // POST returns the new record's id only (Guid body), not a full DTO.
    async create(params: CreateStaffTaxYearParams): Promise<string> {
      const id = await client.post<string>('/api/v1/taxiq/staff/tax-years', {
        taxYear: params.taxYear,
        contractType: params.contractType,
        w9Status: params.w9Status,
        enabledModules: params.enabledModules,
      })
      return id
    },

    async getDashboard(id: string): Promise<StaffDashboard> {
      const dto = await client.get<StaffDashboardApiDto>(
        `/api/v1/taxiq/staff/tax-years/${encodeURIComponent(id)}/dashboard`,
      )
      return normalizeStaffDashboard(dto)
    },

    async updateModules(id: string, params: UpdateStaffTaxYearModulesParams): Promise<void> {
      await client.put(`/api/v1/taxiq/staff/tax-years/${encodeURIComponent(id)}/modules`, {
        enabledModules: params.enabledModules,
        contractType: params.contractType ?? null,
        w9Status: params.w9Status ?? null,
      })
    },
  }
}

export const taxiqStaffTaxYearRepository = createTaxiqStaffTaxYearRepository()
export default taxiqStaffTaxYearRepository
