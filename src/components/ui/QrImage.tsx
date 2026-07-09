import { useCallback, useEffect, useMemo, useState, type MouseEvent } from 'react'
import { useTranslation } from '../../contexts/LanguageContext'
import { Loader2, QrCode, RefreshCw } from 'lucide-react'

type QrImageProps = {
  src?: string | null
  alt?: string
  className?: string
  imgClassName?: string
  loadingClassName?: string
}

function withReloadParam(url: string, nonce: number): string {
  if (!url || nonce === 0) return url
  const separator = url.includes('?') ? '&' : '?'
  return `${url}${separator}_qrReload=${nonce}`
}

export function QrImage({
  src,
  alt = 'QR Code',
  className = '',
  imgClassName = '',
  loadingClassName = '',
}: QrImageProps) {
  const { t } = useTranslation()
  const [isLoading, setIsLoading] = useState(Boolean(src))
  const [hasError, setHasError] = useState(false)
  const [reloadNonce, setReloadNonce] = useState(0)

  const effectiveSrc = useMemo(
    () => (src ? withReloadParam(src, reloadNonce) : ''),
    [src, reloadNonce],
  )

  useEffect(() => {
    setIsLoading(Boolean(src))
    setHasError(false)
    setReloadNonce(0)
  }, [src])

  const handleLoad = useCallback(() => {
    setIsLoading(false)
    setHasError(false)
  }, [])

  const handleError = useCallback(() => {
    setIsLoading(false)
    setHasError(true)
  }, [])

  const handleReload = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      event.preventDefault()
      event.stopPropagation()
      if (!src) return
      setIsLoading(true)
      setHasError(false)
      setReloadNonce((current) => current + 1)
    },
    [src],
  )

  if (!src) {
    return (
      <div
        className={`flex items-center justify-center bg-slate-100 text-slate-400 ${className}`}
        aria-label={t('common.qr_load_failed')}
      >
        <QrCode className="h-8 w-8" aria-hidden />
      </div>
    )
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {isLoading ? (
        <div
          className={`absolute inset-0 z-10 flex items-center justify-center bg-slate-100/90 ${loadingClassName}`}
          aria-live="polite"
          aria-busy="true"
        >
          <Loader2 className="h-8 w-8 animate-spin text-slate-400" aria-hidden />
        </div>
      ) : null}

      {hasError ? (
        <div
          className={`absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 bg-slate-100 px-2 text-center ${loadingClassName}`}
          role="alert"
        >
          <QrCode className="h-6 w-6 text-slate-400" aria-hidden />
          <button
            type="button"
            onClick={handleReload}
            className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-1 text-xs font-medium text-slate-700 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50"
            aria-label={t('common.qr_reload')}
          >
            <RefreshCw className="h-3.5 w-3.5" aria-hidden />
            {t('common.qr_reload')}
          </button>
        </div>
      ) : null}

      <img
        key={effectiveSrc}
        src={effectiveSrc}
        alt={alt}
        className={`h-full w-full object-contain ${imgClassName} ${
          isLoading || hasError ? 'opacity-0' : 'opacity-100'
        }`}
        onLoad={handleLoad}
        onError={handleError}
      />
    </div>
  )
}

export default QrImage
