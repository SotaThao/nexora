/**
 * TanStack Query hooks for TaxIQ Jurisdictions (mục 19, backend US-037).
 */
import { useQuery } from '@tanstack/react-query'
import { qk } from '../queryKeys'
import jurisdictionsRepository, { type JurisdictionSummaryItem } from '../repositories/jurisdictions'

export function useJurisdictionSummary(businessId: string | undefined, employerId: string | undefined) {
  return useQuery<JurisdictionSummaryItem[]>({
    queryKey: qk.taxiqJurisdictionSummary(businessId, employerId),
    queryFn: () => jurisdictionsRepository.getJurisdictionSummary(employerId as string),
    enabled: !!businessId && !!employerId,
  })
}
