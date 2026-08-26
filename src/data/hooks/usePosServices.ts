/**
 * TanStack Query hooks for POS Owner Setup: Services (US-017).
 */
import { useContext } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { qk } from '../queryKeys'
import posServicesRepository, { type PosServiceInput, type ServiceOrderItem } from '../repositories/posServices'
import { AuthContext } from '../../auth/AuthContext'
import type { PosServiceApiDto } from '../../types/repositories'

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

export function useDeletePosService() {
  const queryClient = useQueryClient()
  return useMutation<boolean, Error, string>({
    mutationFn: (serviceId) => posServicesRepository.deletePosService(serviceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.merchantPosServices() })
    },
  })
}
