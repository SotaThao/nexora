// Shell for the Self Check-In kiosk.
//
// Owns the three states that exist before any check-in flow can run:
//   - no token stored at all → the tablet was never paired (or signed out)
//   - the server rejected the token → revoked screen
//   - token accepted → the salon's branding, and the flow itself
//
// Once the token is accepted this hands straight over to SelfCheckInFlow, which is remounted from
// scratch for every customer (see `sessionKey`).
import { useEffect, useState } from 'react'
import { Loader2, QrCode, WifiOff } from 'lucide-react'
import { useTranslation } from '../../contexts/LanguageContext'
import posDeviceHttpClient, {
  POS_DEVICE_REVOKED_EVENT,
  posDeviceToken,
} from '../../lib/posDeviceHttpClient'
import PosDeviceRevokedPage from './PosDeviceRevokedPage'
import SelfCheckInFlow from './SelfCheckInFlow'
import SelfCheckInSettings from './SelfCheckInSettings'
import type { PosCheckInLayout } from '../../types/repositories'

const K = 'components.posDevice.SelfCheckInPage'

interface SelfCheckInContext {
  businessName: string
  logoUrl: string | null
  deviceName: string
  checkInLayout: PosCheckInLayout
}

type LoadState = 'loading' | 'ready' | 'unpaired' | 'revoked' | 'offline'

export default function SelfCheckInPage() {
  const { t } = useTranslation()
  const [state, setState] = useState<LoadState>('loading')
  const [context, setContext] = useState<SelfCheckInContext | null>(null)
  // Bumped every time a check-in ends, which remounts the flow and discards the customer's data
  // rather than trusting a reset function to clear every field.
  const [sessionKey, setSessionKey] = useState(0)
  const [settingsOpen, setSettingsOpen] = useState(false)

  useEffect(() => {
    // The client dispatches this from its 401 branch, so any request anywhere in the kiosk can
    // flip the whole screen without each caller handling it.
    const onRevoked = () => setState('revoked')
    window.addEventListener(POS_DEVICE_REVOKED_EVENT, onRevoked)
    return () => window.removeEventListener(POS_DEVICE_REVOKED_EVENT, onRevoked)
  }, [])

  useEffect(() => {
    let cancelled = false

    if (!posDeviceToken.get()) {
      setState('unpaired')
      return
    }

    posDeviceHttpClient
      .get<SelfCheckInContext>('/api/v1/pos-device/self-checkin/context')
      .then((res) => {
        if (cancelled || !res) return
        setContext(res)
        setState('ready')
      })
      .catch((err: { status?: number }) => {
        if (cancelled) return
        // 401 already flipped the state via the event above; anything else is a transport problem
        // the salon can retry.
        if (err?.status !== 401) setState('offline')
      })

    return () => {
      cancelled = true
    }
  }, [])

  if (state === 'revoked') return <PosDeviceRevokedPage />

  if (state === 'loading') {
    return (
      <KioskShell>
        <Loader2 className="h-8 w-8 animate-spin text-nexoraBrand" />
      </KioskShell>
    )
  }

  if (state === 'unpaired') {
    return (
      <KioskShell>
        <QrCode className="h-10 w-10 text-nexoraMuted" />
        <h1 className="text-2xl font-bold leading-tight text-nexoraText">{t(`${K}.unpairedTitle`)}</h1>
        <p className="text-sm font-medium text-nexoraMuted">{t(`${K}.unpairedBody`)}</p>
      </KioskShell>
    )
  }

  if (state === 'offline') {
    return (
      <KioskShell>
        <WifiOff className="h-10 w-10 text-nexoraDanger" />
        <h1 className="text-2xl font-bold leading-tight text-nexoraText">{t(`${K}.offlineTitle`)}</h1>
        <p className="text-sm font-medium text-nexoraMuted">{t(`${K}.offlineBody`)}</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="h-14 rounded-lg bg-nexoraBrand px-6 text-base font-bold text-white hover:bg-nexoraBrandDark"
        >
          {t(`${K}.retry`)}
        </button>
      </KioskShell>
    )
  }

  if (settingsOpen) {
    return (
      <SelfCheckInSettings
        deviceName={context?.deviceName ?? ''}
        businessName={context?.businessName ?? ''}
        onClose={() => setSettingsOpen(false)}
        onSignedOut={() => {
          setSettingsOpen(false)
          setState('unpaired')
        }}
      />
    )
  }

  // The phone keypad *is* the idle screen — there is no "tap to start" screen in front of it. A
  // tablet by the door is already an invitation; a first screen whose only job is to be tapped
  // once costs every customer a step and buys nothing.
  return (
    <div className="min-h-screen bg-nexoraCanvas p-6">
      <SelfCheckInFlow
        key={sessionKey}
        businessName={context?.businessName ?? ''}
        logoUrl={context?.logoUrl ?? null}
        deviceName={context?.deviceName ?? ''}
        // Owner-configurable per business — a salon that trained its staff on the step flow can
        // keep it while the default moved to the one-page form.
        layout={context?.checkInLayout ?? 'SinglePage'}
        // Ending a check-in returns to a fresh keypad rather than a home screen, so the tablet is
        // ready for the next person with nothing of the last one left on it.
        onExit={() => setSessionKey((prev) => prev + 1)}
        onOpenSettings={() => setSettingsOpen(true)}
      />
    </div>
  )
}

function KioskShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-nexoraCanvas p-8 text-center">
      {children}
    </div>
  )
}
