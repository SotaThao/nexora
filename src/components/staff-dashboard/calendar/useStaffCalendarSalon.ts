import { useMemo } from 'react'
import { useStaffBookingCalendar } from '../../../data/hooks/useStaffWorkOrders'
import { useStaffBusinesses } from '../../../data/hooks/useStaffSelf'
import { formatDateIsoInTimeZone } from '../../../utils/localDate'
import type { WorkOrderSalon } from '../work-orders/constants'
import { toWorkOrderSalons } from '../work-orders/workOrderTickets'

/**
 * My Calendar sits in the top-level staff nav with no salon step of its own, but the API is
 * per-salon. Resolve it from the technician's own links: the `?salon=` one when the URL names
 * it, otherwise the only salon they work at. Shares the cached businesses query with the rest
 * of the staff shell, so this costs no extra request.
 */
export function useStaffCalendarSalon(requestedSalonId?: string) {
  const businessesQuery = useStaffBusinesses()

  const salons = useMemo<WorkOrderSalon[]>(
    () => toWorkOrderSalons(businessesQuery.data),
    [businessesQuery.data],
  )

  const salon = useMemo<WorkOrderSalon | undefined>(
    () => salons.find((item) => item.id === requestedSalonId) ?? salons[0],
    [salons, requestedSalonId],
  )

  // The day boundary that matters is the salon's, not the technician's browser — a US salon's
  // "today" is already tomorrow in VN.
  const todayKey = useMemo(
    () => (salon ? formatDateIsoInTimeZone(new Date(), salon.timeZone) : ''),
    [salon],
  )

  return {
    salons,
    salon,
    todayKey,
    isPending: businessesQuery.isPending,
    isError: businessesQuery.isError,
    refetch: businessesQuery.refetch,
  }
}

/**
 * Badge on the sidebar's My Calendar item: how many appointments the technician has left
 * today at their default salon. Shares both queries with the calendar screen itself.
 */
export function useStaffCalendarTodayCount(): number {
  const { salon, todayKey } = useStaffCalendarSalon()
  const calendarQuery = useStaffBookingCalendar(salon?.id, todayKey)
  return calendarQuery.data?.appointmentCount ?? 0
}
