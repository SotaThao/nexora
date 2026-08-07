/**
 * TanStack Query hook for TaxIQ deduction categories (read-only dropdown source).
 * See openspec/changes/integrate-taxiq-owner-deductions/design.md D2.
 */
import { useQuery } from '@tanstack/react-query'
import { qk } from '../queryKeys'
import taxiqDeductionCategoriesRepository from '../repositories/taxiqDeductionCategories'
import type { DeductionCategory } from '../repositories/taxiqDeductionCategories'

export function useTaxiqDeductionCategories(applicableRole?: string) {
  return useQuery<DeductionCategory[]>({
    queryKey: qk.taxiqDeductionCategories(applicableRole),
    queryFn: () => taxiqDeductionCategoriesRepository.list(applicableRole),
  })
}
