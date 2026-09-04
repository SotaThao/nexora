import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Copy, Check, Download, Loader2, Printer, ShieldCheck, X } from 'lucide-react'
import { useTranslation } from '../../contexts/LanguageContext'
import { useNotification } from '../../contexts/NotificationContext'
import { buildPublicQrImageUrl } from '../../data/repositories/publicQr'
import { downloadQrCode, QR_IMAGE_SIZES } from '../../utils/qrUtils'
import { copyTextToClipboard } from '../../utils/clipboard'
import QrImage from '../ui/QrImage'

const slugify = (value = '') =>
  value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'qr'

export default function DirectPaymentQrPreviewModal({
  open,
  onClose,
  title,
  businessName: _businessName = '',
  previewQrUrl,
  paymentPageUrl,
  hideUrlCode = false,
  scanCaption,
}) {
  const { t } = useTranslation()
  const { showToast } = useNotification()
  const [isSaving, setIsSaving] = useState(false)
  const [isCopied, setIsCopied] = useState(false)
  const modalRef = useRef<HTMLDivElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open || typeof document === 'undefined') return undefined
    const previouslyFocused = document.activeElement
    closeButtonRef.current?.focus()

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
        return
      }
      if (event.key !== 'Tab') return
      const focusable = Array.from(
        modalRef.current?.querySelectorAll<HTMLElement>(
          'button:not([disabled]), a[href], input:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ) ?? [],
      )
      if (focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      if (previouslyFocused instanceof HTMLElement) previouslyFocused.focus()
    }
  }, [onClose, open])

  if (!open || !previewQrUrl || typeof document === 'undefined') return null

  const displayUrl = paymentPageUrl?.replace(/^https?:\/\//, '') ?? ''
  const qrImageSrc = paymentPageUrl ? buildPublicQrImageUrl(paymentPageUrl, QR_IMAGE_SIZES.print) : previewQrUrl

  const handleCopyLink = async () => {
    if (!paymentPageUrl) return
    try {
      await copyTextToClipboard(paymentPageUrl)
      setIsCopied(true)
      showToast(t('dashboard.master_gateway.copied_qr_link'), 'success')
      window.setTimeout(() => setIsCopied(false), 2000)
    } catch {
      showToast(t('common.error'), 'error')
    }
  }

  const handleDownload = async () => {
    if (isSaving) return

    setIsSaving(true)
    try {
      const safeName = slugify(title || 'payment-qr')
      await downloadQrCode(qrImageSrc, `${safeName}.png`)
      showToast(t('components.SettingsView.qrCodeDownloaded'), 'success')
    } catch {
      showToast(t('common.error'), 'error')
    } finally {
      setIsSaving(false)
    }
  }

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-nexoraText/70 modal-overlay-safe backdrop-blur-sm sm:items-center qr-modal-backdrop"
      onClick={onClose}
    >
      <div
        ref={modalRef}
        className="relative w-full max-w-md rounded-xl bg-white px-6 pb-6 pt-12 text-center shadow-2xl animate-scaleUp qr-modal-container"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          ref={closeButtonRef}
          type="button"
          onClick={onClose}
          className="no-print modal-close-btn absolute right-2 top-2 rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          title="Close"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mx-auto flex w-full max-w-sm flex-col items-center gap-3.5 rounded-2xl border border-nexoraBorder/80 bg-nexoraCanvas px-4 py-5 text-nexoraText shadow-md qr-print-card qr-print-card--payment">
          <div className="flex items-center justify-center gap-1.5 qr-print-brand-header">
            <img
              src="/assets/nexora-logo.png"
              alt="Nexora Logo"
              className="h-6 w-6 object-contain qr-print-brand-logo"
            />
            <span className="text-sm font-black tracking-wider text-slate-800 qr-print-brand-text">NEXORA</span>
          </div>

          <div className="flex aspect-square w-full max-w-[14.5rem] shrink-0 items-center justify-center overflow-hidden rounded-xl border border-nexoraBorder/60 bg-white p-2.5 shadow-inner qr-print-qr-wrapper">
            <QrImage
              src={qrImageSrc}
              alt={title}
              className="h-full w-full max-h-full max-w-full qr-print-qr-image"
            />
          </div>

          <p className="max-w-[19rem] text-center text-[9px] font-extrabold uppercase leading-snug tracking-wide text-nexoraMuted qr-print-scan-text">
            {scanCaption}
          </p>

          <div className="flex items-center justify-center gap-1 text-[11px] font-bold text-nexoraSubtle qr-print-footer">
            <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-nexoraBrand" />
            <span>{t('components.SetupWizard.secureRedirect')}</span>
          </div>
        </div>

        {!hideUrlCode && displayUrl ? (
          <div className="mt-4 flex items-center justify-between gap-2 overflow-hidden rounded-xl border border-nexoraBorder bg-nexoraCanvas p-2 shadow-inner qr-print-url">
            <span className="min-w-0 flex-1 truncate pl-2 text-left font-mono text-[11px] text-nexoraMuted">
              {displayUrl}
            </span>
            <button
              type="button"
              onClick={() => void handleCopyLink()}
              className="no-print flex shrink-0 items-center gap-1.5 rounded-full px-2 py-1 text-xs font-extrabold uppercase tracking-wide text-nexoraBrand transition hover:opacity-80"
            >
              {isCopied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{t('common.copy')}</span>
            </button>
          </div>
        ) : null}

        <div className="no-print mt-5 space-y-2">
          <button
            type="button"
            onClick={() => void handleDownload()}
            disabled={isSaving}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-nexoraBrand px-4 py-2.5 text-xs font-bold text-white transition hover:bg-opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            {t('dashboard.master_gateway.btn_download')}
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-nexoraBorder bg-nexoraCanvas px-4 py-2.5 text-xs font-bold text-nexoraText transition hover:bg-nexoraSurfaceMuted"
          >
            <Printer className="h-4 w-4" />
            {t('dashboard.modals.print_qr')}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
