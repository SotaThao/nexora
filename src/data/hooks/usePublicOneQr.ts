/**
 * Public OneQR landing hooks.
 *
 * Unlike `usePublicBooking`, this endpoint is auth-*aware*: it reads a stored
 * token to resolve Staff/Owner. `authStatus` therefore belongs in the query key
 * (same reasoning as `usePublicPhysicalCardHelp`) and the query waits until
 * auth has finished restoring, otherwise a staff member would briefly see the
 * customer grid before flipping.
 */

import { useContext } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { AuthContext } from '../../auth/AuthContext'
import { tokenStore } from '../../auth/tokenStore'
import { qk } from '../queryKeys'
import publicOneQrRepository from '../repositories/publicOneQr'
import type { OneQrAudience } from '../../constants/oneQr'
import type { OneQrLanding } from '../../types/oneQr'

function hasStoredAccessToken(): boolean {
  return Boolean(tokenStore.get()?.accessToken)
}

export function usePublicOneQrLanding({
  businessSlug,
  sessionId,
  viewAs,
  enabled = true,
}: {
  businessSlug?: string | null
  sessionId: string
  /** Raw `?as=` value from the URL; the backend validates it. */
  viewAs?: string | null
  enabled?: boolean
}) {
  const auth = useContext(AuthContext)
  const authStatus = auth?.status ?? 'loading'
  const authReady = authStatus !== 'loading'
  const slug = businessSlug?.trim() ?? ''

  return useQuery<OneQrLanding | null>({
    queryKey: qk.publicOneQrLanding(slug, sessionId, authStatus, viewAs),
    queryFn: () =>
      publicOneQrRepository.getLanding({
        businessSlug: slug,
        sessionId,
        viewAs,
        anonymous: !hasStoredAccessToken(),
      }),
    enabled: enabled && Boolean(slug) && Boolean(sessionId) && authReady,
    retry: false,
  })
}

interface TrackOneQrModuleClickVars {
  businessSlug: string
  moduleKey: string
  sessionId: string
  audience: OneQrAudience
}

/**
 * Fire-and-forget. Failures are swallowed on purpose — a dropped analytics
 * beacon must never surface an error toast over a customer's tap or delay the
 * navigation that follows it.
 */
export function useTrackOneQrModuleClick() {
  return useMutation<void, Error, TrackOneQrModuleClickVars>({
    mutationFn: (vars) =>
      publicOneQrRepository.trackModuleClick({
        ...vars,
        anonymous: !hasStoredAccessToken(),
      }),
    retry: false,
    onError: () => {},
  })
}
