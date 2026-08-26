/**
 * TanStack Query hooks for POS Owner Setup: Categories (US-016).
 */
import { useContext } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { qk } from '../queryKeys'
import posCategoriesRepository, { type CategoryOrderItem } from '../repositories/posCategories'
import { AuthContext } from '../../auth/AuthContext'
import type { PosCategoryApiDto } from '../../types/repositories'

export function usePosCategories() {
  const auth = useContext(AuthContext)
  const isOwner = auth?.status === 'authenticated' && auth?.session?.role === 'owner'
  return useQuery<PosCategoryApiDto[]>({
    queryKey: qk.merchantPosCategories(),
    queryFn: () => posCategoriesRepository.getPosCategories(),
    enabled: isOwner,
    retry: false,
  })
}

export function useCreatePosCategory() {
  const queryClient = useQueryClient()
  return useMutation<string, Error, string>({
    mutationFn: (name) => posCategoriesRepository.createPosCategory(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.merchantPosCategories() })
    },
  })
}

export function useUpdatePosCategory() {
  const queryClient = useQueryClient()
  return useMutation<boolean, Error, { categoryId: string; name: string }>({
    mutationFn: ({ categoryId, name }) => posCategoriesRepository.updatePosCategory(categoryId, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.merchantPosCategories() })
    },
  })
}

export function useReorderPosCategories() {
  const queryClient = useQueryClient()
  return useMutation<void, Error, CategoryOrderItem[], { previous?: PosCategoryApiDto[] }>({
    mutationFn: (items) => posCategoriesRepository.reorderPosCategories(items),
    onMutate: async (items) => {
      await queryClient.cancelQueries({ queryKey: qk.merchantPosCategories() })
      const previous = queryClient.getQueryData<PosCategoryApiDto[]>(qk.merchantPosCategories())
      if (previous) {
        const orderMap = new Map(items.map((i) => [i.categoryId, i.sortOrder]))
        const next = [...previous].sort(
          (a, b) => (orderMap.get(a.id) ?? a.displayOrder) - (orderMap.get(b.id) ?? b.displayOrder),
        )
        queryClient.setQueryData<PosCategoryApiDto[]>(
          qk.merchantPosCategories(),
          next.map((c) => ({ ...c, displayOrder: orderMap.get(c.id) ?? c.displayOrder })),
        )
      }
      return { previous }
    },
    onError: (_err, _items, context) => {
      if (context?.previous) {
        queryClient.setQueryData(qk.merchantPosCategories(), context.previous)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: qk.merchantPosCategories() })
    },
  })
}

export function useDeletePosCategory() {
  const queryClient = useQueryClient()
  return useMutation<boolean, Error, string>({
    mutationFn: (categoryId) => posCategoriesRepository.deletePosCategory(categoryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.merchantPosCategories() })
    },
  })
}
