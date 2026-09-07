import { useEffect, useState } from 'react'
import { CalendarDays, Clock3, Phone } from 'lucide-react'
import { useTranslation } from '../../../../contexts/LanguageContext'
import { useNotification } from '../../../../contexts/NotificationContext'
import {
  getLandingExpiryTime,
  type LandingPageContent,
} from '../../../../data/repositories/marketingLandingPages'

interface Props {
  content: LandingPageContent
}

export default function LandingPagePreview({ content }: Props) {
  const { t, currentLanguage } = useTranslation()
  const { showToast } = useNotification()
  const [now, setNow] = useState(Date.now)
  const expiry = getLandingExpiryTime(content.expiresOn)
  const isExpired = expiry !== null && expiry <= now
  const seconds = expiry === null ? 0 : Math.max(0, Math.floor((expiry - now) / 1000))

  useEffect(() => {
    setNow(Date.now())
    if (expiry === null) return
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [expiry])

  const countdown = t('marketingSuite.countdownValue', {
    days: Math.floor(seconds / 86400),
    hours: Math.floor((seconds % 86400) / 3600),
    minutes: Math.floor((seconds % 3600) / 60),
    seconds: seconds % 60,
  })

  return (
    <article
      className="overflow-hidden rounded-2xl border border-nexoraBorder bg-nexoraSurface shadow-nexora-soft"
      aria-label={t('marketingSuite.landingPreview')}
    >
      <div className="flex items-center justify-between gap-3 border-b border-nexoraBorder bg-nexoraSurfaceMuted px-4 py-3">
        <span className="text-xs font-semibold text-nexoraMuted">
          {t('marketingSuite.localPreview')}
        </span>
        <span className="rounded-full bg-nexoraBrandSoft px-2.5 py-1 text-xs font-bold text-nexoraBrand">
          {t('marketingSuite.demo')}
        </span>
      </div>
      {content.imageUrl && (
        <img
          src={content.imageUrl}
          alt={content.title || t('marketingSuite.banner')}
          className="aspect-[16/9] w-full object-cover"
          width={800}
          height={450}
        />
      )}
      <div className="space-y-5 p-5 sm:p-6">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-nexoraBrand">
            {t('marketingSuite.sampleSalon')}
          </p>
          <h3 className="break-words text-2xl font-bold tracking-tight text-nexoraText">
            {content.title || t('marketingSuite.titlePlaceholder')}
          </h3>
          {content.subtitle && (
            <p className="mt-3 break-words text-sm leading-relaxed text-nexoraMuted">
              {content.subtitle}
            </p>
          )}
        </div>
        {content.offer && (
          <div className="rounded-xl bg-nexoraBrandSoft/50 p-4">
            <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-nexoraBrand">
              {t('marketingSuite.yourOffer')}
            </h4>
            <p className="whitespace-pre-line break-words text-sm leading-relaxed text-nexoraText">
              {content.offer}
            </p>
          </div>
        )}
        {expiry !== null && (
          <div className="flex items-start gap-2 rounded-xl border border-nexoraBorder p-3 text-sm text-nexoraMuted">
            <Clock3 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <div>
              <p>
                {isExpired
                  ? t('marketingSuite.offerEnded')
                  : t('marketingSuite.offerExpires', {
                      date: new Intl.DateTimeFormat(currentLanguage === 'vi' ? 'vi-VN' : 'en-US', {
                        timeZone: 'America/Chicago',
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      }).format(expiry),
                    })}
              </p>
              {content.countdownEnabled && !isExpired && (
                <p className="mt-1 font-mono font-semibold text-nexoraText">{countdown}</p>
              )}
            </div>
          </div>
        )}
        {(content.bookingEnabled || content.callEnabled) && (
          <div className="space-y-3 border-t border-nexoraRule pt-5">
            {content.bookingEnabled && (
              <button
                type="button"
                disabled={isExpired || !content.bookingUrl}
                onClick={() =>
                  showToast(t('marketingSuite.bookingDemo', { url: content.bookingUrl }))
                }
                className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-nexoraBrand px-4 py-3 text-sm font-bold text-white transition hover:bg-nexoraBrandDark disabled:cursor-not-allowed disabled:opacity-50"
              >
                <CalendarDays className="h-4 w-4" aria-hidden="true" />
                {t('marketingSuite.bookNow')}
              </button>
            )}
            {content.callEnabled && (
              <button
                type="button"
                disabled={isExpired || !content.phone}
                onClick={() => showToast(t('marketingSuite.callDemo', { phone: content.phone }))}
                className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-nexoraBorder px-4 py-3 text-sm font-bold text-nexoraText transition hover:bg-nexoraSurfaceMuted disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Phone className="h-4 w-4" aria-hidden="true" />
                {t('marketingSuite.callNow')}
              </button>
            )}
            <p className="text-center text-xs leading-relaxed text-nexoraMuted">
              {t('marketingSuite.ctaDemo')}
            </p>
          </div>
        )}
      </div>
    </article>
  )
}
