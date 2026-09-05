/**
 * Merchant OneQR data hooks.
 *
 * Flow 1 of the business doc says the OneQR is created automatically the first
 * time the owner opens the tab — and it is, but on the **server**:
 * `GET /api/v1/merchant/oneqr` is get-or-create and the API exposes no POST.
 * So there is no client-side create step; a successful GET always yields a
 * seeded record.
 */

import { useContext } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { qk } from '../queryKeys'
import merchantOneQrRepository, {
  buildOneQrFallbackCatalog,
} from '../repositories/merchantOneQr'
import { AuthContext } from '../../auth/AuthContext'
import { useNotification } from '../../contexts/NotificationContext'
import { useTranslation } from '../../contexts/LanguageContext'
import { getApiErrorCode } from '../../types/domain'
import { getErrorI18nKey } from '../errorCodes'
import type {
  OneQr,
  OneQrModuleCatalogItem,
  SaveOneQrModulesVars,
  SaveOneQrRoleConfigVars,
} from '../../types/oneQr'

function useIsOwner(): boolean {
  const auth = useContext(AuthContext)
  return auth?.status === 'authenticated' && auth?.session?.role === 'owner'
}

function useOneQrErrorToast() {
  const { showToast } = useNotification()
  const { t } = useTranslation()
  return (err: unknown) => {
    showToast(t(getErrorI18nKey(getApiErrorCode(err, 'unknown_error'))), 'error')
  }
}

export function useOneQr({ enabled = true }: { enabled?: boolean } = {}) {
  const isOwner = useIsOwner()

  return useQuery<OneQr | null>({
    queryKey: qk.merchantOneQr(),
    queryFn: () => merchantOneQrRepository.getOneQr(),
    enabled: isOwner && enabled,
    refetchOnMount: true,
  })
}

/**
 * Static registry data — labels, icons and which audiences may use each module
 * key. The repository merges it over the bundled defaults, so `data` is a
 * complete catalog even before the endpoint ships; callers never need their own
 * fallback. `placeholderData` means the picker is populated on first paint
 * instead of flashing empty while the request is in flight.
 */
export function useOneQrModuleCatalog({ enabled = true }: { enabled?: boolean } = {}) {
  const isOwner = useIsOwner()

  return useQuery<OneQrModuleCatalogItem[]>({
    queryKey: qk.merchantOneQrModuleCatalog(),
    queryFn: () => merchantOneQrRepository.getModuleCatalog(),
    enabled: isOwner && enabled,
    placeholderData: buildOneQrFallbackCatalog,
    // A missing/broken registry must not stall the builder behind three
    // backoff retries — the bundled catalog is already a valid answer.
    retry: false,
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    refetchOnWindowFocus: false,
  })
}

export function useUpdateOneQrName() {
  const queryClient = useQueryClient()
  const showError = useOneQrErrorToast()

  return useMutation<void, Error, string>({
    mutationFn: (name) => merchantOneQrRepository.updateOneQrName(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.merchantOneQr() })
    },
    onError: showError,
  })
}

export function useSaveOneQrRoleConfig() {
  const queryClient = useQueryClient()
  const showError = useOneQrErrorToast()

  return useMutation<void, Error, SaveOneQrRoleConfigVars>({
    mutationFn: (vars) => merchantOneQrRepository.saveRoleConfig(vars),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.merchantOneQr() })
    },
    onError: showError,
  })
}

export function useSaveOneQrModules() {
  const queryClient = useQueryClient()
  const showError = useOneQrErrorToast()

  return useMutation<void, Error, SaveOneQrModulesVars>({
    mutationFn: (vars) => merchantOneQrRepository.saveModules(vars),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.merchantOneQr() })
    },
    onError: showError,
  })
}

/** Snapshot handed from `onMutate` to `onError` for the optimistic rollback. */
type ToggleOneQrContext = { previous: OneQr | null | undefined }

export function useToggleOneQr() {
  const queryClient = useQueryClient()
  const { showToast } = useNotification()
  const { t } = useTranslation()
  const showError = useOneQrErrorToast()

  return useMutation<boolean | null, Error, void, ToggleOneQrContext>({
    mutationFn: () => merchantOneQrRepository.toggleOneQr(),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: qk.merchantOneQr() })
      const previous = queryClient.getQueryData<OneQr | null>(qk.merchantOneQr())
      if (previous) {
        queryClient.setQueryData<OneQr>(qk.merchantOneQr(), {
          ...previous,
          isActive: !previous.isActive,
        })
      }
      return { previous }
    },
    onSuccess: (isActive) => {
      // `ToggleOneQrResponseDto` reports the resulting state; fall back to the
      // optimistic cache value only if the body was empty.
      const resolved =
        isActive ??
        queryClient.getQueryData<OneQr | null>(qk.merchantOneQr())?.isActive
      if (isActive !== null && isActive !== undefined) {
        queryClient.setQueryData<OneQr | null>(qk.merchantOneQr(), (current) =>
          current ? { ...current, isActive } : current,
        )
      }
      showToast(
        t(resolved ? 'oneqr.toast.resumed' : 'oneqr.toast.paused'),
        'success',
      )
    },
    onError: (err, _vars, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(qk.merchantOneQr(), context.previous)
      }
      showError(err)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: qk.merchantOneQr() })
    },
  })
}

export function useDeleteOneQr() {
  const queryClient = useQueryClient()
  const showError = useOneQrErrorToast()

  return useMutation<void, Error, void>({
    mutationFn: () => merchantOneQrRepository.deleteOneQr(),
    onSuccess: () => {
      queryClient.setQueryData(qk.merchantOneQr(), null)
      queryClient.invalidateQueries({ queryKey: qk.merchantOneQr() })
      // A deleted OneQR unlinks every physical card pointing at it.
      queryClient.invalidateQueries({ queryKey: qk.merchantPhysicalCards() })
    },
    onError: showError,
  })
}
