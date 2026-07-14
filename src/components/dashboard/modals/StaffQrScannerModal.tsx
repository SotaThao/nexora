import { useEffect, useRef, useState } from 'react'
import { X, QrCode, Loader2 } from 'lucide-react'
import jsQR from 'jsqr'
import { useTranslation } from '../../../contexts/LanguageContext'
import { extractStaffSearchValueFromQrText } from '../../../utils/staffQrScan'

type ScannerCameraState = 'loading' | 'ready' | 'permission_denied' | 'unavailable'

type StaffQrScannerModalProps = {
  open: boolean
  scanTarget?: string | null
  onClose: () => void
  onScan: (value: string) => void
}

function StaffQrScannerModal({
  open,
  scanTarget,
  onClose,
  onScan,
}: StaffQrScannerModalProps) {
  const { t } = useTranslation()
  const [cameraState, setCameraState] = useState<ScannerCameraState>('loading')
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const frameRef = useRef<number | null>(null)
  const lastScanAtRef = useRef(0)
  const hasScannedRef = useRef(false)
  const onScanRef = useRef(onScan)
  onScanRef.current = onScan

  useEffect(() => {
    if (!open) {
      hasScannedRef.current = false
      streamRef.current?.getTracks().forEach((track) => track.stop())
      streamRef.current = null
      if (frameRef.current != null) {
        window.cancelAnimationFrame(frameRef.current)
        frameRef.current = null
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null
      }
      setCameraState('loading')
      return
    }

    let cancelled = false

    const startCamera = async () => {
      setCameraState('loading')

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
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play()
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
      streamRef.current?.getTracks().forEach((track) => track.stop())
      streamRef.current = null
      if (frameRef.current != null) {
        window.cancelAnimationFrame(frameRef.current)
        frameRef.current = null
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null
      }
    }
  }, [open])

  useEffect(() => {
    if (!open || cameraState !== 'ready' || hasScannedRef.current) return

    const video = videoRef.current
    if (!video) return

    if (!canvasRef.current) {
      canvasRef.current = document.createElement('canvas')
    }
    const canvas = canvasRef.current
    const context = canvas.getContext('2d', { willReadFrequently: true })
    if (!context) return

    let cancelled = false

    const loop = () => {
      if (cancelled || hasScannedRef.current) return
      frameRef.current = window.requestAnimationFrame(loop)

      const now = Date.now()
      if (now - lastScanAtRef.current < 180) return
      lastScanAtRef.current = now

      if (!video.videoWidth || !video.videoHeight) return
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      context.drawImage(video, 0, 0, canvas.width, canvas.height)

      const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
      const detected = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'attemptBoth',
      })
      if (!detected?.data) return

      const parsed = extractStaffSearchValueFromQrText(detected.data)
      if (!parsed) return

      hasScannedRef.current = true
      if (frameRef.current != null) {
        window.cancelAnimationFrame(frameRef.current)
        frameRef.current = null
      }
      onScanRef.current(parsed)
    }

    frameRef.current = window.requestAnimationFrame(loop)

    return () => {
      cancelled = true
      if (frameRef.current != null) {
        window.cancelAnimationFrame(frameRef.current)
        frameRef.current = null
      }
    }
  }, [cameraState, open])

  if (!open) return null

  const cameraErrorMessage =
    cameraState === 'permission_denied'
      ? t('common.camera_permission_denied')
      : cameraState === 'unavailable'
        ? t('common.camera_not_available')
        : ''

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/60 modal-overlay-safe backdrop-blur-sm">
      <style>{`
        @keyframes scannerLaser {
          0% { top: 0%; opacity: 0.8; }
          50% { top: 100%; opacity: 0.8; }
          100% { top: 0%; opacity: 0.8; }
        }
        .animate-scannerLaser {
          animation: scannerLaser 2.5s linear infinite;
        }
      `}</style>

      <div className="relative w-full max-w-sm animate-scaleUp space-y-5 overflow-hidden rounded-3xl border border-slate-100 bg-white p-6 text-center text-slate-800 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="modal-close-btn absolute right-2 top-2 rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          title="Close Scanner"
          aria-label="Close Scanner"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="space-y-1 text-center">
          <h3 className="text-sm font-black uppercase tracking-wider text-slate-800">
            {t('components.dashboard.modals.StaffQrScannerModal.scanQrCode')}
          </h3>
          <p className="text-center text-[10px] font-medium text-slate-500">
            {scanTarget === 'staff'
              ? t('components.dashboard.modals.StaffQrScannerModal.scanNexoraPersonalId')
              : t('components.dashboard.modals.StaffQrScannerModal.scanVlinkpayIdTo')}
          </p>
        </div>

        <div className="relative mx-auto flex h-64 w-64 items-center justify-center overflow-hidden rounded-2xl border-2 border-slate-100 bg-slate-50 shadow-inner">
          <div className="absolute left-3 top-3 h-4 w-4 rounded-tl-sm border-l-2 border-t-2 border-amber-500" />
          <div className="absolute right-3 top-3 h-4 w-4 rounded-tr-sm border-r-2 border-t-2 border-amber-500" />
          <div className="absolute bottom-3 left-3 h-4 w-4 rounded-bl-sm border-b-2 border-l-2 border-amber-500" />
          <div className="absolute bottom-3 right-3 h-4 w-4 rounded-br-sm border-b-2 border-r-2 border-amber-500" />

          {cameraState === 'loading' && (
            <Loader2 className="h-16 w-16 animate-spin text-amber-500" />
          )}

          <video
            ref={videoRef}
            playsInline
            muted
            className={`h-full w-full object-cover ${cameraState === 'ready' ? 'block' : 'hidden'}`}
          />

          {cameraState !== 'ready' && cameraState !== 'loading' && (
            <QrCode className="h-16 w-16 animate-pulse text-slate-300 opacity-80" />
          )}

          {cameraState === 'ready' && (
            <div className="animate-scannerLaser absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-amber-500 to-transparent shadow-[0_0_8px_#f59e0b]" />
          )}
        </div>

        <p className="mx-auto max-w-xs text-center text-[10px] font-medium text-slate-500">
          {cameraState === 'loading'
            ? t('common.camera_starting')
            : cameraErrorMessage || t('components.dashboard.modals.StaffQrScannerModal.pointTheCameraAt')}
        </p>

        <button
          type="button"
          onClick={onClose}
          className="w-full rounded-xl border border-slate-200 py-2 text-xs font-bold text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
        >
          {t('components.dashboard.modals.StaffQrScannerModal.cancel')}
        </button>
      </div>
    </div>
  )
}

export default StaffQrScannerModal
