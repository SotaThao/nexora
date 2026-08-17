// Step 5 — the visit number, then back to the home screen on its own.
//
// No SMS is sent from here. The number on this screen is the only confirmation the customer gets,
// which is why it is the largest thing on the page and why the countdown is visible rather than a
// silent timer that snatches it away.
import { useEffect, useState } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { useTranslation } from '../../../contexts/LanguageContext'

const K = 'components.posDevice.SelfCheckInFlow'

const AUTO_RETURN_SECONDS = 8

export default function ThankYouStep({
  orderNumber,
  customerName,
  onDone,
}: {
  orderNumber: string
  customerName: string
  onDone: () => void
}) {
  const { t } = useTranslation()
  const [secondsLeft, setSecondsLeft] = useState(AUTO_RETURN_SECONDS)

  useEffect(() => {
    const timer = window.setInterval(() => setSecondsLeft((prev) => prev - 1), 1000)
    return () => window.clearInterval(timer)
  }, [])

  // Fires from the rendered value rather than a parallel setTimeout, so the screen can never sit
  // at "0s" while nothing happens.
  useEffect(() => {
    if (secondsLeft > 0) return
    onDone()
  }, [secondsLeft, onDone])

  return (
    <div className="mx-auto w-full max-w-md space-y-6 rounded-2xl border border-nexoraBorder bg-nexoraSurface p-8 text-center">
      <CheckCircle2 className="mx-auto h-12 w-12 text-nexoraBrand" />
      <div className="space-y-1">
        <h1 className="text-2xl font-black text-nexoraText">
          {customerName
            ? t(`${K}.thankYouTitleNamed`, { customerName })
            : t(`${K}.thankYouTitle`)}
        </h1>
        <p className="text-sm text-nexoraMuted">{t(`${K}.thankYouBody`)}</p>
      </div>

      <div className="rounded-2xl bg-nexoraCanvas p-6">
        <p className="text-xs font-black uppercase tracking-wider text-nexoraMuted">
          {t(`${K}.thankYouNumberLabel`)}
        </p>
        <p className="mt-1 text-5xl font-black tracking-wide text-nexoraBrand">{orderNumber}</p>
      </div>

      <button
        type="button"
        onClick={onDone}
        className="h-14 w-full rounded-lg border border-nexoraBorder text-base font-bold text-nexoraText hover:border-nexoraBrand"
      >
        {t(`${K}.thankYouDone`, { seconds: String(Math.max(secondsLeft, 0)) })}
      </button>
    </div>
  )
}
