import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { Loader2, RotateCcw } from 'lucide-react'
import { useTranslation } from '../../../contexts/LanguageContext'
import { useKycInitialize } from '../../../data/hooks/useProfileSettings'
import useIsMobileUI from '../../../hooks/useIsMobileUI'
import MobileIframeScreen from '../../ui/MobileIframeScreen'

// The parent only mounts this widget for staff who aren't verified yet (verified
// staff see an informational card instead), so it goes straight into the KYC
// portal — there is no "Verify now" launcher card.
const StaffKycOverview = forwardRef(function StaffKycOverview({ onExit } = {}, ref) {
  const { t } = useTranslation()
  const isMobile = useIsMobileUI()
  const [isWebviewOpen, setIsWebviewOpen] = useState(true)

  const { data, isLoading, isFetching, isError, refetch } = useKycInitialize({
    enabled: true,
  })

  const [isIframeLoading, setIsIframeLoading] = useState(false)
  const timeoutRef = useRef(null)

  useImperativeHandle(ref, () => ({
    openPortal: () => setIsWebviewOpen(true),
    closePortal: () => setIsWebviewOpen(false),
  }), [])

  const isBusy = isLoading || isFetching
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

  useEffect(() => {
    function handleKycMessage(event) {
      if (event.data?.action === 'navigate' || event.data?.action === 'navigate-kyb') {
        window.location.reload()
      }
    }
    window.addEventListener('message', handleKycMessage)
    return () => window.removeEventListener('message', handleKycMessage)
  }, [])

  // Mobile: present the KYC portal as its own full-screen webview so the
  // provider's (cross-origin) popups aren't clipped by the app chrome. The
  // launcher lives in the parent's status card (openPortal); the back button
  // closes the webview and hands the screen back to that card.
  if (isMobile) {
    const showRetry = isError || (!isBusy && !hasUrl)
    return (
      <MobileIframeScreen
        open={isWebviewOpen}
        title={t('staff_dashboard.profile.menu_verification')}
        iframeTitle="KYC/KYB"
        onClose={onExit ?? (() => setIsWebviewOpen(false))}
        src={!isError && hasUrl ? iframeUrl : undefined}
        isLoading={isBusy || (hasUrl && isIframeLoading)}
        loadingLabel={t('common.loading')}
        onLoad={handleIframeLoad}
        fallback={
          showRetry ? (
            <div className="flex flex-col items-center gap-4 text-center">
              <p className="max-w-sm text-sm text-nexoraMuted">
                {t(
                  isError
                    ? 'components.staff_dashboard.views.StaffKycOverview.networkError'
                    : 'components.staff_dashboard.views.StaffKycOverview.serverError',
                )}
              </p>
              <button
                type="button"
                onClick={() => refetch()}
                className="inline-flex items-center rounded-lg border border-nexoraBorder bg-white px-4 py-2 text-xs font-bold text-nexoraText hover:bg-slate-50 transition cursor-pointer"
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                {t('components.staff_dashboard.views.StaffKycOverview.retry')}
              </button>
            </div>
          ) : null
        }
      />
    )
  }

  // Desktop: embed the KYC portal inline (the parent only renders this widget
  // for staff who still need to verify).
  return (
    <div>
      {isError && (
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
        <div className="flex h-[calc(100dvh-280px)] min-h-[480px] flex-col items-center justify-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-nexoraBrand" />
          <span className="text-sm text-nexoraMuted">{t('common.loading')}</span>
        </div>
      )}

      {!isBusy && isError && (
        <div className="flex h-[calc(100dvh-280px)] min-h-[480px] flex-col items-center justify-center gap-3">
          <p className="max-w-sm text-center text-sm text-nexoraMuted">
            {t('components.staff_dashboard.views.StaffKycOverview.networkError')}
          </p>
        </div>
      )}

      {!isBusy && !isError && hasUrl && (
        <div className="relative h-[calc(100dvh-280px)] min-h-[480px] w-full rounded-xl border border-nexoraBorder overflow-hidden bg-white">
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
        <div className="flex h-[calc(100dvh-280px)] min-h-[480px] flex-col items-center justify-center gap-3">
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
