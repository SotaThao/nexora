import { useQuery } from '@tanstack/react-query'
import { useSessionRole } from '../../../auth/useSessionRole'
import { qk } from '../../../data/queryKeys'
import staffWorkOrdersRepository from '../../../data/repositories/staffWorkOrders'
import { formatDateIsoInTimeZone } from '../../../utils/localDate'
import {
  WORK_ORDER_TICKET_FILTER,
  type WorkOrderSalon,
} from './constants'
import { resolveFallbackMyTicketsSalonId } from './myTicketsSalonPreference'
import { workOrderListHref } from './workOrderListUrl'

export type MyTicketsEntryTarget = {
  href: string
  salonId: string
  dateIso: string
}

function buildSalonTodayTarget(
  salonId: string,
  salons: readonly WorkOrderSalon[],
): MyTicketsEntryTarget {
  const salon = salons.find((item) => item.id === salonId)
  const dateIso = formatDateIsoInTimeZone(new Date(), salon?.timeZone)
  return {
    salonId,
    dateIso,
    href: workOrderListHref(salonId, dateIso, WORK_ORDER_TICKET_FILTER.Assigned),
  }
}

/**
 * Opens My Tickets on the salon that owns on-floor work (PendingAcceptance first, then
 * Assigned FIFO). When nothing needs handling, opens the nearest preferred salon + today:
 * clocked-in → last opened → first linked salon.
 */
export function useMyTicketsEntryTarget(salons: readonly WorkOrderSalon[]) {
  const { isStaff } = useSessionRole()
  const salonIds = salons.map((salon) => salon.id)

  const entryQuery = useQuery({
    queryKey: qk.staffMyTicketsEntryTarget(),
    queryFn: () => staffWorkOrdersRepository.getMyTicketsEntryTarget(),
    enabled: isStaff && salonIds.length > 0,
    retry: false,
  })

  let target: MyTicketsEntryTarget | null = null
  if (!entryQuery.isPending && salonIds.length) {
    const apiTarget = entryQuery.data
    if (!entryQuery.isError && apiTarget?.businessId && apiTarget.date) {
      target = {
        salonId: apiTarget.businessId,
        dateIso: apiTarget.date,
        href: workOrderListHref(
          apiTarget.businessId,
          apiTarget.date,
          WORK_ORDER_TICKET_FILTER.Assigned,
        ),
      }
    } else {
      const nearestSalonId = resolveFallbackMyTicketsSalonId(salonIds)
      if (nearestSalonId) {
        target = buildSalonTodayTarget(nearestSalonId, salons)
      }
    }
  }

  return {
    target,
    isPending: isStaff && salonIds.length > 0 && entryQuery.isPending,
    // Entry-target failure still falls back to nearest salon — never block the menu.
    isError: false,
    refetch: () => {
      void entryQuery.refetch()
    },
  }
}
