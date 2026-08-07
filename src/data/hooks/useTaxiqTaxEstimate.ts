/**
 * TanStack Query hooks for Tax Estimate (mục 27).
 */
import { useMutation, useQuery } from '@tanstack/react-query'
import { qk } from '../queryKeys'
import taxiqTaxEstimateRepository from '../repositories/taxiqTaxEstimate'
import type { DepositScheduleAlert, TaxEstimate, TaxReadinessChecklist } from '../repositories/taxiqTaxEstimate'

export function useTaxEstimate(ownerTaxYearId?: string, quarter?: number) {
  return useQuery<TaxEstimate>({
    queryKey: qk.taxiqTaxEstimate(ownerTaxYearId, quarter),
    queryFn: () => taxiqTaxEstimateRepository.getEstimate(ownerTaxYearId as string, quarter),
    enabled: !!ownerTaxYearId,
  })
}

export function useDepositScheduleAlerts(ownerTaxYearId?: string) {
  return useQuery<DepositScheduleAlert[]>({
    queryKey: qk.taxiqDepositScheduleAlerts(ownerTaxYearId),
    queryFn: () => taxiqTaxEstimateRepository.getDepositScheduleAlerts(ownerTaxYearId as string),
    enabled: !!ownerTaxYearId,
  })
}

export function useTaxReadinessChecklist(ownerTaxYearId?: string) {
  return useQuery<TaxReadinessChecklist>({
    queryKey: qk.taxiqTaxReadinessChecklist(ownerTaxYearId),
    queryFn: () => taxiqTaxEstimateRepository.getReadinessChecklist(ownerTaxYearId as string),
    enabled: !!ownerTaxYearId,
  })
}

export function useExportDepositScheduleCsv() {
  return useMutation<Blob, Error, string>({
    mutationFn: (ownerTaxYearId) => taxiqTaxEstimateRepository.exportDepositScheduleCsv(ownerTaxYearId),
  })
}
