// Step 5 — the whole visit on one screen before it is submitted.
//
// Each line already carries the technician chosen two steps back, or Anyone where that person is
// not assigned to the service. The dropdown is the escape hatch for the customer who wants someone
// different for one item — inline rather than behind an overlay, because the point of this screen
// is seeing every line at once, and an overlay hides exactly that.
import { Loader2 } from 'lucide-react'
import { useTranslation } from '../../../contexts/LanguageContext'
import { initialsOf } from './technicianDisplay'
import type { SelfCheckInServiceApiDto, SelfCheckInTechnicianApiDto } from '../../../types/repositories'

const K = 'components.posDevice.SelfCheckInFlow'

// <select> speaks strings; null is not one of them.
const ANYONE = ''

export default function OverviewStep({
  services,
  technicians,
  choices,
  customerName,
  customerPhone,
  bookingTime,
  isSubmitting,
  errorMessage,
  onChoose,
  onBack,
  onSubmit,
}: {
  services: SelfCheckInServiceApiDto[]
  technicians: SelfCheckInTechnicianApiDto[]
  // serviceId → posStaffProfileId, or null for Anyone.
  choices: Record<string, string | null>
  customerName: string
  customerPhone: string
  // Set only when this visit came from an appointment.
  bookingTime: string | null
  isSubmitting: boolean
  errorMessage: string | null
  onChoose: (serviceId: string, posStaffProfileId: string | null) => void
  onBack: () => void
  onSubmit: () => void
}) {
  const { t } = useTranslation()

  return (
    <div className="mx-auto w-full max-w-2xl space-y-4 rounded-2xl border border-nexoraBorder bg-nexoraSurface p-6">
      <div className="text-center">
        <h1 className="text-xl font-black text-nexoraText">{t(`${K}.overviewTitle`)}</h1>
        <p className="mt-1 text-sm text-nexoraMuted">{t(`${K}.overviewSubtitle`)}</p>
      </div>

      {/* Last chance to notice the tablet has the wrong person — worth the space on a screen a
          stranger types their own number into. */}
      <div className="rounded-2xl bg-nexoraCanvas p-4">
        <p className="text-sm font-bold text-nexoraText">
          {customerName || t(`${K}.overviewNoName`)}
        </p>
        <p className="text-sm text-nexoraMuted">{customerPhone}</p>
        {bookingTime ? (
          <p className="mt-1 text-xs font-bold text-nexoraBrandDark">
            {t(`${K}.overviewBookingAt`, { time: bookingTime })}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        {services.map((service) => {
          const selectedId = choices[service.id] ?? null
          // Only technicians actually assigned to this service — offering anyone else would let
          // the kiosk pin a line to someone who cannot perform it.
          const eligible = technicians.filter((tech) => tech.serviceIds.includes(service.id))
          const selected = eligible.find((tech) => tech.posStaffProfileId === selectedId)

          return (
            <div
              key={service.id}
              className="flex items-center justify-between gap-3 rounded-2xl border border-nexoraBorder p-3"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-nexoraCanvas text-xs font-bold text-nexoraText">
                  {selected ? initialsOf(selected.displayName) : '⚡'}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-nexoraText">{service.name}</p>
                  <p className="truncate text-xs text-nexoraMuted">
                    ${service.price.toFixed(2)}
                    {service.durationMinutes ? ` · ${service.durationMinutes} min` : ''}
                  </p>
                </div>
              </div>

              <select
                value={selectedId ?? ANYONE}
                aria-label={t(`${K}.technicianForService`, { serviceName: service.name })}
                onChange={(e) => onChoose(service.id, e.target.value === ANYONE ? null : e.target.value)}
                className="h-11 max-w-[45%] shrink-0 rounded-lg border border-nexoraBorder bg-white px-3 text-sm font-bold text-nexoraText outline-none focus:border-nexoraBrand"
              >
                <option value={ANYONE}>{t(`${K}.anyone`)}</option>
                {eligible.map((tech) => (
                  <option key={tech.posStaffProfileId} value={tech.posStaffProfileId}>
                    {tech.displayName}
                  </option>
                ))}
              </select>
            </div>
          )
        })}
      </div>

      {errorMessage ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-nexoraDanger">{errorMessage}</p>
      ) : null}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onBack}
          disabled={isSubmitting}
          className="h-14 flex-1 rounded-lg border border-nexoraBorder text-base font-bold text-nexoraText hover:border-nexoraBrand disabled:opacity-60"
        >
          {t(`${K}.back`)}
        </button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={isSubmitting}
          className="flex h-14 flex-[2] items-center justify-center gap-2 rounded-lg bg-nexoraBrand text-base font-bold text-white hover:bg-nexoraBrandDark disabled:opacity-60"
        >
          {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
          {t(`${K}.submit`)}
        </button>
      </div>
    </div>
  )
}
