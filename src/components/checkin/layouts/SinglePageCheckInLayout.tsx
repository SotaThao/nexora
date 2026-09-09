// The default check-in layout: everything after the keypad on one page.
//
// Chosen over the step flow because the questions are not actually sequential — a guest who knows
// they want a pedicure with Chloe should not have to walk through four screens to say so, and the
// front desk should be able to correct any of it without going back. The wizard is still available
// per business (see WizardCheckInLayout and the check-in layout setting).
//
// Holds no state and no rules: everything comes off the session, so this file and the wizard
// cannot disagree about what check-in does.
import { ArrowLeft, Loader2, UsersRound } from 'lucide-react'
import { useTranslation } from '../../../contexts/LanguageContext'
import CustomerIdentityCard from '../parts/CustomerIdentityCard'
import CheckInSectionCard from '../parts/CheckInSectionCard'
import FrontDeskNoteCard from '../parts/FrontDeskNoteCard'
import SelectedServicesSummary from '../parts/SelectedServicesSummary'
import ServiceCatalogSection from '../parts/ServiceCatalogSection'
import TechnicianPickerGrid from '../parts/TechnicianPickerGrid'
import type { CheckInSession } from '../useCheckInSession'

const K = 'components.checkin.SinglePageCheckInLayout'

export default function SinglePageCheckInLayout({
  session,
  businessName,
  onCancel,
  compactTechnicianCards = false,
}: {
  session: CheckInSession
  businessName: string
  onCancel: () => void
  compactTechnicianCards?: boolean
}) {
  const { t } = useTranslation()

  return (
    <div className="mx-auto w-full max-w-6xl space-y-4">
      <div className="flex justify-start">
        <button
          type="button"
          onClick={onCancel}
          className="flex h-11 items-center gap-1.5 rounded-lg border border-nexoraBorder bg-nexoraSurface px-4 text-sm font-bold text-nexoraMuted hover:border-nexoraBrand"
        >
          <ArrowLeft className="h-4 w-4" />
          {t(`${K}.back`)}
        </button>
      </div>

      {session.bookingTimeLabel ? (
        <p className="rounded-xl bg-nexoraBrand/5 px-3 py-2 text-center text-xs font-bold text-nexoraBrandDark">
          {t(`${K}.bookingAt`, { time: session.bookingTimeLabel })}
        </p>
      ) : null}

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(300px,360px)]">
        <div className="min-w-0 space-y-4">
          <CustomerIdentityCard
            phone={session.phone}
            customerName={session.customerName}
            onChangeName={session.setCustomerName}
            onChangePhone={session.changePhone}
            smsConsent={session.smsConsent}
            onChangeSmsConsent={session.setSmsConsent}
            businessName={businessName}
          />

          <CheckInSectionCard
            title={t(`${K}.technicianTitle`)}
            subtitle={t(`${K}.technicianSubtitle`)}
            icon={UsersRound}
          >
            <TechnicianPickerGrid
              technicians={session.technicians}
              isLoading={session.isTechniciansLoading}
              selectedStaffId={session.preferredStaffId}
              onSelect={session.choosePreferredStaff}
              anyoneLabel={t(`${K}.firstAvailable`)}
              anyoneHint={t(`${K}.firstAvailableHint`)}
              searchPlaceholder={t(`${K}.technicianSearchPlaceholder`)}
              emptyLabel={t(`${K}.noTechnicians`)}
              busyLabel={t(`${K}.technicianBusy`)}
              availableLabel={t(`${K}.technicianAvailable`)}
              queueLabel={(count) => t(`${K}.technicianQueueCount`, { count })}
              compact={compactTechnicianCards}
              autoWrap
            />
          </CheckInSectionCard>

          <ServiceCatalogSection
            services={session.catalog}
            isLoading={session.isCatalogLoading}
            selectedServiceIds={session.selectedServiceIds}
            onToggle={session.toggleService}
          />
        </div>

        <aside className="min-w-0 space-y-4 lg:sticky lg:top-4 lg:self-start">
          <SelectedServicesSummary
            services={session.selectedServices}
            totalPrice={session.totalPrice}
            onRemove={session.toggleService}
          />

          <FrontDeskNoteCard note={session.note} onChangeNote={session.setNote} />

          {session.submitError ? (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-nexoraDanger">
              {session.submitError}
            </p>
          ) : null}

          <button
            type="button"
            onClick={session.submit}
            disabled={session.isSubmitting}
            className="flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-nexoraBrand text-base font-black text-white hover:bg-nexoraBrandDark disabled:opacity-60"
          >
            {session.isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
            {t(`${K}.submit`)}
          </button>
        </aside>
      </div>
    </div>
  )
}
