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
import CheckInActivePromotionsSection from '../parts/CheckInActivePromotionsSection'
import ServiceCatalogSection from '../parts/ServiceCatalogSection'
import TechnicianPickerGrid from '../parts/TechnicianPickerGrid'
import type { CheckInSession } from '../useCheckInSession'
import type { PosPromotionApiDto } from '../../../types/repositories'

const K = 'components.checkin.SinglePageCheckInLayout'

export default function SinglePageCheckInLayout({
  session,
  businessName,
  onCancel,
  compactTechnicianCards = false,
  businessId,
  promotions,
  appearance = 'default',
}: {
  session: CheckInSession
  businessName: string
  onCancel: () => void
  compactTechnicianCards?: boolean
  /** Front desk only — loads active promotions under the service catalog. */
  businessId?: string
  /** Door-QR public page — promotions from the page payload. */
  promotions?: PosPromotionApiDto[]
  appearance?: 'default' | 'public'
}) {
  const { t } = useTranslation()

  const promotionsSection = businessId ? (
    <CheckInActivePromotionsSection source="merchant" businessId={businessId} />
  ) : promotions && promotions.length > 0 ? (
    <CheckInActivePromotionsSection
      source="inline"
      promotions={promotions}
      variant={appearance === 'public' ? 'strip' : 'panel'}
    />
  ) : null

  return (
    <div className="mx-auto w-full max-w-6xl space-y-4">
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
            onAdd={session.addService}
            isSubmitting={session.isSubmitting}
          />

          {promotionsSection}
        </div>

        <aside className="min-w-0 space-y-4 lg:sticky lg:top-4 lg:self-start">
          <SelectedServicesSummary
            services={session.selectedServices}
            totalPrice={session.totalPrice}
            onAdd={session.addService}
            onRemove={session.removeService}
            onRemoveGroup={session.removeServiceGroup}
            isSubmitting={session.isSubmitting}
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
