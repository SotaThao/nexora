import React, { useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { Loader2, RotateCcw } from 'lucide-react'
import { useTranslation } from '../../../contexts/LanguageContext'
import { useKybInfo } from '../../../data/hooks/useProfileSettings'

const APPROVED_STATUSES = new Set(['kyb_approved', 'verified_pro'])

function shouldRequestKybCamera(verificationStatus: string) {
  return (
    verificationStatus === 'basic' ||
    verificationStatus === 'kyb_rejected' ||
    verificationStatus === 'rejected'
  )
}

async function requestCameraPermission() {
  if (!navigator.mediaDevices?.getUserMedia) return

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: 'user',
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
    })
    stream.getTracks().forEach((track) => track.stop())
  } catch {
    // Permission denied or unavailable — iframe may still prompt the user.
  }
}

export type KybTabHandle = {
  openPortal: () => void
}

type KybTabProps = {
  profile: LooseObject
  cardDetails: LooseObject | null
  verificationStatus: string
  showToast: (message: string) => void
  portalRef?: React.Ref<KybTabHandle>
}

export default function KybTab({
  cardDetails,
  verificationStatus,
  portalRef,
}: KybTabProps) {
  const { t, currentLanguage } = useTranslation()
  const [isIframeLoading, setIsIframeLoading] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const cameraRequestedRef = useRef(false)

  const isApproved = APPROVED_STATUSES.has(verificationStatus)

  const {
    data: kybInfo,
    isLoading: isLoadingKybInfo,
    isFetching: isFetchingKybInfo,
    isError: isKybInfoError,
    refetch: refetchKybInfo,
  } = useKybInfo({ language: currentLanguage })

  const iframeUrl = kybInfo?.url
  const hasUrl = Boolean(iframeUrl)
  const isBusy = isLoadingKybInfo || (isFetchingKybInfo && !hasUrl)

  const onLoadKybForm = useCallback(() => {
    refetchKybInfo()
  }, [refetchKybInfo])

  const openPortal = useCallback(() => {
    onLoadKybForm()
  }, [onLoadKybForm])

  useImperativeHandle(portalRef, () => ({ openPortal }), [openPortal])

  useEffect(() => {
    if (!hasUrl) return

    setIsIframeLoading(true)
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = window.setTimeout(() => setIsIframeLoading(false), 30000)

    const shouldRequestCamera = shouldRequestKybCamera(verificationStatus)

    if (shouldRequestCamera && !cameraRequestedRef.current) {
      cameraRequestedRef.current = true
      requestCameraPermission()
    }

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [hasUrl, iframeUrl, verificationStatus])

  const handleIframeLoad = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    setIsIframeLoading(false)
  }

  const handleRetry = () => {
    onLoadKybForm()
  }

  const showIframe = !isBusy && !isKybInfoError && hasUrl
  const showInitError = !isBusy && isKybInfoError
  const showMissingUrl = !isBusy && !isKybInfoError && !hasUrl

  return (
    <div className="space-y-6 animate-fadeIn">
      {cardDetails && (
        <div
          className={`rounded-xl border p-5 sm:p-6 flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4 shadow-nexora-soft ${cardDetails.bgClass}`}
        >
          <div className="flex gap-4 items-start text-center sm:text-left flex-col sm:flex-row">
            <span
              className={`flex h-12 w-12 items-center justify-center rounded-2xl shrink-0 shadow-sm text-white ${cardDetails.iconBg}`}
            >
              <cardDetails.icon className="h-6 w-6" />
            </span>

            <div className="space-y-1">
              <h3 className="text-sm font-black uppercase tracking-wider">{cardDetails.title}</h3>
              <p className="text-xs font-semibold opacity-85 leading-relaxed max-w-2xl">
                {cardDetails.description}
              </p>
              {cardDetails.subText && (
                <div className="text-[10px] font-bold bg-white/50 border border-emerald-200/50 inline-block px-2.5 py-0.5 rounded mt-2">
                  {cardDetails.subText}
                </div>
              )}
            </div>
          </div>

          {cardDetails.ctaText && !isApproved && (
            <button
              type="button"
              onClick={openPortal}
              disabled={isBusy}
              className="shrink-0 rounded-lg bg-nexoraBrand hover:bg-nexoraBrandDark text-white px-4 py-2.5 text-xs font-bold transition shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {cardDetails.ctaText}
            </button>
          )}
        </div>
      )}

      {isKybInfoError && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => refetchKybInfo()}
            className="inline-flex items-center rounded-lg border border-nexoraBorder bg-white px-3 py-1.5 text-xs font-bold text-nexoraText hover:bg-slate-50 transition"
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            {t('components.settings.tabs.KybTab.retry')}
          </button>
        </div>
      )}

      {isBusy && (
        <div className="flex h-[calc(100vh-320px)] min-h-[400px] flex-col items-center justify-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-nexoraBrand" />
          <span className="text-sm text-nexoraMuted">{t('common.loading')}</span>
        </div>
      )}

      {showInitError && (
        <div className="flex h-[calc(100vh-320px)] min-h-[300px] flex-col items-center justify-center gap-4">
          <p className="max-w-sm text-center text-sm text-nexoraMuted">
            {t('components.settings.tabs.KybTab.networkError')}
          </p>
          <button
            type="button"
            onClick={handleRetry}
            className="inline-flex items-center rounded-lg border border-nexoraBorder bg-white px-4 py-2 text-xs font-bold text-nexoraText hover:bg-slate-50 transition"
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            {t('components.settings.tabs.KybTab.retry')}
          </button>
        </div>
      )}

      {showIframe && (
        <div className="relative h-[calc(100vh-280px)] min-h-[480px] w-full rounded-xl border border-nexoraBorder overflow-hidden bg-white shadow-sm animate-fadeIn">
          {isIframeLoading && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-white">
              <Loader2 className="h-6 w-6 animate-spin text-nexoraBrand" />
              <span className="text-sm text-nexoraMuted">{t('common.loading')}</span>
            </div>
          )}
          <iframe
            src={iframeUrl}
            title={t('components.settings.tabs.KybTab.iframeTitle')}
            className="h-full w-full border-0"
            allow="camera *; microphone *; geolocation *; fullscreen *"
            onLoad={handleIframeLoad}
            allowFullScreen
          />
        </div>
      )}

      {showMissingUrl && (
        <div className="flex h-[calc(100vh-320px)] min-h-[300px] flex-col items-center justify-center gap-4">
          <p className="max-w-sm text-center text-sm text-nexoraMuted">
            {t('components.settings.tabs.KybTab.serverError')}
          </p>
          <button
            type="button"
            onClick={handleRetry}
            className="inline-flex items-center rounded-lg border border-nexoraBorder bg-white px-4 py-2 text-xs font-bold text-nexoraText hover:bg-slate-50 transition"
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            {t('components.settings.tabs.KybTab.retry')}
          </button>
        </div>
      )}

      <div className="rounded-xl border border-nexoraBorder bg-slate-50 p-6 space-y-4 text-xs mt-6 text-nexoraMuted select-text">
        <h5 className="font-bold text-nexoraText uppercase tracking-wider border-b border-slate-200 pb-2">
          {t('components.settings.tabs.KybTab.legalDisclosuresAndTerms')}
        </h5>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-1">
            <h6 className="font-extrabold text-slate-700">
              {t('components.settings.tabs.KybTab.label1IrsIncomeReporting')}
            </h6>
            <p className="leading-relaxed text-[11px]">
              {t('components.settings.tabs.KybTab.under1099KRegulations')}
            </p>
          </div>
          <div className="space-y-1">
            <h6 className="font-extrabold text-slate-700">
              {t('components.settings.tabs.KybTab.label2SavingsDisclaimer')}
            </h6>
            <p className="leading-relaxed text-[11px]">
              {t('components.settings.tabs.KybTab.estimatedProcessingSavingsAre')}
            </p>
          </div>
          <div className="space-y-1">
            <h6 className="font-extrabold text-slate-700">
              {t('components.settings.tabs.KybTab.label3TermsOfService')}
            </h6>
            <p className="leading-relaxed text-[11px]">
              {t('components.settings.tabs.KybTab.usageConstitutesAgreementWith')}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
