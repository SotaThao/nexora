import { useEffect, useRef, useState } from 'react'
import { IdCard, Loader2, RotateCcw } from 'lucide-react'
import { useTranslation } from '../../../contexts/LanguageContext'
import { UserVerifyStatus } from '../../../constants/userVerifyStatus'
import { useKycInitialize, useVerifiedStatus } from '../../../data/hooks/useProfileSettings'

export default function StaffKycOverview() {
  const { t } = useTranslation()
  const [shouldInitialize, setShouldInitialize] = useState(false)
  const [isExpanded, setIsExpanded] = useState(true)

  const {
    data: verifyStatusData,
    isLoading: isLoadingStatus,
    isError: isStatusError,
    refetch: refetchStatus,
  } = useVerifiedStatus()

  const isNoneStatus = verifyStatusData?.status === UserVerifyStatus.None

  const { data, isLoading, isFetching, isError, refetch } = useKycInitialize({
    enabled: shouldInitialize || !isNoneStatus,
  })

  const [isIframeLoading, setIsIframeLoading] = useState(false)
  const timeoutRef = useRef(null)

  const handleGetStarted = () => {
    setShouldInitialize(true)
  }

  const isBusy = isLoading || isFetching || isLoadingStatus
  const hasUrl = Boolean(data?.url)
  const iframeUrl = data?.url

  useEffect(() => {
    if (hasUrl) {
      setIsIframeLoading(true)
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      timeoutRef.current = window.setTimeout(() => {
        setIsIframeLoading(false)
      }, 30000)
      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
        }
      }
    }
  }, [hasUrl, iframeUrl])

  const handleIframeLoad = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    setIsIframeLoading(false)
  }

  return (
    <div>
      {isStatusError && (
        <div className="mb-4 flex justify-end">
          <button
            type="button"
            onClick={() => refetchStatus()}
            className="inline-flex items-center rounded-lg border border-nexoraBorder bg-white px-3 py-1.5 text-xs font-bold text-nexoraText hover:bg-slate-50 transition cursor-pointer"
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            {t('components.staff_dashboard.views.StaffKycOverview.retry')}
          </button>
        </div>
      )}

      {!isLoadingStatus &&
        !isStatusError &&
        isNoneStatus &&
        !shouldInitialize && (
          <div className="flex flex-col items-center justify-center py-6 space-y-6">
            <div className="flex h-28 w-28 items-center justify-center rounded-full bg-nexoraBrand/10 text-nexoraBrand">
              <IdCard className="h-14 w-14" />
            </div>

            <div className="text-center space-y-4 max-w-2xl">
              <h2 className="text-2xl font-semibold text-nexoraText">
                {t('components.staff_dashboard.views.StaffKycOverview.verifyYourAccount')}
              </h2>
              <p className="text-base text-nexoraMuted">
                {t('components.staff_dashboard.views.StaffKycOverview.completeKyc')}{' '}
                <span className="font-semibold">{t('components.staff_dashboard.views.StaffKycOverview.kyc')}</span>{' '}
                {t('components.staff_dashboard.views.StaffKycOverview.andExploreNextLevel')}{' '}
                <span className="font-semibold">
                  {t('components.staff_dashboard.views.StaffKycOverview.nexora')}
                </span>
              </p>
            </div>

            <button
              type="button"
              onClick={handleGetStarted}
              className="rounded-lg bg-nexoraBrand hover:bg-nexoraBrandDark text-white px-12 py-3 text-base font-semibold transition cursor-pointer"
            >
              {t('components.staff_dashboard.views.StaffKycOverview.getStarted')}
            </button>

            <div className="w-full max-w-3xl bg-nexoraCanvas rounded-lg p-6 mt-8">
              <button
                className="w-full flex items-center justify-between text-left cursor-pointer"
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                <h3 className="text-lg font-semibold text-nexoraText">
                  {t('components.staff_dashboard.views.StaffKycOverview.whyKycMatters')}
                </h3>
                <svg
                  className={`w-5 h-5 text-nexoraMuted transition-transform duration-200 ${
                    isExpanded ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
              {isExpanded && (
                <div className="mt-4">
                  <p className="text-sm text-nexoraMuted leading-relaxed">
                    {t('components.staff_dashboard.views.StaffKycOverview.kycDescription')}{' '}
                    <span className="font-semibold">
                      {t('components.staff_dashboard.views.StaffKycOverview.nexora')}
                    </span>{' '}
                    {t('components.staff_dashboard.views.StaffKycOverview.kycDescriptionContinued')}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

      {isError && !isNoneStatus && (
        <div className="mb-4 flex justify-end">
          <button
            type="button"
            onClick={() => refetch()}
            className="inline-flex items-center rounded-lg border border-nexoraBorder bg-white px-3 py-1.5 text-xs font-bold text-nexoraText hover:bg-slate-50 transition cursor-pointer"
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            {t('components.staff_dashboard.views.StaffKycOverview.retry')}
          </button>
        </div>
      )}

      {isBusy && (
        <div className="flex h-[70vh] flex-col items-center justify-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-nexoraBrand" />
          <span className="text-sm text-nexoraMuted">{t('common.loading')}</span>
        </div>
      )}

      {!isBusy && isError && !isNoneStatus && (
        <div className="flex h-[70vh] flex-col items-center justify-center gap-3">
          <p className="max-w-sm text-center text-sm text-nexoraMuted">
            {t('components.staff_dashboard.views.StaffKycOverview.networkError')}
          </p>
        </div>
      )}

      {!isBusy && !isError && hasUrl && (shouldInitialize || !isNoneStatus) && (
        <div className="relative h-[70vh] w-full rounded-xl border border-nexoraBorder overflow-hidden bg-white">
          {isIframeLoading && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-white">
              <Loader2 className="h-6 w-6 animate-spin text-nexoraBrand" />
              <span className="text-sm text-nexoraMuted">{t('common.loading')}</span>
            </div>
          )}
          <iframe
            src={iframeUrl}
            title="KYC/KYB"
            className="h-full w-full border-0"
            allow="camera; microphone; clipboard-write; encrypted-media; fullscreen"
            onLoad={handleIframeLoad}
            allowFullScreen
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
            referrerPolicy="no-referrer"
            loading="lazy"
          />
        </div>
      )}

      {!isBusy && !isError && !hasUrl && !isNoneStatus && (
        <div className="flex h-[70vh] flex-col items-center justify-center gap-3">
          <p className="max-w-sm text-center text-sm text-nexoraMuted">
            {t('components.staff_dashboard.views.StaffKycOverview.serverError')}
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            className="inline-flex items-center rounded-lg border border-nexoraBorder bg-white px-3 py-1.5 text-xs font-bold text-nexoraText hover:bg-slate-50 transition cursor-pointer"
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            {t('components.staff_dashboard.views.StaffKycOverview.retry')}
          </button>
        </div>
      )}
    </div>
  )
}
