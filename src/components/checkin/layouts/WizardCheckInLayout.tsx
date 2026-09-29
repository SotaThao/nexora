// The step-by-step check-in, kept as a per-business option after the one-page layout replaced it
// as the default.
//
// It is here rather than deleted because a salon that trained its staff on four screens should be
// able to keep them, and because a third mode later has an obvious place to go. Its four steps are
// the same components that shipped before; the only thing that changed is where their state comes
// from — the session, shared with the one-page layout, so the two cannot disagree about what
// check-in does.
//
// The step cursor below is the one piece of state a layout legitimately owns: it is a way of
// presenting the same answers, not a rule about them.
import { useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { useTranslation } from '../../../contexts/LanguageContext'
import CustomerNameStep from '../../posDevice/steps/CustomerNameStep'
import SelectTechnicianStep from '../../posDevice/steps/SelectTechnicianStep'
import SelectServicesStep from '../../posDevice/steps/SelectServicesStep'
import OverviewStep from '../../posDevice/steps/OverviewStep'
import SelectedServicesSummary from '../parts/SelectedServicesSummary'
import type { CheckInSession } from '../useCheckInSession'

const K = 'components.checkin.WizardCheckInLayout'

type WizardStep = 'name' | 'technician' | 'services' | 'overview'

export default function WizardCheckInLayout({
  session,
  businessName,
  onCancel,
  compactTechnicianCards = false,
  appearance = 'default',
}: {
  session: CheckInSession
  businessName: string
  onCancel: () => void
  compactTechnicianCards?: boolean
  appearance?: 'default' | 'public'
}) {
  const { t } = useTranslation()
  const [step, setStep] = useState<WizardStep>('name')

  return (
    <div className="w-full space-y-4">
      <div className="flex justify-start">
        <button
          type="button"
          onClick={onCancel}
          className={`flex items-center rounded-lg border border-nexoraBorder bg-nexoraSurface font-bold text-nexoraMuted hover:border-nexoraBrand ${
            appearance === 'public'
              ? 'absolute left-3 top-1 h-8 gap-0.5 px-2.5 text-[11px] sm:left-8 sm:top-6 lg:left-12 lg:top-10'
              : 'h-11 gap-1.5 px-4 text-sm'
          }`}
        >
          <ArrowLeft className={appearance === 'public' ? 'h-3 w-3' : 'h-4 w-4'} />
          {t(`${K}.back`)}
        </button>
      </div>

      {step === 'name' ? (
        <CustomerNameStep
          value={session.customerName}
          phoneLabel={session.phone}
          onChange={session.setCustomerName}
          onBack={session.changePhone}
          onContinue={() => setStep('technician')}
          // The consent checkbox is mandatory on both layouts, so it has to be reachable here too
          // — otherwise a guest could never satisfy the rule the submit button enforces.
          extra={
            <label className="flex cursor-pointer items-start gap-2.5">
              <input
                type="checkbox"
                checked={session.smsConsent}
                onChange={(e) => session.setSmsConsent(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 accent-nexoraBrand"
              />
              <span className="text-xs leading-snug text-nexoraMuted">
                {t('components.checkin.CustomerIdentityCard.smsConsent', { businessName })}
              </span>
            </label>
          }
        />
      ) : null}

      {step === 'technician' ? (
        <SelectTechnicianStep
          technicians={session.technicians}
          isLoading={session.isTechniciansLoading}
          selectedStaffId={session.preferredStaffId}
          onSelect={session.choosePreferredStaff}
          onBack={() => setStep('name')}
          onContinue={() => setStep('services')}
          compact={compactTechnicianCards}
        />
      ) : null}

      {step === 'services' ? (
        <SelectServicesStep
          services={session.catalog}
          isLoading={session.isCatalogLoading}
          selectedServiceIds={session.selectedServiceIds}
          isSubmitting={session.isSubmitting}
          errorMessage={session.submitError}
          onAdd={session.addService}
          onBack={() => setStep('technician')}
          onContinue={() => setStep('overview')}
          footerNote={
            <SelectedServicesSummary
              services={session.selectedServices}
              totalPrice={session.totalPrice}
              onAdd={session.addService}
              onRemove={session.removeService}
              onRemoveGroup={session.removeServiceGroup}
              isSubmitting={session.isSubmitting}
            />
          }
        />
      ) : null}

      {step === 'overview' ? (
        <OverviewStep
          services={session.selectedServices}
          technicians={session.technicians}
          choices={session.technicianChoices}
          customerName={session.customerName.trim()}
          customerPhone={session.phone}
          bookingTime={session.bookingTimeLabel}
          isSubmitting={session.isSubmitting}
          errorMessage={session.submitError}
          onChoose={session.chooseServiceTechnician}
          onBack={() => setStep('services')}
          onSubmit={session.submit}
        />
      ) : null}
    </div>
  )
}
