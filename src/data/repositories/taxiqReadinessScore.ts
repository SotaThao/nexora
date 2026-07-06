/**
 * taxiqReadinessScoreRepository — Tax Readiness Score (Owner + Staff, shared widget).
 * Owner and Staff endpoints return structurally different DTOs (see
 * OwnerReadinessScoreDto / StaffReadinessScoreDto in backend); normalized here
 * into one shared FE shape so the widget doesn't need to branch on scope.
 */
import httpClient from '../../lib/httpClient'

type HttpClient = typeof httpClient

export type TaxReadinessScope = 'owner' | 'staff'

export interface ReadinessPriorityItemApiDto {
  type: string
  priority: string
  description: string
}

interface OwnerReadinessScoreApiDto {
  ownerCpaScore: number
  cpaReviewScore: number
  highPriorityCount: number
  highPriorityItems: ReadinessPriorityItemApiDto[]
}

interface StaffReadinessScoreApiDto {
  staffTaxScore: number
  cpaReviewScore: number
  priorityItemCount: number
  priorityItems: ReadinessPriorityItemApiDto[]
}

export interface ReadinessPriorityItem {
  type: string
  priority: string
  description: string
}

export interface TaxReadinessScore {
  ownerCpaScore: number
  staffTaxScore: number
  cpaReviewScore: number
  highPriorityCount: number
  highPriorityItems: ReadinessPriorityItem[]
}

function normalizePriorityItem(dto: ReadinessPriorityItemApiDto): ReadinessPriorityItem {
  return {
    type: dto.type,
    priority: dto.priority,
    description: dto.description,
  }
}

function normalizeOwnerScore(dto: OwnerReadinessScoreApiDto): TaxReadinessScore {
  return {
    ownerCpaScore: dto.ownerCpaScore ?? 0,
    staffTaxScore: 0,
    cpaReviewScore: dto.cpaReviewScore ?? 0,
    highPriorityCount: dto.highPriorityCount ?? 0,
    highPriorityItems: (dto.highPriorityItems ?? []).map(normalizePriorityItem),
  }
}

function normalizeStaffScore(dto: StaffReadinessScoreApiDto): TaxReadinessScore {
  return {
    ownerCpaScore: 0,
    staffTaxScore: dto.staffTaxScore ?? 0,
    cpaReviewScore: dto.cpaReviewScore ?? 0,
    highPriorityCount: dto.priorityItemCount ?? 0,
    highPriorityItems: (dto.priorityItems ?? []).map(normalizePriorityItem),
  }
}

export function createTaxiqReadinessScoreRepository(client: HttpClient = httpClient) {
  return {
    async get(scope: TaxReadinessScope, taxYearId: string): Promise<TaxReadinessScore> {
      if (scope === 'staff') {
        const dto = await client.get<StaffReadinessScoreApiDto>(
          `/api/v1/taxiq/staff/tax-years/${encodeURIComponent(taxYearId)}/readiness-score`,
        )
        return normalizeStaffScore(dto)
      }
      const dto = await client.get<OwnerReadinessScoreApiDto>(
        `/api/v1/taxiq/owner/tax-years/${encodeURIComponent(taxYearId)}/readiness-score`,
      )
      return normalizeOwnerScore(dto)
    },
  }
}

export const taxiqReadinessScoreRepository = createTaxiqReadinessScoreRepository()
export default taxiqReadinessScoreRepository
