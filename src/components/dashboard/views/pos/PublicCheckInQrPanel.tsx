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
import { useBusinessHours } from '../../../../data/hooks/useMerchantSetup'
import { useCheckInSettings } from '../../../../data/hooks/usePosCheckIn'
import { copyTextToClipboard } from '../../../../utils/clipboard'
import { buildPublicQrImageUrl, downloadQrCode, QR_IMAGE_SIZES } from '../../../../utils/qrUtils'
import { getWebUrlOrigin } from '../../../../utils/webUrlBase'
import { formatCheckInPosterHours } from './formatCheckInPosterHours'

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

const NEXORA_MARK_SRC = '/homepage/assets/images/icon-nexora.png'

function buildCheckInPosterHtml({
  businessName,
  scanTo,
  hoursCaption,
  logoUrl,
  qrImageUrl,
  displayUrl,
}: {
  businessName: string
  scanTo: string
  hoursCaption: string | null
  logoUrl: string
  qrImageUrl: string
  displayUrl: string
}): string {
  const hoursBlock = hoursCaption
    ? `<div class="hours">${escapeHtml(hoursCaption)}</div>`
    : ''
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${escapeHtml(businessName)}</title>
  <style>
    @page{size:A4;margin:0;}
    *{margin:0;padding:0;box-sizing:border-box;font-family:system-ui,-apple-system,"Segoe UI",sans-serif;}
    body{width:210mm;min-height:297mm;padding:22mm 18mm;background:#fff;color:#0B1220;text-align:center;}
    .mark{display:flex;align-items:center;justify-content:center;gap:10px;margin-bottom:12mm;}
    .mark img{width:36px;height:36px;}
    .mark span{font-size:22px;letter-spacing:6px;color:#4648D8;font-weight:800;}
    .qr img{width:330px;height:330px;border:1px solid #DDE5EF;border-radius:16px;padding:14px;}
    .scan{font-size:18px;font-weight:800;letter-spacing:1.2px;text-transform:uppercase;margin:10mm 18mm 4mm;}
    .hours{font-size:15px;font-weight:700;letter-spacing:0.8px;color:#4D5870;text-transform:uppercase;}
    .url{font-size:13px;color:#4D5870;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;margin-top:10mm;}
  </style></head><body onload="window.print()">
    <div class="mark"><img src="${escapeHtml(logoUrl)}" width="36" height="36" alt="NEXORA"><span>NEXORA</span></div>
    <div class="qr"><img src="${escapeHtml(qrImageUrl)}" alt=""></div>
    <div class="scan">${escapeHtml(scanTo)}</div>
    ${hoursBlock}
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
  const hoursQuery = useBusinessHours()
  const [isCopied, setIsCopied] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const showEnableNotice =
    checkInSettings != null && checkInSettings.publicCheckInEnabled !== true

  if (!businessSlug) return null

  const url = `${getWebUrlOrigin()}/checkin/${businessSlug}`
  const displayUrl = url.replace(/^https?:\/\//, '')
  const previewQrUrl = buildPublicQrImageUrl(url, QR_IMAGE_SIZES.zoom)
  const salonName = businessName?.trim() || t(TK + 'fallbackBusinessName')
  const scanTo = t(TK + 'posterScanTo', { businessName: salonName })
  const hoursSummary = formatCheckInPosterHours(hoursQuery.data, (day) =>
    t(TK + 'daysShort.' + day.toLowerCase()),
  )
  const hoursCaption =
    hoursQuery.isPending || hoursQuery.isError
      ? null
      : t(TK + 'posterHours', { hours: hoursSummary ?? t(TK + 'hoursClosed') })

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
        scanTo,
        hoursCaption,
        logoUrl: `${window.location.origin}${NEXORA_MARK_SRC}`,
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
        <div className="shrink-0 rounded-2xl border border-nexoraBorder bg-white p-3 text-center lg:p-5">
          <div className="mb-3 flex items-center justify-center gap-2">
            <img src={NEXORA_MARK_SRC} alt="" width={22} height={22} className="h-[22px] w-[22px]" />
            <span className="text-sm font-extrabold tracking-[0.22em] text-nexoraBrand">NEXORA</span>
          </div>
          <img
            src={previewQrUrl}
            alt={t(TK + 'qrAlt', { businessName: salonName })}
            width={280}
            height={280}
            className="mx-auto h-[168px] w-[168px] lg:h-[280px] lg:w-[280px]"
          />
          <p className="mx-auto mt-3 max-w-[280px] text-[11px] font-extrabold uppercase tracking-wide text-nexoraText">
            {scanTo}
          </p>
          {hoursCaption ? (
            <p className="mx-auto mt-1 max-w-[280px] text-[11px] font-bold uppercase tracking-wide text-nexoraMuted">
              {hoursCaption}
            </p>
          ) : null}
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
