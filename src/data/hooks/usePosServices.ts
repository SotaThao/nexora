/**
 * TanStack Query hooks for POS Owner Setup: Services (US-017).
 */
import { useContext } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { qk } from '../queryKeys'
import posServicesRepository, { type PosServiceInput, type ServiceOrderItem } from '../repositories/posServices'
import { AuthContext } from '../../auth/AuthContext'
import type {
  PosServiceApiDto,
  ServiceAddOnApiDto,
  ServiceAddOnCopySourceApiDto,
  ServiceAddOnInput,
  UpdateServiceAddOnInput,
} from '../../types/repositories'

export function usePosServices() {
  const auth = useContext(AuthContext)
  const isOwner = auth?.status === 'authenticated' && auth?.session?.role === 'owner'
  return useQuery<PosServiceApiDto[]>({
    queryKey: qk.merchantPosServices(),
    queryFn: () => posServicesRepository.getPosServices(),
    enabled: isOwner,
    retry: false,
  })
}

export function useCreatePosService() {
  const queryClient = useQueryClient()
  return useMutation<string, Error, PosServiceInput>({
    mutationFn: (input) => posServicesRepository.createPosService(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.merchantPosServices() })
      queryClient.invalidateQueries({ queryKey: qk.merchantPosTags() })
    },
  })
}

export function useUpdatePosService() {
  const queryClient = useQueryClient()
  return useMutation<boolean, Error, { serviceId: string; input: PosServiceInput }>({
    mutationFn: ({ serviceId, input }) => posServicesRepository.updatePosService(serviceId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.merchantPosServices() })
      queryClient.invalidateQueries({ queryKey: qk.merchantPosTags() })
    },
  })
}

export function useReorderPosServices() {
  const queryClient = useQueryClient()
  return useMutation<void, Error, ServiceOrderItem[], { previous?: PosServiceApiDto[] }>({
    mutationFn: (items) => posServicesRepository.reorderPosServices(items),
    onMutate: async (items) => {
      await queryClient.cancelQueries({ queryKey: qk.merchantPosServices() })
      const previous = queryClient.getQueryData<PosServiceApiDto[]>(qk.merchantPosServices())
      if (previous) {
        const orderMap = new Map(items.map((i) => [i.serviceId, i.sortOrder]))
        const next = [...previous].sort(
          (a, b) => (orderMap.get(a.id) ?? a.displayOrder) - (orderMap.get(b.id) ?? b.displayOrder),
        )
        queryClient.setQueryData<PosServiceApiDto[]>(
          qk.merchantPosServices(),
          next.map((s) => ({ ...s, displayOrder: orderMap.get(s.id) ?? s.displayOrder })),
        )
      }
      return { previous }
    },
    onError: (_err, _items, context) => {
      if (context?.previous) {
        queryClient.setQueryData(qk.merchantPosServices(), context.previous)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: qk.merchantPosServices() })
    },
  })
}

// Add-Ons — owned by one service, never shared. Every hook below is keyed by that service so
// editing one service's list can never invalidate another's.
export function useServiceAddOns(serviceId?: string) {
  const auth = useContext(AuthContext)
  const isOwner = auth?.status === 'authenticated' && auth?.session?.role === 'owner'
  return useQuery<ServiceAddOnApiDto[]>({
    queryKey: qk.merchantPosServiceAddOns(serviceId),
    queryFn: () => posServicesRepository.getServiceAddOns(serviceId as string),
    enabled: isOwner && Boolean(serviceId),
    retry: false,
  })
}

// Lists only the services that own at least one add-on — the picker must never offer a service
// whose copy could only ever report "0 copied".
export function useServiceAddOnCopySources(serviceId?: string) {
  const auth = useContext(AuthContext)
  const isOwner = auth?.status === 'authenticated' && auth?.session?.role === 'owner'
  return useQuery<ServiceAddOnCopySourceApiDto[]>({
    queryKey: qk.merchantPosServiceAddOnCopySources(serviceId),
    queryFn: () => posServicesRepository.getServiceAddOnCopySources(serviceId as string),
    enabled: isOwner && Boolean(serviceId),
    retry: false,
  })
}

export function useCreateServiceAddOn() {
  const queryClient = useQueryClient()
  return useMutation<string, Error, { serviceId: string; input: ServiceAddOnInput }>({
    mutationFn: ({ serviceId, input }) => posServicesRepository.createServiceAddOn(serviceId, input),
    onSuccess: (_result, { serviceId }) => {
      queryClient.invalidateQueries({ queryKey: qk.merchantPosServiceAddOns(serviceId) })
      queryClient.invalidateQueries({ queryKey: qk.merchantPosServiceAddOnCopySourcesRoot() })
    },
  })
}

export function useUpdateServiceAddOn() {
  const queryClient = useQueryClient()
  return useMutation<boolean, Error, { serviceId: string; addOnId: string; input: UpdateServiceAddOnInput }>({
    mutationFn: ({ serviceId, addOnId, input }) =>
      posServicesRepository.updateServiceAddOn(serviceId, addOnId, input),
    onSuccess: (_result, { serviceId }) => {
      queryClient.invalidateQueries({ queryKey: qk.merchantPosServiceAddOns(serviceId) })
    },
  })
}

export function useDeleteServiceAddOn() {
  const queryClient = useQueryClient()
  return useMutation<boolean, Error, { serviceId: string; addOnId: string }>({
    mutationFn: ({ serviceId, addOnId }) => posServicesRepository.deleteServiceAddOn(serviceId, addOnId),
    onSuccess: (_result, { serviceId }) => {
      queryClient.invalidateQueries({ queryKey: qk.merchantPosServiceAddOns(serviceId) })
      queryClient.invalidateQueries({ queryKey: qk.merchantPosServiceAddOnCopySourcesRoot() })
    },
  })
}

// Returns how many rows were actually copied — names already present on the target are skipped.
export function useCopyServiceAddOns() {
  const queryClient = useQueryClient()
  return useMutation<number, Error, { serviceId: string; sourceServiceId: string }>({
    mutationFn: ({ serviceId, sourceServiceId }) =>
      posServicesRepository.copyServiceAddOns(serviceId, sourceServiceId),
    onSuccess: (_result, { serviceId }) => {
      queryClient.invalidateQueries({ queryKey: qk.merchantPosServiceAddOns(serviceId) })
      queryClient.invalidateQueries({ queryKey: qk.merchantPosServiceAddOnCopySourcesRoot() })
    },
  })
}
