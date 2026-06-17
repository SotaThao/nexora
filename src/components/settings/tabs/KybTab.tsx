import React, { useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { Building2, ChevronDown, Loader2, RotateCcw, ShieldCheck } from 'lucide-react'
import { useTranslation } from '../../../contexts/LanguageContext'
import type { KybIframeInitializeResponse } from '../../../data/repositories/profileSettings'
import { useKybInfo, useRegisterKyb } from '../../../data/hooks/useProfileSettings'

const APPROVED_STATUSES = new Set(['kyb_approved', 'verified_pro'])

function hasKybSubmission(kybInfo?: KybIframeInitializeResponse | null) {
  if (!kybInfo) return false
  return Boolean(kybInfo.identityId)
}

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
  profile,
  cardDetails,
  verificationStatus,
  portalRef,
}: KybTabProps) {
  const { t, currentLanguage } = useTranslation()
  const [isAccordionOpen, setIsAccordionOpen] = useState(true)
  const [isIframeLoading, setIsIframeLoading] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const cameraRequestedRef = useRef(false)
  const autoLoadAttemptedRef = useRef(false)

  const isApproved = APPROVED_STATUSES.has(verificationStatus)

  const {
    data: kybInfo,
    isLoading: isLoadingKybInfo,
    isError: isKybInfoError,
    refetch: refetchKybInfo,
  } = useKybInfo({ language: currentLanguage, enabled: !isApproved })

  const {
    mutate: loadKybForm,
    data: portalData,
    isPending: isLoadingForm,
    isError: isInitError,
    reset: resetPortal,
  } = useRegisterKyb()

  const hasSubmittedKyb = hasKybSubmission(kybInfo)
  const iframeUrl = portalData?.url
  const hasUrl = Boolean(iframeUrl)
  const isLoadingScreen = !isApproved && isLoadingKybInfo
  const isBusy = isLoadingScreen || isLoadingForm

  const onLoadKybForm = useCallback(() => {
    refetchKybInfo()
    loadKybForm()
  }, [loadKybForm, refetchKybInfo])

  const openPortal = useCallback(() => {
    onLoadKybForm()
  }, [onLoadKybForm])

  useImperativeHandle(portalRef, () => ({ openPortal }), [openPortal])

  useEffect(() => {
    if (isApproved || isLoadingKybInfo || autoLoadAttemptedRef.current) return
    if (!kybInfo || !hasSubmittedKyb) return

    autoLoadAttemptedRef.current = true
    onLoadKybForm()
  }, [isApproved, isLoadingKybInfo, kybInfo, hasSubmittedKyb, onLoadKybForm])

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
    resetPortal()
    autoLoadAttemptedRef.current = false
    onLoadKybForm()
  }

  const showLanding = !isApproved && !isBusy && !hasUrl && !isInitError
  const showIframe = !isApproved && !isBusy && !isInitError && hasUrl
  const showInitError = !isApproved && !isBusy && isInitError
  const showMissingUrl =
    !isApproved && !isBusy && !isInitError && !hasUrl && hasSubmittedKyb && !showLanding

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

      {isApproved && (
        <div className="rounded-xl border border-nexoraBorder bg-white shadow-sm p-6 space-y-3 animate-fadeIn">
          <div className="flex items-center gap-3 border-b border-nexoraRule pb-3">
            <Building2 className="h-5 w-5 text-emerald-600" />
            <h4 className="text-xs font-black uppercase text-nexoraText tracking-wider">
              {t('components.settings.tabs.KybTab.registeredCompanyDossier')}
            </h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="flex flex-col gap-1">
              <span className="text-nexoraMuted font-semibold">
                {t('components.settings.tabs.KybTab.legalBusinessName')}
              </span>
              <span className="text-nexoraText font-extrabold">
                {profile.businessName || profile.fullName || '—'}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-nexoraMuted font-semibold">
                {t('components.settings.tabs.KybTab.representativeOwnerName')}
              </span>
              <span className="text-nexoraText font-extrabold">{profile.fullName || '—'}</span>
            </div>
          </div>
        </div>
      )}

      {!isApproved && isKybInfoError && (
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

      {showLanding && (
        <div className="flex flex-col items-center justify-center py-6 space-y-6 animate-fadeIn">
          <div className="flex h-28 w-28 items-center justify-center rounded-full bg-nexoraBrand/10 text-nexoraBrand">
            <ShieldCheck className="h-14 w-14" />
          </div>

          <div className="text-center space-y-3 max-w-2xl px-4">
            <h2 className="text-lg font-extrabold text-nexoraText">
              {t('components.settings.tabs.KybTab.verifyYourBusiness')}
            </h2>
            <p
              className="text-sm text-nexoraMuted leading-relaxed"
              dangerouslySetInnerHTML={{ __html: t('components.settings.tabs.KybTab.subtitle') }}
            />
          </div>

          <button
            type="button"
            onClick={openPortal}
            disabled={isLoadingForm}
            className="rounded-xl bg-nexoraBrand hover:bg-nexoraBrandDark text-white px-10 py-3 text-sm font-bold transition min-w-[237px] flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {isLoadingForm && <Loader2 className="h-4 w-4 animate-spin" />}
            {t('components.settings.tabs.KybTab.getStarted')}
          </button>

          <div className="w-full max-w-3xl rounded-xl border border-nexoraBorder bg-nexoraCanvas/60 overflow-hidden mt-4">
            <button
              type="button"
              onClick={() => setIsAccordionOpen((prev) => !prev)}
              className="w-full flex items-center justify-between px-5 py-4 text-left bg-slate-100/80 hover:bg-slate-100 transition"
            >
              <span className="text-sm font-bold text-nexoraText">
                {t('components.settings.tabs.KybTab.tabKybTitle')}
              </span>
              <ChevronDown
                className={`h-5 w-5 text-nexoraMuted transition-transform duration-200 ${
                  isAccordionOpen ? 'rotate-180' : ''
                }`}
              />
            </button>
            {isAccordionOpen && (
              <div className="px-5 py-4 text-left text-sm text-nexoraMuted leading-relaxed border-t border-nexoraBorder/60 bg-white/50">
                <p>{t('components.settings.tabs.KybTab.tabKybContent')}</p>
              </div>
            )}
          </div>
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
