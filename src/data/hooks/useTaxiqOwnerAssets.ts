/**
 * TanStack Query hooks for the TaxIQ Owner Assets Tracker (US-07):
 * Equipment, Gift Card Liability, Membership Credit.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { qk } from '../queryKeys'
import taxiqOwnerAssetsRepository from '../repositories/taxiqOwnerAssets'
import type {
  CreateEquipmentAssetParams,
  CreateGiftCardLiabilityParams,
  CreateMembershipCreditParams,
  EquipmentAsset,
  GiftCardLiability,
  MembershipCredit,
  UpdateEquipmentAssetParams,
  UpdateGiftCardLiabilityParams,
  UpdateMembershipCreditParams,
} from '../repositories/taxiqOwnerAssets'

export function useTaxiqOwnerEquipment(ownerTaxYearId: string | undefined) {
  return useQuery<EquipmentAsset[]>({
    queryKey: qk.taxiqOwnerEquipment(ownerTaxYearId),
    queryFn: () => taxiqOwnerAssetsRepository.listEquipment(ownerTaxYearId as string),
    enabled: !!ownerTaxYearId,
  })
}

export function useCreateEquipmentAsset() {
  const queryClient = useQueryClient()
  return useMutation<string, Error, CreateEquipmentAssetParams>({
    mutationFn: (params) => taxiqOwnerAssetsRepository.createEquipment(params),
    onSuccess: (_, params) =>
      queryClient.invalidateQueries({ queryKey: qk.taxiqOwnerEquipment(params.ownerTaxYearId) }),
  })
}

export function useUpdateEquipmentAsset() {
  const queryClient = useQueryClient()
  return useMutation<void, Error, UpdateEquipmentAssetParams & { ownerTaxYearId: string }>({
    mutationFn: (params) => taxiqOwnerAssetsRepository.updateEquipment(params),
    onSuccess: (_, params) =>
      queryClient.invalidateQueries({ queryKey: qk.taxiqOwnerEquipment(params.ownerTaxYearId) }),
  })
}

export function useDeleteEquipmentAsset() {
  const queryClient = useQueryClient()
  return useMutation<void, Error, { id: string; ownerTaxYearId: string }>({
    mutationFn: (params) => taxiqOwnerAssetsRepository.deleteEquipment(params.id),
    onSuccess: (_, params) =>
      queryClient.invalidateQueries({ queryKey: qk.taxiqOwnerEquipment(params.ownerTaxYearId) }),
  })
}

export function useTaxiqOwnerGiftCardLiabilities(ownerTaxYearId: string | undefined) {
  return useQuery<GiftCardLiability[]>({
    queryKey: qk.taxiqOwnerGiftCardLiabilities(ownerTaxYearId),
    queryFn: () => taxiqOwnerAssetsRepository.listGiftCardLiabilities(ownerTaxYearId as string),
    enabled: !!ownerTaxYearId,
  })
}

export function useCreateGiftCardLiability() {
  const queryClient = useQueryClient()
  return useMutation<string, Error, CreateGiftCardLiabilityParams>({
    mutationFn: (params) => taxiqOwnerAssetsRepository.createGiftCardLiability(params),
    onSuccess: (_, params) =>
      queryClient.invalidateQueries({ queryKey: qk.taxiqOwnerGiftCardLiabilities(params.ownerTaxYearId) }),
  })
}

export function useUpdateGiftCardLiability() {
  const queryClient = useQueryClient()
  return useMutation<void, Error, UpdateGiftCardLiabilityParams & { ownerTaxYearId: string }>({
    mutationFn: (params) => taxiqOwnerAssetsRepository.updateGiftCardLiability(params),
    onSuccess: (_, params) =>
      queryClient.invalidateQueries({ queryKey: qk.taxiqOwnerGiftCardLiabilities(params.ownerTaxYearId) }),
  })
}

export function useDeleteGiftCardLiability() {
  const queryClient = useQueryClient()
  return useMutation<void, Error, { id: string; ownerTaxYearId: string }>({
    mutationFn: (params) => taxiqOwnerAssetsRepository.deleteGiftCardLiability(params.id),
    onSuccess: (_, params) =>
      queryClient.invalidateQueries({ queryKey: qk.taxiqOwnerGiftCardLiabilities(params.ownerTaxYearId) }),
  })
}

export function useTaxiqOwnerMembershipCredits(ownerTaxYearId: string | undefined) {
  return useQuery<MembershipCredit[]>({
    queryKey: qk.taxiqOwnerMembershipCredits(ownerTaxYearId),
    queryFn: () => taxiqOwnerAssetsRepository.listMembershipCredits(ownerTaxYearId as string),
    enabled: !!ownerTaxYearId,
  })
}

export function useCreateMembershipCredit() {
  const queryClient = useQueryClient()
  return useMutation<string, Error, CreateMembershipCreditParams>({
    mutationFn: (params) => taxiqOwnerAssetsRepository.createMembershipCredit(params),
    onSuccess: (_, params) =>
      queryClient.invalidateQueries({ queryKey: qk.taxiqOwnerMembershipCredits(params.ownerTaxYearId) }),
  })
}

export function useUpdateMembershipCredit() {
  const queryClient = useQueryClient()
  return useMutation<void, Error, UpdateMembershipCreditParams & { ownerTaxYearId: string }>({
    mutationFn: (params) => taxiqOwnerAssetsRepository.updateMembershipCredit(params),
    onSuccess: (_, params) =>
      queryClient.invalidateQueries({ queryKey: qk.taxiqOwnerMembershipCredits(params.ownerTaxYearId) }),
  })
}

export function useDeleteMembershipCredit() {
  const queryClient = useQueryClient()
  return useMutation<void, Error, { id: string; ownerTaxYearId: string }>({
    mutationFn: (params) => taxiqOwnerAssetsRepository.deleteMembershipCredit(params.id),
    onSuccess: (_, params) =>
      queryClient.invalidateQueries({ queryKey: qk.taxiqOwnerMembershipCredits(params.ownerTaxYearId) }),
  })
}
