import React, { useCallback, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  QrCode,
  Copy,
  Check,
  Download,
  Eye,
  Loader2,
  ExternalLink,
  Wallet,
  AlertCircle,
  ClipboardList,
} from 'lucide-react'
import DirectPaymentQrPreviewModal from './DirectPaymentQrPreviewModal'
import { useProfileSettings } from '../../data/hooks/useProfileSettings'
import { useMerchantPaymentQr } from '../../data/hooks/useMerchantPayments'
import { useMerchantPaymentMethods } from '../../data/hooks/useMerchantPaymentMethods'
import { buildPublicQrImageUrl } from '../../data/repositories/publicQr'
import {
  resolveDirectPaymentPageUrl,
  resolveMerchantBusinessIdFromProfile,
} from '../../utils/merchantBusinessId'
import { downloadQrCode, QR_IMAGE_SIZES } from '../../utils/qrUtils'
import { payoutTypeToUiKey, getPaymentMethodDisplayName } from '../../data/paymentMethodTypes'
import QrImage from '../ui/QrImage'

function isReadyForCustomerPayment(method) {
  return Boolean(method?.isActive && method?.accountInfo?.trim())
}

export default function SettingsTipQrPanel({
  businessName = '',
  showToast,
  handleCopy,
  copiedId,
  t,
  onConfigurePayoutMethods,
  variant = 'default',
  hideUrlCode = false,
}) {
  const navigate = useNavigate()
  const isCompact = variant === 'compact'
  const isGateway = variant === 'gateway'
  const {
    data: userProfile,
    isLoading: isProfileLoading,
    isError: isProfileError,
    refetch: refetchProfile,
  } = useProfileSettings()
  const {
    data: paymentQr,
    isLoading: isQrLoading,
    isError: isQrError,
    refetch: refetchPaymentQr,
  } = useMerchantPaymentQr()
  const { data: paymentMethods = [], isLoading: isMethodsLoading } = useMerchantPaymentMethods()

  const businessId = useMemo(
    () => resolveMerchantBusinessIdFromProfile(userProfile),
    [userProfile],
  )

  const [showPreview, setShowPreview] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)

  const readyPaymentMethods = useMemo(
    () =>
      paymentMethods.filter(
        (method) => payoutTypeToUiKey(method.type || '') !== 'bankwire' && isReadyForCustomerPayment(method),
      ),
    [paymentMethods],
  )

  const paymentPageUrl = useMemo(
    () =>
      resolveDirectPaymentPageUrl({
        businessId,
        paymentUrlFromApi: paymentQr?.paymentUrl,
      }),
    [businessId, paymentQr?.paymentUrl],
  )

  const qrPreviewUrl = useMemo(
    () => (paymentPageUrl ? buildPublicQrImageUrl(paymentPageUrl, QR_IMAGE_SIZES.panel) : ''),
    [paymentPageUrl],
  )

  const previewQrUrl = qrPreviewUrl

  const handleDownloadQr = useCallback(async () => {
    if (!paymentPageUrl) return

    setIsDownloading(true)
    try {
      await downloadQrCode(buildPublicQrImageUrl(paymentPageUrl, QR_IMAGE_SIZES.print), 'direct-payment-qr.png')
      showToast(t('components.SettingsView.qrCodeDownloaded'), 'success')
    } catch {
      showToast(t('components.dashboard.overview.Overview.qr_download_failed'), 'error')
    } finally {
      setIsDownloading(false)
    }
  }, [paymentPageUrl, showToast, t])

  const isLoading = isProfileLoading || isQrLoading || isMethodsLoading

  const gatewayCardClass = 'rounded-xl border border-nexoraBorder bg-nexoraCanvas p-5'
  const gatewayActionBtnClass = 'flex h-9 w-full min-w-0 items-center justify-center gap-1 rounded-lg px-2 text-xs font-bold transition cursor-pointer'

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center ${isGateway ? `${gatewayCardClass} min-h-[196px]` : isCompact ? 'py-6' : 'py-10'}`}>
        <Loader2 className={`animate-spin text-nexoraBrand ${isGateway || isCompact ? 'h-5 w-5' : 'h-6 w-6'}`} />
      </div>
    )
  }

  if (isProfileError || isQrError || (!isProfileLoading && !isQrLoading && !businessId)) {
    return (
      <div className={`flex flex-col items-center gap-3 px-2 text-center ${isGateway ? `${gatewayCardClass} min-h-[196px] justify-center` : isCompact ? 'py-5' : 'gap-4 py-8 px-4'}`}>
        <div className={`flex items-center justify-center rounded-2xl bg-rose-50 text-rose-600 ${isCompact ? 'h-11 w-11' : 'h-14 w-14'}`}>
          <AlertCircle className={isCompact ? 'h-5 w-5' : 'h-7 w-7'} />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-extrabold text-nexoraText">
            {t('components.settings.SettingsTipQrPanel.loadErrorTitle')}
          </p>
          <p className="text-xs leading-relaxed text-nexoraMuted">
            {t('components.settings.SettingsTipQrPanel.loadErrorDesc')}
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            refetchProfile()
            refetchPaymentQr()
          }}
          className="inline-flex items-center gap-2 rounded-lg border border-nexoraBorder bg-white px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-nexoraText hover:bg-slate-50 transition"
        >
          {t('components.settings.SettingsTipQrPanel.retry')}
        </button>
      </div>
    )
  }

  if (!readyPaymentMethods.length) {
    return (
      <div className={`flex flex-col items-center gap-3 px-2 text-center ${isGateway ? `${gatewayCardClass} min-h-[196px] justify-center` : isCompact ? 'py-5' : 'gap-4 py-8 px-4'}`}>
        <div className={`flex items-center justify-center rounded-2xl bg-amber-50 text-amber-600 ${isCompact ? 'h-11 w-11' : 'h-14 w-14'}`}>
          <Wallet className={isCompact ? 'h-5 w-5' : 'h-7 w-7'} />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-extrabold text-nexoraText">
            {t('components.settings.SettingsTipQrPanel.emptyTitle')}
          </p>
          <p className="text-xs leading-relaxed text-nexoraMuted">
            {t('components.settings.SettingsTipQrPanel.emptyDesc')}
          </p>
        </div>
        <button
          type="button"
          onClick={onConfigurePayoutMethods}
          className="inline-flex items-center gap-2 rounded-lg bg-nexoraBrand px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-white hover:bg-nexoraBrandDark transition"
        >
          <Wallet className="h-4 w-4" />
          {t('components.settings.SettingsTipQrPanel.emptyAction')}
        </button>
      </div>
    )
  }

  if (isGateway) {
    const gatewayActionButtons = (
      <>
        <button
          type="button"
          onClick={() => setShowPreview(true)}
          disabled={!paymentPageUrl}
          className={`${gatewayActionBtnClass} bg-white border border-nexoraBorder text-nexoraText hover:bg-nexoraSurfaceMuted disabled:cursor-not-allowed disabled:opacity-60`}
        >
          <Eye className="h-4 w-4 shrink-0" />
          <span className="truncate">{t('dashboard.master_gateway.btn_open')}</span>
        </button>
        <button
          type="button"
          onClick={handleDownloadQr}
          disabled={!paymentPageUrl || isDownloading}
          className={`${gatewayActionBtnClass} bg-nexoraBrand text-white hover:bg-nexoraBrandDark disabled:cursor-not-allowed disabled:opacity-60`}
        >
          <Download className="h-4 w-4 shrink-0" />
          <span className="truncate">{t('dashboard.master_gateway.btn_download')}</span>
        </button>
        <button
          type="button"
          disabled={!paymentPageUrl}
          onClick={() => handleCopy(paymentPageUrl, 'direct-payment-url')}
          className={`${gatewayActionBtnClass} bg-white border border-nexoraBorder text-nexoraText hover:bg-nexoraSurfaceMuted disabled:cursor-not-allowed disabled:opacity-60`}
        >
          {copiedId === 'direct-payment-url' ? (
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
      <>
        <div className={`${gatewayCardClass} flex flex-col gap-5 md:flex-row md:justify-between`}>
          <div className="flex flex-col justify-between md:flex-grow md:min-w-0">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                  <Wallet className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="text-sm font-extrabold text-nexoraText">
                    {t('dashboard.master_gateway.payment_title')}
                  </h3>
                </div>
              </div>
              <p className="mt-4 text-xs leading-normal text-nexoraMuted">
                {t('dashboard.master_gateway.payment_body')}
              </p>
            </div>

            <div className="mt-6 hidden w-full grid-cols-3 gap-2 md:grid">
              {gatewayActionButtons}
            </div>
          </div>

          <button
            type="button"
            onClick={() => paymentPageUrl && setShowPreview(true)}
            aria-label={t('components.settings.SettingsTipQrPanel.previewQr')}
            className="mx-auto flex h-28 w-28 shrink-0 items-center justify-center rounded-lg border border-nexoraBorder/80 bg-white p-2 shadow-sm relative overflow-hidden cursor-pointer hover:border-nexoraBrand transition select-none group md:mx-0 md:self-start"
          >
            {qrPreviewUrl ? (
              <QrImage
                src={qrPreviewUrl}
                alt={t('components.settings.SettingsTipQrPanel.qrAlt')}
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
            {gatewayActionButtons}
          </div>
        </div>

        <DirectPaymentQrPreviewModal
          open={showPreview}
          onClose={() => setShowPreview(false)}
          title={t('dashboard.master_gateway.payment_title')}
          businessName={businessName}
          previewQrUrl={previewQrUrl}
          paymentPageUrl={paymentPageUrl}
          hideUrlCode
          scanCaption={t('components.settings.SettingsTipQrPanel.scanCaption')}
        />
      </>
    )
  }

  if (isCompact) {
    return (
      <>
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[9px] font-extrabold uppercase tracking-wide text-emerald-700">
              {t('components.settings.SettingsTipQrPanel.activeMethodsLabel', {
                count: readyPaymentMethods.length,
              })}
            </span>
            {readyPaymentMethods.map((method) => (
              <span
                key={method.id || method.type}
                className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[9px] font-bold text-emerald-800"
              >
                {method.name || getPaymentMethodDisplayName(method.type || '')}
              </span>
            ))}
          </div>

          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:gap-5">
            <button
              type="button"
              onClick={() => setShowPreview(true)}
              disabled={!paymentPageUrl}
              className="group relative mx-auto flex h-[120px] w-[120px] shrink-0 items-center justify-center self-center rounded-xl border border-nexoraBorder bg-white p-2 shadow-sm transition hover:border-nexoraBrand hover:scale-[1.02] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 sm:mx-0"
              title={t('components.settings.SettingsTipQrPanel.previewQr')}
            >
              {qrPreviewUrl ? (
                <QrImage
                  src={qrPreviewUrl}
                  alt={t('components.settings.SettingsTipQrPanel.qrAlt')}
                  className="h-full w-full"
                />
              ) : (
                <QrCode className="h-12 w-12 text-slate-300" />
              )}
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5 rounded-xl bg-nexoraBrand/85 text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
                <Eye className="h-4 w-4" />
                <span className="text-[8px] font-black uppercase tracking-wider">
                  {t('components.settings.SettingsTipQrPanel.previewQr')}
                </span>
              </div>
            </button>

            <div className="flex min-w-0 flex-1 flex-col gap-3">
              <div className="space-y-1.5">
                <h3 className="text-sm font-extrabold text-nexoraText">
                  {businessName || t('components.settings.SettingsTipQrPanel.defaultQrTitle')}
                </h3>
                {hideUrlCode ? null : (
                  paymentPageUrl ? (
                    <a
                      href={paymentPageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex max-w-full items-center gap-1 text-[10px] font-bold text-blue-500 hover:text-blue-600"
                    >
                      <span className="truncate">{paymentPageUrl.replace(/^https?:\/\//, '')}</span>
                      <ExternalLink className="h-3 w-3 shrink-0" />
                    </a>
                  ) : null
                )}
                <p className="text-[10px] text-nexoraMuted">
                  {t('components.settings.SettingsTipQrPanel.scanCaption')}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3">
                <button
                  type="button"
                  disabled={!paymentPageUrl}
                  onClick={() => handleCopy(paymentPageUrl, 'direct-payment-url')}
                  className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-lg border border-nexoraBorder bg-white px-3 text-[11px] font-bold text-nexoraText transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {copiedId === 'direct-payment-url' ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                      <span className="text-emerald-600">{t('components.settings.tabs.ProfileTab.copied')}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                  <span className="truncate">{t('components.settings.SettingsTipQrPanel.copyLink')}</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  disabled={!paymentPageUrl || isDownloading}
                  onClick={handleDownloadQr}
                  className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-lg bg-amber-600 px-3 text-[11px] font-bold text-white transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isDownloading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Download className="h-3.5 w-3.5" />
                  )}
                  <span className="truncate">{t('components.settings.SettingsTipQrPanel.downloadQr')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/dashboard/reports?tab=direct_payments')}
                  className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-lg border border-nexoraBrand/20 bg-nexoraBrandSoft px-3 text-[11px] font-bold text-nexoraBrand transition hover:bg-nexoraBrand/10"
                >
                  <ClipboardList className="h-3.5 w-3.5" />
                  <span className="truncate">{t('components.settings.SettingsTipQrPanel.viewHistory')}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <DirectPaymentQrPreviewModal
          open={showPreview && Boolean(paymentPageUrl)}
          onClose={() => setShowPreview(false)}
          title={t('components.settings.SettingsTipQrPanel.defaultQrTitle')}
          businessName={businessName}
          previewQrUrl={previewQrUrl}
          paymentPageUrl={paymentPageUrl}
          scanCaption={t('components.settings.SettingsTipQrPanel.scanCaption')}
        />
      </>
    )
  }

  return (
    <>
      <div className="space-y-4">
        <p className="text-center text-xs leading-relaxed text-nexoraMuted">
          {t('components.settings.SettingsTipQrPanel.description')}
        </p>

        <div className="flex flex-col items-center gap-4 rounded-xl border border-slate-100 bg-slate-50/80 p-4">
          <div className="flex h-44 w-44 items-center justify-center rounded-2xl border-2 border-nexoraBorder bg-white p-3 shadow-sm">
            {qrPreviewUrl ? (
              <QrImage
                src={qrPreviewUrl}
                alt={t('components.settings.SettingsTipQrPanel.qrAlt')}
                className="h-full w-full"
              />
            ) : (
              <QrCode className="h-16 w-16 text-slate-300" />
            )}
          </div>

          <div className="w-full space-y-1 text-center">
            <p className="text-xs font-extrabold text-nexoraText">
              {businessName || t('components.settings.SettingsTipQrPanel.defaultQrTitle')}
            </p>
            <p className="text-[10px] font-bold uppercase tracking-wide text-nexoraMuted">
              {t('components.settings.SettingsTipQrPanel.scanCaption')}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            disabled={!paymentPageUrl}
            onClick={() => handleCopy(paymentPageUrl, 'direct-payment-url')}
            className="flex w-full cursor-pointer flex-row items-center justify-center gap-2 rounded-lg border border-nexoraBorder bg-white px-3 py-3.5 text-[11px] font-bold leading-snug text-nexoraText transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {copiedId === 'direct-payment-url' ? (
              <>
                <Check className="h-4 w-4 shrink-0 text-emerald-600" />
                <span className="text-emerald-600">{t('components.settings.tabs.ProfileTab.copied')}</span>
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 shrink-0" />
                <span>{t('components.settings.SettingsTipQrPanel.copyLink')}</span>
              </>
            )}
          </button>
          <button
            type="button"
            disabled={!paymentPageUrl || isDownloading}
            onClick={handleDownloadQr}
            className="flex w-full cursor-pointer flex-row items-center justify-center gap-2 rounded-lg bg-amber-600 px-3 py-3.5 text-[11px] font-bold leading-snug text-white transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isDownloading ? (
              <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
            ) : (
              <Download className="h-4 w-4 shrink-0" />
            )}
            <span>{t('components.settings.SettingsTipQrPanel.downloadQr')}</span>
          </button>
        </div>

        <button
          type="button"
          onClick={() => navigate('/dashboard/reports?tab=direct_payments')}
          className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-nexoraBrand/20 bg-nexoraBrandSoft px-4 py-3 text-xs font-bold text-nexoraBrand transition hover:bg-nexoraBrand/10"
        >
          <ClipboardList className="h-4 w-4 shrink-0" />
          {t('components.settings.SettingsTipQrPanel.viewHistory')}
        </button>
      </div>
    </>
  )
}
