import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { AlertTriangle, Camera, FolderOpen, X } from 'lucide-react'
import { useTranslation } from '../../contexts/LanguageContext'
import { ensureNativeCameraPermission } from '../../utils/cameraPermission'

type CameraState = 'loading' | 'ready' | 'unavailable' | 'permission_denied'

interface CameraCaptureModalProps {
  open: boolean
  onClose: () => void
  onCapture: (file: File) => void
}

export default function CameraCaptureModal({ open, onClose, onCapture }: CameraCaptureModalProps) {
  const { t } = useTranslation()
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [cameraState, setCameraState] = useState<CameraState>('loading')
  const [isCapturing, setIsCapturing] = useState(false)

  useEffect(() => {
    if (!open) {
      setCameraState('loading')
      setIsCapturing(false)
      return
    }

    let cancelled = false

    const stopStream = () => {
      streamRef.current?.getTracks().forEach((track) => track.stop())
      streamRef.current = null
      if (videoRef.current) {
        videoRef.current.srcObject = null
      }
    }

    const startCamera = async () => {
      setCameraState('loading')

      const hasPermission = await ensureNativeCameraPermission()
      if (cancelled) return
      if (!hasPermission) {
        setCameraState('permission_denied')
        return
      }

      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraState('unavailable')
        return
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
          audio: false,
        })

        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop())
          return
        }

        streamRef.current = stream
        const video = videoRef.current
        if (video) {
          video.srcObject = stream
          await video.play()
        }
        setCameraState('ready')
      } catch (err: unknown) {
        if (cancelled) return
        const name = err instanceof DOMException ? err.name : ''
        if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
          setCameraState('permission_denied')
        } else {
          setCameraState('unavailable')
        }
      }
    }

    startCamera()

    return () => {
      cancelled = true
      stopStream()
    }
  }, [open])

  const handleClose = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    onClose()
  }

  const handleCapture = () => {
    const video = videoRef.current
    if (!video || cameraState !== 'ready') return

    setIsCapturing(true)
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth || 1280
    canvas.height = video.videoHeight || 720
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      setIsCapturing(false)
      return
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    canvas.toBlob(
      (blob) => {
        setIsCapturing(false)
        if (!blob) return
        const file = new File([blob], `camera-capture-${Date.now()}.jpg`, {
          type: 'image/jpeg',
        })
        onCapture(file)
        handleClose()
      },
      'image/jpeg',
      0.92,
    )
  }

  const handleFileFallback = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    onCapture(file)
    handleClose()
    e.target.value = ''
  }

  if (!open) return null

  const showFallback = cameraState === 'unavailable' || cameraState === 'permission_denied'

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/70 backdrop-blur-sm modal-overlay-safe"
      data-testid="camera-capture-modal"
    >
      <div className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-2xl">
        <button
          type="button"
          onClick={handleClose}
          className="modal-close-btn absolute right-2 top-2 z-10 rounded-full text-white/90 transition hover:bg-white/10"
          aria-label={t('common.cancel')}
        >
          <X className="h-5 w-5" />
        </button>

        <div className="bg-slate-900 px-5 pb-4 pt-5 text-white">
          <h3 className="pr-8 text-sm font-black uppercase tracking-wider">
            {t('setup.camera_capture_title')}
          </h3>
          <p className="mt-1 text-[10px] font-medium text-slate-300">
            {t('setup.camera_capture_hint')}
          </p>
        </div>

        <div className="relative aspect-[4/3] bg-slate-950">
          {cameraState === 'loading' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-slate-300">
              <div className="h-7 w-7 animate-spin rounded-full border-2 border-white/20 border-t-white" />
              <span className="text-xs font-semibold">{t('setup.camera_starting')}</span>
            </div>
          )}

          <video
            ref={videoRef}
            playsInline
            muted
            className={`h-full w-full object-cover ${cameraState === 'ready' ? 'block' : 'hidden'}`}
          />

          {showFallback && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-800">
                <Camera className="h-7 w-7 text-slate-400" />
              </div>
              <p className="text-sm font-bold text-white">
                {cameraState === 'permission_denied'
                  ? t('setup.camera_permission_denied')
                  : t('setup.camera_not_available')}
              </p>
              <p className="text-[11px] leading-relaxed text-slate-400">
                {t('setup.camera_use_file_instead')}
              </p>
            </div>
          )}

          {cameraState === 'ready' && (
            <>
              <div className="pointer-events-none absolute inset-6 rounded-2xl border-2 border-white/40" />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/50 to-transparent" />
            </>
          )}
        </div>

        <div className="flex gap-2.5 border-t border-slate-100 p-4">
          <button
            type="button"
            onClick={handleClose}
            className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-500 transition hover:bg-slate-50"
          >
            {t('common.cancel')}
          </button>

          {showFallback ? (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={handleFileFallback}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-amber-600 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-amber-700"
              >
                <FolderOpen className="h-4 w-4" />
                {t('setup.choose_file')}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={handleCapture}
              disabled={cameraState !== 'ready' || isCapturing}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-amber-600 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Camera className="h-4 w-4" />
              {isCapturing ? t('setup.taking_photo') : t('setup.capture_photo')}
            </button>
          )}
        </div>

        {showFallback && (
          <div className="flex items-start gap-2 border-t border-amber-100 bg-amber-50 px-4 py-3 text-[10px] leading-relaxed text-amber-900">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <span>{t('setup.camera_fallback_hint')}</span>
          </div>
        )}
      </div>
    </div>
  )
}
