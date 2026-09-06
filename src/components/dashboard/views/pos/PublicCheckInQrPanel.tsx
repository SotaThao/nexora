// PublicCheckInQrPanel — the merchant-side half of POS Public Check-In: the Owner needs a QR
// they can print and stick on the door, because the whole point of the feature is that a
// customer checks in from their own phone (POS-Public-Check-In-Technical.md §1/§3 decision 2).
// The slug is static, so this QR is printed once and never rotates.
//
// Lives on POS > Public Check-In (PosPublicCheckInView), the same "print this URL" job
// BookingLinkShare does for the public booking page.
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { printDomWithBodyClass, type BrowserPrintHandle } from './receipt/browserPrintTransport'
import './publicCheckInQrPrint.css'
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

const NEXORA_MARK_SRC = '/homepage/assets/images/icon-nexora.png'
const PRINT_BODY_CLASS = 'printing-checkin-qr'

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
  const printCardRef = useRef<HTMLDivElement>(null)
  const printHandleRef = useRef<BrowserPrintHandle | null>(null)
  useEffect(() => () => printHandleRef.current?.cancel(), [])
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

  const handlePrint = () => {
    // Keep print in the click event: popup/document.write/onload can leave an empty tab
    // on iPad. The body portal is already mounted and its images must be ready first.
    const images = Array.from(printCardRef.current?.querySelectorAll('img') ?? [])
    if (images.length < 2 || images.some((image) => !image.complete || image.naturalWidth === 0)) {
      showToast(t(TK + 'printNotReady'), 'error')
      return
    }
    printHandleRef.current?.cancel()
    printHandleRef.current = printDomWithBodyClass(PRINT_BODY_CLASS)
  }

  return (
    <>
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

      <div className="mx-auto flex w-full max-w-md flex-col items-center gap-4 py-4 lg:py-6">
        <div className="w-full rounded-2xl border border-nexoraBorder bg-nexoraCanvas px-4 py-5 text-center shadow-sm">
          <div className="mb-3 flex items-center justify-center gap-2">
            <img src={NEXORA_MARK_SRC} alt="" width={22} height={22} className="h-[22px] w-[22px]" />
            <span className="text-sm font-black tracking-wider text-nexoraText">NEXORA</span>
          </div>
          <img
            src={previewQrUrl}
            alt={t(TK + 'qrAlt', { businessName: salonName })}
            width={280}
            height={280}
            className="mx-auto aspect-square h-auto w-full max-w-[232px] rounded-xl border border-nexoraBorder bg-white p-2.5"
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

        <div className="w-full min-w-0 space-y-3">
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

          <div className="grid grid-cols-1 gap-2">
            <button
              type="button"
              onClick={() => void handleDownload()}
              disabled={isDownloading}
              className="flex h-11 items-center justify-center gap-2 rounded-lg bg-nexoraBrand text-xs font-bold text-white transition hover:bg-nexoraBrandDark disabled:opacity-60"
            >
              <Download className="h-3.5 w-3.5" />
              {t(TK + 'downloadButton')}
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="flex h-11 items-center justify-center gap-2 rounded-lg border border-nexoraBorder bg-nexoraCanvas text-xs font-bold text-nexoraText transition hover:border-nexoraBrand"
            >
              <Printer className="h-3.5 w-3.5" />
              {t(TK + 'printButton')}
            </button>
          </div>

          <p className="text-[11px] text-nexoraMuted">{t(TK + 'printHint')}</p>
        </div>
      </div>
    </div>
    {typeof document !== 'undefined' && createPortal(
      <div ref={printCardRef} className="pos-checkin-qr-print" aria-hidden="true">
        <div className="checkin-print-mark">
          <img src={NEXORA_MARK_SRC} alt="" width={36} height={36} />
          <span>NEXORA</span>
        </div>
        <img className="checkin-print-qr" src={buildPublicQrImageUrl(url, QR_IMAGE_SIZES.print)} alt="" width={1000} height={1000} />
        <p className="checkin-print-scan">{scanTo}</p>
        {hoursCaption && <p className="checkin-print-hours">{hoursCaption}</p>}
        <p className="checkin-print-url">{displayUrl}</p>
      </div>,
      document.body,
    )}
    </>
  )
}
