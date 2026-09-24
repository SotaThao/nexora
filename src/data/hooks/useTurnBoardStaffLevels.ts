import { useQueries } from '@tanstack/react-query'
import { useSessionRole } from '../../auth/useSessionRole'
import type { TimeClockRosterRowApiDto } from '../../types/repositories'
import { qk } from '../queryKeys'
import posStaffProfileRepository from '../repositories/posStaffProfile'

/** Supplement the on-shift check-in list without calling owner-only APIs as staff. */
export function useTurnBoardStaffLevels(
  rows: readonly Pick<TimeClockRosterRowApiDto, 'posStaffProfileId' | 'businessStaffLinkId'>[],
  enabled: boolean,
) {
  const { isOwner } = useSessionRole()
  const queries = useQueries({
    queries: rows.map(row => ({
      queryKey: qk.merchantPosStaffProfile(row.businessStaffLinkId),
      queryFn: () => posStaffProfileRepository.getStaffPosProfile(row.businessStaffLinkId),
      enabled: enabled && isOwner && Boolean(row.businessStaffLinkId),
      staleTime: 60_000,
      retry: false,
    })),
  })
  return new Map(rows.map((row, index) => [
    row.posStaffProfileId,
    isOwner ? queries[index].data?.staffLevelName : undefined,
  ]))
}
