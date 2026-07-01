import { createPortal } from 'react-dom'
import { Printer, ShieldCheck, X } from 'lucide-react'
import { useTranslation } from '../../contexts/LanguageContext'
import { buildPublicQrImageUrl } from '../../data/repositories/publicQr'

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

  if (!open || !previewQrUrl || typeof document === 'undefined') return null

  const displayUrl = paymentPageUrl?.replace(/^https?:\/\//, '') ?? ''
  const qrImageSrc = paymentPageUrl ? buildPublicQrImageUrl(paymentPageUrl, 1000) : previewQrUrl

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-nexoraText/70 p-4 py-6 backdrop-blur-sm sm:items-center qr-modal-backdrop">
      <div className="relative w-full max-w-sm rounded-xl bg-white px-6 pb-6 pt-12 text-center shadow-2xl animate-scaleUp qr-modal-container">
        <button
          type="button"
          onClick={onClose}
          className="no-print absolute right-4 top-4 rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          title="Close"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mx-auto flex w-48 flex-col items-center gap-3.5 rounded-2xl border border-nexoraBorder/80 bg-nexoraCanvas px-4 py-5 text-nexoraText shadow-md qr-print-card qr-print-card--payment">
          <div className="flex items-center justify-center gap-1.5 qr-print-brand-header">
            <img
              src="/assets/nexora-logo.png"
              alt="Nexora Logo"
              className="h-4 w-4 object-contain qr-print-brand-logo"
            />
            <span className="text-[9px] font-black tracking-wider text-slate-800 qr-print-brand-text">NEXORA</span>
          </div>

          <div className="flex h-[7.25rem] w-[7.25rem] shrink-0 items-center justify-center rounded-xl border border-nexoraBorder/60 bg-white p-2.5 shadow-inner qr-print-qr-wrapper">
            <img
              src={qrImageSrc}
              alt={title}
              className="h-full w-full object-contain qr-print-qr-image"
            />
          </div>

          <p className="max-w-[9.5rem] text-center text-[9px] font-extrabold uppercase leading-snug tracking-wide text-nexoraMuted qr-print-scan-text">
            {scanCaption}
          </p>

          <div className="flex items-center justify-center gap-1 text-[8px] font-bold text-nexoraSubtle qr-print-footer">
            <ShieldCheck className="h-3 w-3 shrink-0 text-nexoraBrand" />
            <span>{t('components.SetupWizard.secureRedirect')}</span>
          </div>
        </div>

        {!hideUrlCode && displayUrl ? (
          <p className="mt-4 select-all rounded-lg bg-nexoraCanvas px-3 py-2 text-[10px] font-mono text-nexoraMuted qr-print-url">
            {displayUrl}
          </p>
        ) : null}

        <button
          type="button"
          onClick={() => window.print()}
          className="no-print mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-nexoraBrand px-4 py-2.5 text-xs font-bold text-white transition hover:bg-opacity-90"
        >
          <Printer className="h-4 w-4" />
          {t('dashboard.modals.print_qr')}
        </button>
      </div>
    </div>,
    document.body,
  )
}
