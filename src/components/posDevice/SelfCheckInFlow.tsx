// The check-in itself: phone → name → services → technicians → visit number.
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
import SelectTechniciansStep, { type TechnicianChoice } from './steps/SelectTechniciansStep'
import ThankYouStep from './steps/ThankYouStep'
import {
  useCreateSelfCheckInOrder,
  useSelfCheckInActiveVisit,
  useSelfCheckInCatalog,
  useSelfCheckInCustomerName,
} from '../../data/hooks/usePosSelfCheckIn'

const K = 'components.posDevice.SelfCheckInFlow'

type Step = 'phone' | 'looking-up' | 'active-visit' | 'name' | 'services' | 'technicians' | 'done'

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
  const [technicianChoices, setTechnicianChoices] = useState<Record<string, TechnicianChoice>>({})
  const [orderNumber, setOrderNumber] = useState('')
  const [submitError, setSubmitError] = useState<string | null>(null)

  const catalogQuery = useSelfCheckInCatalog()
  const customerQuery = useSelfCheckInCustomerName(phone || undefined)
  const activeVisitQuery = useSelfCheckInActiveVisit(phone || undefined)
  const createOrder = useCreateSelfCheckInOrder()

  // Both lookups are fired by the same phone number and neither blocks the other, so this waits on
  // the pair and then decides. An error on either is not a dead end — an unreachable lookup must
  // not stop someone from checking in, so the flow simply continues without the prefill.
  const lookupsSettled = !customerQuery.isPending && !activeVisitQuery.isPending
  useEffect(() => {
    if (step !== 'looking-up' || !lookupsSettled) return
    if (customerQuery.data) setCustomerName(customerQuery.data)
    setStep(activeVisitQuery.data ? 'active-visit' : 'name')
  }, [step, lookupsSettled, customerQuery.data, activeVisitQuery.data])

  const selectedServices = useMemo(
    () => (catalogQuery.data ?? []).filter((s) => selectedServiceIds.includes(s.id)),
    [catalogQuery.data, selectedServiceIds],
  )

  const toggleService = (serviceId: string) => {
    setSelectedServiceIds((prev) =>
      prev.includes(serviceId) ? prev.filter((id) => id !== serviceId) : [...prev, serviceId],
    )
    // Drop the technician along with the service — keeping it would re-apply a stale choice if the
    // customer added the same service back after changing their mind.
    setTechnicianChoices((prev) => {
      if (!(serviceId in prev)) return prev
      const next = { ...prev }
      delete next[serviceId]
      return next
    })
  }

  const submit = useCallback(() => {
    setSubmitError(null)
    createOrder.mutate(
      {
        customerName: customerName.trim() || null,
        customerPhone: phone,
        items: selectedServiceIds.map((serviceId) => ({
          posServiceId: serviceId,
          posStaffProfileId: technicianChoices[serviceId]?.posStaffProfileId ?? null,
        })),
      },
      {
        onSuccess: (result) => {
          setOrderNumber(result.orderNumber)
          setStep('done')
        },
        onError: () => setSubmitError(t(`${K}.submitError`)),
      },
    )
  }, [createOrder, customerName, phone, selectedServiceIds, technicianChoices, t])

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
          onContinue={() => setStep('services')}
        />
      ) : null}

      {step === 'services' ? (
        <SelectServicesStep
          services={catalogQuery.data ?? []}
          isLoading={catalogQuery.isPending}
          selectedServiceIds={selectedServiceIds}
          isSubmitting={createOrder.isPending}
          errorMessage={submitError}
          onToggle={toggleService}
          onBack={() => setStep('name')}
          onContinue={() => (selectedServiceIds.length === 0 ? submit() : setStep('technicians'))}
        />
      ) : null}

      {step === 'technicians' ? (
        <SelectTechniciansStep
          services={selectedServices}
          choices={technicianChoices}
          isSubmitting={createOrder.isPending}
          errorMessage={submitError}
          onChoose={(serviceId, choice) =>
            setTechnicianChoices((prev) => ({ ...prev, [serviceId]: choice }))
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
