import { useState, useEffect, useContext } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { qk } from '../queryKeys'
import merchantsRepository from '../repositories/merchants'
import { AuthContext } from '../../auth/AuthProvider'

export function useMerchantSetup({ enabled: callerEnabled = true } = {}) {
  const auth = useContext(AuthContext)
  // Only fetch when user is an authenticated merchant owner
  const isOwner = auth?.status === 'authenticated' && auth?.session?.role === 'owner'
  return useQuery({
    queryKey: qk.merchantSetup(),
    queryFn: () => merchantsRepository.getSetup(),
    enabled: isOwner && callerEnabled,
    retry: false,
  })
}

export function useSaveMerchantSetup() {
  const queryClient = useQueryClient()
  return useMutation({
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
  return useMutation({
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
  return useQuery({
    queryKey: qk.merchantSetup(),
    queryFn: () => merchantsRepository.getStaffList(),
    select: (data) => data ?? [],
    enabled: isOwner,
    retry: false,
  })
}

export function useSaveStaffList() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (list) => merchantsRepository.saveStaffList(list),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.merchantSetup() })
    },
  })
}

/**
 * Checks slug availability with debounced API query.
 */
export function useCheckSlug(slug) {
  const [debouncedSlug, setDebouncedSlug] = useState(slug)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSlug(slug)
    }, 500)
    return () => clearTimeout(handler)
  }, [slug])

  return useQuery({
    queryKey: ['checkSlug', debouncedSlug],
    queryFn: () => merchantsRepository.checkSlug(debouncedSlug),
    enabled: !!debouncedSlug && debouncedSlug.trim().length > 0,
    retry: false,
  })
}

export function useCreateBusiness() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (dto) => merchantsRepository.createBusiness(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.merchantSetup() })
    },
  })
}

export function useUploadLogo() {
  return useMutation({
    mutationFn: (file) => merchantsRepository.uploadLogo(file),
  })
}

export function useUpdateReviewLinks() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (dto) => merchantsRepository.updateReviewLinks(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.merchantSetup() })
    },
  })
}

export function useCompleteOnboarding() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => merchantsRepository.completeOnboarding(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.merchantSetup() })
    },
  })
}
