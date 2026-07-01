import React, { useState, useCallback } from 'react'
import { QrCode, Eye, Download, Copy, Check } from 'lucide-react'

const gatewayCardClass = 'rounded-xl border border-nexoraBorder bg-nexoraCanvas p-5'

export default function MasterWelcomeQrPanel({
  t,
  qrPreviewUrl,
  qrLink,
  onPreview,
  onDownload,
  isDownloading = false,
  showToast,
}) {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(() => {
    if (!qrLink) return
    navigator.clipboard.writeText(qrLink)
    setCopied(true)
    showToast(t('dashboard.master_gateway.copied_qr_link'), 'success')
    window.setTimeout(() => setCopied(false), 2000)
  }, [qrLink, showToast, t])

  return (
    <div className={`${gatewayCardClass} flex flex-col md:flex-row justify-between gap-5`}>
      <div className="flex-grow flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-nexoraBrandSoft text-nexoraBrand">
              <QrCode className="h-5 w-5" />
            </span>
            <div>
              <h3 className="text-sm font-extrabold text-nexoraText">
                {t('dashboard.master_gateway.qr_title')}
              </h3>
            </div>
          </div>
          <p className="mt-4 text-xs leading-normal text-nexoraMuted">
            {t('dashboard.master_gateway.qr_body')}
          </p>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onPreview}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-white border border-nexoraBorder px-4 text-xs font-bold text-nexoraText hover:bg-nexoraSurfaceMuted transition cursor-pointer"
          >
            <Eye className="h-4 w-4" />
            {t('dashboard.master_gateway.btn_open')}
          </button>
          <button
            type="button"
            onClick={onDownload}
            disabled={isDownloading}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-nexoraBrand px-4 text-xs font-bold text-white hover:bg-nexoraBrandDark transition cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Download className="h-4 w-4" />
            {t('dashboard.master_gateway.btn_download')}
          </button>
          <button
            type="button"
            disabled={!qrLink}
            onClick={handleCopy}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-white border border-nexoraBorder px-4 text-xs font-bold text-nexoraText hover:bg-nexoraSurfaceMuted transition cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 text-emerald-600" />
                <span className="text-emerald-600">{t('components.settings.tabs.ProfileTab.copied')}</span>
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                {t('dashboard.master_gateway.btn_copy_link')}
              </>
            )}
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={onPreview}
        aria-label={t('components.settings.SettingsTipQrPanel.previewQr')}
        className="flex-shrink-0 mx-auto md:mx-0 w-28 h-28 rounded-lg bg-white border border-nexoraBorder/80 p-2 flex items-center justify-center shadow-sm relative overflow-hidden cursor-pointer hover:border-nexoraBrand transition select-none group"
      >
        {qrPreviewUrl ? (
          <img
            src={qrPreviewUrl}
            alt={t('dashboard.master_gateway.qr_title')}
            className="h-full w-full object-contain group-hover:scale-105 transition duration-200"
          />
        ) : (
          <QrCode className="h-12 w-12 text-slate-300" />
        )}
        <div className="absolute inset-0 bg-nexoraBrand/80 opacity-0 group-hover:opacity-100 transition flex flex-col items-center justify-center gap-1 text-white select-none">
          <QrCode className="h-5 w-5" />
          <span className="text-[9px] font-black uppercase tracking-wider">
            {t('components.dashboard.views.StaffView.preview')}
          </span>
        </div>
      </button>
    </div>
  )
}
