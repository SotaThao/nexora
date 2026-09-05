// Check-in data as a customer's own phone sees it: no session, no device token, no businessId —
// just the salon's public slug out of the URL.
//
// The third twin of useKioskCheckInSource / usePosCheckInSource, and deliberately shaped to be
// indistinguishable from them so the page cannot tell which surface it is running on. The one
// genuine difference is `checkInBlockedMessage`: a booking may only convert inside its window
// here (POS-Public-Check-In-Technical.md §8.3), because a guest opening the link from home eight
// hours early would otherwise hold a queue slot all day. A guest at the kiosk or the front desk
// is already standing in the salon, so neither of those surfaces has that rule.
import { useMemo } from 'react'
import { useTranslation } from '../../../contexts/LanguageContext'
import {
  useCheckInPublicBooking,
  useCreatePublicCheckInOrder,
  usePublicCheckInActiveVisit,
  usePublicCheckInBooking,
  usePublicCheckInCustomerLookup,
  usePublicCheckInPage,
} from '../../../data/hooks/usePublicCheckIn'
import { formatBookingWallClockTime } from '../../public/checkin/publicCheckInUtils'
import type { CheckInSourceHook, CheckInSourceResult } from '../types'

// A factory, not a hook: it takes the slug the route already has and hands back the hook
// useCheckInSession will call. Running it during render is safe — it calls no hooks itself.
export default function createPublicCheckInSource(businessSlug: string): CheckInSourceHook {
  return function usePublicCheckInSource(phone?: string): CheckInSourceResult {
    const { t } = useTranslation()
    const pageQuery = usePublicCheckInPage(businessSlug)
    const customerQuery = usePublicCheckInCustomerLookup(businessSlug, phone)
    const activeVisitQuery = usePublicCheckInActiveVisit(businessSlug, phone)
    const bookingQuery = usePublicCheckInBooking(businessSlug, phone)

    const createOrder = useCreatePublicCheckInOrder(businessSlug)
    const checkInBooking = useCheckInPublicBooking(businessSlug)

    const catalog = useMemo(
      () =>
        (pageQuery.data?.services ?? []).map((service) => ({
          id: service.id,
          name: service.name,
          price: service.price,
          durationMinutes: service.durationMinutes,
          description: service.description ?? null,
          photoUrl: service.photoUrl ?? null,
          categories: service.categories,
        })),
      [pageQuery.data?.services],
    )

    const technicians = useMemo(
      () =>
        (pageQuery.data?.technicians ?? []).map((tech) => ({
          posStaffProfileId: tech.posStaffProfileId,
          displayName: tech.displayName,
          photoUrl: tech.photoUrl ?? null,
          serviceIds: tech.serviceIds,
          isBusy: tech.isBusy,
        })),
      [pageQuery.data?.technicians],
    )

    // Only a booking inside its convert window becomes the visit. Outside it the appointment is
    // deliberately not handed to the session at all — otherwise the guest would silently check in
    // as a walk-in and end up queued twice.
    const booking = useMemo(() => {
      const data = bookingQuery.data
      if (!data || !data.canCheckInNow) return null
      return {
        bookingId: data.bookingId,
        scheduledTimeLabel: formatBookingWallClockTime(data.scheduledAt),
        customerName: data.customerName,
        // The booked technician is carried by id, never re-resolved through the roster: someone
        // off schedule today is missing from it, and dropping their id would turn a booked visit
        // into an unassigned one the front desk cannot start.
        items: data.items.map((item) => ({
          posServiceId: item.posServiceId,
          posStaffProfileId: item.posStaffProfileId ?? null,
        })),
      }
    }, [bookingQuery.data])

    const earlyBooking = bookingQuery.data && !bookingQuery.data.canCheckInNow ? bookingQuery.data : null

    return {
      catalog,
      isCatalogLoading: pageQuery.isPending,
      technicians,
      isTechniciansLoading: pageQuery.isPending,
      customerName: customerQuery.data?.displayName ?? null,
      booking,
      activeVisitOrderNumber: activeVisitQuery.data?.orderNumber ?? null,
      activeVisitReceiptToken: activeVisitQuery.data?.receiptToken ?? null,
      areLookupsSettled:
        !customerQuery.isPending && !activeVisitQuery.isPending && !bookingQuery.isPending,
      checkInBlockedMessage: earlyBooking
        ? t('public.checkIn.bookingTooEarlyBlocked', {
            appointment: formatBookingWallClockTime(earlyBooking.scheduledAt),
            opensAt: formatBookingWallClockTime(earlyBooking.earliestCheckInAt),
          })
        : null,
      submitOrder: (payload) =>
        createOrder.mutateAsync({
          customerName: payload.customerName,
          customerPhone: payload.customerPhone,
          items: payload.items.map((item) => ({
            posServiceId: item.posServiceId,
            posStaffProfileId: item.posStaffProfileId ?? undefined,
            note: item.note ?? undefined,
          })),
          ...(payload.allowDuplicatePhone ? { allowDuplicatePhone: true } : {}),
        }),
      submitBooking: (payload) =>
        checkInBooking.mutateAsync({
          bookingId: payload.bookingId,
          customerName: payload.customerName,
          items: payload.items.map((item) => ({
            posServiceId: item.posServiceId,
            posStaffProfileId: item.posStaffProfileId ?? undefined,
            note: item.note ?? undefined,
          })),
        }),
      isSubmitting: createOrder.isPending || checkInBooking.isPending,
    }
  }
}
