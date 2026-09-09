/**
 * TanStack Query hooks for POS Owner Setup: Staff Levels.
 */
import { useContext } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { qk } from '../queryKeys'
import posStaffLevelsRepository from '../repositories/posStaffLevels'
import { AuthContext } from '../../auth/AuthContext'
import type { PosStaffLevelApiDto } from '../../types/repositories'

export function usePosStaffLevels({ enabled = true }: { enabled?: boolean } = {}) {
  const auth = useContext(AuthContext)
  const isOwner = auth?.status === 'authenticated' && auth?.session?.role === 'owner'
  return useQuery<PosStaffLevelApiDto[]>({
    queryKey: qk.merchantPosStaffLevels(),
    queryFn: () => posStaffLevelsRepository.getPosStaffLevels(),
    enabled: enabled && isOwner,
    retry: false,
  })
}

export function useCreatePosStaffLevel() {
  const queryClient = useQueryClient()
  return useMutation<string, Error, string>({
    mutationFn: (name) => posStaffLevelsRepository.createPosStaffLevel(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.merchantPosStaffLevels() })
    },
  })
}

export function useUpdatePosStaffLevel() {
  const queryClient = useQueryClient()
  return useMutation<boolean, Error, { staffLevelId: string; name: string }>({
    mutationFn: ({ staffLevelId, name }) => posStaffLevelsRepository.updatePosStaffLevel(staffLevelId, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.merchantPosStaffLevels() })
    },
  })
}

export function useDeletePosStaffLevel() {
  const queryClient = useQueryClient()
  return useMutation<boolean, Error, string>({
    mutationFn: (staffLevelId) => posStaffLevelsRepository.deletePosStaffLevel(staffLevelId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.merchantPosStaffLevels() })
    },
  })
}
