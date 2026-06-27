import React, { useCallback, useMemo, useState } from 'react'
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
}) {
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
    () => (paymentPageUrl ? buildPublicQrImageUrl(paymentPageUrl, 200) : ''),
    [paymentPageUrl],
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
      <div className="flex items-center justify-center py-10">
        <Loader2 className="h-6 w-6 animate-spin text-nexoraBrand" />
      </div>
    )
  }

  if (isProfileError || isQrError || (!isProfileLoading && !isQrLoading && !businessId)) {
    return (
      <div className="flex flex-col items-center gap-4 py-8 px-4 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
          <AlertCircle className="h-7 w-7" />
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
      <div className="flex flex-col items-center gap-4 py-8 px-4 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
          <Wallet className="h-7 w-7" />
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

        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            disabled={!paymentPageUrl}
            onClick={() => setShowPreview(true)}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-nexoraBorder bg-white px-3 py-2.5 text-[10px] font-bold uppercase tracking-wide text-nexoraText disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Eye className="h-3.5 w-3.5" />
            {t('components.settings.SettingsTipQrPanel.previewQr')}
          </button>
          <button
            type="button"
            disabled={!paymentPageUrl}
            onClick={() => handleCopy(paymentPageUrl, 'direct-payment-url')}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-nexoraBorder bg-white px-3 py-2.5 text-[10px] font-bold uppercase tracking-wide text-nexoraText disabled:cursor-not-allowed disabled:opacity-50"
          >
            {copiedId === 'direct-payment-url' ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-600" />
                <span className="text-emerald-600">{t('components.settings.tabs.ProfileTab.copied')}</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                {t('components.settings.SettingsTipQrPanel.copyLink')}
              </>
            )}
          </button>
          <button
            type="button"
            disabled={!paymentPageUrl || isDownloading}
            onClick={handleDownloadQr}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-amber-600 px-3 py-2.5 text-[10px] font-bold uppercase tracking-wide text-white hover:bg-amber-700 transition disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isDownloading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Download className="h-3.5 w-3.5" />
            )}
            {t('components.settings.SettingsTipQrPanel.downloadQr')}
          </button>
        </div>

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
