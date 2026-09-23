// The kiosk's check-in: CheckInSurface wired to the device-token data source.
//
// Everything that used to live here — the step machine, the lookups, the submit — moved into
// useCheckInSession, which the front desk runs too. That is the whole point: the two screens kept
// drifting while each owned its own copy, and three attempts to "make them match" all failed
// because they only ever touched the shell. This file now decides two things: where the data comes
// from, and that a tablet nobody is standing at returns to the keypad on its own.
import { Settings } from 'lucide-react'
import { useTranslation } from '../../contexts/LanguageContext'
import CheckInSurface from '../checkin/CheckInSurface'
import useKioskCheckInSource from '../checkin/sources/useKioskCheckInSource'
import type { PosCheckInLayout } from '../../types/repositories'

const K = 'components.posDevice.SelfCheckInFlow'

// The number on the thank-you screen is the only confirmation the customer gets, so the countdown
// is visible rather than a silent timer that snatches it away.
const AUTO_RETURN_SECONDS = 8

export default function SelfCheckInFlow({
  businessName,
  logoUrl,
  deviceName,
  layout,
  onExit,
  onOpenSettings,
}: {
  businessName: string
  logoUrl: string | null
  deviceName: string
  layout: PosCheckInLayout
  onExit: () => void
  onOpenSettings: () => void
}) {
  const { t } = useTranslation()

  return (
    <CheckInSurface
      useSource={useKioskCheckInSource}
      layout={layout}
      businessName={businessName}
      autoReturnSeconds={AUTO_RETURN_SECONDS}
      showKioskPromotions
      // Both endings land in the same place on a tablet by the door: a fresh keypad, with nothing
      // of the last person left on it. The remount is the guarantee of that, not the reset call.
      onFinished={onExit}
      onCancelled={onExit}
      idleSlot={
        <>
          {logoUrl ? (
            <div className="flex flex-col items-center gap-2">
              <img
                src={logoUrl}
                alt={businessName}
                className="h-16 w-16 rounded-2xl border border-nexoraBorder bg-white object-contain p-1"
              />
            </div>
          ) : null}

          {/* Deliberately the quietest things on the screen: staff know they are there, a customer
              has no reason to notice them, and the PIN behind the gear is what actually guards
              Sign Out. Same offset and height, so the two read as one strip along the bottom. */}
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
      }
    />
  )
}
