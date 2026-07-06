/**
 * taxiqDeductionCategoriesRepository — read-only category list for the "Add Deduction"
 * wizard's Step 1 dropdown. See openspec/changes/integrate-taxiq-owner-deductions/design.md.
 *
 * D2 (resolved): GET /api/v1/taxiq/admin/categories was [Authorize(Policy = Admin)] on the
 * backend, blocking Owner/Staff callers with a 403. Backend now allows any authenticated
 * role to GET (writes remain Admin-only) — see DeductionCategoryController.cs. Non-admin
 * callers always get isActive=true results server-side regardless of the query param.
 */
import httpClient from '../../lib/httpClient'

type HttpClient = typeof httpClient

export interface DeductionCategoryApiDto {
  id: string
  name: string
  applicableRole: string
  riskLevel: string
  requiresBusinessUsePercent: boolean
  smartFieldSchema?: string | null
  displayOrder: number
  isActive: boolean
}

export interface DeductionCategory {
  id: string
  name: string
  applicableRole: string
  riskLevel: string
  requiresBusinessUsePercent: boolean
  displayOrder: number
  isActive: boolean
}

function normalizeDeductionCategory(dto: DeductionCategoryApiDto): DeductionCategory {
  return {
    id: dto.id,
    name: dto.name,
    applicableRole: dto.applicableRole,
    riskLevel: dto.riskLevel,
    requiresBusinessUsePercent: !!dto.requiresBusinessUsePercent,
    displayOrder: dto.displayOrder ?? 0,
    isActive: dto.isActive,
  }
}

export function createTaxiqDeductionCategoriesRepository(client: HttpClient = httpClient) {
  return {
    async list(applicableRole?: string): Promise<DeductionCategory[]> {
      const params = new URLSearchParams()
      if (applicableRole) params.set('applicableRole', applicableRole)
      params.set('isActive', 'true')
      const data = await client.get<DeductionCategoryApiDto[]>(
        `/api/v1/taxiq/admin/categories?${params.toString()}`,
      )
      return (data ?? []).map(normalizeDeductionCategory)
    },
  }
}

export const taxiqDeductionCategoriesRepository = createTaxiqDeductionCategoriesRepository()
export default taxiqDeductionCategoriesRepository
