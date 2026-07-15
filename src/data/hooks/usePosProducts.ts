/**
 * TanStack Query hooks for POS Owner Setup: Products (US-018).
 */
import { useContext } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { qk } from '../queryKeys'
import posProductsRepository, { type PosProductInput, type ProductOrderItem } from '../repositories/posProducts'
import { AuthContext } from '../../auth/AuthContext'
import type { PosProductApiDto } from '../../types/repositories'

export function usePosProducts() {
  const auth = useContext(AuthContext)
  const isOwner = auth?.status === 'authenticated' && auth?.session?.role === 'owner'
  return useQuery<PosProductApiDto[]>({
    queryKey: qk.merchantPosProducts(),
    queryFn: () => posProductsRepository.getPosProducts(),
    enabled: isOwner,
    retry: false,
  })
}

export function useCreatePosProduct() {
  const queryClient = useQueryClient()
  return useMutation<string, Error, PosProductInput>({
    mutationFn: (input) => posProductsRepository.createPosProduct(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.merchantPosProducts() })
      queryClient.invalidateQueries({ queryKey: qk.merchantPosTags() })
    },
  })
}

export function useUpdatePosProduct() {
  const queryClient = useQueryClient()
  return useMutation<boolean, Error, { productId: string; input: PosProductInput }>({
    mutationFn: ({ productId, input }) => posProductsRepository.updatePosProduct(productId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.merchantPosProducts() })
      queryClient.invalidateQueries({ queryKey: qk.merchantPosTags() })
    },
  })
}

export function useReorderPosProducts() {
  const queryClient = useQueryClient()
  return useMutation<void, Error, ProductOrderItem[], { previous?: PosProductApiDto[] }>({
    mutationFn: (items) => posProductsRepository.reorderPosProducts(items),
    onMutate: async (items) => {
      await queryClient.cancelQueries({ queryKey: qk.merchantPosProducts() })
      const previous = queryClient.getQueryData<PosProductApiDto[]>(qk.merchantPosProducts())
      if (previous) {
        const orderMap = new Map(items.map((i) => [i.productId, i.sortOrder]))
        const next = [...previous].sort(
          (a, b) => (orderMap.get(a.id) ?? a.displayOrder) - (orderMap.get(b.id) ?? b.displayOrder),
        )
        queryClient.setQueryData<PosProductApiDto[]>(
          qk.merchantPosProducts(),
          next.map((p) => ({ ...p, displayOrder: orderMap.get(p.id) ?? p.displayOrder })),
        )
      }
      return { previous }
    },
    onError: (_err, _items, context) => {
      if (context?.previous) {
        queryClient.setQueryData(qk.merchantPosProducts(), context.previous)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: qk.merchantPosProducts() })
    },
  })
}
