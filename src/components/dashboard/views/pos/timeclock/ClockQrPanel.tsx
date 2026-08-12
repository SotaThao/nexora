// Rotating clock-in QR shown on the front desk iPad. The image itself is rendered server-side and
// arrives as a data URI, so there is no QR library on the client and no raw SVG injection.
//
// Two clocks are in play: the query refetches just under the token's 30s window, and this local
// countdown ticks every second purely for display. If the countdown hits zero before the next
// token lands (slow network), the panel says so rather than showing a code that no longer works.
import { useEffect, useState } from 'react'
import { Clock } from 'lucide-react'
import { useTranslation } from '../../../../../contexts/LanguageContext'
import { useClockQrToken } from '../../../../../data/hooks/usePosTimeClock'
import { Skeleton } from '../../../../ui/skeleton'
import { tk } from './timeClockI18n'

function secondsUntil(expiresAt?: string | null): number {
  if (!expiresAt) return 0
  const remainingMs = new Date(expiresAt).getTime() - Date.now()
  return Math.max(0, Math.ceil(remainingMs / 1000))
}

export default function ClockQrPanel({ businessId }: { businessId: string }) {
  const { t } = useTranslation()
  const { data: token, isLoading } = useClockQrToken(businessId)
  const [secondsLeft, setSecondsLeft] = useState(0)

  useEffect(() => {
    setSecondsLeft(secondsUntil(token?.expiresAt))
    const timer = window.setInterval(() => setSecondsLeft(secondsUntil(token?.expiresAt)), 1000)
    return () => window.clearInterval(timer)
  }, [token?.expiresAt])

  const totalWindowSeconds = token
    ? Math.max(1, Math.round((new Date(token.expiresAt).getTime() - new Date(token.issuedAt).getTime()) / 1000))
    : 1
  const progressPercent = Math.min(100, Math.max(0, (secondsLeft / totalWindowSeconds) * 100))

  return (
    <section className="rounded-xl border border-nexoraBorder bg-nexoraSurface p-4">
      <h3 className="flex items-center gap-2 text-sm font-bold text-nexoraText">
        <Clock className="h-4 w-4 text-nexoraBrand" />
        {t(tk('title'))}
      </h3>

      <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-center">
        {isLoading || !token ? (
          <Skeleton height={160} width={160} borderRadius={16} />
        ) : (
          <img
            src={token.qrImageDataUri}
            alt={t(tk('qrAlt'))}
            className="h-40 w-40 rounded-2xl border border-nexoraBorder bg-white object-contain p-2"
          />
        )}

        <div className="min-w-0 flex-1 space-y-2">
          {token ? (
            <>
              <p className="text-xs text-nexoraMuted">
                {t(tk('tokenLine'), {
                  token: token.token,
                  rotation: token.rotationNumber,
                })}
              </p>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-nexoraCanvas">
                <div
                  className="h-full rounded-full bg-nexoraBrand transition-[width] duration-1000 ease-linear"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <p className="text-sm font-bold text-nexoraText">
                {t(tk('rotatesIn'), { seconds: secondsLeft })}
              </p>
            </>
          ) : (
            !isLoading && (
              <p className="text-sm font-bold text-nexoraText">
                {t(tk('qrUnavailable'))}
              </p>
            )
          )}
          <p className="text-[11px] text-nexoraMuted">
            {t(tk('subtitle'))}
          </p>
        </div>
      </div>
    </section>
  )
}
