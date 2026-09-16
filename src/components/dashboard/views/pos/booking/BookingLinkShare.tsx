// BookingLinkShare — small reusable "copy the public booking link" block (POS Booking
// risk-review follow-up, 2026-07-26): there was previously no merchant-facing way to find this
// URL at all, only by asking a developer to look it up in the database. Shared by
// PosBookingSettingsPanel and BookingTab. Renders nothing if the slug isn't loaded yet.
import { useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { useTranslation } from '../../../../../contexts/LanguageContext'
import { useNotification } from '../../../../../contexts/NotificationContext'
import { copyTextToClipboard } from '../../../../../utils/clipboard'
import { getWebUrlOrigin } from '../../../../../utils/webUrlBase'

export default function BookingLinkShare({ businessSlug }: { businessSlug?: string }) {
  const { t } = useTranslation()
  const { showToast } = useNotification()
  const [isCopied, setIsCopied] = useState(false)
  const p = 'components.dashboard.views.pos.BookingLinkShare.'

  if (!businessSlug) return null

  const url = `${getWebUrlOrigin()}/booking/${businessSlug}`

  const handleCopy = async () => {
    try {
      await copyTextToClipboard(url)
      setIsCopied(true)
      window.setTimeout(() => setIsCopied(false), 2000)
    } catch {
      showToast(t('common.error'), 'error')
    }
  }

  return (
    <div
      role="group"
      aria-label={t(p + 'title')}
      className="flex flex-wrap items-center justify-start gap-x-2 gap-y-1 rounded-lg border border-nexoraBorder bg-nexoraCanvas px-3 py-2 text-left"
    >
      <span className="text-[10px] font-extrabold uppercase tracking-wide text-nexoraMuted">
        {t(p + 'title')}:
      </span>
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="min-w-0 max-w-full truncate text-left font-mono text-[11px] text-nexoraMuted hover:text-nexoraBrand"
      >
        {url.replace(/^https?:\/\//, '')}
      </a>
      <button
        type="button"
        onClick={() => void handleCopy()}
        className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg border border-nexoraBrand/15 bg-white px-2.5 text-left text-[11px] font-extrabold uppercase tracking-wide text-nexoraBrand transition hover:border-nexoraBrand/30 hover:bg-nexoraBrandSoft"
      >
        {isCopied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
        <span>{t('common.copy')}</span>
      </button>
    </div>
  )
}
