import { useMemo } from 'react'
import { useQueries, useQuery } from '@tanstack/react-query'
import { useSessionRole } from '../../auth/useSessionRole'
import type { StaffBusinessLink } from '../../types/domain'
import { resolveStaffBusinessLinkStatusLabel, STAFF_BUSINESS_LINK_STATUS } from '../../utils/staffBusinessLinkStatus'
import { qk } from '../queryKeys'
import posTimeClockRepository from '../repositories/posTimeClock'
import staffSelfRepository from '../repositories/staffSelf'

export function useStaffClockedInSalons(businesses: StaffBusinessLink[]): ReadonlySet<string> {
  const { isStaff } = useSessionRole()
  const activeBusinessIds = new Set(businesses
    .filter(business => resolveStaffBusinessLinkStatusLabel(business).toLowerCase() === STAFF_BUSINESS_LINK_STATUS.active)
    .map(business => business.businessId))
  const links = useQuery({
    queryKey: qk.staffActiveBusinessLinks(),
    queryFn: () => staffSelfRepository.listActiveBusinessLinks(),
    enabled: isStaff && activeBusinessIds.size > 0,
    retry: false,
  })
  const clockedInIds = useQueries({
    queries: (links.data ?? [])
      .filter(link => Boolean(link.id) && activeBusinessIds.has(link.businessId))
      .map(link => ({
        queryKey: qk.staffClockStatus(link.businessId, link.id),
        queryFn: async () => ({
          businessId: link.businessId,
          ...await posTimeClockRepository.getStaffClockStatus(link.id),
        }),
        enabled: isStaff,
        retry: false,
      })),
    combine: statuses => statuses.flatMap(status => (
      status.data?.isClockedIn ? [status.data.businessId] : []
    )),
  })

  // A failed or unavailable clock lookup must not hide the salon list or imply clock-in.
  return useMemo(() => new Set(isStaff ? clockedInIds : []), [isStaff, clockedInIds])
}
