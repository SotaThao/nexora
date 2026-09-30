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
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AuthContext } from '../../auth/AuthContext'
import { tokenStore } from '../../auth/tokenStore'
import { qk } from '../queryKeys'
import publicOneQrRepository, { resolveOneQrBookAiUrl } from '../repositories/publicOneQr'
import { ONEQR_ROUTE, OneQrAudience } from '../../constants/oneQr'
import type { OneQrLanding } from '../../types/oneQr'

const BOOKING_LINK_STALE_TIME = 60_000

function hasStoredAccessToken(): boolean {
  return Boolean(tokenStore.get()?.accessToken)
}

export function usePublicOneQrLanding({
  businessSlug,
  sessionId,
  viewAs,
  enabled = true,
  customerOnly = false,
}: {
  businessSlug?: string | null
  sessionId: string
  /** Raw `?as=` value from the URL; the backend validates it. */
  viewAs?: string | null
  enabled?: boolean
  customerOnly?: boolean
}) {
  const auth = useContext(AuthContext)
  const authStatus = customerOnly ? 'anonymous' : auth?.status ?? 'loading'
  const authReady = authStatus !== 'loading'
  const slug = businessSlug?.trim() ?? ''
  const resolvedViewAs = customerOnly ? ONEQR_ROUTE.asCustomerValue : viewAs

  return useQuery<OneQrLanding | null>({
    queryKey: qk.publicOneQrLanding(slug, sessionId, authStatus, resolvedViewAs),
    queryFn: () =>
      publicOneQrRepository.getLanding({
        businessSlug: slug,
        sessionId,
        viewAs: resolvedViewAs,
        anonymous: customerOnly || !hasStoredAccessToken(),
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

/** Resolve the customer's configured Book AI destination without inventing a tenant slug. */
export function usePublicOneQrBookingLink(businessSlug?: string) {
  const slug = businessSlug?.trim() ?? ''
  const queryClient = useQueryClient()
  const cached = queryClient.getQueryCache().findAll({ queryKey: qk.publicOneQrLanding(slug).slice(0, 2) })
    .filter(query => (query.state.data as OneQrLanding | null)?.audience === OneQrAudience.Customer
      && Date.now() - query.state.dataUpdatedAt < BOOKING_LINK_STALE_TIME)
    .sort((left, right) => right.state.dataUpdatedAt - left.state.dataUpdatedAt)[0]

  const query = useQuery({
    queryKey: qk.publicOneQrLanding(slug, '', 'anonymous', ONEQR_ROUTE.asCustomerValue),
    queryFn: () => publicOneQrRepository.getLanding({
      businessSlug: slug, sessionId: '', viewAs: ONEQR_ROUTE.asCustomerValue, anonymous: true,
    }),
    select: resolveOneQrBookAiUrl,
    initialData: cached?.state.data as OneQrLanding | undefined,
    initialDataUpdatedAt: cached?.state.dataUpdatedAt,
    enabled: Boolean(slug),
    staleTime: BOOKING_LINK_STALE_TIME,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  })

  // A newer OneQR visit may update Book AI after this menu query was cached.
  return cached && cached.state.dataUpdatedAt > query.dataUpdatedAt
    ? { ...query, data: resolveOneQrBookAiUrl(cached.state.data as OneQrLanding) }
    : query
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
