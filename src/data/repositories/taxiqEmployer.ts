/**
 * taxiqEmployerRepository — API implementation for the TaxIQ Employer Registry (US-21 backend /
 * US-029 FE). See openspec/changes/integrate-taxiq-employer-registry/design.md.
 */
import httpClient from '../../lib/httpClient'

type HttpClient = typeof httpClient

export const DEPOSIT_SCHEDULES = ['Semiweekly', 'Monthly', 'Quarterly'] as const
export type DepositSchedule = (typeof DEPOSIT_SCHEDULES)[number]

export const EMPLOYER_EDITABLE_STATUSES = ['Active', 'Inactive', 'Suspended'] as const
export type EmployerEditableStatus = (typeof EMPLOYER_EDITABLE_STATUSES)[number]

export const REGISTRATION_STATUSES = ['Active', 'Review', 'MissingSetup'] as const
export type RegistrationStatus = (typeof REGISTRATION_STATUSES)[number]

export const KNOWN_JURISDICTIONS = ['US-FED', 'US-TX', 'US-CA', 'US-NY'] as const

export interface EmployerApiDto {
  id: string
  businessId: string
  businessName: string
  einMasked?: string | null
  industry?: string | null
  primaryState?: string | null
  employeeCount: number
  registrationsSummary: string
  federalDepositSchedule: string
  nextDeposit?: string | null
  healthPercent: number
  status: string
  enableStrictFinalization: boolean
  createdAt: string
  lastModified?: string | null
}

export interface Employer {
  id: string
  businessId: string
  businessName: string
  einMasked: string | null
  industry: string | null
  primaryState: string | null
  employeeCount: number
  registrationsSummary: string
  federalDepositSchedule: string
  nextDeposit: string | null
  healthPercent: number
  status: string
  enableStrictFinalization: boolean
  createdAt: string
  lastModified: string | null
}

function normalizeEmployer(dto: EmployerApiDto): Employer {
  return {
    id: dto.id,
    businessId: dto.businessId,
    businessName: dto.businessName,
    einMasked: dto.einMasked ?? null,
    industry: dto.industry ?? null,
    primaryState: dto.primaryState ?? null,
    employeeCount: dto.employeeCount,
    registrationsSummary: dto.registrationsSummary,
    federalDepositSchedule: dto.federalDepositSchedule,
    nextDeposit: dto.nextDeposit ?? null,
    healthPercent: dto.healthPercent,
    status: dto.status,
    enableStrictFinalization: dto.enableStrictFinalization,
    createdAt: dto.createdAt,
    lastModified: dto.lastModified ?? null,
  }
}

export interface EmployerRegistrationApiDto {
  id: string
  employerId: string
  jurisdiction: string
  accountNumberMasked?: string | null
  registrationStatus: string
  depositSchedule: string
  nextDue?: string | null
  registeredDate?: string | null
}

export interface EmployerRegistration {
  id: string
  employerId: string
  jurisdiction: string
  accountNumberMasked: string | null
  registrationStatus: string
  depositSchedule: string
  nextDue: string | null
  registeredDate: string | null
}

function normalizeEmployerRegistration(dto: EmployerRegistrationApiDto): EmployerRegistration {
  return {
    id: dto.id,
    employerId: dto.employerId,
    jurisdiction: dto.jurisdiction,
    accountNumberMasked: dto.accountNumberMasked ?? null,
    registrationStatus: dto.registrationStatus,
    depositSchedule: dto.depositSchedule,
    nextDue: dto.nextDue ?? null,
    registeredDate: dto.registeredDate ?? null,
  }
}

export interface EmployerListPage {
  items: Employer[]
  totalCount: number
}

export interface CreateEmployerParams {
  businessId: string
  industry?: string
  federalDepositSchedule: DepositSchedule
  enableStrictFinalization: boolean
}

export interface UpdateEmployerParams {
  employerId: string
  industry?: string
  federalDepositSchedule: DepositSchedule
  enableStrictFinalization: boolean
  status: EmployerEditableStatus
}

export interface UpsertEmployerRegistrationParams {
  employerId: string
  jurisdiction: string
  accountNumber?: string
  registrationStatus: RegistrationStatus
  depositSchedule: DepositSchedule
  nextDue?: string | null
  registeredDate?: string | null
}

// PaginatedList<T> field names from backend/src/Application/Common/Models/PaginatedList.cs
interface PaginatedListApiResponse<T> {
  items: T[]
  totalCount: number
}

export function createTaxiqEmployerRepository(client: HttpClient = httpClient) {
  return {
    async listByBusiness(businessId: string): Promise<EmployerListPage> {
      const params = new URLSearchParams({ businessId, pageSize: '100' })
      const data = await client.get<PaginatedListApiResponse<EmployerApiDto>>(
        `/api/v1/taxiq/owner/employers?${params.toString()}`,
      )
      return {
        items: (data?.items ?? []).map(normalizeEmployer),
        totalCount: data?.totalCount ?? data?.items?.length ?? 0,
      }
    },

    async create(params: CreateEmployerParams): Promise<string> {
      return await client.post<string>('/api/v1/taxiq/owner/employers', {
        businessId: params.businessId,
        industry: params.industry ?? null,
        federalDepositSchedule: params.federalDepositSchedule,
        enableStrictFinalization: params.enableStrictFinalization,
      })
    },

    async getById(employerId: string): Promise<Employer> {
      const dto = await client.get<EmployerApiDto>(
        `/api/v1/taxiq/owner/employers/${encodeURIComponent(employerId)}`,
      )
      return normalizeEmployer(dto)
    },

    async update(params: UpdateEmployerParams): Promise<void> {
      await client.put<void>(`/api/v1/taxiq/owner/employers/${encodeURIComponent(params.employerId)}`, {
        industry: params.industry ?? null,
        federalDepositSchedule: params.federalDepositSchedule,
        enableStrictFinalization: params.enableStrictFinalization,
        status: params.status,
      })
    },

    async listRegistrations(employerId: string): Promise<EmployerRegistration[]> {
      const data = await client.get<EmployerRegistrationApiDto[]>(
        `/api/v1/taxiq/owner/employers/${encodeURIComponent(employerId)}/registrations`,
      )
      return (data ?? []).map(normalizeEmployerRegistration)
    },

    async upsertRegistration(params: UpsertEmployerRegistrationParams): Promise<void> {
      await client.put<void>(
        `/api/v1/taxiq/owner/employers/${encodeURIComponent(params.employerId)}/registrations`,
        {
          jurisdiction: params.jurisdiction,
          accountNumber: params.accountNumber,
          registrationStatus: params.registrationStatus,
          depositSchedule: params.depositSchedule,
          nextDue: params.nextDue ?? null,
          registeredDate: params.registeredDate ?? null,
        },
      )
    },
  }
}

export const taxiqEmployerRepository = createTaxiqEmployerRepository()
export default taxiqEmployerRepository
