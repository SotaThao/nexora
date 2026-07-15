/**
 * TanStack Query hooks for POS Owner Setup: Roles & Permissions (US-015).
 */
import { useContext } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { qk } from '../queryKeys'
import posRolesRepository from '../repositories/posRoles'
import { AuthContext } from '../../auth/AuthContext'
import type { PosRoleApiDto } from '../../types/repositories'

export function usePosRoles() {
  const auth = useContext(AuthContext)
  const isOwner = auth?.status === 'authenticated' && auth?.session?.role === 'owner'
  return useQuery<PosRoleApiDto[]>({
    queryKey: qk.merchantPosRoles(),
    queryFn: () => posRolesRepository.getPosRoles(),
    enabled: isOwner,
    retry: false,
  })
}

export function useCreatePosRole() {
  const queryClient = useQueryClient()
  return useMutation<string, Error, string>({
    mutationFn: (name) => posRolesRepository.createPosRole(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.merchantPosRoles() })
    },
  })
}

export function useUpdateRolePermissions() {
  const queryClient = useQueryClient()
  return useMutation<boolean, Error, { roleId: string; permissionDefinitionIds: string[] }>({
    mutationFn: ({ roleId, permissionDefinitionIds }) =>
      posRolesRepository.updateRolePermissions(roleId, permissionDefinitionIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.merchantPosRoles() })
    },
  })
}

export function useDeletePosRole() {
  const queryClient = useQueryClient()
  return useMutation<boolean, Error, string>({
    mutationFn: (roleId) => posRolesRepository.deletePosRole(roleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.merchantPosRoles() })
    },
  })
}
