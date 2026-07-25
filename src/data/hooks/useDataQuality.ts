/**
 * TanStack Query hooks for TaxIQ Data Quality Center (mục 18, backend US-036).
 */
import { useContext } from 'react'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { qk } from '../queryKeys'
import dataQualityRepository, {
  type CleanupTaskListPage,
  type CleanupTaskListQuery,
  type CreateCleanupTaskParams,
  type DataQuality,
} from '../repositories/dataQuality'
import { AuthContext } from '../../auth/AuthContext'

export function useDataQuality(businessId: string | undefined, employerId: string | undefined) {
  const auth = useContext(AuthContext)
  const isOwner = auth?.status === 'authenticated' && auth?.session?.role === 'owner'
  return useQuery<DataQuality>({
    queryKey: qk.taxiqDataQuality(businessId, employerId),
    queryFn: () => dataQualityRepository.getDataQuality(employerId as string),
    enabled: isOwner && !!businessId && !!employerId,
  })
}

export function useCleanupTasks(businessId: string | undefined, query: CleanupTaskListQuery = {}) {
  const auth = useContext(AuthContext)
  const isOwner = auth?.status === 'authenticated' && auth?.session?.role === 'owner'
  return useQuery<CleanupTaskListPage>({
    queryKey: qk.taxiqCleanupTasks(businessId, query),
    queryFn: () => dataQualityRepository.listCleanupTasks(query),
    enabled: isOwner && !!businessId && !!query.employerId,
    placeholderData: keepPreviousData,
  })
}

export function useCreateCleanupTask(businessId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation<string, Error, CreateCleanupTaskParams>({
    mutationFn: (params) => dataQualityRepository.createCleanupTask(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.taxiqCleanupTasks(businessId) })
    },
  })
}

export function useCloseCleanupTask(businessId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation<void, Error, { id: string; reviewerNote: string }>({
    mutationFn: ({ id, reviewerNote }) => dataQualityRepository.closeCleanupTask(id, reviewerNote),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.taxiqCleanupTasks(businessId) })
    },
  })
}
