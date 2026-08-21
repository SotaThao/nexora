// The whole of check-in, on either surface.
//
// The kiosk mounts this with its device-token source; the front desk mounts it with the merchant
// one. Nothing else differs except `autoReturnSeconds`, which is the single honest behavioural
// difference between a tablet nobody is standing at and a desk somebody is.
//
// Keypad, interstitial and thank-you screen live here rather than in a layout because they are the
// same on every layout — a layout only owns the middle, where the questions are asked.
import { Loader2 } from 'lucide-react'
import { useTranslation } from '../../contexts/LanguageContext'
import PhoneCheckInStep from '../dashboard/views/pos/PhoneCheckInStep'
import SinglePageCheckInLayout from './layouts/SinglePageCheckInLayout'
import WizardCheckInLayout from './layouts/WizardCheckInLayout'
import ActiveVisitInterstitial from './parts/ActiveVisitInterstitial'
import ThankYouScreen from './parts/ThankYouScreen'
import useCheckInSession from './useCheckInSession'
import type { CheckInSourceHook } from './types'
import type { PosCheckInLayout } from '../../types/repositories'

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
}: {
  useSource: CheckInSourceHook
  layout: PosCheckInLayout
  businessName: string
  // Kiosk only: the thank-you screen counts itself back to the keypad. The front desk passes null
  // and waits for Done.
  autoReturnSeconds?: number | null
  // Fires the moment the order exists, so the caller's lists can catch up while the guest is still
  // reading their number.
  onCheckedIn?: (orderNumber: string) => void
  // Fires only once a check-in actually happened and the operator is done reading the number off
  // the thank-you screen. The front desk navigates away on this; the kiosk goes back to idle.
  onFinished?: () => void
  // Fires when the guest never got checked in — Cancel, or "that's me" on the active-visit screen.
  // Nothing was created, so the default is to sit back on the keypad ready for the next person
  // rather than taking the operator somewhere else.
  onCancelled?: () => void
  // Kiosk only: the salon's logo, plus the device name and settings gear (both fixed-positioned,
  // so where they sit in this subtree does not matter). Shown on the keypad and nowhere else.
  idleSlot?: React.ReactNode
  // Front-desk-only density option. Kiosk callers omit it and retain avatar cards.
  compactTechnicianCards?: boolean
}) {
  const { t } = useTranslation()

  const session = useCheckInSession({
    useSource,
    submitErrorMessage: t(`${K}.submitError`),
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
    session.reset()
    onCancelled?.()
  }

  if (session.phase === 'done') {
    return (
      <ThankYouScreen
        orderNumber={session.orderNumber}
        customerName={session.customerName.trim()}
        onDone={finishAfterCheckIn}
        autoReturnSeconds={autoReturnSeconds}
      />
    )
  }

  if (session.phase === 'phone') {
    return (
      <div className="w-full space-y-4">
        {idleSlot}
        <PhoneCheckInStep
          businessName={businessName}
          initialDigits={session.phone}
          onSubmit={session.submitPhone}
        />
      </div>
    )
  }

  if (session.phase === 'lookingUp') {
    return (
      <div className="flex min-h-[240px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-nexoraBrand" />
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
    />
  ) : (
    <SinglePageCheckInLayout
      session={session}
      businessName={businessName}
      onCancel={abandon}
      compactTechnicianCards={compactTechnicianCards}
    />
  )
}
