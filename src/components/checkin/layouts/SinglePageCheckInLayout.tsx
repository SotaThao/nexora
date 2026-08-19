// The default check-in layout: everything after the keypad on one page.
//
// Chosen over the step flow because the questions are not actually sequential — a guest who knows
// they want a pedicure with Chloe should not have to walk through four screens to say so, and the
// front desk should be able to correct any of it without going back. The wizard is still available
// per business (see WizardCheckInLayout and the check-in layout setting).
//
// Holds no state and no rules: everything comes off the session, so this file and the wizard
// cannot disagree about what check-in does.
import { Loader2, X } from 'lucide-react'
import { useTranslation } from '../../../contexts/LanguageContext'
import CustomerIdentityCard from '../parts/CustomerIdentityCard'
import SelectedServicesSummary from '../parts/SelectedServicesSummary'
import ServiceCatalogSection from '../parts/ServiceCatalogSection'
import TechnicianPickerGrid from '../parts/TechnicianPickerGrid'
import type { CheckInSession } from '../useCheckInSession'

const K = 'components.checkin.SinglePageCheckInLayout'

export default function SinglePageCheckInLayout({
  session,
  businessName,
  onCancel,
}: {
  session: CheckInSession
  businessName: string
  onCancel: () => void
}) {
  const { t } = useTranslation()

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="flex h-11 items-center gap-1.5 rounded-lg border border-nexoraBorder bg-nexoraSurface px-4 text-sm font-bold text-nexoraMuted hover:border-nexoraBrand"
        >
          <X className="h-4 w-4" />
          {t(`${K}.cancel`)}
        </button>
      </div>

      {session.bookingTimeLabel ? (
        <p className="rounded-xl bg-nexoraBrand/5 px-3 py-2 text-center text-xs font-bold text-nexoraBrandDark">
          {t(`${K}.bookingAt`, { time: session.bookingTimeLabel })}
        </p>
      ) : null}

      <CustomerIdentityCard
        phone={session.phone}
        customerName={session.customerName}
        onChangeName={session.setCustomerName}
        onChangePhone={session.changePhone}
        smsConsent={session.smsConsent}
        onChangeSmsConsent={session.setSmsConsent}
        businessName={businessName}
      />

      <section className="space-y-3 rounded-2xl border border-nexoraBorder bg-nexoraSurface p-4">
        <div>
          <h2 className="text-lg font-black text-nexoraText">{t(`${K}.technicianTitle`)}</h2>
          <p className="text-sm text-nexoraMuted">{t(`${K}.technicianSubtitle`)}</p>
        </div>
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
        />
      </section>

      <ServiceCatalogSection
        services={session.catalog}
        isLoading={session.isCatalogLoading}
        selectedServiceIds={session.selectedServiceIds}
        onToggle={session.toggleService}
        note={session.note}
        onChangeNote={session.setNote}
      />

      <SelectedServicesSummary
        services={session.selectedServices}
        totalMinutes={session.totalMinutes}
        totalPrice={session.totalPrice}
        onRemove={session.toggleService}
      />

      {session.submitError ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-nexoraDanger">
          {session.submitError}
        </p>
      ) : null}

      <button
        type="button"
        onClick={session.submit}
        disabled={!session.canSubmit || session.isSubmitting}
        className="flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-nexoraBrand to-nexoraLavender text-base font-black text-white hover:from-nexoraBrandDark hover:to-nexoraBrand disabled:opacity-60"
      >
        {session.isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
        {t(`${K}.submit`, { count: String(session.selectedServiceIds.length) })}
      </button>
    </div>
  )
}
