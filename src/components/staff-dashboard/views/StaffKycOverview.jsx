import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { Loader2, RotateCcw } from 'lucide-react'
import { useTranslation } from '../../../contexts/LanguageContext'
import { UserVerifyStatus } from '../../../constants/userVerifyStatus'
import { useKycInitialize, useVerifiedStatus } from '../../../data/hooks/useProfileSettings'

const StaffKycOverview = forwardRef(function StaffKycOverview({ onWidgetVisibleChange } = {}, ref) {
  const { t } = useTranslation()
  const [shouldInitialize, setShouldInitialize] = useState(false)

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

  useImperativeHandle(ref, () => ({
    openPortal: () => setShouldInitialize(true),
  }), [])

  const isBusy = isLoading || isFetching || isLoadingStatus
  const hasUrl = Boolean(data?.url)
  const iframeUrl = data?.url

  // Once the widget takes over (initialized or already past the "None" state),
  // the parent's standalone "Not verified" card is redundant with the widget's
  // own status display — mirrors the KYB tab, which never shows that card
  // once the portal is opened.
  const isWidgetActive = shouldInitialize || !isNoneStatus
  useEffect(() => {
    onWidgetVisibleChange?.(isWidgetActive)
    return () => onWidgetVisibleChange?.(false)
  }, [isWidgetActive, onWidgetVisibleChange])

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

  useEffect(() => {
    function handleKycMessage(event) {
      if (event.data?.action === 'navigate' || event.data?.action === 'navigate-kyb') {
        window.location.reload()
      }
    }
    window.addEventListener('message', handleKycMessage)
    return () => window.removeEventListener('message', handleKycMessage)
  }, [])

  if (!isWidgetActive) {
    return null
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
        <div className="flex h-[calc(100vh-280px)] min-h-[480px] flex-col items-center justify-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-nexoraBrand" />
          <span className="text-sm text-nexoraMuted">{t('common.loading')}</span>
        </div>
      )}

      {!isBusy && isError && !isNoneStatus && (
        <div className="flex h-[calc(100vh-280px)] min-h-[480px] flex-col items-center justify-center gap-3">
          <p className="max-w-sm text-center text-sm text-nexoraMuted">
            {t('components.staff_dashboard.views.StaffKycOverview.networkError')}
          </p>
        </div>
      )}

      {!isBusy && !isError && hasUrl && (
        <div className="relative h-[calc(100vh-280px)] min-h-[480px] w-full rounded-xl border border-nexoraBorder overflow-hidden bg-white">
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
            allow="camera *; microphone *; geolocation *; fullscreen *"
            onLoad={handleIframeLoad}
            allowFullScreen
          />
        </div>
      )}

      {!isBusy && !isError && !hasUrl && (
        <div className="flex h-[calc(100vh-280px)] min-h-[480px] flex-col items-center justify-center gap-3">
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
})

export default StaffKycOverview
