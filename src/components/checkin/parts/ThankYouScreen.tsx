// The visit number, and the one place the two surfaces genuinely differ.
//
// The tablet by the door counts itself back to the keypad — nobody is standing there to dismiss
// it. The front desk stays put until an operator taps Done, because the number on this screen is
// what they read out, and a screen that clears itself mid-sentence is worse than one extra tap.
import { useEffect, useState } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { useTranslation } from '../../../contexts/LanguageContext'

const K = 'components.checkin.ThankYouScreen'

export default function ThankYouScreen({
  orderNumber,
  customerName,
  onDone,
  autoReturnSeconds,
}: {
  orderNumber: string
  customerName: string
  onDone: () => void
  // null = stay until Done is tapped.
  autoReturnSeconds: number | null
}) {
  const { t } = useTranslation()
  const [secondsLeft, setSecondsLeft] = useState(autoReturnSeconds ?? 0)

  useEffect(() => {
    if (autoReturnSeconds === null) return
    const timer = window.setInterval(() => setSecondsLeft((prev) => prev - 1), 1000)
    return () => window.clearInterval(timer)
  }, [autoReturnSeconds])

  // Fires from the rendered value rather than a parallel setTimeout, so the screen can never sit
  // at "0s" while nothing happens.
  useEffect(() => {
    if (autoReturnSeconds === null || secondsLeft > 0) return
    onDone()
  }, [autoReturnSeconds, secondsLeft, onDone])

  return (
    <div className="mx-auto w-full max-w-md space-y-6 rounded-2xl border border-nexoraBorder bg-nexoraSurface p-8 text-center">
      <CheckCircle2 className="mx-auto h-12 w-12 text-nexoraBrand" />
      <div className="space-y-1">
        <h1 className="text-2xl font-black text-nexoraText">
          {customerName ? t(`${K}.titleNamed`, { customerName }) : t(`${K}.title`)}
        </h1>
        <p className="text-sm text-nexoraMuted">{t(`${K}.body`)}</p>
      </div>

      <div className="rounded-2xl bg-nexoraCanvas p-6">
        <p className="text-xs font-black uppercase tracking-wider text-nexoraMuted">
          {t(`${K}.numberLabel`)}
        </p>
        <p className="mt-1 text-5xl font-black tracking-wide text-nexoraBrand">{orderNumber}</p>
      </div>

      <button
        type="button"
        onClick={onDone}
        className="h-14 w-full rounded-lg border border-nexoraBorder text-base font-bold text-nexoraText hover:border-nexoraBrand"
      >
        {autoReturnSeconds === null
          ? t(`${K}.done`)
          : t(`${K}.doneCountdown`, { seconds: String(Math.max(secondsLeft, 0)) })}
      </button>
    </div>
  )
}
