/**
 * TanStack Query hooks for TaxIQ Exceptions Queue (mục 17, backend US-036).
 */
import { useContext } from 'react'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { qk } from '../queryKeys'
import exceptionsRepository, {
  type ExceptionDetail,
  type ExceptionListPage,
  type ExceptionListQuery,
  type ResolveExceptionParams,
  type ScanExceptionsResult,
} from '../repositories/exceptions'
import { AuthContext } from '../../auth/AuthContext'

export function useExceptions(businessId: string | undefined, query: ExceptionListQuery = {}) {
  const auth = useContext(AuthContext)
  const isOwner = auth?.status === 'authenticated' && auth?.session?.role === 'owner'
  return useQuery<ExceptionListPage>({
    queryKey: qk.taxiqExceptions(businessId, query),
    queryFn: () => exceptionsRepository.listExceptions(query),
    enabled: isOwner && !!businessId && !!query.employerId,
    placeholderData: keepPreviousData,
  })
}

export function useExceptionDetail(id: string | undefined) {
  const auth = useContext(AuthContext)
  const isOwner = auth?.status === 'authenticated' && auth?.session?.role === 'owner'
  return useQuery<ExceptionDetail>({
    queryKey: qk.taxiqException(id),
    queryFn: () => exceptionsRepository.getExceptionDetail(id as string),
    enabled: isOwner && !!id,
  })
}

export function useScanExceptions(businessId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation<ScanExceptionsResult, Error, string>({
    mutationFn: (employerId) => exceptionsRepository.scanExceptions(employerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.taxiqExceptions(businessId) })
    },
  })
}

export function useResolveException(businessId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation<void, Error, { id: string; params: ResolveExceptionParams }>({
    mutationFn: ({ id, params }) => exceptionsRepository.resolveException(id, params),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: qk.taxiqExceptions(businessId) })
      queryClient.invalidateQueries({ queryKey: qk.taxiqException(variables.id) })
      queryClient.invalidateQueries({ queryKey: qk.taxiqDataQuality(businessId) })
    },
  })
}

export function useAssignException(businessId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation<void, Error, { id: string; newOwner: string }>({
    mutationFn: ({ id, newOwner }) => exceptionsRepository.assignException(id, newOwner),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: qk.taxiqExceptions(businessId) })
      queryClient.invalidateQueries({ queryKey: qk.taxiqException(variables.id) })
    },
  })
}

export function useAddExceptionNote(businessId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation<void, Error, { id: string; note: string }>({
    mutationFn: ({ id, note }) => exceptionsRepository.addExceptionNote(id, note),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: qk.taxiqExceptions(businessId) })
      queryClient.invalidateQueries({ queryKey: qk.taxiqException(variables.id) })
    },
  })
}
