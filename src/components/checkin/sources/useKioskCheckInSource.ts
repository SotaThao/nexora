// Check-in data as the tablet by the door sees it: everything under the device token, no
// businessId anywhere, no user session.
//
// Its only job is to flatten the kiosk API into the shape useCheckInSession reads. Any rule about
// what check-in does belongs in the session hook, not here.
import { useMemo } from 'react'
import {
  useCheckInSelfCheckInBooking,
  useCreateSelfCheckInOrder,
  useSelfCheckInActiveVisit,
  useSelfCheckInCatalog,
  useSelfCheckInCustomerName,
  useSelfCheckInTechnicians,
  useSelfCheckInTodaysBooking,
} from '../../../data/hooks/usePosSelfCheckIn'
import type { CheckInSourceResult } from '../types'

// The kiosk's scheduledAt is the salon's wall clock, already resolved server-side, so it is read
// as-is — running it through the browser's timezone would shift the appointment the guest agreed
// to.
function formatResolvedWallClock(scheduledAt: string): string {
  const [, time] = scheduledAt.split('T')
  if (!time) return ''
  const [hours, minutes] = time.split(':')
  const hour = Number(hours)
  const period = hour >= 12 ? 'PM' : 'AM'
  const hour12 = hour % 12 === 0 ? 12 : hour % 12
  return `${hour12}:${minutes} ${period}`
}

export default function useKioskCheckInSource(phone?: string): CheckInSourceResult {
  const catalogQuery = useSelfCheckInCatalog()
  const techniciansQuery = useSelfCheckInTechnicians()
  const customerQuery = useSelfCheckInCustomerName(phone)
  const bookingQuery = useSelfCheckInTodaysBooking(phone)
  const activeVisitQuery = useSelfCheckInActiveVisit(phone)
  const createOrder = useCreateSelfCheckInOrder()
  const checkInBooking = useCheckInSelfCheckInBooking()

  const catalog = useMemo(
    () =>
      (catalogQuery.data ?? []).map((service) => ({
        id: service.id,
        name: service.name,
        price: service.price,
        durationMinutes: service.durationMinutes,
        description: service.description,
        photoUrl: service.photoUrl,
        categories: service.categories,
      })),
    [catalogQuery.data],
  )

  const technicians = useMemo(
    () =>
      (techniciansQuery.data ?? []).map((tech) => ({
        posStaffProfileId: tech.posStaffProfileId,
        displayName: tech.displayName,
        photoUrl: tech.photoUrl,
        serviceIds: tech.serviceIds,
        isBusy: tech.isBusy,
      })),
    [techniciansQuery.data],
  )

  const booking = useMemo(() => {
    const data = bookingQuery.data
    if (!data) return null
    return {
      bookingId: data.bookingId,
      scheduledTimeLabel: formatResolvedWallClock(data.scheduledAt),
      customerName: data.customerName,
      items: data.items.map((item) => ({
        posServiceId: item.posServiceId,
        posStaffProfileId: item.posStaffProfileId,
      })),
    }
  }, [bookingQuery.data])

  return {
    catalog,
    isCatalogLoading: catalogQuery.isPending,
    technicians,
    isTechniciansLoading: techniciansQuery.isPending,
    customerName: customerQuery.data ?? null,
    booking,
    activeVisitOrderNumber: activeVisitQuery.data ?? null,
    areLookupsSettled:
      !customerQuery.isPending && !activeVisitQuery.isPending && !bookingQuery.isPending,
    submitOrder: (payload) =>
      createOrder.mutateAsync({
        customerName: payload.customerName || null,
        customerPhone: payload.customerPhone,
        items: payload.items,
      }),
    submitBooking: (payload) =>
      checkInBooking.mutateAsync({
        bookingId: payload.bookingId,
        customerName: payload.customerName || null,
        items: payload.items,
      }),
    isSubmitting: createOrder.isPending || checkInBooking.isPending,
  }
}
