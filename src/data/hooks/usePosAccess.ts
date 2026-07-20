/**
 * TanStack Query hook for POS Merchant Ops: Front Desk access self-check (US-12).
 * Usable by both Owner and Staff sessions — the "Operations" permission check
 * lives entirely server-side, this hook just surfaces the result for FE show/hide.
 */
import { useQuery } from '@tanstack/react-query'
import { qk } from '../queryKeys'
import { useSessionRole } from '../../auth/useSessionRole'
import posAccessRepository from '../repositories/posAccess'
import type { PosAccessApiDto } from '../../types/repositories'

export function usePosAccess(businessId?: string) {
  const { isAuthenticated } = useSessionRole()
  return useQuery<PosAccessApiDto>({
    queryKey: qk.merchantPosAccess(businessId),
    queryFn: () => posAccessRepository.getMyPosAccess(businessId as string),
    enabled: isAuthenticated && Boolean(businessId),
    retry: false,
  })
}
