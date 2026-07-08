import { createPortal } from 'react-dom'
import { X, ShieldAlert, ShieldCheck, Printer } from 'lucide-react'
import IconButton from '../../ui/IconButton'
import { useTranslation } from '../../../contexts/LanguageContext'
import { buildQrImageUrl, toLocalCustomerTouchUrl } from '../../../utils/staffTipUrl'

const slugify = (str = '') => str.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

function QrGatewayPreviewLayout({ target, qrImageSrc, scanCaption, onClose, t, showInactiveWarning = false }) {
  if (typeof document === 'undefined') return null

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

        {showInactiveWarning ? (
          <div className="no-print mb-4 flex items-center justify-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-[10px] font-bold text-amber-700">
            <ShieldAlert className="h-3.5 w-3.5 shrink-0" />
            {t('dashboard.modals.staff_qr_inactive_warning')}
          </div>
        ) : null}

        <div className="mx-auto flex w-72 flex-col items-center gap-5 rounded-2xl border border-nexoraBorder/80 bg-nexoraCanvas px-6 py-7 text-nexoraText shadow-md qr-print-card qr-print-card--payment">
          <div className="flex items-center justify-center gap-2 qr-print-brand-header">
            <img
              src="/assets/nexora-logo.png"
              alt="Nexora Logo"
              className="h-6 w-6 object-contain qr-print-brand-logo"
            />
            <span className="text-sm font-black tracking-wider text-slate-800 qr-print-brand-text">NEXORA</span>
          </div>

          <div className="flex h-64 w-64 shrink-0 items-center justify-center rounded-xl border border-nexoraBorder/60 bg-white p-4 shadow-inner qr-print-qr-wrapper">
            <img
              src={qrImageSrc}
              alt={target.name}
              className="h-full w-full object-contain qr-print-qr-image"
            />
          </div>

          <p className="max-w-[14rem] text-center text-xs font-extrabold uppercase leading-snug tracking-wide text-nexoraMuted qr-print-scan-text">
            {scanCaption}
          </p>

          <div className="flex items-center justify-center gap-1 text-[11px] font-bold text-nexoraSubtle qr-print-footer">
            <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-nexoraBrand" />
            <span>{t('components.SetupWizard.secureRedirect')}</span>
          </div>
        </div>

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

function QrModal({ target, businessName, onClose }) {
  const { t } = useTranslation()
  if (!target) return null

  const businessSlug = slugify(businessName || '')
  let qrUrl = ''
  if (target.url) {
    qrUrl = toLocalCustomerTouchUrl(target.url)
  }
  if (!qrUrl) {
    qrUrl = `${window.location.origin}/touch/${businessSlug}/${target.slug}`
  }

  const qrImageSrc = buildQrImageUrl(qrUrl, 150, target.qrImageUrl)
  const qrImageSrcHighRes = buildQrImageUrl(qrUrl, 1000, target.qrImageUrl)

  const isStaff = Boolean(
    target.isStaffQr ||
    target.slug?.startsWith('staff-') ||
    (() => {
      try {
        return new URL(qrUrl).searchParams.has('staffProfileId')
      } catch {
        return false
      }
    })(),
  )
  const displayName = isStaff ? target.name.replace('Personal QR - ', '') : ''
  const displayRole = isStaff ? target.subtitle : ''

  if (target.isGatewayQr || isStaff) {
    return (
      <QrGatewayPreviewLayout
        target={target}
        qrImageSrc={qrImageSrcHighRes}
        scanCaption={t('customer.scan_to_tip_review')}
        onClose={onClose}
        t={t}
        showInactiveWarning={isStaff && !target.isActive}
      />
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-nexoraText/70 p-4 py-6 backdrop-blur-sm sm:items-center qr-modal-backdrop">
      <div className="w-full max-w-sm rounded-xl bg-white p-6 text-center shadow-2xl animate-scaleUp qr-modal-container">
        <div className="flex justify-end no-print">
          <IconButton label="Close QR preview" onClick={onClose}>
            <X className="h-4 w-4" />
          </IconButton>
        </div>
        <h2 className="mt-1 text-lg font-extrabold text-nexoraText qr-print-title">{target.name}</h2>
        <p className="text-xs text-nexoraMuted qr-print-subtitle">{target.subtitle}</p>
        {!target.isActive && (
          <div className="mt-3 flex items-center justify-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-[10px] font-bold text-amber-700 no-print">
            <ShieldAlert className="h-3.5 w-3.5" />
            {t('dashboard.modals.staff_qr_inactive_warning')}
          </div>
        )}
        <div className="mx-auto mt-5 flex aspect-[2/3] w-44 flex-col items-center justify-between rounded-2xl bg-nexoraCanvas border border-nexoraBorder/80 p-4 text-nexoraText shadow-md qr-print-card">
          <div className="flex items-center gap-1 justify-center qr-print-brand-header">
            <img src="/assets/nexora-logo.png" alt="Nexora Logo" className="h-3.5 w-3.5 object-contain qr-print-brand-logo" />
            <span className="text-[8px] font-black tracking-wider text-slate-800 qr-print-brand-text">NEXORA</span>
          </div>

          <div className="w-full text-center">
            <div className="text-[10px] font-extrabold uppercase text-nexoraBrand tracking-wide qr-print-biz-name mx-auto">
              {isStaff ? displayName : (target.name || 'Master QR')}
            </div>
            <div className="text-[7.5px] font-bold text-nexoraMuted qr-print-staff-info mx-auto">
              {businessName} {isStaff && displayRole ? `• ${displayRole}` : ''}
            </div>
          </div>

          <div className="h-28 w-28 rounded-lg bg-white border border-nexoraBorder/60 p-2 flex items-center justify-center shadow-inner qr-print-qr-wrapper">
            <img
              src={qrImageSrc}
              alt="Scan QR code to tip and review"
              className="h-full w-full object-contain qr-print-qr-image"
            />
          </div>

          <div className="text-[8px] font-extrabold uppercase text-nexoraMuted tracking-wider qr-print-scan-text leading-tight mx-auto">
            {t('customer.scan_to_tip_review')}
          </div>

          <div className="flex items-center gap-1 text-[7.5px] font-bold text-nexoraSubtle qr-print-footer">
            <ShieldCheck className="h-2.5 w-2.5 text-nexoraBrand shrink-0" />
            <span>Secure redirect by VLINKPAY</span>
          </div>
        </div>

        <p className="mt-4 rounded-lg bg-nexoraCanvas px-3 py-2 text-[10px] font-mono text-nexoraMuted select-all qr-print-url">
          {qrUrl.replace(/^https?:\/\//, '')}
        </p>

        <button
          type="button"
          onClick={() => window.print()}
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-nexoraBrand px-4 py-2 text-xs font-bold text-white hover:bg-opacity-90 transition no-print"
        >
          <Printer className="h-4 w-4" />
          {t('dashboard.modals.print_qr')}
        </button>
      </div>
    </div>
  )
}

export default QrModal
