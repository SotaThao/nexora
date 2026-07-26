// PublicBookingPage — POS Booking, public wizard (Tickets 4-5). Anonymous, no login.
// Step 1 ("discovery"): salon branding + active services/technicians via two entry tabs
// ("By Service" / "By Technician"), plus selecting one or more services (each optionally
// with a specific technician) for the booking — per POS-Booking-Business.md's "Workflow:
// Customer Books Online" steps 1-4. Step 2 ("datetime"): DateTimeStep. Step 3 ("contact"):
// name/phone/email. Step 4 ("confirmation"): ConfirmationScreen.
import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useTranslation } from '../../contexts/LanguageContext'
import { useNotification } from '../../contexts/NotificationContext'
import { formatNationalNumber, getNationalPhonePlaceholder, PhoneDialCode } from '../CountryCodeSelect'
import { getApiErrorCode } from '../../types/domain'
import { getErrorI18nKey } from '../../data/errorCodes'
import { usePublicBookingPage, useCreatePublicBooking } from '../../data/hooks/usePublicBooking'
import type { CreatePublicBookingResultApiDto, PublicBookingTechnicianApiDto } from '../../types/repositories'
import DateTimeStep from '../booking-public/DateTimeStep'
import ConfirmationScreen from '../booking-public/ConfirmationScreen'

type DiscoveryTab = 'service' | 'technician'
type WizardStep = 'discovery' | 'datetime' | 'contact' | 'confirmation'

interface SelectedLine {
  key: string
  posServiceId: string
  serviceName: string
  unitPrice: number
  durationMinutes: number
  posStaffProfileId?: string
}

function Avatar({ name, photoUrl }: { name: string; photoUrl?: string | null }) {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')

  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-nexoraCanvas text-[11px] font-bold text-nexoraText">
      {photoUrl ? <img src={photoUrl} alt="" className="h-9 w-9 rounded-full object-cover" /> : initials}
    </span>
  )
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-2 text-xs font-bold ${
        active ? 'border-b-2 border-nexoraBrand text-nexoraBrand' : 'text-nexoraMuted hover:text-nexoraText'
      }`}
    >
      {children}
    </button>
  )
}

function PublicBookingShell({
  businessName,
  logoUrl,
  children,
}: {
  businessName?: string
  logoUrl?: string | null
  children: React.ReactNode
}) {
  return (
    <div className="min-h-dvh bg-nexoraCanvas px-4 py-8">
      <div className="mx-auto max-w-2xl space-y-4">
        {businessName ? (
          <div className="flex items-center gap-3">
            {logoUrl ? (
              <img src={logoUrl} alt="" className="h-12 w-12 rounded-full object-cover" />
            ) : null}
            <h1 className="text-lg font-extrabold text-nexoraText">{businessName}</h1>
          </div>
        ) : null}
        <div className="nexora-card p-4">{children}</div>
      </div>
    </div>
  )
}

export default function PublicBookingPage() {
  const { businessSlug } = useParams<{ businessSlug: string }>()
  const { t } = useTranslation()
  const { showToast } = useNotification()
  const { data, isLoading, isError } = usePublicBookingPage(businessSlug)
  const createBooking = useCreatePublicBooking(businessSlug)

  const [tab, setTab] = useState<DiscoveryTab>('service')
  const [expandedServiceId, setExpandedServiceId] = useState<string | null>(null)
  const [expandedTechnicianId, setExpandedTechnicianId] = useState<string | null>(null)
  const [selectedLines, setSelectedLines] = useState<SelectedLine[]>([])
  const [step, setStep] = useState<WizardStep>('discovery')
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [contactError, setContactError] = useState('')
  const [bookingResult, setBookingResult] = useState<CreatePublicBookingResultApiDto | null>(null)

  if (isLoading) {
    return (
      <PublicBookingShell>
        <div className="flex justify-center py-16">
          <Loader2 className="h-7 w-7 animate-spin text-nexoraBrand" />
        </div>
      </PublicBookingShell>
    )
  }

  if (isError || !data) {
    return (
      <PublicBookingShell>
        <div className="px-4 py-10 text-center">
          <p className="text-sm font-bold text-nexoraText">{t('public.booking.notFoundTitle')}</p>
          <p className="mt-1 text-xs text-nexoraMuted">{t('public.booking.notFoundDesc')}</p>
        </div>
      </PublicBookingShell>
    )
  }

  const techniciansForService = (serviceId: string): PublicBookingTechnicianApiDto[] =>
    data.technicians.filter((technician) => technician.serviceIds.includes(serviceId))

  const servicesForTechnician = (technicianId: string) => {
    const technician = data.technicians.find((tech) => tech.id === technicianId)
    if (!technician) return []
    return data.services.filter((s) => technician.serviceIds.includes(s.id))
  }

  const isSelected = (serviceId: string) => selectedLines.some((l) => l.posServiceId === serviceId)

  const toggleService = (serviceId: string) => {
    if (isSelected(serviceId)) {
      setSelectedLines((prev) => prev.filter((l) => l.posServiceId !== serviceId))
      return
    }
    const service = data.services.find((s) => s.id === serviceId)
    if (!service) return
    setSelectedLines((prev) => [
      ...prev,
      {
        key: crypto.randomUUID(),
        posServiceId: service.id,
        serviceName: service.name,
        unitPrice: service.price,
        durationMinutes: service.durationMinutes,
      },
    ])
  }

  const setLineTechnician = (key: string, posStaffProfileId?: string) => {
    setSelectedLines((prev) => prev.map((l) => (l.key === key ? { ...l, posStaffProfileId } : l)))
  }

  const handleDateTimeContinue = (date: string, time: string) => {
    setSelectedDate(date)
    setSelectedTime(time)
    setStep('contact')
  }

  const reportError = (err: unknown) => {
    showToast(t(getErrorI18nKey(getApiErrorCode(err, 'ERROR'))), 'error')
  }

  const handleSubmit = () => {
    const name = customerName.trim()
    const phone = customerPhone.trim()
    if (!name || !phone) {
      setContactError(t('public.booking.formIncomplete'))
      return
    }
    setContactError('')

    const [year, month, day] = selectedDate.split('-').map(Number)
    const [hour, minute] = selectedTime.split(':').map(Number)
    const scheduledAt = new Date(Date.UTC(year, month - 1, day, hour, minute)).toISOString()

    createBooking.mutate(
      {
        customerName: name,
        customerPhone: phone,
        customerEmail: customerEmail.trim() || undefined,
        scheduledAt,
        items: selectedLines.map((l) => ({ posServiceId: l.posServiceId, posStaffProfileId: l.posStaffProfileId })),
      },
      {
        onSuccess: (result) => {
          setBookingResult(result)
          setStep('confirmation')
        },
        onError: reportError,
      },
    )
  }

  if (step === 'confirmation' && bookingResult) {
    const [year, month, day] = selectedDate.split('-').map(Number)
    const [hour, minute] = selectedTime.split(':').map(Number)
    const scheduledAt = new Date(Date.UTC(year, month - 1, day, hour, minute))
    const maxDuration = Math.max(...selectedLines.map((l) => l.durationMinutes))

    return (
      <PublicBookingShell businessName={data.businessName} logoUrl={data.logoUrl}>
        <ConfirmationScreen
          businessName={data.businessName}
          status={bookingResult.status}
          scheduledAt={scheduledAt}
          durationMinutes={maxDuration}
          serviceNames={selectedLines.map((l) => l.serviceName)}
          bookingId={bookingResult.bookingId}
          manageToken={bookingResult.manageToken}
          onDone={() => {
            setSelectedLines([])
            setSelectedDate('')
            setSelectedTime('')
            setCustomerName('')
            setCustomerPhone('')
            setCustomerEmail('')
            setBookingResult(null)
            setStep('discovery')
          }}
        />
      </PublicBookingShell>
    )
  }

  if (step === 'datetime') {
    return (
      <PublicBookingShell businessName={data.businessName} logoUrl={data.logoUrl}>
        <DateTimeStep
          businessSlug={businessSlug as string}
          items={selectedLines.map((l) => ({ posServiceId: l.posServiceId, posStaffProfileId: l.posStaffProfileId }))}
          onContinue={handleDateTimeContinue}
          onBack={() => setStep('discovery')}
        />
      </PublicBookingShell>
    )
  }

  if (step === 'contact') {
    return (
      <PublicBookingShell businessName={data.businessName} logoUrl={data.logoUrl}>
        <div className="space-y-4">
          <h2 className="text-sm font-extrabold text-nexoraText">{t('public.booking.contactTitle')}</h2>
          <div>
            <label className="mb-1 block text-[10px] font-extrabold uppercase text-nexoraMuted">
              {t('public.booking.customerName')}
            </label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="h-10 w-full rounded-lg border border-nexoraBorder bg-white px-3.5 text-xs text-nexoraText outline-none focus:border-nexoraBrand"
            />
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-extrabold uppercase text-nexoraMuted">
              {t('public.booking.customerPhone')}
            </label>
            <input
              type="tel"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(formatNationalNumber(e.target.value, PhoneDialCode.US))}
              placeholder={getNationalPhonePlaceholder(PhoneDialCode.US)}
              inputMode="numeric"
              autoComplete="tel-national"
              className="h-10 w-full rounded-lg border border-nexoraBorder bg-white px-3.5 text-xs text-nexoraText outline-none focus:border-nexoraBrand"
            />
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-extrabold uppercase text-nexoraMuted">
              {t('public.booking.customerEmail')}
            </label>
            <input
              type="email"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              className="h-10 w-full rounded-lg border border-nexoraBorder bg-white px-3.5 text-xs text-nexoraText outline-none focus:border-nexoraBrand"
            />
          </div>
          {contactError ? <p className="text-[10px] font-bold text-rose-500">{contactError}</p> : null}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setStep('datetime')}
              className="h-10 flex-1 rounded-lg border border-nexoraBorder text-xs font-bold text-nexoraText hover:border-nexoraBrand"
            >
              {t('public.booking.backButton')}
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={createBooking.isPending}
              className="h-10 flex-1 rounded-lg bg-nexoraBrand text-xs font-bold text-white hover:bg-nexoraBrandDark disabled:opacity-60"
            >
              {createBooking.isPending ? (
                <Loader2 className="mx-auto h-4 w-4 animate-spin" />
              ) : (
                t('public.booking.confirmButton')
              )}
            </button>
          </div>
        </div>
      </PublicBookingShell>
    )
  }

  return (
    <PublicBookingShell businessName={data.businessName} logoUrl={data.logoUrl}>
      <div className="mb-4 flex gap-1 border-b border-nexoraBorder">
        <TabButton active={tab === 'service'} onClick={() => setTab('service')}>
          {t('public.booking.byServiceTab')}
        </TabButton>
        <TabButton active={tab === 'technician'} onClick={() => setTab('technician')}>
          {t('public.booking.byTechnicianTab')}
        </TabButton>
      </div>

      {tab === 'service' ? (
        data.services.length === 0 ? (
          <p className="py-6 text-center text-xs text-nexoraMuted">{t('public.booking.noServices')}</p>
        ) : (
          <div className="space-y-2">
            {data.services.map((service) => (
              <div key={service.id} className="rounded-xl border border-nexoraBorder p-3">
                <div className="flex items-start justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setExpandedServiceId(expandedServiceId === service.id ? null : service.id)}
                    className="min-w-0 flex-1 text-left"
                  >
                    <p className="truncate text-sm font-bold text-nexoraText">{service.name}</p>
                    <p className="text-xs text-nexoraMuted">
                      ${service.price.toFixed(2)} · {service.durationMinutes} {t('public.booking.minutesAbbrev')}
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleService(service.id)}
                    className={`shrink-0 rounded-lg px-2.5 py-1.5 text-[10px] font-bold ${
                      isSelected(service.id)
                        ? 'bg-rose-50 text-rose-600 hover:bg-rose-100'
                        : 'bg-nexoraBrand text-white hover:bg-nexoraBrandDark'
                    }`}
                  >
                    {isSelected(service.id) ? t('public.booking.removeFromBooking') : t('public.booking.addToBooking')}
                  </button>
                </div>
                {service.description ? (
                  <p className="mt-1 text-xs text-nexoraMuted">{service.description}</p>
                ) : null}
                {expandedServiceId === service.id ? (
                  <div className="mt-2 space-y-2 border-t border-nexoraBorder pt-2">
                    <p className="text-[10px] font-black uppercase tracking-wider text-nexoraMuted">
                      {t('public.booking.availableTechnicians')}
                    </p>
                    {techniciansForService(service.id).length === 0 ? (
                      <p className="text-xs text-nexoraMuted">{t('public.booking.noTechniciansForService')}</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {techniciansForService(service.id).map((technician) => (
                          <div key={technician.id} className="flex items-center gap-2 rounded-full border border-nexoraBorder px-2 py-1">
                            <Avatar name={technician.displayName} photoUrl={technician.photoUrl} />
                            <span className="text-xs font-semibold text-nexoraText">{technician.displayName}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )
      ) : data.technicians.length === 0 ? (
        <p className="py-6 text-center text-xs text-nexoraMuted">{t('public.booking.noTechnicians')}</p>
      ) : (
        <div className="space-y-2">
          {data.technicians.map((technician) => (
            <div key={technician.id} className="rounded-xl border border-nexoraBorder p-3">
              <button
                type="button"
                onClick={() =>
                  setExpandedTechnicianId(expandedTechnicianId === technician.id ? null : technician.id)
                }
                className="flex w-full items-center gap-3 text-left"
              >
                <Avatar name={technician.displayName} photoUrl={technician.photoUrl} />
                <p className="text-sm font-bold text-nexoraText">{technician.displayName}</p>
              </button>
              {expandedTechnicianId === technician.id ? (
                <div className="mt-2 border-t border-nexoraBorder pt-2">
                  <p className="mb-1 text-[10px] font-black uppercase tracking-wider text-nexoraMuted">
                    {t('public.booking.servicesOffered')}
                  </p>
                  {servicesForTechnician(technician.id).length === 0 ? (
                    <p className="text-xs text-nexoraMuted">{t('public.booking.noServicesForTechnician')}</p>
                  ) : (
                    <ul className="space-y-1 text-xs text-nexoraText">
                      {servicesForTechnician(technician.id).map((s) => (
                        <li key={s.id}>
                          {s.name} — ${s.price.toFixed(2)}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}

      {selectedLines.length > 0 ? (
        <div className="mt-4 space-y-2 border-t border-nexoraBorder pt-4">
          <h3 className="text-[10px] font-black uppercase tracking-wider text-nexoraMuted">
            {t('public.booking.selectedServicesTitle')}
          </h3>
          {selectedLines.map((line) => (
            <div key={line.key} className="flex items-center gap-2 rounded-lg border border-nexoraBorder p-2">
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-nexoraText">
                  {line.serviceName} — ${line.unitPrice.toFixed(2)}
                </p>
                <select
                  value={line.posStaffProfileId ?? ''}
                  onChange={(e) => setLineTechnician(line.key, e.target.value || undefined)}
                  className="mt-1 h-8 w-full rounded-lg border border-nexoraBorder bg-white px-2 text-[11px] text-nexoraText outline-none focus:border-nexoraBrand"
                >
                  <option value="">{t('public.booking.unassignedTechnician')}</option>
                  {techniciansForService(line.posServiceId).map((technician) => (
                    <option key={technician.id} value={technician.id}>
                      {technician.displayName}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setStep('datetime')}
            className="h-10 w-full rounded-lg bg-nexoraBrand text-xs font-bold text-white hover:bg-nexoraBrandDark"
          >
            {t('public.booking.continueButton')}
          </button>
        </div>
      ) : null}
    </PublicBookingShell>
  )
}
