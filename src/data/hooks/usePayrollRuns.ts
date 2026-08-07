/**
 * TanStack Query hooks for TaxIQ Payroll Runs (mục 12, backend US-26).
 */
import { useContext } from 'react'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { qk } from '../queryKeys'
import payrollRunsRepository, {
  type CreatePayrollRunParams,
  type FinalizePayrollRunResult,
  type PayrollRunDetail,
  type PayrollRunListPage,
  type PayrollRunListQuery,
} from '../repositories/payrollRuns'
import { AuthContext } from '../../auth/AuthContext'

export function usePayrollRuns(businessId: string | undefined, query: PayrollRunListQuery = {}) {
  const auth = useContext(AuthContext)
  const isOwner = auth?.status === 'authenticated' && auth?.session?.role === 'owner'
  return useQuery<PayrollRunListPage>({
    queryKey: qk.taxiqPayrollRuns(businessId, query),
    queryFn: () => payrollRunsRepository.listPayrollRuns(query),
    enabled: isOwner && !!businessId,
    placeholderData: keepPreviousData,
  })
}

export function usePayrollRun(id: string | undefined) {
  const auth = useContext(AuthContext)
  const isOwner = auth?.status === 'authenticated' && auth?.session?.role === 'owner'
  return useQuery<PayrollRunDetail>({
    queryKey: qk.taxiqPayrollRun(id),
    queryFn: () => payrollRunsRepository.getPayrollRun(id as string),
    enabled: isOwner && !!id,
  })
}

export function useCreatePayrollRun(businessId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation<string, Error, CreatePayrollRunParams>({
    mutationFn: (params) => payrollRunsRepository.createPayrollRun(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.taxiqPayrollRuns(businessId) })
    },
  })
}

export function useRerunPayrollRunValidation(businessId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation<void, Error, string>({
    mutationFn: (id) => payrollRunsRepository.rerunValidation(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: qk.taxiqPayrollRuns(businessId) })
      queryClient.invalidateQueries({ queryKey: qk.taxiqPayrollRun(id) })
    },
  })
}

export function useFinalizePayrollRun(businessId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation<FinalizePayrollRunResult, Error, { id: string; approvalNote: string }>({
    mutationFn: ({ id, approvalNote }) => payrollRunsRepository.finalize(id, approvalNote),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: qk.taxiqPayrollRuns(businessId) })
      queryClient.invalidateQueries({ queryKey: qk.taxiqPayrollRun(id) })
    },
  })
}

export function useCancelPayrollRun(businessId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation<void, Error, { id: string; cancelReason: string }>({
    mutationFn: ({ id, cancelReason }) => payrollRunsRepository.cancel(id, cancelReason),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: qk.taxiqPayrollRuns(businessId) })
      queryClient.invalidateQueries({ queryKey: qk.taxiqPayrollRun(id) })
    },
  })
}
