/**
 * TanStack Query hooks for POS Owner Setup: Staff Profile (US-019).
 */
import { useContext } from 'react'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { qk } from '../queryKeys'
import posStaffProfileRepository, { type SaveStaffPosProfileParams } from '../repositories/posStaffProfile'
import { AuthContext } from '../../auth/AuthContext'
import type { PosStaffProfileApiDto, StaffWeeklyScheduleDayApiDto } from '../../types/repositories'

export function useStaffPosProfile(businessStaffLinkId: string | undefined) {
  const auth = useContext(AuthContext)
  const isOwner = auth?.status === 'authenticated' && auth?.session?.role === 'owner'
  return useQuery<PosStaffProfileApiDto>({
    queryKey: qk.merchantPosStaffProfile(businessStaffLinkId),
    queryFn: () => posStaffProfileRepository.getStaffPosProfile(businessStaffLinkId as string),
    enabled: isOwner && !!businessStaffLinkId,
    retry: false,
    // Keep the previously-selected staff's profile rendered while the newly selected
    // staff's data fetches, instead of collapsing the two-card detail panel down to a
    // skeleton on every click — that collapse/expand was the reported UI jank.
    placeholderData: keepPreviousData,
  })
}

export function useSaveStaffPosProfile() {
  const queryClient = useQueryClient()
  return useMutation<boolean, Error, SaveStaffPosProfileParams>({
    mutationFn: (params) => posStaffProfileRepository.saveStaffPosProfile(params),
    onSuccess: (_, params) => {
      queryClient.invalidateQueries({ queryKey: qk.merchantPosStaffProfile(params.businessStaffLinkId) })
    },
  })
}

export function useUpdateStaffPosContractType() {
  const queryClient = useQueryClient()
  return useMutation<void, Error, { businessStaffLinkId: string; contractType: string }>({
    mutationFn: ({ businessStaffLinkId, contractType }) =>
      posStaffProfileRepository.updateContractType(businessStaffLinkId, contractType),
    onSuccess: (_, { businessStaffLinkId }) => {
      queryClient.invalidateQueries({ queryKey: qk.merchantPosStaffProfile(businessStaffLinkId) })
    },
  })
}

export function useStaffServiceAssignments(businessStaffLinkId: string | undefined) {
  const auth = useContext(AuthContext)
  const isOwner = auth?.status === 'authenticated' && auth?.session?.role === 'owner'
  return useQuery<string[]>({
    queryKey: qk.merchantPosStaffServiceAssignments(businessStaffLinkId),
    queryFn: () => posStaffProfileRepository.getStaffServiceAssignments(businessStaffLinkId as string),
    enabled: isOwner && !!businessStaffLinkId,
    retry: false,
    // Same jank-avoidance as useStaffPosProfile — keep the previous staff's checklist
    // rendered while the newly selected staff's assignments fetch.
    placeholderData: keepPreviousData,
  })
}

export function useSaveStaffServiceAssignments() {
  const queryClient = useQueryClient()
  return useMutation<boolean, Error, { businessStaffLinkId: string; posServiceIds: string[] }>({
    mutationFn: ({ businessStaffLinkId, posServiceIds }) =>
      posStaffProfileRepository.saveStaffServiceAssignments(businessStaffLinkId, posServiceIds),
    onSuccess: (_, { businessStaffLinkId }) => {
      queryClient.invalidateQueries({ queryKey: qk.merchantPosStaffServiceAssignments(businessStaffLinkId) })
    },
  })
}

export function useStaffWeeklySchedule(businessStaffLinkId: string | undefined) {
  const auth = useContext(AuthContext)
  const isOwner = auth?.status === 'authenticated' && auth?.session?.role === 'owner'
  return useQuery<StaffWeeklyScheduleDayApiDto[]>({
    queryKey: qk.merchantPosStaffWeeklySchedule(businessStaffLinkId),
    queryFn: () => posStaffProfileRepository.getStaffWeeklySchedule(businessStaffLinkId as string),
    enabled: isOwner && !!businessStaffLinkId,
    retry: false,
    // Same jank-avoidance as useStaffPosProfile — keep the previous staff's schedule
    // rendered while the newly selected staff's schedule fetches.
    placeholderData: keepPreviousData,
  })
}

export function useUpdateStaffWeeklySchedule() {
  const queryClient = useQueryClient()
  return useMutation<boolean, Error, { businessStaffLinkId: string; days: StaffWeeklyScheduleDayApiDto[] }>({
    mutationFn: ({ businessStaffLinkId, days }) =>
      posStaffProfileRepository.saveStaffWeeklySchedule(businessStaffLinkId, days),
    onSuccess: (_, { businessStaffLinkId }) => {
      queryClient.invalidateQueries({ queryKey: qk.merchantPosStaffWeeklySchedule(businessStaffLinkId) })
    },
  })
}
