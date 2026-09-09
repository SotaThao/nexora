// CertificateCanvasPreview — renders one certificate onto the artwork and offers it as a download.
//
// The canvas and saved PNG use 1427 × 1102 pixels; CSS fits the preview to its card.
import { useEffect, useRef, useState } from 'react'
import { AlertTriangle, Download, Loader2 } from 'lucide-react'
import { useTranslation } from '../../contexts/LanguageContext'
import { logger } from '../../utils/logger'
import { CertificateStatus } from '../../constants/certificate'
import {
  certificateCanvasToBlob,
  certificateFileName,
  renderCertificateCanvas,
  type CertificateStampTone,
} from './certificateCanvas'
import type { CertificateVerificationApiDto } from '../../types/repositories'

const K = 'certifications'

/** Local twin of the private helper in qrUtils — kept here so this file owns its own download. */
function downloadBlob(blob: Blob, filename: string) {
  const blobUrl = URL.createObjectURL(blob)
  try {
    const link = document.createElement('a')
    link.href = blobUrl
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  } finally {
    URL.revokeObjectURL(blobUrl)
  }
}

export default function CertificateCanvasPreview({
  certificate,
}: {
  certificate: CertificateVerificationApiDto
}) {
  const { t, currentLanguage } = useTranslation()
  const holderRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [state, setState] = useState<'rendering' | 'ready' | 'failed'>('rendering')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    let mounted = true
    setState('rendering')

    // A certificate that is no longer good is struck on the canvas itself, so the downloaded file
    // carries the mark too.
    const stamp: { label: string; tone: CertificateStampTone } | undefined =
      certificate.status === CertificateStatus.Revoked
        ? { label: t(`${K}.stampRevoked`), tone: 'revoked' }
        : certificate.status === CertificateStatus.Expired
          ? { label: t(`${K}.stampExpired`), tone: 'expired' }
          : undefined

    renderCertificateCanvas({
      certificate,
      stamp,
      signal: controller.signal,
    })
      .then((canvas) => {
        if (!mounted) return
        canvas.className = 'block h-auto w-full rounded-lg'
        // The certificate is a picture of text, so the alternative text has to carry the same
        // facts a screen reader would otherwise miss entirely.
        canvas.setAttribute('role', 'img')
        canvas.setAttribute(
          'aria-label',
          t(`${K}.canvasAlt`, {
            name: certificate.memberName,
            program: certificate.programName,
            id: certificate.certificateId,
          }),
        )
        canvasRef.current = canvas
        const holder = holderRef.current
        if (holder) {
          holder.replaceChildren(canvas)
        }
        setState('ready')
      })
      .catch((error) => {
        if (!mounted || controller.signal.aborted) return
        logger.error('Failed to render certificate canvas', error)
        setState('failed')
      })

    return () => {
      mounted = false
      controller.abort()
      canvasRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [certificate, currentLanguage])

  const handleDownload = async () => {
    const canvas = canvasRef.current
    if (!canvas || isSaving) return
    setIsSaving(true)
    try {
      const blob = await certificateCanvasToBlob(canvas)
      downloadBlob(blob, certificateFileName(certificate))
    } catch (error) {
      logger.error('Failed to export certificate image', error)
      setState('failed')
    } finally {
      setIsSaving(false)
    }
  }

  if (state === 'failed') {
    return (
      <div className="nexora-card flex items-center gap-3 p-6">
        <AlertTriangle className="h-5 w-5 shrink-0 text-nexoraWarning" />
        <p className="text-xs font-bold text-nexoraText">{t(`${K}.renderFailed`)}</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="relative overflow-hidden rounded-xl border border-nexoraBorder bg-nexoraSurface p-2 shadow-nexora-card">
        {/* Reserves the artwork's aspect ratio so the card does not jump when the canvas lands. */}
        <div ref={holderRef} className="aspect-[1427/1102] w-full" />
        {state === 'rendering' ? (
          <div className="absolute inset-0 flex items-center justify-center bg-nexoraSurface/80">
            <Loader2 className="h-6 w-6 animate-spin text-nexoraBrand" />
          </div>
        ) : null}
      </div>

      <button
        type="button"
        onClick={handleDownload}
        disabled={state !== 'ready' || isSaving}
        className="nexora-primary-button mx-auto flex w-full disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
      >
        {isSaving ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Download className="h-4 w-4" />
        )}
        {t(`${K}.download`)}
      </button>
    </div>
  )
}
