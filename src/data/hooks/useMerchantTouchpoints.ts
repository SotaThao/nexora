import { useContext } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { qk } from '../queryKeys'
import merchantTouchpointsRepository from '../repositories/merchantTouchpoints'
import { AuthContext } from '../../auth/AuthContext'
import type { TouchpointPage } from '../../types/domain'
import type { CreateTouchpointVars, DownloadTouchpointQrVars } from '../../types/hooks'
import type { TouchpointCreateResult } from '../../types/repositories'

interface TouchpointQueryParams {
  PageNumber?: number
  PageSize?: number
  Name?: string
}

export function useTouchpoints(
  params: TouchpointQueryParams = {},
  { enabled = true }: { enabled?: boolean } = {},
) {
  const auth = useContext(AuthContext)
  const isOwner = auth?.status === 'authenticated' && auth?.session?.role === 'owner'

  return useQuery<TouchpointPage>({
    queryKey: [...qk.merchantTouchpoints(), params],
    queryFn: () => merchantTouchpointsRepository.getTouchpoints(params),
    enabled: isOwner && enabled,
  })
}

export function useCreateTouchpoint() {
  const queryClient = useQueryClient()

  return useMutation<TouchpointCreateResult, Error, CreateTouchpointVars>({
    mutationFn: (dto) => merchantTouchpointsRepository.createTouchpoint(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.merchantTouchpoints() })
      queryClient.invalidateQueries({ queryKey: qk.dashboardOverview() })
      queryClient.invalidateQueries({ queryKey: qk.dashboardTipsChart() })
      queryClient.invalidateQueries({ queryKey: qk.merchantSetup() })
    },
  })
}

export function useDeleteTouchpoint() {
  const queryClient = useQueryClient()

  return useMutation<void, Error, string>({
    mutationFn: (id) => merchantTouchpointsRepository.deleteTouchpoint(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.merchantTouchpoints() })
      queryClient.invalidateQueries({ queryKey: qk.dashboardOverview() })
      queryClient.invalidateQueries({ queryKey: qk.dashboardTipsChart() })
      queryClient.invalidateQueries({ queryKey: qk.merchantSetup() })
    },
  })
}

export function useDownloadTouchpointQr() {
  return useMutation<Blob, Error, DownloadTouchpointQrVars>({
    mutationFn: ({ id, format = 'png' }) => merchantTouchpointsRepository.downloadQr(id, format),
    onSuccess: (blob, { format = 'png' }) => {
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `qr-code.${format}`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    },
  })
}
