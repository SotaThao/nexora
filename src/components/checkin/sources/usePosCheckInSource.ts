// Check-in data as the front desk sees it: the merchant session, an explicit businessId, and the
// endpoints that already existed for the Order Workspace.
//
// The twin of useKioskCheckInSource, and deliberately shaped to be indistinguishable from it —
// the page must not be able to tell which one it is running on.
import { useMemo } from 'react'
import { useCheckoutServiceCatalog } from '../../../data/hooks/usePosCheckout'
import { useCheckInActiveVisit, useCheckInTechnicians } from '../../../data/hooks/usePosCheckIn'
import { useCheckInOrder, useCustomerLookupByPhone } from '../../../data/hooks/usePosOrders'
import { useBookingDetail, useBookingList, useCheckInBookingWithDraft } from '../../../data/hooks/usePosBooking'
import { formatBookingWallClockTime } from '../../dashboard/views/pos/booking/bookingFormatters'
import { formatLocalDateIso } from '../../../utils/localDate'
import { PosOrderStatus } from '../../../constants/posOrderStatus'
import type { CheckInSourceHook, CheckInSourceResult } from '../types'

// Compares two phone numbers regardless of formatting (national vs E.164, punctuation) by
// matching their last 10 digits — good enough for US-only POS phone entry today.
function samePhoneDigits(a: string, b: string): boolean {
  const digitsA = a.replace(/\D/g, '').slice(-10)
  const digitsB = b.replace(/\D/g, '').slice(-10)
  return digitsA.length === 10 && digitsA === digitsB
}

// A factory, not a hook: it takes the businessId the caller already has and hands back the hook
// useCheckInSession will call. Calling it during render is safe — it runs no hooks itself.
export default function createPosCheckInSource(businessId: string): CheckInSourceHook {
  return function usePosCheckInSource(phone?: string): CheckInSourceResult {
    const catalogQuery = useCheckoutServiceCatalog(businessId)
    const techniciansQuery = useCheckInTechnicians(businessId)
    const customerQuery = useCustomerLookupByPhone(businessId, phone)
    const activeVisitQuery = useCheckInActiveVisit(businessId, phone)

    // The kiosk has a single endpoint that answers "does this number have an appointment today";
    // the front desk has to find it in today's list and then load its lines.
    const todayIso = useMemo(() => formatLocalDateIso(new Date()), [])
    const bookingListQuery = useBookingList(
      businessId,
      { dateFrom: todayIso, dateTo: todayIso },
      { enabled: Boolean(phone) },
    )
    const matchedBookingId = useMemo(() => {
      if (!phone || !bookingListQuery.data?.items?.length) return null
      const eligible = bookingListQuery.data.items.filter(
        (b) =>
          b.customerPhone &&
          samePhoneDigits(b.customerPhone, phone) &&
          (b.status === PosOrderStatus.Pending || b.status === PosOrderStatus.Confirmed),
      )
      if (eligible.length === 0) return null
      return [...eligible].sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt))[0].bookingId
    }, [bookingListQuery.data, phone])
    const bookingDetailQuery = useBookingDetail(businessId, matchedBookingId ?? undefined, {
      enabled: Boolean(matchedBookingId),
    })

    const checkInOrder = useCheckInOrder(businessId)
    const checkInBooking = useCheckInBookingWithDraft(businessId)

    const catalog = useMemo(
      () =>
        (catalogQuery.data ?? []).map((service) => ({
          id: service.id,
          name: service.name,
          price: service.price,
          durationMinutes: service.durationMinutes,
          description: service.description ?? null,
          photoUrl: service.photoUrl ?? null,
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
      const detail = bookingDetailQuery.data
      if (!detail) return null
      return {
        bookingId: detail.bookingId,
        // Same resolver the Bookings tab uses — scheduledAt means different things depending on
        // which flow created the booking, and reading it naively shows the wrong hour.
        scheduledTimeLabel: formatBookingWallClockTime(detail.scheduledAt, detail.source),
        customerName: detail.customerName,
        // A booking line with no resolved service (a Voice call's free-text request) has nothing
        // to tick in the catalog, so it is dropped rather than carried as an unusable row.
        items: detail.services.flatMap((service) =>
          service.posServiceId
            ? [{ posServiceId: service.posServiceId, posStaffProfileId: service.posStaffProfileId ?? null }]
            : [],
        ),
      }
    }, [bookingDetailQuery.data])

    // The booking arm settles only once its detail has landed, otherwise the page would open as a
    // walk-in a moment before the appointment it should have converted showed up.
    const isBookingSettled = matchedBookingId
      ? !bookingDetailQuery.isPending
      : !bookingListQuery.isPending

    return {
      catalog,
      isCatalogLoading: catalogQuery.isPending,
      technicians,
      isTechniciansLoading: techniciansQuery.isPending,
      customerName: customerQuery.data?.customerName ?? null,
      booking,
      activeVisitOrderNumber: activeVisitQuery.data ?? null,
      areLookupsSettled: !customerQuery.isPending && !activeVisitQuery.isPending && isBookingSettled,
      submitOrder: (payload) =>
        checkInOrder.mutateAsync({
          customerName: payload.customerName,
          customerPhone: payload.customerPhone,
          items: payload.items.map((item) => ({
            itemType: 'Service' as const,
            id: item.posServiceId,
            posStaffProfileId: item.posStaffProfileId ?? undefined,
            note: item.note ?? undefined,
          })),
        }),
      submitBooking: (payload) =>
        checkInBooking.mutateAsync({
          bookingId: payload.bookingId,
          customerName: payload.customerName || undefined,
          items: payload.items.map((item) => ({
            itemType: 'Service' as const,
            id: item.posServiceId,
            posStaffProfileId: item.posStaffProfileId ?? undefined,
            note: item.note ?? undefined,
          })),
        }),
      isSubmitting: checkInOrder.isPending || checkInBooking.isPending,
    }
  }
}
