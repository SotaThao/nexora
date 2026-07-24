/**
 * taxiqStaffTaxYearRepository — API implementation for TaxIQ StaffTaxYear (onboarding,
 * dashboard, module config). See openspec/changes/integrate-taxiq-staff-nav-onboarding/design.md.
 */
import httpClient from '../../lib/httpClient'

type HttpClient = typeof httpClient

export const FILING_STATUSES = [
  'Single',
  'MarriedFilingJointly',
  'MarriedFilingSeparately',
  'HeadOfHousehold',
  'QualifyingSurvivingSpouse',
] as const
export type FilingStatus = (typeof FILING_STATUSES)[number]

export interface StaffTaxYearApiDto {
  id: string
  taxYear: number
  status: string
  contractType: string
  w9Status: string
  officeSqFt?: number | null
  totalHomeSqFt?: number | null
  enabledModules?: string[]
  w4TaxYear?: number | null
  filingStatus?: string | null
  dependentsClaimed?: number | null
  extraWithholdingPerPayPeriod?: number | null
  residenceState?: string | null
  workState?: string | null
  stateExtraWithholding?: number | null
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
  officeSqFt: number | null
  totalHomeSqFt: number | null
  enabledModules: string[]
  w4TaxYear: number | null
  filingStatus: FilingStatus | null
  dependentsClaimed: number | null
  extraWithholdingPerPayPeriod: number | null
  residenceState: string | null
  workState: string | null
  stateExtraWithholding: number | null
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
  officeSqFt?: number | null
  totalHomeSqFt?: number | null
  enabledModules: string[]
}

export interface UpdateStaffTaxYearModulesParams {
  enabledModules: string[]
  contractType?: string
  w9Status?: string
  officeSqFt?: number | null
  totalHomeSqFt?: number | null
}

export interface UpsertStaffW4Params {
  w4TaxYear: number
  filingStatus: FilingStatus
  dependentsClaimed: number
  extraWithholdingPerPayPeriod: number
  residenceState: string
  workState: string
  stateExtraWithholding: number
}

export interface W9RecordApiDto {
  legalName: string
  dbaName?: string | null
  address: string
  city: string
  state: string
  zipCode: string
  taxClassification: string
  llcTaxClassificationType?: string | null
  otherClassificationDescription?: string | null
  hasSignedDocument: boolean
  signedDocumentUrl?: string | null
  isSubjectToBackupWithholding: boolean
  certificationAccepted: boolean
  certifiedAt?: string | null
}

export interface W9Record {
  legalName: string
  dbaName: string | null
  address: string
  city: string
  state: string
  zipCode: string
  taxClassification: string
  llcTaxClassificationType: string | null
  otherClassificationDescription: string | null
  hasSignedDocument: boolean
  signedDocumentUrl: string | null
  isSubjectToBackupWithholding: boolean
  certificationAccepted: boolean
  certifiedAt: string | null
}

function normalizeW9Record(dto: W9RecordApiDto): W9Record {
  return {
    legalName: dto.legalName,
    dbaName: dto.dbaName ?? null,
    address: dto.address,
    city: dto.city,
    state: dto.state,
    zipCode: dto.zipCode,
    taxClassification: dto.taxClassification,
    llcTaxClassificationType: dto.llcTaxClassificationType ?? null,
    otherClassificationDescription: dto.otherClassificationDescription ?? null,
    hasSignedDocument: dto.hasSignedDocument,
    signedDocumentUrl: dto.signedDocumentUrl ?? null,
    isSubjectToBackupWithholding: dto.isSubjectToBackupWithholding ?? false,
    certificationAccepted: dto.certificationAccepted ?? false,
    certifiedAt: dto.certifiedAt ?? null,
  }
}

export interface StaffTaxProfileApiDto {
  ssn?: string | null
  ein?: string | null
  w9Record?: W9RecordApiDto | null
}

export interface StaffTaxProfile {
  ssn: string | null
  ein: string | null
  w9Record: W9Record | null
}

export interface UpsertStaffTaxProfileParams {
  ssn?: string | null
  ein?: string | null
}

export interface UpsertW9RecordParams {
  legalName: string
  dbaName?: string | null
  address: string
  city: string
  state: string
  zipCode: string
  taxClassification: string
  llcTaxClassificationType?: string | null
  otherClassificationDescription?: string | null
  isSubjectToBackupWithholding: boolean
}

function normalizeStaffTaxProfile(dto: StaffTaxProfileApiDto): StaffTaxProfile {
  return {
    ssn: dto.ssn ?? null,
    ein: dto.ein ?? null,
    w9Record: dto.w9Record ? normalizeW9Record(dto.w9Record) : null,
  }
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
    officeSqFt: dto.officeSqFt ?? null,
    totalHomeSqFt: dto.totalHomeSqFt ?? null,
    enabledModules: dto.enabledModules ?? [],
    w4TaxYear: dto.w4TaxYear ?? null,
    filingStatus: (dto.filingStatus as FilingStatus) ?? null,
    dependentsClaimed: dto.dependentsClaimed ?? null,
    extraWithholdingPerPayPeriod: dto.extraWithholdingPerPayPeriod ?? null,
    residenceState: dto.residenceState ?? null,
    workState: dto.workState ?? null,
    stateExtraWithholding: dto.stateExtraWithholding ?? null,
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
        officeSqFt: params.officeSqFt ?? null,
        totalHomeSqFt: params.totalHomeSqFt ?? null,
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
        officeSqFt: params.officeSqFt ?? null,
        totalHomeSqFt: params.totalHomeSqFt ?? null,
      })
    },

    async upsertW4(id: string, params: UpsertStaffW4Params): Promise<void> {
      await client.put(`/api/v1/taxiq/staff/tax-years/${encodeURIComponent(id)}/w4`, {
        w4TaxYear: params.w4TaxYear,
        filingStatus: params.filingStatus,
        dependentsClaimed: params.dependentsClaimed,
        extraWithholdingPerPayPeriod: params.extraWithholdingPerPayPeriod,
        residenceState: params.residenceState,
        workState: params.workState,
        stateExtraWithholding: params.stateExtraWithholding,
      })
    },

    async getMyTaxProfile(): Promise<StaffTaxProfile> {
      const dto = await client.get<StaffTaxProfileApiDto>('/api/v1/taxiq/staff/tax-profile')
      return normalizeStaffTaxProfile(dto)
    },

    async upsertMyTaxProfile(params: UpsertStaffTaxProfileParams): Promise<void> {
      await client.put('/api/v1/taxiq/staff/tax-profile', {
        ssn: params.ssn ?? null,
        ein: params.ein ?? null,
      })
    },

    async upsertW9Record(params: UpsertW9RecordParams): Promise<void> {
      await client.put('/api/v1/taxiq/staff/tax-profile/w9', {
        legalName: params.legalName,
        dbaName: params.dbaName ?? null,
        address: params.address,
        city: params.city,
        state: params.state,
        zipCode: params.zipCode,
        taxClassification: params.taxClassification,
        llcTaxClassificationType: params.llcTaxClassificationType ?? null,
        otherClassificationDescription: params.otherClassificationDescription ?? null,
        isSubjectToBackupWithholding: params.isSubjectToBackupWithholding,
      })
    },

    async uploadSignedW9(file: File): Promise<void> {
      const formData = new FormData()
      formData.append('file', file)
      await client.upload<void>('/api/v1/taxiq/staff/tax-profile/w9/document', formData, 'POST')
    },

    // Separate, deliberate action — mirrors verifyStaffTin on the Owner side. Backend
    // rejects with TAXIQ_W9_NOT_READY_FOR_CERTIFICATION when required fields or the
    // signed document are missing.
    async certifyW9Record(): Promise<void> {
      await client.post<void>('/api/v1/taxiq/staff/tax-profile/w9/certify')
    },
  }
}

export const taxiqStaffTaxYearRepository = createTaxiqStaffTaxYearRepository()
export default taxiqStaffTaxYearRepository
