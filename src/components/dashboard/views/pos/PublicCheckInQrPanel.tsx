// PublicCheckInQrPanel — the merchant-side half of POS Public Check-In: the Owner needs a QR
// they can print and stick on the door, because the whole point of the feature is that a
// customer checks in from their own phone (POS-Public-Check-In-Technical.md §1/§3 decision 2).
// The slug is static, so this QR is printed once and never rotates.
//
// Lives on POS > Public Check-In (PosPublicCheckInView), the same "print this URL" job
// BookingLinkShare does for the public booking page.
import { useState } from 'react'
import { AlertTriangle, Check, Copy, Download, Printer, QrCode } from 'lucide-react'
import { useTranslation } from '../../../../contexts/LanguageContext'
import { useNotification } from '../../../../contexts/NotificationContext'
import { useCheckInSettings } from '../../../../data/hooks/usePosCheckIn'
import { copyTextToClipboard } from '../../../../utils/clipboard'
import { buildPublicQrImageUrl, downloadQrCode, QR_IMAGE_SIZES } from '../../../../utils/qrUtils'
import { getWebUrlOrigin } from '../../../../utils/webUrlBase'

const TK = 'components.dashboard.views.pos.PublicCheckInQrPanel.'

/** The poster is written into a new window, outside React's escaping. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function buildCheckInPosterHtml({
  businessName,
  headline,
  instruction,
  qrImageUrl,
  displayUrl,
}: {
  businessName: string
  headline: string
  instruction: string
  qrImageUrl: string
  displayUrl: string
}): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${escapeHtml(businessName)}</title>
  <style>
    @page{size:A4;margin:0;}
    *{margin:0;padding:0;box-sizing:border-box;font-family:system-ui,-apple-system,"Segoe UI",sans-serif;}
    body{width:210mm;min-height:297mm;padding:26mm 18mm;background:#fff;color:#0B1220;text-align:center;}
    .biz{font-size:15px;letter-spacing:4px;color:#4648D8;font-weight:800;margin-bottom:14mm;text-transform:uppercase;}
    h1{font-size:40px;font-weight:900;line-height:1.2;margin-bottom:12mm;}
    .qr img{width:330px;height:330px;border:1px solid #DDE5EF;border-radius:16px;padding:14px;}
    .how{font-size:20px;font-weight:600;color:#4D5870;margin:12mm 0 8mm;}
    .url{font-size:15px;color:#4D5870;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;}
  </style></head><body onload="window.print()">
    <div class="biz">${escapeHtml(businessName)}</div>
    <h1>${escapeHtml(headline)}</h1>
    <div class="qr"><img src="${escapeHtml(qrImageUrl)}" alt=""></div>
    <div class="how">${escapeHtml(instruction)}</div>
    <div class="url">${escapeHtml(displayUrl)}</div>
  </body></html>`
}

export default function PublicCheckInQrPanel({
  businessId,
  businessSlug,
  businessName,
}: {
  businessId?: string
  businessSlug?: string
  businessName?: string
}) {
  const { t } = useTranslation()
  const { showToast } = useNotification()
  const { data: checkInSettings } = useCheckInSettings(businessId)
  const [isCopied, setIsCopied] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const showEnableNotice =
    checkInSettings != null && checkInSettings.publicCheckInEnabled !== true

  if (!businessSlug) return null

  const url = `${getWebUrlOrigin()}/checkin/${businessSlug}`
  const displayUrl = url.replace(/^https?:\/\//, '')
  const previewQrUrl = buildPublicQrImageUrl(url, QR_IMAGE_SIZES.zoom)
  const salonName = businessName?.trim() || t(TK + 'fallbackBusinessName')

  const handleCopy = async () => {
    try {
      await copyTextToClipboard(url)
      setIsCopied(true)
      showToast(t(TK + 'copied'))
      window.setTimeout(() => setIsCopied(false), 2000)
    } catch {
      showToast(t('common.error'), 'error')
    }
  }

  const handleDownload = async () => {
    setIsDownloading(true)
    try {
      await downloadQrCode(
        buildPublicQrImageUrl(url, QR_IMAGE_SIZES.print),
        `checkin-qr-${businessSlug}.png`,
      )
    } catch {
      showToast(t('common.error'), 'error')
    } finally {
      setIsDownloading(false)
    }
  }

  // Popup blockers return null — say so instead of failing silently.
  const handlePrint = () => {
    const posterWindow = window.open('', '_blank')
    if (!posterWindow) {
      showToast(t(TK + 'printBlocked'), 'error')
      return
    }
    posterWindow.document.write(
      buildCheckInPosterHtml({
        businessName: salonName,
        headline: t(TK + 'posterHeadline'),
        instruction: t(TK + 'posterInstruction'),
        qrImageUrl: buildPublicQrImageUrl(url, QR_IMAGE_SIZES.print),
        displayUrl,
      }),
    )
    posterWindow.document.close()
  }

  return (
    <div className="nexora-card flex min-h-0 flex-1 flex-col p-4 lg:p-6">
      <div className="mb-3 flex shrink-0 items-start gap-2 lg:mb-4">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-nexoraCanvas text-nexoraBrand">
          <QrCode className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <h3 className="text-sm font-extrabold text-nexoraText">{t(TK + 'title')}</h3>
          <p className="mt-0.5 text-xs text-nexoraMuted">{t(TK + 'description')}</p>
        </div>
      </div>

      {showEnableNotice ? (
        <div className="mb-3 flex shrink-0 items-start gap-2 rounded-lg border border-nexoraWarning bg-amber-50 p-2.5 lg:mb-4">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-nexoraWarning" />
          <p className="text-[11px] font-semibold text-nexoraText">{t(TK + 'enableNotice')}</p>
        </div>
      ) : null}

      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-4 lg:flex-row lg:gap-10">
        <div className="shrink-0 rounded-2xl border border-nexoraBorder bg-white p-3 lg:p-5">
          <img
            src={previewQrUrl}
            alt={t(TK + 'qrAlt', { businessName: salonName })}
            width={280}
            height={280}
            className="h-[168px] w-[168px] lg:h-[280px] lg:w-[280px]"
          />
        </div>

        <div className="w-full min-w-0 max-w-md space-y-3 lg:max-w-lg">
          <div className="flex items-center justify-between gap-2 rounded-lg border border-nexoraBorder bg-white p-2">
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="min-w-0 flex-1 truncate pl-1 text-left font-mono text-[11px] text-nexoraMuted hover:text-nexoraBrand"
            >
              {displayUrl}
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

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => void handleDownload()}
              disabled={isDownloading}
              className="flex h-11 items-center justify-center gap-2 rounded-lg border border-nexoraBorder text-xs font-bold text-nexoraText transition hover:border-nexoraBrand disabled:opacity-60"
            >
              <Download className="h-3.5 w-3.5" />
              {t(TK + 'downloadButton')}
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="flex h-11 items-center justify-center gap-2 rounded-lg bg-nexoraBrand text-xs font-bold text-white transition hover:bg-nexoraBrandDark"
            >
              <Printer className="h-3.5 w-3.5" />
              {t(TK + 'printButton')}
            </button>
          </div>

          <p className="text-[11px] text-nexoraMuted">{t(TK + 'printHint')}</p>
        </div>
      </div>
    </div>
  )
}
