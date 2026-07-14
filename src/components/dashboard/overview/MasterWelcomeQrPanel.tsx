import React, { useState, useCallback } from 'react'
import { QrCode, Eye, Download, Copy, Check } from 'lucide-react'
import QrImage from '../../ui/QrImage'

const gatewayCardClass = 'rounded-xl border border-nexoraBorder bg-nexoraCanvas p-5'

const gatewayActionBtnClass = 'flex h-9 w-full min-w-0 items-center justify-center gap-1 rounded-lg px-2 text-xs font-bold transition cursor-pointer'

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

  const actionButtons = (
    <>
      <button
        type="button"
        onClick={onPreview}
        className={`${gatewayActionBtnClass} bg-white border border-nexoraBorder text-nexoraText hover:bg-nexoraSurfaceMuted`}
      >
        <Eye className="h-4 w-4 shrink-0" />
        <span className="truncate">{t('dashboard.master_gateway.btn_open')}</span>
      </button>
      <button
        type="button"
        onClick={onDownload}
        disabled={isDownloading}
        className={`${gatewayActionBtnClass} bg-nexoraBrand text-white hover:bg-nexoraBrandDark disabled:cursor-not-allowed disabled:opacity-60`}
      >
        <Download className="h-4 w-4 shrink-0" />
        <span className="truncate">{t('dashboard.master_gateway.btn_download')}</span>
      </button>
      <button
        type="button"
        disabled={!qrLink}
        onClick={handleCopy}
        className={`${gatewayActionBtnClass} bg-white border border-nexoraBorder text-nexoraText hover:bg-nexoraSurfaceMuted disabled:cursor-not-allowed disabled:opacity-60`}
      >
        {copied ? (
          <>
            <Check className="h-4 w-4 shrink-0 text-emerald-600" />
            <span className="truncate text-emerald-600">{t('components.settings.tabs.ProfileTab.copied')}</span>
          </>
        ) : (
          <>
            <Copy className="h-4 w-4 shrink-0" />
            <span className="truncate">{t('dashboard.master_gateway.btn_copy_link')}</span>
          </>
        )}
      </button>
    </>
  )

  return (
    <div className={`${gatewayCardClass} flex flex-col gap-5 md:flex-row md:justify-between`}>
      <div className="flex flex-col justify-between md:flex-grow md:min-w-0">
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

        <div className="mt-6 hidden w-full grid-cols-3 gap-2 md:grid">
          {actionButtons}
        </div>
      </div>

      <button
        type="button"
        onClick={onPreview}
        aria-label={t('components.settings.SettingsTipQrPanel.previewQr')}
        className="mx-auto flex h-28 w-28 shrink-0 items-center justify-center rounded-lg border border-nexoraBorder/80 bg-white p-2 shadow-sm relative overflow-hidden cursor-pointer hover:border-nexoraBrand transition select-none group md:mx-0 md:self-start"
      >
        {qrPreviewUrl ? (
          <QrImage
            src={qrPreviewUrl}
            alt={t('dashboard.master_gateway.qr_title')}
            className="h-full w-full transition duration-200 group-hover:scale-105"
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

      <div className="grid w-full grid-cols-3 gap-2 md:hidden">
        {actionButtons}
      </div>
    </div>
  )
}
