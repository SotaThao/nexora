import React, { useRef, useState, useEffect, useCallback } from 'react'
import { Camera, X, RotateCcw, Check } from 'lucide-react'

interface CameraCaptureProps {
  onCapture: (dataUrl: string) => void
  onCancel: () => void
}

export default function CameraCapture({ onCapture, onCancel }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.pause()
      videoRef.current.srcObject = null
    }
  }, [])

  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        })
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
        }
      } catch {
        setError('Không thể truy cập camera. Vui lòng kiểm tra quyền truy cập.')
      }
    }
    startCamera()
    return () => stopStream()
  }, [stopStream])

  const captureImage = () => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    setCapturedImage(canvas.toDataURL('image/png'))
    video.pause()
  }

  const retake = () => {
    setCapturedImage(null)
    videoRef.current?.play()
  }

  const confirm = () => {
    if (!capturedImage) return
    stopStream()
    onCapture(capturedImage)
  }

  const cancel = () => {
    stopStream()
    onCancel()
  }

  return (
    <div className="absolute inset-0 z-10 flex flex-col bg-black rounded-3xl overflow-hidden">
      {error ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
          <Camera className="h-12 w-12 text-white/40" />
          <p className="text-sm text-white/70">{error}</p>
          <button
            type="button"
            onClick={cancel}
            className="mt-2 rounded-xl bg-white/10 px-6 py-2.5 text-sm font-bold text-white hover:bg-white/20 transition"
          >
            Đóng
          </button>
        </div>
      ) : (
        <>
          <div className="relative flex flex-1 items-center justify-center overflow-hidden">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`h-full w-full object-cover ${capturedImage ? 'hidden' : ''}`}
            />
            {capturedImage && (
              <img src={capturedImage} alt="Captured" className="h-full w-full object-contain" />
            )}
            <canvas ref={canvasRef} className="hidden" />
          </div>

          <div className="flex items-center justify-center gap-8 bg-black/80 px-6 py-5">
            {!capturedImage ? (
              <>
                <button
                  type="button"
                  onClick={cancel}
                  className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
                >
                  <X className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={captureImage}
                  className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-white shadow-lg transition active:scale-95"
                >
                  <Camera className="h-8 w-8 text-slate-800" />
                </button>
                <div className="h-12 w-12" />
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={retake}
                  className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
                >
                  <RotateCcw className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={confirm}
                  className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-nexoraBrand shadow-lg transition active:scale-95"
                >
                  <Check className="h-8 w-8 text-white stroke-[3px]" />
                </button>
                <div className="h-12 w-12" />
              </>
            )}
          </div>
        </>
      )}
    </div>
  )
}
