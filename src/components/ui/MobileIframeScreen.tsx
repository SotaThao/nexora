import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { useTranslation } from '../../contexts/LanguageContext'

type MobileIframeScreenProps = {
  open: boolean
  title: string
  onClose: () => void
  src?: string
  iframeTitle?: string
  isLoading?: boolean
  loadingLabel?: string
  onLoad?: () => void
  allow?: string
  fallback?: ReactNode
}

/**
 * Full-screen "webview" overlay for embedding an external iframe on mobile.
 *
 * The KYC/KYB portal is a separate (backend-hosted) origin, so its own popups
 * can't be scrolled from here when the iframe is boxed inside the app chrome.
 * On narrow viewports we let it take over the whole screen instead — giving the
 * portal a full device viewport and its own back button — while desktop keeps
 * the iframe embedded inline. Page scroll is locked while the overlay is open.
 */
export default function MobileIframeScreen({
  open,
  title,
  onClose,
  src,
  iframeTitle,
  isLoading = false,
  loadingLabel,
  onLoad,
  allow = 'camera *; microphone *; geolocation *; fullscreen *',
  fallback = null,
}: MobileIframeScreenProps) {
  const { t } = useTranslation()

  useEffect(() => {
    if (!open) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [open])

  if (!open || typeof document === 'undefined') return null

  // Portal to <body> so the full-screen overlay escapes any ancestor stacking
  // context / transformed containing block in the host shell (the merchant
  // dashboard wraps routed content in such ancestors, which would otherwise trap
  // a plain `position: fixed` and stop the webview from covering the screen).
  return createPortal(
    <div className="fixed inset-0 z-[120] flex h-[100dvh] flex-col bg-white">
      <header
        className="flex shrink-0 items-center gap-2 border-b border-nexoraBorder bg-white px-2 py-2"
        style={{ paddingTop: 'max(0.5rem, var(--app-safe-area-top))' }}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label={t('common.back')}
          className="flex h-9 w-9 items-center justify-center rounded-full text-nexoraText transition hover:bg-slate-100"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h2 className="min-w-0 flex-1 truncate text-sm font-bold text-nexoraText">{title}</h2>
      </header>

      <div
        className="relative flex-1 overflow-hidden bg-white"
        style={{ paddingBottom: 'var(--app-safe-area-bottom)' }}
      >
        {isLoading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-white">
            <Loader2 className="h-6 w-6 animate-spin text-nexoraBrand" />
            {loadingLabel ? <span className="text-sm text-nexoraMuted">{loadingLabel}</span> : null}
          </div>
        )}

        {src ? (
          <iframe
            src={src}
            title={iframeTitle ?? title}
            className="h-full w-full border-0"
            allow={allow}
            onLoad={onLoad}
            allowFullScreen
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center p-6">{fallback}</div>
        )}
      </div>
    </div>,
    document.body,
  )
}
