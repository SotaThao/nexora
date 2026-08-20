// Step 5 — the whole visit on one screen before it is submitted.
//
// Each line already carries the technician chosen two steps back, or Anyone where that person is
// not assigned to the service. The dropdown is the escape hatch for the customer who wants someone
// different for one item — inline rather than behind an overlay, because the point of this screen
// is seeing every line at once, and an overlay hides exactly that.
import { useTranslation } from '../../../contexts/LanguageContext'
import CheckInStepFrame from '../../checkin/parts/CheckInStepFrame'
import CheckInServiceLineRow from '../../checkin/parts/CheckInServiceLineRow'
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
  primaryDisabled,
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
  // Set when check-in's own rules are not met yet (a missing name, an unticked consent box) — the
  // button says so rather than silently doing nothing.
  primaryDisabled?: boolean
  errorMessage: string | null
  onChoose: (serviceId: string, posStaffProfileId: string | null) => void
  onBack: () => void
  onSubmit: () => void
}) {
  const { t } = useTranslation()

  return (
    <CheckInStepFrame
      title={t(`${K}.overviewTitle`)}
      subtitle={t(`${K}.overviewSubtitle`)}
      backLabel={t(`${K}.back`)}
      onBack={onBack}
      primaryLabel={t(`${K}.submit`)}
      onPrimary={onSubmit}
      primaryDisabled={primaryDisabled}
      isSubmitting={isSubmitting}
    >

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
            <CheckInServiceLineRow
              key={service.id}
              serviceName={service.name}
              price={service.price}
              durationMinutes={service.durationMinutes}
              technicianInitials={selected ? initialsOf(selected.displayName) : null}
              technicianSelect={
                <select
                  value={selectedId ?? ANYONE}
                  aria-label={t(`${K}.technicianForService`, { serviceName: service.name })}
                  onChange={(e) => onChoose(service.id, e.target.value === ANYONE ? null : e.target.value)}
                  // A fixed width, not a percentage: this select sits inside a shrink-0 flex
                  // container whose own width comes from its content, so a percentage max-width
                  // resolves against an indefinite parent and collapses the control to its arrow.
                  className="h-11 w-40 rounded-lg border border-nexoraBorder bg-white px-3 text-sm font-bold text-nexoraText outline-none focus:border-nexoraBrand"
                >
                  <option value={ANYONE}>{t(`${K}.anyone`)}</option>
                  {eligible.map((tech) => (
                    <option key={tech.posStaffProfileId} value={tech.posStaffProfileId}>
                      {tech.displayName}
                    </option>
                  ))}
                </select>
              }
            />
          )
        })}
      </div>

      {errorMessage ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-nexoraDanger">{errorMessage}</p>
      ) : null}

    </CheckInStepFrame>
  )
}
