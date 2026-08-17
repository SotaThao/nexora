// The tablet's own Settings screen, behind the PIN set at pairing.
//
// Two states, and the boundary between them is the whole point of the screen: until the PIN is
// accepted, nothing is shown that a customer could act on — a wrong PIN keeps the same pad with one
// generic message, never a hint about length, position, or how close the guess was.
//
// A forgotten PIN is not recoverable here by design. The Owner sets a new one from
// POS › Check-In Devices, which is why there is no "reset" affordance on the tablet.
import { useState } from 'react'
import { Loader2, LogOut } from 'lucide-react'
import { useTranslation } from '../../contexts/LanguageContext'
import { posDeviceToken } from '../../lib/posDeviceHttpClient'
import { useSignOutPosDevice, useVerifyPosDevicePin } from '../../data/hooks/usePosDeviceSession'

const K = 'components.posDevice.SelfCheckInSettings'

const PIN_MIN_LENGTH = 4
const PIN_MAX_LENGTH = 6

const KEYPAD_DIGITS = ['1', '2', '3', '4', '5', '6', '7', '8', '9'] as const

export default function SelfCheckInSettings({
  deviceName,
  businessName,
  onClose,
  onSignedOut,
}: {
  deviceName: string
  businessName: string
  onClose: () => void
  onSignedOut: () => void
}) {
  const { t } = useTranslation()
  const [unlocked, setUnlocked] = useState(false)
  const [pin, setPin] = useState('')
  const [pinError, setPinError] = useState(false)
  const [confirmingSignOut, setConfirmingSignOut] = useState(false)

  const verifyPin = useVerifyPosDevicePin()
  const signOut = useSignOutPosDevice()

  const pressDigit = (digit: string) => {
    if (pin.length >= PIN_MAX_LENGTH) return
    setPinError(false)
    setPin((prev) => prev + digit)
  }

  const submitPin = () => {
    verifyPin.mutate(pin, {
      onSuccess: () => setUnlocked(true),
      onError: () => {
        setPinError(true)
        setPin('')
      },
    })
  }

  const handleSignOut = () => {
    signOut.mutate(undefined, {
      onSuccess: () => {
        // Only after the server confirms — clearing first would strand a still-paired tablet with
        // no way to reach the salon if the request had failed.
        posDeviceToken.clear()
        onSignedOut()
      },
    })
  }

  if (!unlocked) {
    return (
      <Shell>
        <div className="text-center">
          <h1 className="text-xl font-black text-nexoraText">{t(`${K}.pinTitle`)}</h1>
          <p className="mt-1 text-sm text-nexoraMuted">{t(`${K}.pinSubtitle`)}</p>
        </div>

        <div className="flex h-14 items-center justify-center gap-3">
          {Array.from({ length: PIN_MAX_LENGTH }, (_, index) => (
            <span
              key={index}
              className={`h-3 w-3 rounded-full ${index < pin.length ? 'bg-nexoraBrand' : 'bg-nexoraBorder'}`}
            />
          ))}
        </div>

        {pinError ? (
          <p className="text-center text-sm font-bold text-nexoraDanger">{t(`${K}.pinWrong`)}</p>
        ) : null}

        <div className="grid grid-cols-3 gap-3">
          {KEYPAD_DIGITS.map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => pressDigit(digit)}
              className="h-20 rounded-xl border border-nexoraBorder bg-white text-2xl font-black text-nexoraText active:bg-nexoraCanvas"
            >
              {digit}
            </button>
          ))}
          <button
            type="button"
            onClick={() => {
              setPin('')
              setPinError(false)
            }}
            className="h-20 rounded-xl border border-nexoraBorder bg-white text-sm font-bold text-nexoraMuted active:bg-nexoraCanvas"
          >
            {t(`${K}.clear`)}
          </button>
          <button
            type="button"
            onClick={() => pressDigit('0')}
            className="h-20 rounded-xl border border-nexoraBorder bg-white text-2xl font-black text-nexoraText active:bg-nexoraCanvas"
          >
            0
          </button>
          <button
            type="button"
            onClick={() => setPin((prev) => prev.slice(0, -1))}
            className="h-20 rounded-xl border border-nexoraBorder bg-white text-xl font-bold text-nexoraText active:bg-nexoraCanvas"
          >
            ⌫
          </button>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="h-14 flex-1 rounded-lg border border-nexoraBorder text-base font-bold text-nexoraText"
          >
            {t(`${K}.cancel`)}
          </button>
          <button
            type="button"
            onClick={submitPin}
            disabled={pin.length < PIN_MIN_LENGTH || verifyPin.isPending}
            className="flex h-14 flex-[2] items-center justify-center gap-2 rounded-lg bg-nexoraBrand text-base font-bold text-white hover:bg-nexoraBrandDark disabled:opacity-60"
          >
            {verifyPin.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
            {t(`${K}.unlock`)}
          </button>
        </div>
      </Shell>
    )
  }

  return (
    <Shell>
      <div className="text-center">
        <h1 className="text-xl font-black text-nexoraText">{t(`${K}.settingsTitle`)}</h1>
        <p className="mt-1 text-sm text-nexoraMuted">{businessName}</p>
      </div>

      <dl className="space-y-1 rounded-xl border border-nexoraBorder p-4">
        <dt className="text-[11px] font-black uppercase tracking-wider text-nexoraMuted">
          {t(`${K}.deviceNameLabel`)}
        </dt>
        <dd className="text-base font-bold text-nexoraText">{deviceName}</dd>
      </dl>

      {confirmingSignOut ? (
        <div className="space-y-2 rounded-xl border border-nexoraDanger bg-red-50 p-4">
          <p className="text-sm font-bold text-nexoraText">{t(`${K}.signOutConfirmTitle`)}</p>
          <p className="text-sm text-nexoraMuted">{t(`${K}.signOutConfirmBody`)}</p>
          {signOut.isError ? (
            <p className="text-sm font-bold text-nexoraDanger">{t(`${K}.signOutError`)}</p>
          ) : null}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={() => setConfirmingSignOut(false)}
              disabled={signOut.isPending}
              className="h-14 flex-1 rounded-lg border border-nexoraBorder bg-nexoraSurface text-base font-bold text-nexoraText disabled:opacity-60"
            >
              {t(`${K}.cancel`)}
            </button>
            <button
              type="button"
              onClick={handleSignOut}
              disabled={signOut.isPending}
              className="flex h-14 flex-1 items-center justify-center gap-2 rounded-lg bg-nexoraDanger text-base font-bold text-white disabled:opacity-60"
            >
              {signOut.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
              {t(`${K}.signOutConfirmButton`)}
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setConfirmingSignOut(true)}
          className="flex h-14 w-full items-center justify-center gap-2 rounded-lg border border-nexoraDanger text-base font-bold text-nexoraDanger hover:bg-red-50"
        >
          <LogOut className="h-5 w-5" />
          {t(`${K}.signOut`)}
        </button>
      )}

      <button
        type="button"
        onClick={onClose}
        className="h-14 w-full rounded-lg border border-nexoraBorder text-base font-bold text-nexoraText"
      >
        {t(`${K}.done`)}
      </button>
    </Shell>
  )
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-nexoraCanvas p-6">
      <div className="w-full max-w-sm space-y-4 rounded-2xl border border-nexoraBorder bg-nexoraSurface p-6">
        {children}
      </div>
    </div>
  )
}
