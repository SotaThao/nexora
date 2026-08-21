/**
 * TanStack Query hooks for TaxIQ/POS Weekly Payroll (mục 14, backend US-25).
 */
import { useContext } from 'react'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { qk } from '../queryKeys'
import weeklyPayrollRepository, {
  type PayAllWeeklyPayrollParams,
  type PayAllWeeklyPayrollResult,
  type PayWeeklyPayrollParams,
  type WeeklyPayroll,
  type WeeklyPayrollDailyDetail,
} from '../repositories/weeklyPayroll'
import { AuthContext } from '../../auth/AuthContext'

export function useWeeklyPayroll(
  businessId: string | undefined,
  weekStart?: string,
  options?: { enabled?: boolean },
) {
  const auth = useContext(AuthContext)
  const isOwner = auth?.status === 'authenticated' && auth?.session?.role === 'owner'
  return useQuery<WeeklyPayroll>({
    queryKey: qk.merchantPosWeeklyPayroll(businessId, weekStart),
    queryFn: () => weeklyPayrollRepository.getWeeklyPayroll(weekStart),
    enabled: isOwner && !!businessId && (options?.enabled ?? true),
    placeholderData: keepPreviousData,
  })
}

export function useWeeklyPayrollDailyDetail(businessStaffLinkId: string | undefined, weekStart?: string) {
  const auth = useContext(AuthContext)
  const isOwner = auth?.status === 'authenticated' && auth?.session?.role === 'owner'
  return useQuery<WeeklyPayrollDailyDetail>({
    queryKey: qk.merchantPosWeeklyPayrollDailyDetail(businessStaffLinkId, weekStart),
    queryFn: () => weeklyPayrollRepository.getDailyDetail(businessStaffLinkId as string, weekStart),
    enabled: isOwner && !!businessStaffLinkId,
  })
}

export function usePayWeeklyPayroll(businessId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation<string, Error, PayWeeklyPayrollParams>({
    mutationFn: (params) => weeklyPayrollRepository.pay(params),
    onSuccess: () => {
      // Prefix-only key (no weekStart segment) so this matches every cached week for this
      // business — the mutation's own weekStart may not match whatever weekStart (possibly
      // undefined, meaning "current week") the currently-mounted list query was keyed with.
      queryClient.invalidateQueries({ queryKey: qk.merchantPosWeeklyPayroll(businessId) })
    },
  })
}

export function usePayAllWeeklyPayroll(businessId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation<PayAllWeeklyPayrollResult, Error, PayAllWeeklyPayrollParams>({
    mutationFn: (params) => weeklyPayrollRepository.payAll(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.merchantPosWeeklyPayroll(businessId) })
    },
  })
}
