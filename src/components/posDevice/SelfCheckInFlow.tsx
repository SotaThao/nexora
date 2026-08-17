// The check-in itself: phone → name → technician → services → overview → visit number.
//
// Technician comes before the menu on purpose: people arrive asking "is Chloe in today?", and
// knowing the answer first lets every service they then tap be assigned without asking again. When
// the chosen technician is not assigned to a service, that line falls back to Anyone rather than
// refusing the pick — the front desk sorts it out in person.
//
// State lives here rather than in a store because the whole flow is one customer standing at the
// tablet: when they finish (or walk away and staff taps Cancel), the parent remounts this
// component and every trace of them is gone. That is also the reason the two phone lookups are
// cached with gcTime 0 — the next person must never see a name resolved for the person before.
//
// Known and accepted: nothing resets the screen on its own if a customer abandons the flow
// mid-way. An inactivity timeout is deliberately out of scope for this ticket.
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Loader2, Settings, X } from 'lucide-react'
import { useTranslation } from '../../contexts/LanguageContext'
import PhoneCheckInStep from '../dashboard/views/pos/PhoneCheckInStep'
import ActiveVisitWarning from './steps/ActiveVisitWarning'
import CustomerNameStep from './steps/CustomerNameStep'
import SelectServicesStep from './steps/SelectServicesStep'
import SelectTechnicianStep from './steps/SelectTechnicianStep'
import OverviewStep from './steps/OverviewStep'
import ThankYouStep from './steps/ThankYouStep'
import {
  useCheckInSelfCheckInBooking,
  useCreateSelfCheckInOrder,
  useSelfCheckInActiveVisit,
  useSelfCheckInCatalog,
  useSelfCheckInCustomerName,
  useSelfCheckInTechnicians,
  useSelfCheckInTodaysBooking,
} from '../../data/hooks/usePosSelfCheckIn'

const K = 'components.posDevice.SelfCheckInFlow'

type Step =
  | 'phone'
  | 'looking-up'
  | 'active-visit'
  | 'name'
  | 'technician'
  | 'services'
  | 'overview'
  | 'done'

export default function SelfCheckInFlow({
  businessName,
  logoUrl,
  deviceName,
  onExit,
  onOpenSettings,
}: {
  businessName: string
  logoUrl: string | null
  deviceName: string
  onExit: () => void
  onOpenSettings: () => void
}) {
  const { t } = useTranslation()
  const [step, setStep] = useState<Step>('phone')
  const [phone, setPhone] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([])
  // The technician asked for up front. null is "Anyone" and is also where a service the chosen
  // technician cannot perform ends up.
  const [preferredStaffId, setPreferredStaffId] = useState<string | null>(null)
  // serviceId → posStaffProfileId | null. Seeded from the preference, overridable per line on the
  // overview.
  const [technicianChoices, setTechnicianChoices] = useState<Record<string, string | null>>({})
  const [orderNumber, setOrderNumber] = useState('')
  const [submitError, setSubmitError] = useState<string | null>(null)
  // Set when the guest turned out to have an appointment today. Its presence changes what submit
  // does: convert that booking instead of opening a second order beside it.
  const [bookingId, setBookingId] = useState<string | null>(null)
  const [bookingTime, setBookingTime] = useState<string | null>(null)

  const catalogQuery = useSelfCheckInCatalog()
  const customerQuery = useSelfCheckInCustomerName(phone || undefined)
  const activeVisitQuery = useSelfCheckInActiveVisit(phone || undefined)
  const bookingQuery = useSelfCheckInTodaysBooking(phone || undefined)
  const techniciansQuery = useSelfCheckInTechnicians()
  const createOrder = useCreateSelfCheckInOrder()
  const checkInBooking = useCheckInSelfCheckInBooking()
  const isSubmitting = createOrder.isPending || checkInBooking.isPending

  // All three lookups are fired by the same phone number and none blocks the others, so this waits
  // on the set and then decides. An error on any of them is not a dead end — an unreachable lookup
  // must not stop someone from checking in, so the flow simply continues without the prefill.
  const lookupsSettled =
    !customerQuery.isPending && !activeVisitQuery.isPending && !bookingQuery.isPending
  useEffect(() => {
    if (step !== 'looking-up' || !lookupsSettled) return

    if (customerQuery.data) setCustomerName(customerQuery.data)

    if (activeVisitQuery.data) {
      setStep('active-visit')
      return
    }

    // A guest who booked already answered every question ahead — carry their answers in and drop
    // them straight on the overview to confirm. The steps behind it stay reachable via Back, so
    // changing their mind still costs nothing.
    const booking = bookingQuery.data
    if (booking) {
      setBookingId(booking.bookingId)
      setBookingTime(booking.scheduledAt)
      if (booking.customerName) setCustomerName(booking.customerName)
      setSelectedServiceIds(booking.items.map((item) => item.posServiceId))
      setTechnicianChoices(
        Object.fromEntries(booking.items.map((item) => [item.posServiceId, item.posStaffProfileId])),
      )
      setStep(booking.items.length > 0 ? 'overview' : 'name')
      return
    }

    setStep('name')
  }, [step, lookupsSettled, customerQuery.data, activeVisitQuery.data, bookingQuery.data])

  const selectedServices = useMemo(
    () => (catalogQuery.data ?? []).filter((s) => selectedServiceIds.includes(s.id)),
    [catalogQuery.data, selectedServiceIds],
  )

  // Server already resolved this to the salon's wall clock, so it is read as-is — running it
  // through the browser's timezone would shift the appointment the guest agreed to.
  const bookingTimeLabel = useMemo(() => {
    if (!bookingTime) return null
    const [, time] = bookingTime.split('T')
    if (!time) return null
    const [hours, minutes] = time.split(':')
    const hour = Number(hours)
    const suffix = hour >= 12 ? 'PM' : 'AM'
    const hour12 = hour % 12 === 0 ? 12 : hour % 12
    return `${hour12}:${minutes} ${suffix}`
  }, [bookingTime])

  // The chosen technician only carries over to services they are actually assigned to. Anything
  // else stays null, which is the signal the front desk acts on — not a gap to be filled silently.
  const technicians = techniciansQuery.data ?? []
  const staffForService = useCallback(
    (serviceId: string, staffId: string | null) => {
      if (!staffId) return null
      const staff = technicians.find((tech) => tech.posStaffProfileId === staffId)
      return staff?.serviceIds.includes(serviceId) ? staffId : null
    },
    [technicians],
  )

  const toggleService = (serviceId: string) => {
    const isRemoving = selectedServiceIds.includes(serviceId)
    setSelectedServiceIds((prev) =>
      isRemoving ? prev.filter((id) => id !== serviceId) : [...prev, serviceId],
    )
    setTechnicianChoices((prev) => {
      const next = { ...prev }
      // Removing drops the choice too: keeping it would resurrect a stale override if the customer
      // added the same service back after changing their mind.
      if (isRemoving) delete next[serviceId]
      else next[serviceId] = staffForService(serviceId, preferredStaffId)
      return next
    })
  }

  // Changing the preference re-seeds every line. Overrides made on the overview are deliberately
  // discarded: going back to pick a different person means the earlier answer no longer holds.
  const choosePreferredStaff = (staffId: string | null) => {
    setPreferredStaffId(staffId)
    setTechnicianChoices(() =>
      Object.fromEntries(selectedServiceIds.map((id) => [id, staffForService(id, staffId)])),
    )
  }

  const submit = useCallback(() => {
    setSubmitError(null)

    const items = selectedServiceIds.map((serviceId) => ({
      posServiceId: serviceId,
      posStaffProfileId: technicianChoices[serviceId] ?? null,
    }))

    const handlers = {
      onSuccess: (result: { orderNumber: string }) => {
        setOrderNumber(result.orderNumber)
        setStep('done')
      },
      onError: () => setSubmitError(t(`${K}.submitError`)),
    }

    // Two endpoints, one button. A booked guest converts the appointment they already have;
    // anyone else opens a new order.
    if (bookingId) {
      checkInBooking.mutate(
        { bookingId, customerName: customerName.trim() || null, items },
        handlers,
      )
      return
    }

    createOrder.mutate(
      { customerName: customerName.trim() || null, customerPhone: phone, items },
      handlers,
    )
  }, [bookingId, checkInBooking, createOrder, customerName, phone, selectedServiceIds, technicianChoices, t])

  if (step === 'done') {
    return (
      <ThankYouStep orderNumber={orderNumber} customerName={customerName.trim()} onDone={onExit} />
    )
  }

  const isIdleScreen = step === 'phone'

  return (
    <div className="w-full space-y-4">
      {/* Cancel exists from the second step on: a customer who taps the wrong thing, or walks off
          entirely, must not leave the tablet stuck on their half-finished check-in. On the keypad
          there is nothing yet to cancel, so the slot holds the salon's branding instead. */}
      {isIdleScreen ? (
        <div className="flex flex-col items-center gap-2">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={businessName}
              className="h-16 w-16 rounded-2xl border border-nexoraBorder bg-white object-contain p-1"
            />
          ) : null}
        </div>
      ) : (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onExit}
            className="flex h-11 items-center gap-1.5 rounded-lg border border-nexoraBorder bg-nexoraSurface px-4 text-sm font-bold text-nexoraMuted hover:border-nexoraBrand"
          >
            <X className="h-4 w-4" />
            {t(`${K}.cancel`)}
          </button>
        </div>
      )}

      {step === 'phone' ? (
        <PhoneCheckInStep
          businessName={businessName}
          initialDigits={phone}
          onSubmit={(formattedPhone) => {
            setPhone(formattedPhone)
            setStep('looking-up')
          }}
        />
      ) : null}

      {step === 'looking-up' ? (
        <div className="flex min-h-[240px] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-nexoraBrand" />
        </div>
      ) : null}

      {step === 'active-visit' ? (
        <ActiveVisitWarning
          orderNumber={activeVisitQuery.data ?? ''}
          onExit={onExit}
          onContinue={() => setStep('name')}
        />
      ) : null}

      {step === 'name' ? (
        <CustomerNameStep
          value={customerName}
          phoneLabel={phone}
          onChange={setCustomerName}
          onBack={() => setStep('phone')}
          onContinue={() => setStep('technician')}
        />
      ) : null}

      {step === 'technician' ? (
        <SelectTechnicianStep
          technicians={technicians}
          isLoading={techniciansQuery.isPending}
          selectedStaffId={preferredStaffId}
          onSelect={choosePreferredStaff}
          onBack={() => setStep('name')}
          onContinue={() => setStep('services')}
        />
      ) : null}

      {step === 'services' ? (
        <SelectServicesStep
          services={catalogQuery.data ?? []}
          isLoading={catalogQuery.isPending}
          selectedServiceIds={selectedServiceIds}
          isSubmitting={isSubmitting}
          errorMessage={submitError}
          onToggle={toggleService}
          onBack={() => setStep('technician')}
          onContinue={() => (selectedServiceIds.length === 0 ? submit() : setStep('overview'))}
        />
      ) : null}

      {step === 'overview' ? (
        <OverviewStep
          services={selectedServices}
          technicians={technicians}
          choices={technicianChoices}
          customerName={customerName.trim()}
          customerPhone={phone}
          bookingTime={bookingTimeLabel}
          isSubmitting={isSubmitting}
          errorMessage={submitError}
          onChoose={(serviceId, posStaffProfileId) =>
            setTechnicianChoices((prev) => ({ ...prev, [serviceId]: posStaffProfileId }))
          }
          onBack={() => setStep('services')}
          onSubmit={submit}
        />
      ) : null}

      {/* Only on the idle screen, and deliberately the quietest thing on it: staff know it is
          there, a customer has no reason to notice it, and the PIN behind it is what actually
          guards Sign Out. */}
      {isIdleScreen ? (
        <>
          {/* Same offset and height as the gear opposite it, so the two read as one quiet strip
              along the bottom rather than two stray elements. */}
          <p className="fixed bottom-4 left-4 flex h-11 items-center text-[11px] text-nexoraMuted/70">
            {deviceName}
          </p>
          <button
            type="button"
            onClick={onOpenSettings}
            aria-label={t(`${K}.settings`)}
            className="fixed bottom-4 right-4 flex h-11 w-11 items-center justify-center rounded-full text-nexoraMuted/50 hover:text-nexoraMuted"
          >
            <Settings className="h-5 w-5" />
          </button>
        </>
      ) : null}
    </div>
  )
}
