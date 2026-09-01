import { useMemo, useState } from 'react'
import { Check, Copy, Download, ExternalLink, Info, Loader2 } from 'lucide-react'
import { useTranslation } from '../../../contexts/LanguageContext'
import { useNotification } from '../../../contexts/NotificationContext'
import QrImage from '../../ui/QrImage'
import ToggleSwitch from '../../ui/ToggleSwitch'
import { buildPublicQrImageUrl } from '../../../data/repositories/publicQr'
import { QR_IMAGE_SIZES, downloadQrCode } from '../../../utils/qrUtils'
import { getWebUrlOrigin } from '../../../utils/webUrlBase'
import { logger } from '../../../utils/logger'
import {
  OneQrAudience,
  ONEQR_AUDIENCE_ORDER,
  ONEQR_ROUTE,
  buildOneQrPath,
} from '../../../constants/oneQr'
import type { OneQr } from '../../../types/oneQr'

/**
 * `OneQrConfigDto` has no `businessSlug`, but `url` always ends in `/o/{slug}`.
 */
function slugFromUrl(url: string): string {
  const last = String(url || '')
    .split('?')[0]
    .split('/')
    .filter(Boolean)
    .pop()
  return last && last !== 'o' ? last : ''
}

/**
 * The share URL is rebuilt on this app's own origin rather than echoing
 * `oneQr.url`.
 *
 * `oneQr.url` is cached by the backend at create time from *its* `FrontEndUrl`
 * setting, so a backend pointed at `localhost:3000` hands that string to every
 * environment. `getWebUrlOrigin()` (`VITE_VLINKPAY_WEB_URL_BASE`, falling back
 * to the live origin) is the repo-wide rule for anything a customer will open
 * or scan — see `src/utils/webUrlBase.ts`.
 *
 * Falls back to the server string when the origin cannot be determined (native
 * shell, missing env), so the card is never left without a link.
 */
function buildShareUrl(oneQr: OneQr): string {
  const slug = slugFromUrl(oneQr.url)
  const origin = getWebUrlOrigin()
  if (!slug || !origin) return oneQr.url
  return `${origin}${buildOneQrPath(slug)}`
}

const AUDIENCE_LABEL_KEY: Record<OneQrAudience, string> = {
  [OneQrAudience.Customer]: 'oneqr.audience.customer',
  [OneQrAudience.Staff]: 'oneqr.audience.staff',
  [OneQrAudience.Owner]: 'oneqr.audience.owner',
}

export default function OneQrCodeCard({
  oneQr,
  onToggleActive,
  isToggling,
}: {
  oneQr: OneQr
  onToggleActive: () => void
  isToggling: boolean
}) {
  const { t } = useTranslation()
  const { showToast } = useNotification()
  const [copied, setCopied] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [previewAudience, setPreviewAudience] = useState<OneQrAudience>(
    OneQrAudience.Customer,
  )

  const shareUrl = useMemo(() => buildShareUrl(oneQr), [oneQr])

  /**
   * The QR itself never varies by audience — one business, one code, and the
   * backend resolves the role at scan time. Only the *preview link* below
   * changes, so the merchant can check each role's screen.
   *
   * `?as=customer` is the one value the role-resolution table honours (it is a
   * deliberate downgrade). Staff and Owner are derived from the JWT and cannot
   * be forced from a query string, so their preview is the plain URL, opened
   * with an account of that role.
   */
  const previewUrl =
    previewAudience === OneQrAudience.Customer
      ? `${shareUrl}?${ONEQR_ROUTE.asQuery}=${ONEQR_ROUTE.asCustomerValue}`
      : shareUrl

  // The backend's S3 render encodes `oneQr.url`. When the share URL differs
  // from it, that image would send scanners to the wrong origin, so generate
  // one from the URL actually being shared instead.
  const usesServerImage = Boolean(oneQr.qrImageUrl) && shareUrl === oneQr.url
  const previewSrc = usesServerImage
    ? (oneQr.qrImageUrl as string)
    : buildPublicQrImageUrl(shareUrl, QR_IMAGE_SIZES.panel)
  const downloadSrc = usesServerImage
    ? (oneQr.qrImageUrl as string)
    : buildPublicQrImageUrl(shareUrl, QR_IMAGE_SIZES.print)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(previewUrl)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch (err) {
      logger.error('OneQR copy link failed', err)
      showToast(t('oneqr.card.copy_failed'), 'error')
    }
  }

  const handleDownload = async () => {
    setIsDownloading(true)
    try {
      await downloadQrCode(
        downloadSrc,
        `oneqr-${slugFromUrl(oneQr.url) || 'code'}.png`,
      )
    } catch (err) {
      logger.error('OneQR download failed', err)
      showToast(t('common.qr_load_failed'), 'error')
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <section className="nexora-card flex flex-col gap-4 p-4 sm:flex-row sm:items-start sm:p-6">
      <div className="mx-auto shrink-0 sm:mx-0">
        <QrImage
          src={previewSrc}
          alt={t('oneqr.card.qr_alt', { name: oneQr.name })}
          className="h-[168px] w-[168px] rounded-2xl border border-nexoraBorder bg-white p-2"
        />
        <p className="mt-2 max-w-[168px] text-center text-[10px] font-bold uppercase tracking-wide text-nexoraMuted">
          {t('oneqr.card.single_code_note')}
        </p>
      </div>

      <div className="min-w-0 flex-1 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="min-w-0 truncate text-base font-black text-nexoraText">
            {oneQr.name || t('oneqr.card.untitled')}
          </h3>
          <div className="flex items-center gap-2">
            <span
              className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ${
                oneQr.isActive
                  ? 'bg-emerald-50 text-emerald-600'
                  : 'bg-amber-50 text-nexoraWarning'
              }`}
            >
              {t(oneQr.isActive ? 'oneqr.status.active' : 'oneqr.status.paused')}
            </span>
            <ToggleSwitch
              checked={oneQr.isActive}
              onChange={onToggleActive}
              loading={isToggling}
              activeColor="bg-nexoraBrand"
              inactiveColor="bg-nexoraBorder"
              ariaLabel={t('oneqr.card.toggle_active')}
            />
          </div>
        </div>

        <p className="text-xs leading-relaxed text-nexoraMuted">
          {t('oneqr.card.permanence_note')}
        </p>

        <div className="space-y-2 rounded-xl border border-nexoraBorder bg-nexoraSurfaceMuted p-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-black uppercase tracking-wide text-nexoraMuted">
              {t('oneqr.card.preview_as')}
            </span>
            <div
              role="group"
              aria-label={t('oneqr.card.preview_as')}
              className="flex flex-wrap gap-1"
            >
              {ONEQR_AUDIENCE_ORDER.map((audience) => {
                const isActive = audience === previewAudience
                return (
                  <button
                    key={audience}
                    type="button"
                    aria-pressed={isActive}
                    onClick={() => setPreviewAudience(audience)}
                    className={`inline-flex min-h-9 items-center rounded-full px-3 text-xs font-bold transition ${
                      isActive
                        ? 'bg-nexoraBrand text-white shadow-nexora-soft'
                        : 'border border-nexoraBorder bg-nexoraSurface text-nexoraMuted hover:text-nexoraText'
                    }`}
                  >
                    {t(AUDIENCE_LABEL_KEY[audience])}
                  </button>
                )
              })}
            </div>
          </div>

          <a
            href={previewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex max-w-full items-center gap-1.5 text-xs font-medium text-nexoraBrand hover:underline"
          >
            <span className="truncate">{previewUrl}</span>
            <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden />
          </a>

          {previewAudience !== OneQrAudience.Customer ? (
            <p className="flex items-start gap-1.5 text-[11px] font-medium leading-snug text-nexoraMuted">
              <Info className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden />
              <span>
                {t('oneqr.card.preview_needs_login', {
                  audience: t(AUDIENCE_LABEL_KEY[previewAudience]),
                })}
              </span>
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2">
          <a
            href={previewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-nexoraBrand px-4 text-xs font-bold text-white transition hover:bg-nexoraBrandDark"
          >
            <ExternalLink className="h-4 w-4" aria-hidden />
            {t('oneqr.card.open_landing')}
          </a>
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-nexoraBorder bg-nexoraSurface px-4 text-xs font-bold text-nexoraText transition hover:bg-nexoraSurfaceMuted"
          >
            {copied ? (
              <Check className="h-4 w-4 text-emerald-500" aria-hidden />
            ) : (
              <Copy className="h-4 w-4" aria-hidden />
            )}
            {t(copied ? 'common.copied' : 'oneqr.card.copy_url')}
          </button>
          <button
            type="button"
            onClick={handleDownload}
            disabled={isDownloading}
            className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-nexoraBorder bg-nexoraSurface px-4 text-xs font-bold text-nexoraText transition hover:bg-nexoraSurfaceMuted disabled:opacity-50"
          >
            {isDownloading ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <Download className="h-4 w-4" aria-hidden />
            )}
            {t('oneqr.card.download')}
          </button>
        </div>
      </div>
    </section>
  )
}
