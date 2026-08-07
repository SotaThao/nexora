import { useState, useEffect, useContext } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { qk } from '../queryKeys'
import merchantsRepository from '../repositories/merchants'
import { AuthContext } from '../../auth/AuthContext'
import type { BusinessHourEntry, MerchantSetup } from '../../types/domain'
import type { CreateBusinessResult, ImageUploadResult, SlugCheckResult } from '../../types/repositories'

export function useMerchantSetup({ enabled: callerEnabled = true } = {}) {
  const auth = useContext(AuthContext)
  const isOwner = auth?.status === 'authenticated' && auth?.session?.role === 'owner'
  return useQuery<MerchantSetup | null>({
    queryKey: qk.merchantSetup(),
    queryFn: () => merchantsRepository.getSetup(),
    enabled: isOwner && callerEnabled,
    retry: false,
  })
}

export function useSaveMerchantSetup() {
  const queryClient = useQueryClient()
  return useMutation<void, Error, MerchantSetup>({
    mutationFn: (setup) => merchantsRepository.saveSetup(setup),
    onMutate: (setup) => {
      queryClient.setQueryData(qk.merchantSetup(), setup)
    },
    onSuccess: (_data, setup) => {
      queryClient.setQueryData(qk.merchantSetup(), setup)
      queryClient.invalidateQueries({ queryKey: qk.merchantSetup() })
    },
  })
}

export function useClearMerchantSetup() {
  const queryClient = useQueryClient()
  return useMutation<void, Error, void>({
    mutationFn: () => merchantsRepository.clearSetup(),
    onMutate: () => {
      queryClient.setQueryData(qk.merchantSetup(), null)
    },
    onSuccess: () => {
      queryClient.setQueryData(qk.merchantSetup(), null)
      queryClient.invalidateQueries({ queryKey: qk.merchantSetup() })
    },
  })
}

export function useStaffList() {
  const auth = useContext(AuthContext)
  const isOwner = auth?.status === 'authenticated' && auth?.session?.role === 'owner'
  return useQuery<MerchantSetup['staffList']>({
    queryKey: qk.merchantSetup(),
    queryFn: () => merchantsRepository.getStaffList(),
    select: (data) => data ?? [],
    enabled: isOwner,
    retry: false,
  })
}

export function useSaveStaffList() {
  const queryClient = useQueryClient()
  return useMutation<void, Error, MerchantSetup['staffList']>({
    mutationFn: (list) => merchantsRepository.saveStaffList(list),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.merchantSetup() })
    },
  })
}

export function useCheckSlug(slug: string) {
  const [debouncedSlug, setDebouncedSlug] = useState(slug)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSlug(slug)
    }, 500)
    return () => clearTimeout(handler)
  }, [slug])

  return useQuery<SlugCheckResult>({
    queryKey: ['checkSlug', debouncedSlug],
    queryFn: () => merchantsRepository.checkSlug(debouncedSlug),
    enabled: !!debouncedSlug && debouncedSlug.trim().length > 0,
    retry: false,
  })
}

export function useCreateBusiness() {
  const queryClient = useQueryClient()

  return useMutation<CreateBusinessResult, Error, LooseObject>({
    mutationFn: (dto) => merchantsRepository.createBusiness(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.merchantSetup() })
    },
  })
}

export function useUploadLogo() {
  return useMutation<string, Error, File>({
    mutationFn: (file) => merchantsRepository.uploadLogo(file),
  })
}

export function useUploadImage() {
  return useMutation<ImageUploadResult, Error, File>({
    mutationFn: (file) => merchantsRepository.uploadImage(file),
  })
}

export function useUpdateBusiness() {
  const queryClient = useQueryClient()

  return useMutation<void, Error, LooseObject>({
    mutationFn: (dto) => merchantsRepository.updateBusiness(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.merchantSetup() })
    },
  })
}

export function useUpdateBusinessLogo() {
  const queryClient = useQueryClient()

  return useMutation<string, Error, File>({
    mutationFn: (file) => merchantsRepository.updateBusinessLogo(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.merchantSetup() })
    },
  })
}

export function useUpdateBusinessInfo() {
  const queryClient = useQueryClient()

  return useMutation<
    void,
    Error,
    {
      name: string
      phone?: string
      feedbackEmail?: string
      website?: string
      bookingNotificationPhone?: string
      salesTaxRatePercent?: number
    }
  >({
    mutationFn: (dto) => merchantsRepository.updateBusinessInfo(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.merchantSetup() })
    },
  })
}

// POS Owner Setup — Business Hours (US-014)
export function useBusinessHours() {
  const auth = useContext(AuthContext)
  const isOwner = auth?.status === 'authenticated' && auth?.session?.role === 'owner'
  return useQuery<BusinessHourEntry[]>({
    queryKey: qk.merchantBusinessHours(),
    queryFn: () => merchantsRepository.getBusinessHours(),
    enabled: isOwner,
    retry: false,
  })
}

export function useUpdateBusinessHours() {
  const queryClient = useQueryClient()
  return useMutation<boolean, Error, BusinessHourEntry[]>({
    mutationFn: (days) => merchantsRepository.updateBusinessHours(days),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.merchantBusinessHours() })
    },
  })
}

export function useUpdateReviewLinks() {
  const queryClient = useQueryClient()

  return useMutation<void, Error, LooseObject>({
    mutationFn: (dto) => merchantsRepository.updateReviewLinks(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.merchantSetup() })
    },
  })
}

export function useCompleteOnboarding() {
  const queryClient = useQueryClient()

  return useMutation<void, Error, void>({
    mutationFn: () => merchantsRepository.completeOnboarding(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.merchantSetup() })
    },
  })
}
