// The whole of check-in, on either surface.
//
// The kiosk mounts this with its device-token source; the front desk mounts it with the merchant
// one. Nothing else differs except `autoReturnSeconds`, which is the single honest behavioural
// difference between a tablet nobody is standing at and a desk somebody is.
//
// Keypad, interstitial and thank-you screen live here rather than in a layout because they are the
// same on every layout — a layout only owns the middle, where the questions are asked.
import { AlertCircle } from 'lucide-react'
import { useTranslation } from '../../contexts/LanguageContext'
import PhoneCheckInStep from '../dashboard/views/pos/PhoneCheckInStep'
import { Skeleton, SkeletonText } from '../ui/skeleton'
import SinglePageCheckInLayout from './layouts/SinglePageCheckInLayout'
import WizardCheckInLayout from './layouts/WizardCheckInLayout'
import ActiveVisitInterstitial from './parts/ActiveVisitInterstitial'
import CheckInActivePromotionsSection from './parts/CheckInActivePromotionsSection'
import ThankYouScreen from './parts/ThankYouScreen'
import useCheckInSession from './useCheckInSession'
import type { CheckInSourceHook, CheckInSubmitResult } from './types'
import type { PosCheckInLayout, PosPromotionApiDto } from '../../types/repositories'

const K = 'components.checkin.CheckInSurface'

export default function CheckInSurface({
  useSource,
  layout,
  businessName,
  autoReturnSeconds = null,
  onCheckedIn,
  onFinished,
  onCancelled,
  idleSlot,
  compactTechnicianCards = false,
  doneSlot,
  appearance = 'default',
  businessId,
  showKioskPromotions = false,
  promotions,
}: {
  useSource: CheckInSourceHook
  layout: PosCheckInLayout
  businessName: string
  // Kiosk only: the thank-you screen counts itself back to the keypad. The front desk passes null
  // and waits for Done.
  autoReturnSeconds?: number | null
  // Fires the moment the order exists, so the caller's lists can catch up while the guest is still
  // reading their number.
  onCheckedIn?: (orderNumber: string, result: CheckInSubmitResult) => void
  // Fires only once a check-in actually happened and the operator is done reading the number off
  // the thank-you screen. The front desk navigates away on this; the kiosk goes back to idle.
  onFinished?: () => void
  // Fires when the guest never got checked in — Cancel, or "that's me" on the active-visit screen.
  // Nothing was created, so the default is to sit back on the keypad ready for the next person
  // rather than taking the operator somewhere else. Carries the open visit's receipt token when
  // there was one, so a surface that can show queue position has somewhere to send the guest.
  onCancelled?: (activeVisitReceiptToken?: string | null) => void
  // Kiosk only: the salon's logo, plus the device name and settings gear (both fixed-positioned,
  // so where they sit in this subtree does not matter). Shown on the keypad and nowhere else.
  idleSlot?: React.ReactNode
  // Front-desk-only density option. Kiosk callers omit it and retain avatar cards.
  compactTechnicianCards?: boolean
  // Rendered under the thank-you screen. The public page puts its "see my place in line" link
  // here; the kiosk and the front desk pass nothing.
  doneSlot?: React.ReactNode
  // Public door-QR landing uses the dark glass keypad; kiosk and front desk stay on the
  // default light card. Later steps keep the shared layouts either way.
  appearance?: 'default' | 'public'
  // Front desk: promotions on the keypad strip + under services (merchant JWT + businessId).
  businessId?: string
  // Kiosk only: promotions carousel above the phone keypad (device-token API).
  showKioskPromotions?: boolean
  // Door-QR public page: promotions from the page payload (no JWT / device token).
  promotions?: PosPromotionApiDto[]
}) {
  const { t } = useTranslation()

  const session = useCheckInSession({
    useSource,
    submitErrorMessage: t(`${K}.submitError`),
    nameRequiredMessage: t(`${K}.nameRequired`),
    consentRequiredMessage: t(`${K}.consentRequired`),
    onCheckedIn,
  })

  // Two endings, deliberately not one. A completed check-in hands control back to the caller; an
  // abandoned one only clears the draft — a stray Cancel must not pull the front desk off the tab
  // it is working in.
  const finishAfterCheckIn = () => {
    session.reset()
    onFinished?.()
  }

  const abandon = () => {
    const receiptToken = session.activeVisitReceiptToken
    session.reset()
    onCancelled?.(receiptToken)
  }

  const keypadPromotions =
    showKioskPromotions ? (
      <CheckInActivePromotionsSection source="kiosk" variant="strip" />
    ) : businessId ? (
      <CheckInActivePromotionsSection
        source="merchant"
        businessId={businessId}
        variant="strip"
      />
    ) : promotions && promotions.length > 0 ? (
      <CheckInActivePromotionsSection
        source="inline"
        promotions={promotions}
        variant="strip"
      />
    ) : null

  if (session.phase === 'done') {
    return (
      <div className="w-full space-y-4">
        <ThankYouScreen
          orderNumber={session.orderNumber}
          customerName={session.customerName.trim()}
          onDone={finishAfterCheckIn}
          autoReturnSeconds={autoReturnSeconds}
        />
        {doneSlot}
      </div>
    )
  }

  if (session.phase === 'phone') {
    // flex + gap (not space-y): a `display: contents` wrapper would swallow space-y margins.
    return (
      <div
        className={`flex w-full flex-col items-center ${
          appearance === 'public' ? 'gap-3 sm:gap-8' : 'gap-8'
        }`}
      >
        {keypadPromotions}
        {idleSlot}
        <PhoneCheckInStep
          appearance={appearance}
          businessName={businessName}
          initialDigits={session.phone}
          onSubmit={session.submitPhone}
        />
      </div>
    )
  }

  if (session.phase === 'lookingUp') {
    return (
      <div
        className="mx-auto flex min-h-[240px] w-full max-w-xl items-center"
        data-testid="check-in-lookup-skeleton"
      >
        <div
          className={
            appearance === 'public'
              ? 'public-checkin-card mx-auto'
              : 'w-full rounded-2xl border border-nexoraBorder bg-white p-5 shadow-sm'
          }
        >
          <Skeleton width="38%" height={13} borderRadius={6} />
          <Skeleton width="64%" height={24} borderRadius={8} className="mt-3" />
          <SkeletonText count={2} height={12} className="mt-4" />
          <div className="mt-5 grid grid-cols-2 gap-3">
            <Skeleton height={42} borderRadius={10} />
            <Skeleton height={42} borderRadius={10} />
          </div>
        </div>
      </div>
    )
  }

  // A stop the guest cannot work around by editing the form, so it replaces the form rather
  // than sitting on top of it. Only the public surface can reach this — see CheckInSourceResult.
  if (session.phase === 'form' && session.checkInBlockedMessage) {
    return (
      <div
        className={
          appearance === 'public'
            ? 'public-checkin-card mx-auto space-y-6'
            : 'mx-auto w-full max-w-md space-y-6 rounded-2xl border border-nexoraBorder bg-nexoraSurface p-6 text-center'
        }
      >
        <AlertCircle className="mx-auto h-10 w-10 text-nexoraWarning" />
        <p className={`text-base font-bold ${appearance === 'public' ? 'text-white' : 'text-nexoraText'}`}>
          {session.checkInBlockedMessage}
        </p>
        <button
          type="button"
          onClick={abandon}
          className={
            appearance === 'public'
              ? 'h-14 w-full rounded-lg border border-white/25 text-base font-bold text-white hover:border-white/60'
              : 'h-14 w-full rounded-lg border border-nexoraBorder text-base font-bold text-nexoraText hover:border-nexoraBrand'
          }
        >
          {t(`${K}.blockedBack`)}
        </button>
      </div>
    )
  }

  if (session.phase === 'activeVisit') {
    return (
      <ActiveVisitInterstitial
        orderNumber={session.activeVisitOrderNumber ?? ''}
        onExit={abandon}
        onContinue={session.continueAsNewGuest}
      />
    )
  }

  return layout === 'Wizard' ? (
    <WizardCheckInLayout
      session={session}
      businessName={businessName}
      onCancel={abandon}
      compactTechnicianCards={compactTechnicianCards}
      appearance={appearance}
    />
  ) : (
    <SinglePageCheckInLayout
      session={session}
      businessName={businessName}
      onCancel={abandon}
      compactTechnicianCards={compactTechnicianCards}
      businessId={businessId}
      promotions={promotions}
      appearance={appearance}
    />
  )
}
