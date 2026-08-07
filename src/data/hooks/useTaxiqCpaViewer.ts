/**
 * TanStack Query hooks for the CPA External Viewer (US-10 Phần B). Deliberately does
 * NOT call useAuth() — the token comes from the URL query string, not the JWT session.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { qk } from '../queryKeys'
import taxiqCpaViewerRepository from '../repositories/taxiqCpaViewer'
import type { AddCpaNoteParams, CpaPackage } from '../repositories/taxiqCpaViewer'

export function useCpaPackage(token: string | undefined) {
  return useQuery<CpaPackage>({
    queryKey: qk.taxiqCpaViewerPackage(token),
    queryFn: () => taxiqCpaViewerRepository.getPackage(token as string),
    enabled: !!token,
    retry: false,
  })
}

export function useAddCpaNote(token: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation<void, Error, AddCpaNoteParams>({
    mutationFn: (params) => taxiqCpaViewerRepository.addNote(params),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qk.taxiqCpaViewerPackage(token) }),
  })
}
