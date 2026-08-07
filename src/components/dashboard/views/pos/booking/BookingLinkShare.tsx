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
      showToast(t(p + 'copied'))
      window.setTimeout(() => setIsCopied(false), 2000)
    } catch {
      showToast(t('common.error'), 'error')
    }
  }

  return (
    <div className="rounded-lg border border-nexoraBorder bg-nexoraCanvas p-2.5">
      <p className="mb-1.5 text-[10px] font-extrabold uppercase tracking-wide text-nexoraMuted">
        {t(p + 'title')}
      </p>
      <div className="flex items-center justify-between gap-2 rounded-lg border border-nexoraBorder bg-white p-2">
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="min-w-0 flex-1 truncate pl-1 text-left font-mono text-[11px] text-nexoraMuted hover:text-nexoraBrand"
        >
          {url.replace(/^https?:\/\//, '')}
        </a>
        <button
          type="button"
          onClick={() => void handleCopy()}
          className="flex shrink-0 items-center gap-1.5 rounded-full px-2 py-1 text-[11px] font-extrabold uppercase tracking-wide text-nexoraBrand transition hover:opacity-80"
        >
          {isCopied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
          <span>{t('common.copy')}</span>
        </button>
      </div>
    </div>
  )
}
