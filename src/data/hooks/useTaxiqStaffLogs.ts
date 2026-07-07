/**
 * TanStack Query hooks for the TaxIQ Staff Mileage Log & Cash Tip Log (US-12).
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { qk } from '../queryKeys'
import taxiqStaffLogsRepository from '../repositories/taxiqStaffLogs'
import type {
  CreateMileageLogParams,
  LogCashTipParams,
  MileageLogRecord,
  CashTipLogRecord,
  UpdateMileageLogParams,
} from '../repositories/taxiqStaffLogs'

export function useTaxiqStaffMileageLogs(staffTaxYearId?: string) {
  return useQuery<MileageLogRecord[]>({
    queryKey: qk.taxiqStaffMileageLogs(staffTaxYearId),
    queryFn: () => taxiqStaffLogsRepository.listMileageLogs(staffTaxYearId as string),
    enabled: !!staffTaxYearId,
  })
}

export function useCreateMileageLog() {
  const queryClient = useQueryClient()
  return useMutation<string, Error, CreateMileageLogParams>({
    mutationFn: (params) => taxiqStaffLogsRepository.createMileageLog(params),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: qk.taxiqStaffMileageLogs(variables.staffTaxYearId) })
    },
  })
}

export function useUpdateMileageLog() {
  const queryClient = useQueryClient()
  return useMutation<void, Error, { id: string; staffTaxYearId: string } & UpdateMileageLogParams>({
    mutationFn: ({ id, staffTaxYearId: _staffTaxYearId, ...params }) =>
      taxiqStaffLogsRepository.updateMileageLog(id, params),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: qk.taxiqStaffMileageLogs(variables.staffTaxYearId) })
    },
  })
}

export function useTaxiqStaffCashTipLogs(staffTaxYearId?: string) {
  return useQuery<CashTipLogRecord[]>({
    queryKey: qk.taxiqStaffCashTipLogs(staffTaxYearId),
    queryFn: () => taxiqStaffLogsRepository.listCashTipLogs(staffTaxYearId as string),
    enabled: !!staffTaxYearId,
  })
}

export function useLogCashTip() {
  const queryClient = useQueryClient()
  return useMutation<string, Error, LogCashTipParams>({
    mutationFn: (params) => taxiqStaffLogsRepository.logCashTip(params),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: qk.taxiqStaffCashTipLogs(variables.staffTaxYearId) })
    },
  })
}
