// All of check-in's state and its one submit, in one place that has no idea which layout is
// drawing it.
//
// That ignorance is the point. The kiosk and the front desk drifted apart three times because each
// owned its own copy of this logic behind a shared-looking shell; putting the logic here and the
// pixels in layouts/ makes "the two screens must be identical" true by construction instead of by
// review. A layout may add presentation state of its own (the wizard's step cursor is a layout
// concern), but never a rule about what check-in does.
//
// Where the data comes from is injected: the kiosk passes a hook backed by its device token, the
// front desk one backed by the merchant session. Swapping them changes nothing below.
import { useCallback, useEffect, useMemo, useState } from 'react'
import type {
  CheckInBookingPrefill,
  CheckInService,
  CheckInSourceHook,
  CheckInTechnician,
} from './types'

// phone -> lookingUp -> either activeVisit (a soft stop) or form -> done.
// The wizard's four steps all live inside 'form'.
export type CheckInPhase = 'phone' | 'lookingUp' | 'activeVisit' | 'form' | 'done'

export interface CheckInSession {
  phase: CheckInPhase

  phone: string
  submitPhone: (formattedPhone: string) => void
  // The "Change number" link — back to the keypad with the digits still there to correct.
  changePhone: () => void

  customerName: string
  setCustomerName: (next: string) => void
  // Pre-ticked and mandatory. See the spec's business rules: this was a deliberate decision taken
  // with the legal risk on the table, not an oversight.
  smsConsent: boolean
  setSmsConsent: (next: boolean) => void

  technicians: CheckInTechnician[]
  isTechniciansLoading: boolean
  preferredStaffId: string | null
  choosePreferredStaff: (posStaffProfileId: string | null) => void

  catalog: CheckInService[]
  isCatalogLoading: boolean
  selectedServiceIds: string[]
  selectedServices: CheckInService[]
  toggleService: (serviceId: string) => void
  // serviceId -> posStaffProfileId | null, seeded from the preference and overridable per line.
  technicianChoices: Record<string, string | null>
  chooseServiceTechnician: (serviceId: string, posStaffProfileId: string | null) => void

  note: string
  setNote: (next: string) => void

  totalMinutes: number
  totalPrice: number

  activeVisitOrderNumber: string | null
  continueAsNewGuest: () => void

  booking: CheckInBookingPrefill | null
  bookingTimeLabel: string | null

  canSubmit: boolean
  isSubmitting: boolean
  submitError: string | null
  submit: () => void

  orderNumber: string
  reset: () => void
}

export default function useCheckInSession({
  useSource,
  submitErrorMessage,
  onCheckedIn,
}: {
  useSource: CheckInSourceHook
  submitErrorMessage: string
  // Fired the moment the order exists, before the guest has dismissed the thank-you screen — the
  // front desk's lists should already be right behind it.
  onCheckedIn?: (orderNumber: string) => void
}): CheckInSession {
  const [phase, setPhase] = useState<CheckInPhase>('phone')
  const [phone, setPhone] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [smsConsent, setSmsConsent] = useState(true)
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([])
  const [preferredStaffId, setPreferredStaffId] = useState<string | null>(null)
  const [technicianChoices, setTechnicianChoices] = useState<Record<string, string | null>>({})
  const [note, setNote] = useState('')
  const [booking, setBooking] = useState<CheckInBookingPrefill | null>(null)
  const [orderNumber, setOrderNumber] = useState('')
  const [submitError, setSubmitError] = useState<string | null>(null)

  const source = useSource(phone || undefined)
  const { technicians, catalog } = source

  // The chosen technician only carries over to services they are actually assigned to. Anything
  // else stays null, which is the signal the front desk acts on — not a gap to be filled silently.
  const staffForService = useCallback(
    (serviceId: string, staffId: string | null) => {
      if (!staffId) return null
      const staff = technicians.find((tech) => tech.posStaffProfileId === staffId)
      return staff?.serviceIds.includes(serviceId) ? staffId : null
    },
    [technicians],
  )

  const clearDraft = useCallback(() => {
    setCustomerName('')
    setSmsConsent(true)
    setSelectedServiceIds([])
    setPreferredStaffId(null)
    setTechnicianChoices({})
    setNote('')
    setBooking(null)
    setSubmitError(null)
  }, [])

  const reset = useCallback(() => {
    setPhase('phone')
    setPhone('')
    setOrderNumber('')
    clearDraft()
  }, [clearDraft])

  const submitPhone = useCallback(
    (formattedPhone: string) => {
      // A corrected number must not keep the previous one's booking or prefilled name.
      clearDraft()
      setPhone(formattedPhone)
      setPhase('lookingUp')
    },
    [clearDraft],
  )

  const changePhone = useCallback(() => setPhase('phone'), [])

  // All three lookups fire off the same number and none blocks the others, so this waits on the
  // set and then decides. An error on any of them is not a dead end — an unreachable lookup must
  // not stop someone from checking in, so the page simply opens without the prefill.
  useEffect(() => {
    if (phase !== 'lookingUp' || !source.areLookupsSettled) return

    if (source.customerName) setCustomerName(source.customerName)

    if (source.activeVisitOrderNumber) {
      setPhase('activeVisit')
      return
    }

    if (source.booking) {
      setBooking(source.booking)
      if (source.booking.customerName) setCustomerName(source.booking.customerName)
      setSelectedServiceIds(source.booking.items.map((item) => item.posServiceId))
      setTechnicianChoices(
        Object.fromEntries(source.booking.items.map((item) => [item.posServiceId, item.posStaffProfileId])),
      )
    }

    setPhase('form')
  }, [phase, source.areLookupsSettled, source.customerName, source.activeVisitOrderNumber, source.booking])

  const continueAsNewGuest = useCallback(() => setPhase('form'), [])

  const toggleService = useCallback(
    (serviceId: string) => {
      const isRemoving = selectedServiceIds.includes(serviceId)
      setSelectedServiceIds((prev) =>
        isRemoving ? prev.filter((id) => id !== serviceId) : [...prev, serviceId],
      )
      setTechnicianChoices((prev) => {
        const next = { ...prev }
        // Removing drops the choice too: keeping it would resurrect a stale override if the guest
        // added the same service back after changing their mind.
        if (isRemoving) delete next[serviceId]
        else next[serviceId] = staffForService(serviceId, preferredStaffId)
        return next
      })
    },
    [selectedServiceIds, preferredStaffId, staffForService],
  )

  // Changing the preference re-seeds every line — going back to pick a different person means the
  // earlier answer no longer holds.
  const choosePreferredStaff = useCallback(
    (staffId: string | null) => {
      setPreferredStaffId(staffId)
      setTechnicianChoices(() =>
        Object.fromEntries(selectedServiceIds.map((id) => [id, staffForService(id, staffId)])),
      )
    },
    [selectedServiceIds, staffForService],
  )

  // The per-line escape hatch: one service goes to someone other than the person asked for up
  // front. Deliberately not folded into choosePreferredStaff — changing the preference re-seeds
  // every line and would wipe an override made here.
  const chooseServiceTechnician = useCallback((serviceId: string, posStaffProfileId: string | null) => {
    setTechnicianChoices((prev) => ({ ...prev, [serviceId]: posStaffProfileId }))
  }, [])

  const selectedServices = useMemo(
    () => catalog.filter((service) => selectedServiceIds.includes(service.id)),
    [catalog, selectedServiceIds],
  )

  const totalMinutes = selectedServices.reduce((sum, s) => sum + s.durationMinutes, 0)
  const totalPrice = selectedServices.reduce((sum, s) => sum + s.price, 0)

  // Name and consent, on both surfaces. Services stay optional: "just get me in the queue, I'll
  // explain in person" is a supported way to check in.
  const canSubmit = customerName.trim().length > 0 && smsConsent

  const submit = useCallback(() => {
    if (!canSubmit || source.isSubmitting) return
    setSubmitError(null)

    const trimmedNote = note.trim() || null
    const items = selectedServiceIds.map((serviceId) => ({
      posServiceId: serviceId,
      posStaffProfileId: technicianChoices[serviceId] ?? null,
      note: trimmedNote,
    }))
    const trimmedName = customerName.trim()

    // Two endpoints, one button. A booked guest converts the appointment they already have;
    // anyone else opens a new order.
    const request = booking
      ? source.submitBooking({ bookingId: booking.bookingId, customerName: trimmedName, items })
      : source.submitOrder({ customerName: trimmedName, customerPhone: phone, items })

    request
      .then((result) => {
        setOrderNumber(result.orderNumber)
        setPhase('done')
        onCheckedIn?.(result.orderNumber)
      })
      .catch(() => setSubmitError(submitErrorMessage))
  }, [
    booking, canSubmit, customerName, note, onCheckedIn, phone, selectedServiceIds, source,
    submitErrorMessage, technicianChoices,
  ])

  return {
    phase,
    phone,
    submitPhone,
    changePhone,
    customerName,
    setCustomerName,
    smsConsent,
    setSmsConsent,
    technicians,
    isTechniciansLoading: source.isTechniciansLoading,
    preferredStaffId,
    choosePreferredStaff,
    catalog,
    isCatalogLoading: source.isCatalogLoading,
    selectedServiceIds,
    selectedServices,
    toggleService,
    technicianChoices,
    chooseServiceTechnician,
    note,
    setNote,
    totalMinutes,
    totalPrice,
    activeVisitOrderNumber: source.activeVisitOrderNumber,
    continueAsNewGuest,
    booking,
    bookingTimeLabel: booking?.scheduledTimeLabel ?? null,
    canSubmit,
    isSubmitting: source.isSubmitting,
    submitError,
    submit,
    orderNumber,
    reset,
  }
}
