import { useEffect, useRef, useState, useCallback } from 'react'
import jsQR from 'jsqr'
import { X, AlertCircle, Flashlight } from 'lucide-react'
import { useTranslation } from '../../contexts/LanguageContext'

interface Props {
  onClose: () => void
  onDetect: (text: string) => void
}

export default function AppQrScanner({ onClose, onDetect }: Props) {
  const { t } = useTranslation()
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const rafRef = useRef<number>(0)
  const detectedRef = useRef(false)
  const onDetectRef = useRef(onDetect)
  onDetectRef.current = onDetect
  const [error, setError] = useState<string | null>(null)
  const [torch, setTorch] = useState(false)

  const stopCamera = useCallback(() => {
    cancelAnimationFrame(rafRef.current)
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
  }, [])

  // Use ref for onDetect so the effect does not restart when parent re-renders
  const handleDetect = useCallback(
    (text: string) => {
      if (detectedRef.current) return
      detectedRef.current = true
      stopCamera()
      onDetectRef.current(text)
    },
    [stopCamera],
  )

  useEffect(() => {
    let active = true

    function tick() {
      const video = videoRef.current
      const canvas = canvasRef.current
      if (!active || !video || !canvas) return

      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        const ctx = canvas.getContext('2d', { willReadFrequently: true })
        if (ctx) {
          canvas.width = video.videoWidth
          canvas.height = video.videoHeight
          ctx.drawImage(video, 0, 0)
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'dontInvert',
          })
          if (code?.data) {
            handleDetect(code.data)
            return
          }
        }
      }
      rafRef.current = requestAnimationFrame(tick)
    }

    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        })
        if (!active) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play()
          rafRef.current = requestAnimationFrame(tick)
        }
      } catch {
        if (active) setError(t('components.common.AppQrScanner.camera_error'))
      }
    }

    startCamera()

    return () => {
      active = false
      stopCamera()
    }
  }, [handleDetect, stopCamera])

  async function toggleTorch() {
    const track = streamRef.current?.getVideoTracks()[0]
    if (!track) return
    try {
      const newState = !torch
      await (track as any).applyConstraints({ advanced: [{ torch: newState }] })
      setTorch(newState)
    } catch {
      // Torch not supported on this device — silently ignore
    }
  }

  return (
    <div className="fixed inset-0 z-[80] bg-black flex flex-col">
      <style>{`
        @keyframes qrLaser {
          0%   { top: 8%;  opacity: 1; }
          50%  { top: 88%; opacity: 0.85; }
          100% { top: 8%;  opacity: 1; }
        }
        .qr-laser { animation: qrLaser 2s ease-in-out infinite; position: absolute; }
      `}</style>

      {/* Header */}
      <div className="relative flex items-center justify-center py-4 safe-area-top" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 16px)' }}>
        <span className="text-white text-sm font-bold uppercase tracking-wider">{t('components.common.AppQrScanner.title')}</span>
        <button
          type="button"
          onClick={() => { stopCamera(); onClose() }}
          className="absolute right-4 text-white/80 hover:text-white p-2 rounded-full"
          aria-label="Đóng"
        >
          <X className="h-6 w-6" />
        </button>
      </div>

      {/* Camera viewport */}
      <div className="flex-1 relative flex items-center justify-center overflow-hidden">
        {error ? (
          <div className="flex flex-col items-center gap-4 px-8 text-center">
            <AlertCircle className="h-12 w-12 text-red-400" />
            <p className="text-white/80 text-sm leading-relaxed">{error}</p>
            <button
              type="button"
              onClick={() => { stopCamera(); onClose() }}
              className="mt-2 px-6 py-2 bg-white/20 hover:bg-white/30 text-white rounded-xl text-sm font-bold transition"
            >
              {t('common.close')}
            </button>
          </div>
        ) : (
          <>
            {/* Live video */}
            <video
              ref={videoRef}
              className="absolute inset-0 w-full h-full object-cover"
              playsInline
              muted
            />

            {/* Scan frame — box-shadow dims everything outside the frame */}
            <div
              className="relative w-56 h-56 rounded"
              style={{ boxShadow: '0 0 0 100vmax rgba(0,0,0,0.55)' }}
            >
              {/* Corner brackets */}
              <div className="absolute top-0 left-0 w-8 h-8 border-t-[3px] border-l-[3px] border-white rounded-tl" />
              <div className="absolute top-0 right-0 w-8 h-8 border-t-[3px] border-r-[3px] border-white rounded-tr" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-[3px] border-l-[3px] border-white rounded-bl" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-[3px] border-r-[3px] border-white rounded-br" />

              {/* Laser line */}
              <div className="qr-laser left-0 right-0 h-px bg-gradient-to-r from-transparent via-nexoraBrand to-transparent shadow-[0_0_6px_2px_rgba(255,100,0,0.6)]" />
            </div>
          </>
        )}
      </div>

      {/* Hidden canvas for decoding */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Footer */}
      <div className="flex flex-col items-center gap-3 py-6" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 24px)' }}>
        {!error && (
          <button
            type="button"
            onClick={toggleTorch}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition ${torch ? 'bg-yellow-400 text-black' : 'bg-white/15 text-white'}`}
            aria-label={t('components.common.AppQrScanner.torch')}
          >
            <Flashlight className="h-5 w-5" />
          </button>
        )}
        <p className="text-white/50 text-xs text-center px-8">
          {t('components.common.AppQrScanner.hint')}
        </p>
      </div>
    </div>
  )
}
