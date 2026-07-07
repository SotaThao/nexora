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
