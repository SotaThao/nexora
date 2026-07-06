import { useState } from 'react'
import { createPortal } from 'react-dom'
import { X, ShieldAlert, ShieldCheck, Download, Printer, Loader2 } from 'lucide-react'
import IconButton from '../../ui/IconButton'
import { useTranslation } from '../../../contexts/LanguageContext'
import { useNotification } from '../../../contexts/NotificationContext'
import { toLocalCustomerTouchUrl, buildQrImageUrl } from '../../../utils/staffTipUrl'
import { getWebUrlOrigin } from '../../../utils/webUrlBase'
import { downloadQrCode, downloadTouchpointQrFile } from '../../../utils/qrUtils'
import { shouldUseMobileDownloadFlow } from '../../../utils/downloadFile'

const slugify = (str = '') => str.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

function resolveTouchpointDownloadId(target) {
  if (target?.isStaffQr) return null
  return target?.touchpointId || target?.id || null
}

function QrGatewayPreviewLayout({
  target,
  qrImageSrc,
  scanCaption,
  onClose,
  t,
  showInactiveWarning = false,
  useMobileDownload = false,
  isSaving = false,
  onDownload,
  onPrint,
}) {
  if (typeof document === 'undefined') return null

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-nexoraText/70 modal-overlay-safe backdrop-blur-sm sm:items-center qr-modal-backdrop"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm rounded-xl bg-white px-6 pb-6 pt-12 text-center shadow-2xl animate-scaleUp qr-modal-container"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="no-print modal-close-btn absolute right-2 top-2 rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          title="Close"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        {showInactiveWarning ? (
          <div className="no-print mb-4 flex items-center justify-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-[10px] font-bold text-amber-700">
            <ShieldAlert className="h-3.5 w-3.5 shrink-0" />
            {t('dashboard.modals.staff_qr_inactive_warning')}
          </div>
        ) : null}

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
              alt={target.name}
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

        <button
          type="button"
          onClick={() => void (useMobileDownload ? onDownload?.() : onPrint?.())}
          disabled={useMobileDownload && isSaving}
          className="no-print mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-nexoraBrand px-4 py-2.5 text-xs font-bold text-white transition hover:bg-opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {useMobileDownload ? (
            isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />
          ) : (
            <Printer className="h-4 w-4" />
          )}
          {useMobileDownload
            ? t('dashboard.master_gateway.btn_download')
            : t('dashboard.modals.print_qr')}
        </button>
      </div>
    </div>,
    document.body,
  )
}

function QrModal({ target, businessName, onClose }) {
  const { t } = useTranslation()
  const { showToast } = useNotification()
  const [isSaving, setIsSaving] = useState(false)

  if (!target) return null

  const businessSlug = slugify(businessName || '')
  let qrUrl = ''
  if (target.url) {
    qrUrl = toLocalCustomerTouchUrl(target.url)
  }
  if (!qrUrl) {
    qrUrl = `${getWebUrlOrigin()}/touch/${businessSlug}/${target.slug}`
  }

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
  const useMobileDownload = shouldUseMobileDownloadFlow()
  const touchpointDownloadId = resolveTouchpointDownloadId(target)

  const handleSaveQr = async () => {
    if (isSaving) return

    setIsSaving(true)
    try {
      const safeName = slugify(target.name || target.slug || 'touchpoint')

      if (touchpointDownloadId) {
        const format = useMobileDownload ? 'png' : 'pdf'
        const result = await downloadTouchpointQrFile(
          touchpointDownloadId,
          `${safeName}-qr.${format}`,
          format,
        )
        if (result !== 'cancelled') {
          showToast(t('components.SettingsView.qrCodeDownloaded'), 'success')
        }
        return
      }

      const qrImageUrl = buildQrImageUrl(qrUrl, 600, target.qrImageUrl)
      const result = await downloadQrCode(qrImageUrl, `${safeName}-qr.png`)
      if (result !== 'cancelled') {
        showToast(t('components.SettingsView.qrCodeDownloaded'), 'success')
      }
    } catch {
      showToast(t('common.error'), 'error')
    } finally {
      setIsSaving(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  if (target.isGatewayQr || isStaff) {
    return (
      <QrGatewayPreviewLayout
        target={target}
        qrImageSrc={qrImageSrcHighRes}
        scanCaption={t('customer.scan_to_tip_review')}
        onClose={onClose}
        t={t}
        showInactiveWarning={isStaff && !target.isActive}
        useMobileDownload={useMobileDownload}
        isSaving={isSaving}
        onDownload={handleSaveQr}
        onPrint={handlePrint}
      />
    )
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-nexoraText/70 backdrop-blur-sm sm:items-center qr-modal-backdrop"
      style={{
        paddingTop: 'max(0.75rem, var(--app-safe-area-top))',
        paddingBottom: 'max(0.75rem, var(--app-safe-area-bottom))',
        paddingLeft: 'max(1rem, var(--app-safe-area-left))',
        paddingRight: 'max(1rem, var(--app-safe-area-right))',
      }}
      onClick={onClose}
    >
      <div
        className="qr-modal-container flex w-full max-w-sm max-h-[min(92dvh,calc(100dvh-var(--app-safe-area-top)-var(--app-safe-area-bottom)-1.5rem))] flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl animate-scaleUp sm:rounded-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-nexoraBorder/60 px-4 py-3 no-print sm:px-6 sm:py-4">
          <div className="min-w-0 text-left">
            <h2 className="truncate text-base font-extrabold text-nexoraText qr-print-title sm:text-lg">
              {target.name}
            </h2>
            <p className="truncate text-xs text-nexoraMuted qr-print-subtitle">{target.subtitle}</p>
          </div>
          <IconButton label="Close QR preview" onClick={onClose}>
            <X className="h-4 w-4" />
          </IconButton>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 text-center sm:px-6">
          {!target.isActive && (
            <div className="mb-3 flex items-center justify-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-[10px] font-bold text-amber-700 no-print">
              <ShieldAlert className="h-3.5 w-3.5 shrink-0" />
              This personal QR is blocked while the staff member is inactive.
            </div>
          )}

          <div className="mx-auto flex aspect-[2/3] w-36 flex-col items-center justify-between rounded-2xl bg-nexoraCanvas border border-nexoraBorder/80 p-3 text-nexoraText shadow-md qr-print-card sm:w-44 sm:p-4">
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

            <div className="h-24 w-24 rounded-lg bg-white border border-nexoraBorder/60 p-2 flex items-center justify-center shadow-inner qr-print-qr-wrapper sm:h-28 sm:w-28">
              <img
                src={buildQrImageUrl(qrUrl, 150, target.qrImageUrl)}
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

          <p className="mt-4 break-all rounded-lg bg-nexoraCanvas px-3 py-2 text-left text-[10px] font-mono leading-relaxed text-nexoraMuted qr-print-url">
            {qrUrl.replace(/^https?:\/\//, '')}
          </p>
        </div>

        <div
          className="shrink-0 space-y-2 border-t border-nexoraBorder/60 bg-white px-4 py-3 no-print sm:px-6 sm:py-4"
          style={{ paddingBottom: 'max(0.75rem, var(--app-safe-area-bottom))' }}
        >
          <button
            type="button"
            onClick={() => void handleSaveQr()}
            disabled={isSaving}
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-nexoraBrand px-4 py-2.5 text-xs font-bold text-white transition hover:bg-opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            {useMobileDownload
              ? t('dashboard.master_gateway.btn_download')
              : t('dashboard.modals.download_print_qr')}
          </button>
          {!useMobileDownload && (
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-nexoraBorder bg-nexoraCanvas px-4 py-2.5 text-xs font-bold text-nexoraText transition hover:bg-nexoraSurfaceMuted"
            >
              <Printer className="h-4 w-4" />
              {t('dashboard.modals.print_qr_btn')}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default QrModal
