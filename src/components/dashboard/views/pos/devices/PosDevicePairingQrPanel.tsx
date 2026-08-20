// Pairing QR for Check-In Devices. The image is rendered server-side and arrives as a data URI, so
// there is no QR library on the client and no raw SVG injection.
//
// A code dies two ways, and the panel watches for both: its window runs out (the countdown below,
// driven by the token's own expiresAt), or a tablet scans it (usePosDevicePairingQrUsed, polling
// every 15s). Either way a fresh code takes its place without anyone reloading the page.
import { useEffect, useState } from 'react'
import { QrCode } from 'lucide-react'
import { useTranslation } from '../../../../../contexts/LanguageContext'
import {
  usePosDevicePairingQr,
  usePosDevicePairingQrUsed,
} from '../../../../../data/hooks/usePosDevices'
import { Skeleton } from '../../../../ui/skeleton'

const K = 'components.dashboard.views.pos.devices.PosDevicePairingQrPanel'

function secondsUntil(expiresAt?: string | null): number {
  if (!expiresAt) return 0
  const remainingMs = new Date(expiresAt).getTime() - Date.now()
  return Math.max(0, Math.ceil(remainingMs / 1000))
}

// Minutes now that a window lasts five of them — a bare "273s" is not a duration anyone reads.
function formatCountdown(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

export default function PosDevicePairingQrPanel({ businessId }: { businessId: string }) {
  const { t } = useTranslation()
  const { data: token, isLoading } = usePosDevicePairingQr(businessId)
  const [secondsLeft, setSecondsLeft] = useState(0)

  // Only asks about a code that actually exists; the poll dies with this component.
  usePosDevicePairingQrUsed(businessId, token?.token, Boolean(token))

  useEffect(() => {
    setSecondsLeft(secondsUntil(token?.expiresAt))
    const timer = window.setInterval(() => setSecondsLeft(secondsUntil(token?.expiresAt)), 1000)
    return () => window.clearInterval(timer)
  }, [token?.expiresAt])

  const totalWindowSeconds = token
    ? Math.max(
        1,
        Math.round((new Date(token.expiresAt).getTime() - new Date(token.issuedAt).getTime()) / 1000),
      )
    : 1
  const progressPercent = Math.min(100, Math.max(0, (secondsLeft / totalWindowSeconds) * 100))

  return (
    <section className="rounded-xl border border-nexoraBorder bg-nexoraSurface p-4">
      <h3 className="flex items-center gap-2 text-sm font-bold text-nexoraText">
        <QrCode className="h-4 w-4 text-nexoraBrand" />
        {t(`${K}.title`)}
      </h3>

      <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-center">
        {isLoading || !token ? (
          <Skeleton height={160} width={160} borderRadius={16} />
        ) : (
          <img
            src={token.qrImageDataUri}
            alt={t(`${K}.qrAlt`)}
            className="h-40 w-40 rounded-2xl border border-nexoraBorder bg-white object-contain p-2"
          />
        )}

        <div className="min-w-0 flex-1 space-y-2">
          {token ? (
            <>
              <p className="text-xs text-nexoraMuted">
                {t(`${K}.tokenLine`, { token: token.token, rotation: token.rotationNumber })}
              </p>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-nexoraCanvas">
                <div
                  className="h-full rounded-full bg-nexoraBrand transition-[width] duration-1000 ease-linear"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <p className="text-sm font-bold text-nexoraText">
                {t(`${K}.rotatesIn`, { time: formatCountdown(secondsLeft) })}
              </p>
            </>
          ) : (
            !isLoading && (
              <p className="text-sm font-bold text-nexoraText">{t(`${K}.qrUnavailable`)}</p>
            )
          )}
          <p className="text-[11px] text-nexoraMuted">{t(`${K}.subtitle`)}</p>
        </div>
      </div>
    </section>
  )
}
