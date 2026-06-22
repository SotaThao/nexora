import { useContext } from 'react'
import { useQuery, useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { qk } from '../queryKeys'
import merchantTouchpointsRepository from '../repositories/merchantTouchpoints'
import { AuthContext } from '../../auth/AuthContext'
import { downloadBlob } from '../../utils/downloadFile'
import { useNotification } from '../../contexts/NotificationContext'
import { useTranslation } from '../../contexts/LanguageContext'
import { getApiErrorCode } from '../../types/domain'
import { getErrorI18nKey } from '../errorCodes'
import type { TouchpointPage } from '../../types/domain'
import type { CreateTouchpointVars, DownloadTouchpointQrVars } from '../../types/hooks'
import type { TouchpointCreateResult } from '../../types/repositories'

interface TouchpointQueryParams {
  PageNumber?: number
  PageSize?: number
  Name?: string
}

function toggleTouchpointInCache(queryClient: QueryClient, id: string) {
  queryClient.setQueriesData<TouchpointPage>(
    { queryKey: qk.merchantTouchpoints() },
    (current) => {
      if (!current?.items?.length) return current
      return {
        ...current,
        items: current.items.map((item) =>
          item.id === id ? { ...item, isActive: !(item.isActive !== false) } : item,
        ),
      }
    },
  )
}

function snapshotTouchpointQueries(queryClient: QueryClient) {
  return queryClient.getQueriesData<TouchpointPage>({ queryKey: qk.merchantTouchpoints() })
}

function findTouchpointIsActive(queryClient: QueryClient, id: string): boolean | null {
  const queries = queryClient.getQueriesData<TouchpointPage>({ queryKey: qk.merchantTouchpoints() })
  for (const [, data] of queries) {
    const item = data?.items?.find((tp) => tp.id === id)
    if (item) return item.isActive !== false
  }
  return null
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

export function useToggleTouchpoint() {
  const queryClient = useQueryClient()
  const { showToast } = useNotification()
  const { t } = useTranslation()

  return useMutation<void, Error, string>({
    mutationFn: (id) => merchantTouchpointsRepository.toggleTouchpoint(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: qk.merchantTouchpoints() })
      const previousQueries = snapshotTouchpointQueries(queryClient)
      toggleTouchpointInCache(queryClient, id)
      return { previousQueries }
    },
    onSuccess: (_data, id) => {
      const isActive = findTouchpointIsActive(queryClient, id)
      showToast(
        t(isActive ? 'dashboard.touchpoints.toggle_enabled' : 'dashboard.touchpoints.toggle_disabled'),
        'success',
      )
    },
    onError: (err, _id, context) => {
      context?.previousQueries?.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data)
      })
      const i18nKey = getErrorI18nKey(getApiErrorCode(err, 'unknown_error'))
      showToast(t(i18nKey), 'error')
    },
  })
}

export function useDownloadTouchpointQr() {
  return useMutation<Blob, Error, DownloadTouchpointQrVars>({
    mutationFn: async ({ id, format = 'png' }) => {
      const blob = await merchantTouchpointsRepository.downloadQr(id, format)
      await downloadBlob(blob, `qr-code-${id}.${format}`)
      return blob
    },
  })
}
