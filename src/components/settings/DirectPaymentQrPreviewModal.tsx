import { createPortal } from 'react-dom'
import { Printer, ShieldCheck, X } from 'lucide-react'
import { useTranslation } from '../../contexts/LanguageContext'
import { buildPublicQrImageUrl } from '../../data/repositories/publicQr'

export default function DirectPaymentQrPreviewModal({
  open,
  onClose,
  title,
  businessName = '',
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
      <div className="w-full max-w-sm rounded-xl bg-white p-6 text-center shadow-2xl animate-scaleUp qr-modal-container">
        <div className="flex justify-end no-print">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            title="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <h2 className="mt-1 text-lg font-extrabold text-nexoraText qr-print-title">{title}</h2>
        {businessName ? (
          <p className="text-xs text-nexoraMuted qr-print-subtitle">{businessName}</p>
        ) : null}

        <div className="mx-auto mt-5 flex aspect-[2/3] w-44 flex-col items-center justify-between rounded-2xl border border-nexoraBorder/80 bg-nexoraCanvas p-4 text-nexoraText shadow-md qr-print-card">
          <div className="flex items-center justify-center gap-1 qr-print-brand-header">
            <img
              src="/assets/nexora-logo.png"
              alt="Nexora Logo"
              className="h-3.5 w-3.5 object-contain qr-print-brand-logo"
            />
            <span className="text-[8px] font-black tracking-wider text-slate-800 qr-print-brand-text">NEXORA</span>
          </div>

          <div className="w-full text-center">
            <div className="mx-auto text-[10px] font-extrabold uppercase tracking-wide text-nexoraBrand qr-print-biz-name">
              {title}
            </div>
            {businessName ? (
              <div className="mx-auto text-[7.5px] font-bold text-nexoraMuted qr-print-staff-info">
                {businessName}
              </div>
            ) : null}
          </div>

          <div className="flex h-28 w-28 items-center justify-center rounded-lg border border-nexoraBorder/60 bg-white p-2 shadow-inner qr-print-qr-wrapper">
            <img
              src={qrImageSrc}
              alt={title}
              className="h-full w-full object-contain qr-print-qr-image"
            />
          </div>

          <div className="mx-auto text-[8px] font-extrabold uppercase leading-tight tracking-wider text-nexoraMuted qr-print-scan-text">
            {scanCaption}
          </div>

          <div className="flex items-center gap-1 text-[7.5px] font-bold text-nexoraSubtle qr-print-footer">
            <ShieldCheck className="h-2.5 w-2.5 shrink-0 text-nexoraBrand" />
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
          className="no-print mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-nexoraBrand px-4 py-2 text-xs font-bold text-white transition hover:bg-opacity-90"
        >
          <Printer className="h-4 w-4" />
          {t('dashboard.modals.print_qr')}
        </button>
      </div>
    </div>,
    document.body,
  )
}
