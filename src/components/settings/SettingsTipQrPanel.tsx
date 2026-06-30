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
  X,
  Printer,
  AlertCircle,
  ClipboardList,
} from 'lucide-react'
import { useProfileSettings } from '../../data/hooks/useProfileSettings'
import { useMerchantPaymentQr } from '../../data/hooks/useMerchantPayments'
import { useMerchantPaymentMethods } from '../../data/hooks/useMerchantPaymentMethods'
import { buildPublicQrImageUrl } from '../../data/repositories/publicQr'
import {
  resolveDirectPaymentPageUrl,
  resolveMerchantBusinessIdFromProfile,
} from '../../utils/merchantBusinessId'
import { downloadQrCode } from '../../utils/qrUtils'
import { payoutTypeToUiKey, getPaymentMethodDisplayName } from '../../data/paymentMethodTypes'

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
    () => (paymentPageUrl ? buildPublicQrImageUrl(paymentPageUrl, isCompact ? 150 : 200) : ''),
    [paymentPageUrl, isCompact],
  )

  const previewQrUrl = useMemo(
    () => (paymentPageUrl ? buildPublicQrImageUrl(paymentPageUrl, 280) : ''),
    [paymentPageUrl],
  )

  const handleDownloadQr = useCallback(async () => {
    if (!paymentPageUrl) return

    setIsDownloading(true)
    try {
      await downloadQrCode(buildPublicQrImageUrl(paymentPageUrl, 1000), 'direct-payment-qr.png')
      showToast(t('components.SettingsView.qrCodeDownloaded'), 'success')
    } catch {
      showToast(t('components.dashboard.overview.Overview.qr_download_failed'), 'error')
    } finally {
      setIsDownloading(false)
    }
  }, [paymentPageUrl, showToast, t])

  const isLoading = isProfileLoading || isQrLoading || isMethodsLoading

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center ${isCompact ? 'py-6' : 'py-10'}`}>
        <Loader2 className={`animate-spin text-nexoraBrand ${isCompact ? 'h-5 w-5' : 'h-6 w-6'}`} />
      </div>
    )
  }

  if (isProfileError || isQrError || (!isProfileLoading && !isQrLoading && !businessId)) {
    return (
      <div className={`flex flex-col items-center gap-3 px-2 text-center ${isCompact ? 'py-5' : 'gap-4 py-8 px-4'}`}>
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
      <div className={`flex flex-col items-center gap-3 px-2 text-center ${isCompact ? 'py-5' : 'gap-4 py-8 px-4'}`}>
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
                <img
                  src={qrPreviewUrl}
                  alt={t('components.settings.SettingsTipQrPanel.qrAlt')}
                  className="h-full w-full object-contain"
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

        {showPreview && paymentPageUrl ? (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
            <div className="relative w-full max-w-sm rounded-3xl border border-slate-100 bg-white p-6 text-center shadow-2xl animate-scaleIn">
              <button
                type="button"
                onClick={() => setShowPreview(false)}
                className="absolute right-4 top-4 rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                title="Close"
              >
                <X className="h-5 w-5" />
              </button>

              <h3 className="mt-2 text-sm font-black uppercase tracking-wider text-slate-800">
                {t('components.settings.SettingsTipQrPanel.defaultQrTitle')}
              </h3>
              <p className="mt-1 text-[11px] text-slate-400">{businessName}</p>

              <div className="mx-auto my-4 flex h-[240px] w-[240px] items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <img
                  src={previewQrUrl}
                  alt={t('components.settings.SettingsTipQrPanel.qrAlt')}
                  className="h-full w-full object-contain"
                />
              </div>

              <p className="rounded-lg bg-slate-50 px-3 py-2 text-[10px] font-mono text-slate-500 break-all">
                {paymentPageUrl.replace(/^https?:\/\//, '')}
              </p>

              <p className="mt-3 text-[10px] font-bold uppercase tracking-wide text-nexoraMuted">
                {t('components.settings.SettingsTipQrPanel.scanCaption')}
              </p>

              <button
                type="button"
                onClick={() => window.print()}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-nexoraBrand px-4 py-3 text-xs font-bold uppercase tracking-wide text-white transition hover:bg-nexoraBrandDark"
              >
                <Printer className="h-4 w-4" />
                {t('dashboard.modals.print_qr')}
              </button>
            </div>
          </div>
        ) : null}
      </>
    )
  }

  return (
    <>
      <div className="space-y-4">
        <p className="text-xs leading-relaxed text-nexoraMuted">
          {t('components.settings.SettingsTipQrPanel.description')}
        </p>

        <ol className="space-y-2 rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3 text-left">
          {[
            t('components.settings.SettingsTipQrPanel.stepScan'),
            t('components.settings.SettingsTipQrPanel.stepAmount'),
            t('components.settings.SettingsTipQrPanel.stepMethod'),
            t('components.settings.SettingsTipQrPanel.stepConfirm'),
          ].map((step, index) => (
            <li key={step} className="flex items-start gap-2.5 text-[11px] leading-relaxed text-nexoraText">
              <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-nexoraBrand text-[9px] font-black text-white">
                {index + 1}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>

        <div className="rounded-xl border border-emerald-100 bg-emerald-50/70 px-3 py-2.5">
          <p className="text-[10px] font-extrabold uppercase tracking-wide text-emerald-700">
            {t('components.settings.SettingsTipQrPanel.activeMethodsLabel', {
              count: readyPaymentMethods.length,
            })}
          </p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {readyPaymentMethods.map((method) => (
              <span
                key={method.id || method.type}
                className="rounded-full border border-emerald-200 bg-white px-2 py-0.5 text-[10px] font-bold text-emerald-800"
              >
                {method.name || getPaymentMethodDisplayName(method.type || '')}
              </span>
            ))}
          </div>
        </div>

        <div className="flex flex-col items-center gap-4 rounded-xl border border-slate-100 bg-slate-50/80 p-4">
          <button
            type="button"
            onClick={() => setShowPreview(true)}
            disabled={!paymentPageUrl}
            className="group relative flex h-44 w-44 items-center justify-center rounded-2xl border-2 border-nexoraBorder bg-white p-3 shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
            title={t('components.settings.SettingsTipQrPanel.previewQr')}
          >
            {qrPreviewUrl ? (
              <img
                src={qrPreviewUrl}
                alt={t('components.settings.SettingsTipQrPanel.qrAlt')}
                className="h-full w-full object-contain"
              />
            ) : (
              <QrCode className="h-16 w-16 text-slate-300" />
            )}
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 rounded-2xl bg-nexoraBrand/90 text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
              <Eye className="h-5 w-5" />
              <span className="text-[9px] font-black uppercase tracking-wider">
                {t('components.settings.SettingsTipQrPanel.previewQr')}
              </span>
            </div>
          </button>

          <div className="w-full space-y-1 text-center">
            <p className="text-xs font-extrabold text-nexoraText">
              {businessName || t('components.settings.SettingsTipQrPanel.defaultQrTitle')}
            </p>
            {paymentPageUrl ? (
              <a
                href={paymentPageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex max-w-full items-center justify-center gap-1 text-[10px] font-bold text-blue-500 hover:text-blue-600"
              >
                <span className="truncate">{paymentPageUrl.replace(/^https?:\/\//, '')}</span>
                <ExternalLink className="h-3 w-3 shrink-0" />
              </a>
            ) : null}
            <p className="text-[10px] font-bold uppercase tracking-wide text-nexoraMuted">
              {t('components.settings.SettingsTipQrPanel.scanCaption')}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <button
            type="button"
            disabled={!paymentPageUrl}
            onClick={() => setShowPreview(true)}
            className="flex w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-nexoraBorder bg-white px-2 py-3.5 text-center text-[11px] font-bold leading-snug text-nexoraText transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Eye className="h-4 w-4 shrink-0" />
            <span>{t('components.settings.SettingsTipQrPanel.previewQr')}</span>
          </button>
          <button
            type="button"
            disabled={!paymentPageUrl}
            onClick={() => handleCopy(paymentPageUrl, 'direct-payment-url')}
            className="flex w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-nexoraBorder bg-white px-2 py-3.5 text-center text-[11px] font-bold leading-snug text-nexoraText transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
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
            className="flex w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-lg bg-amber-600 px-2 py-3.5 text-center text-[11px] font-bold leading-snug text-white transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-50"
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

        <p className="text-[10px] leading-relaxed text-nexoraMuted">
          {t('components.settings.SettingsTipQrPanel.merchantNote')}
        </p>
      </div>

      {showPreview && paymentPageUrl ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-sm rounded-3xl border border-slate-100 bg-white p-6 text-center shadow-2xl animate-scaleIn">
            <button
              type="button"
              onClick={() => setShowPreview(false)}
              className="absolute right-4 top-4 rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              title="Close"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="mt-2 text-sm font-black uppercase tracking-wider text-slate-800">
              {t('components.settings.SettingsTipQrPanel.defaultQrTitle')}
            </h3>
            <p className="mt-1 text-[11px] text-slate-400">{businessName}</p>

            <div className="mx-auto my-4 flex h-[240px] w-[240px] items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <img
                src={previewQrUrl}
                alt={t('components.settings.SettingsTipQrPanel.qrAlt')}
                className="h-full w-full object-contain"
              />
            </div>

            {hideUrlCode ? null : (
              <p className="rounded-lg bg-slate-50 px-3 py-2 text-[10px] font-mono text-slate-500 break-all">
                {paymentPageUrl.replace(/^https?:\/\//, '')}
              </p>
            )}

            <p className="mt-3 text-[10px] font-bold uppercase tracking-wide text-nexoraMuted">
              {t('components.settings.SettingsTipQrPanel.scanCaption')}
            </p>

            <button
              type="button"
              onClick={() => window.print()}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-nexoraBrand px-4 py-3 text-xs font-bold uppercase tracking-wide text-white transition hover:bg-nexoraBrandDark"
            >
              <Printer className="h-4 w-4" />
              {t('dashboard.modals.print_qr')}
            </button>
          </div>
        </div>
      ) : null}
    </>
  )
}
