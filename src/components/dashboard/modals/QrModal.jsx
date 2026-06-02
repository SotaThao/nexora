import { X, ShieldAlert, ShieldCheck, Download } from 'lucide-react'
import IconButton from '../../ui/IconButton'
import { useTranslation } from '../../../contexts/LanguageContext'

function QrModal({ target, businessName, onClose }) {
  const { t } = useTranslation()
  if (!target) return null

  // Build the live customer portal URL for this touchpoint/staff QR
  const qrUrl = `${window.location.origin}${window.location.pathname}?flow=customer&tech=${encodeURIComponent(target.slug)}&biz=${encodeURIComponent(businessName)}`

  const isStaff = target.slug?.startsWith('staff/')
  const displayName = isStaff ? target.name.replace('Personal QR - ', '') : ''
  const displayRole = isStaff ? target.subtitle : ''

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
            This personal QR is blocked while the staff member is inactive.
          </div>
        )}
        <div className="mx-auto mt-5 flex aspect-[2/3] w-44 flex-col items-center justify-between rounded-2xl bg-nexoraCanvas border border-nexoraBorder/80 p-4 text-nexoraText shadow-md qr-print-card">
          {/* Nexora Branding Header inside Card */}
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

          {/* Real Scan-Ready QR Code */}
          <div className="h-28 w-28 rounded-lg bg-white border border-nexoraBorder/60 p-2 flex items-center justify-center shadow-inner qr-print-qr-wrapper">
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrUrl)}`}
              alt="Scan QR code to tip and review"
              className="h-full w-full object-contain qr-print-qr-image"
            />
          </div>

          <div className="text-[8px] font-extrabold uppercase text-nexoraMuted tracking-wider qr-print-scan-text leading-tight mx-auto">
            {t('customer.scan_to_tip_review') || 'Scan to Tip & Review'}
          </div>

          <div className="flex items-center gap-1 text-[7.5px] font-bold text-nexoraSubtle qr-print-footer">
            <ShieldCheck className="h-2.5 w-2.5 text-nexoraBrand shrink-0" />
            <span>Secure redirect by VLINKPAY</span>
          </div>
        </div>

        <p className="mt-4 rounded-lg bg-nexoraCanvas px-3 py-2 text-[10px] font-mono text-nexoraMuted select-all qr-print-url">
          nexora.vlinkpay.com/touch/{target.slug}
        </p>

        {/* Browser simulator trigger */}
        <div className="mt-3.5 no-print">
          <a
            href={qrUrl}
            target="_blank"
            rel="opener"
            className="inline-flex items-center gap-1 text-[10.5px] font-black text-nexoraBrand hover:underline tracking-wide bg-nexoraBrandSoft px-3 py-1.5 rounded-lg transition"
          >
            <span>{t('dashboard.modals.customer_view_test') || 'Mô phỏng quét QR (Mở trang khách) ›'}</span>
          </a>
        </div>

        <button
          onClick={() => window.print()}
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-nexoraBrand px-4 py-2 text-xs font-bold text-white hover:bg-opacity-90 transition no-print"
        >
          <Download className="h-4 w-4" />
          {t('dashboard.modals.download_print_qr') || 'Print / Download Design'}
        </button>
      </div>
    </div>
  )
}

export default QrModal
