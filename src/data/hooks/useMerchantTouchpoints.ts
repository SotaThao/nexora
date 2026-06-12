import { useContext } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { qk } from '../queryKeys'
import merchantTouchpointsRepository from '../repositories/merchantTouchpoints'
import { AuthContext } from '../../auth/AuthProvider'

/**
 * Hook to fetch merchant touchpoints (flat array, no pagination)
 */
export function useTouchpoints() {
  const auth = useContext(AuthContext)
  const isOwner = auth?.status === 'authenticated' && auth?.session?.role === 'owner'

  return useQuery({
    queryKey: qk.merchantTouchpoints(),
    queryFn: () => merchantTouchpointsRepository.getTouchpoints(),
    enabled: isOwner,
  })
}

/**
 * Hook to create a touchpoint
 */
export function useCreateTouchpoint() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (dto) => merchantTouchpointsRepository.createTouchpoint(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.merchantTouchpoints() })
      // Since Dashboard might use touchpoint counts, invalidate overview
      queryClient.invalidateQueries({ queryKey: qk.dashboardOverview() })
      queryClient.invalidateQueries({ queryKey: qk.merchantSetup() })
    },
  })
}

/**
 * Hook to delete a touchpoint
 */
export function useDeleteTouchpoint() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id) => merchantTouchpointsRepository.deleteTouchpoint(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.merchantTouchpoints() })
      queryClient.invalidateQueries({ queryKey: qk.dashboardOverview() })
      queryClient.invalidateQueries({ queryKey: qk.merchantSetup() })
    },
  })
}

/**
 * Hook to download a touchpoint QR code
 */
export function useDownloadTouchpointQr() {
  return useMutation<Blob, Error, { id: string; format: string }>({
    mutationFn: ({ id, format }) => merchantTouchpointsRepository.downloadQr(id, format),
    onSuccess: (blob, { format }) => {
      // Create a temporary URL for the blob and trigger download
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `qr-code.${format}`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    }
  })
}
