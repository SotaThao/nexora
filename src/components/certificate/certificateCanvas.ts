/**
 * Draws a member's details onto the NEXORA TOUCH certificate artwork.
 *
 * The artwork provides the frame, headings, signatures and two metadata labels. The renderer
 * adds the member name, certification date, certificate ID and verification QR.
 * Coordinates are fractions of the sheet so the source artwork can have a higher resolution
 * than the downloaded PNG.
 *
 * Same idiom as `renderCheckInBackgroundCanvas.ts`, which composes a QR onto a background for the
 * POS check-in poster.
 */
import QRCode from 'qrcode'
import { CERTIFICATE_EXAM_SCORE_MAX_DEFAULT } from '../../constants/certificate'
import { parseApiUtcDateTime } from '../../utils/localDate'
import type { CertificateVerificationApiDto } from '../../types/repositories'

/** Supplied optimized WebP artwork; the renderer fits it to the export dimensions. */
export const CERTIFICATE_TEMPLATE_SRC = '/images/certificate-template.webp'

const TEMPLATE = {
  naturalWidth: 1600,
  naturalHeight: 1236,
  /** Ink colour of the artwork's own headings, so the filled values match what is printed. */
  inkColor: '#081F49',
  /** Use the system Times New Roman face, with serif fallbacks where it is unavailable. */
  fontFamily: '"Times New Roman", Times, serif',
  weights: { memberName: 400, meta: 400, stamp: 700 },
  memberName: {
    centerX: 0.5,
    /** Leave space below the introduction (y≈428) and above the gold rule (y≈545). */
    topY: 440 / 1102,
    bottomY: 532 / 1102,
    maxWidth: 0.62,
    /** Maximum size as a fraction of the template height; shrink to fit the full name. */
    fontSize: 0.0817,
  },
  /** Date and ID sit just above the two labels printed on the artwork. */
  meta: {
    baselineY: 0.7132,
    fontSize: 0.0245,
    maxWidth: 0.2,
    /** Centres of the printed CERTIFICATION DATE / CERTIFICATE ID labels. */
    columnsX: [0.347, 0.653],
  },
  /** White QR interior measured on the 5708 × 4408 artwork, excluding the decorative border. */
  qrBox: { x: 5025 / 5708, y: 3357 / 4408, width: 523 / 5708, height: 520 / 4408 },
  /** Keeps the QR off the box's printed border so the quiet zone survives. */
  qrInset: 0.06,
  /**
   * Struck across the description block rather than dead centre: centre would land on the holder's
   * name, and who the certificate was issued to stays worth reading even after it is withdrawn.
   */
  stamp: { centerX: 0.5, centerY: 0.575, angle: -12, fontSize: 0.08, padding: 0.02 },
} as const

const STAMP_TONE = {
  revoked: '#EF4444',
  expired: '#F59E0B',
} as const

export type CertificateStampTone = keyof typeof STAMP_TONE

/**
 * Keep the requested 1600 × 1236 preview and download size even when the source is larger.
 */
const DEFAULT_SCALE = 1

/** A canvas this big is still well inside what mobile Safari will export. */
const MAX_PIXELS = 12_000_000

export class CertificateTemplateError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'CertificateTemplateError'
  }
}

function checkAbort(signal?: AbortSignal) {
  if (signal?.aborted) throw new DOMException('Certificate rendering was cancelled', 'AbortError')
}

async function loadTemplate(signal?: AbortSignal): Promise<HTMLImageElement> {
  const image = new Image()
  // Same origin (it is served out of public/), but declared so a future CDN move does not silently
  // taint the canvas and break the download.
  image.crossOrigin = 'anonymous'
  image.src = CERTIFICATE_TEMPLATE_SRC
  try {
    await image.decode()
  } catch {
    throw new CertificateTemplateError('The certificate template could not be loaded')
  }
  checkAbort(signal)
  if (!image.naturalWidth || !image.naturalHeight) {
    throw new CertificateTemplateError('The certificate template could not be decoded')
  }
  return image
}

/**
 * Largest size at which the text still fits the slot, never below `minSize`. A name that is still
 * too wide at the minimum is drawn at the minimum rather than truncated — a person's name is the
 * one thing on a certificate that must not be cut short.
 */
function fitFontSize(
  context: CanvasRenderingContext2D,
  text: string,
  font: (size: number) => string,
  maxWidth: number,
  startSize: number,
  minSize: number,
): number {
  let size = startSize
  while (size > minSize) {
    context.font = font(size)
    if (context.measureText(text).width <= maxWidth) return size
    size -= 1
  }
  return minSize
}

/** The URL the QR encodes — the same shape the backend's CertificateVerificationLink builds. */
export function buildCertificateUrl(certificateId: string, origin?: string): string {
  const base = (origin ?? window.location.origin).replace(/\/+$/, '')
  return `${base}/certificate/${encodeURIComponent(certificateId)}`
}

/**
 * The certification date as the design prints it: "September 7, 2026" — month spelled out, no
 * leading zero on the day.
 *
 * Always in English, whatever the app's language is set to. The artwork's own labels are printed in
 * English ("CERTIFICATION DATE", "EXAM SCORE"), so a Vietnamese date sitting under an English label
 * would read as a bug rather than as a translation — the same reason the public receipt is
 * English-only.
 *
 * Pinned to UTC on the way in and out, so a backend `DateOnly` never shifts a day for a viewer west
 * of Greenwich.
 */
export function formatCertificateDate(isoDate: string | null | undefined): string {
  const date = parseApiUtcDateTime(isoDate)
  if (!date) return ''
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date)
}

export function formatExamScore(certificate: CertificateVerificationApiDto): string {
  if (typeof certificate.examScore !== 'number') return '—'
  const max = certificate.examScoreMax ?? CERTIFICATE_EXAM_SCORE_MAX_DEFAULT
  return `${certificate.examScore} / ${max}`
}

/**
 * Strikes the sheet so a certificate that is no longer good cannot be mistaken for one that is.
 * Drawn onto the canvas rather than layered over it in CSS, because the downloaded file has to
 * carry the mark too — a saved image of a revoked certificate that looks pristine is the whole
 * problem this guards against.
 */
function drawStamp(
  context: CanvasRenderingContext2D,
  { width, height }: { width: number; height: number },
  label: string,
  tone: CertificateStampTone,
) {
  const spec = TEMPLATE.stamp
  const color = STAMP_TONE[tone]
  const fontSize = spec.fontSize * height
  context.save()
  context.translate(spec.centerX * width, spec.centerY * height)
  context.rotate((spec.angle * Math.PI) / 180)
  context.font = `${TEMPLATE.weights.stamp} ${fontSize}px ${TEMPLATE.fontFamily}`
  context.textAlign = 'center'
  context.textBaseline = 'middle'

  const padding = spec.padding * width
  // Upper case, the way a rubber stamp reads — canvas has no text-transform.
  const text = label.toUpperCase()
  const textWidth = context.measureText(text).width
  const boxWidth = textWidth + padding * 2
  const boxHeight = fontSize + padding * 1.4

  // A wash behind the stamp so it stays readable over the artwork's own type.
  context.fillStyle = 'rgba(255, 255, 255, 0.72)'
  context.fillRect(-boxWidth / 2, -boxHeight / 2, boxWidth, boxHeight)
  context.lineWidth = Math.max(2, fontSize * 0.08)
  context.strokeStyle = color
  context.strokeRect(-boxWidth / 2, -boxHeight / 2, boxWidth, boxHeight)
  context.fillStyle = color
  context.fillText(text, 0, 0)
  context.restore()
}

export async function renderCertificateCanvas({
  certificate,
  origin,
  scale = DEFAULT_SCALE,
  stamp,
  signal,
}: {
  certificate: CertificateVerificationApiDto
  origin?: string
  scale?: number
  /**
   * Marks the sheet as revoked or expired. Omitted for a certificate that is still good, which is
   * then drawn exactly as the artwork was designed.
   */
  stamp?: { label: string; tone: CertificateStampTone }
  signal?: AbortSignal
}): Promise<HTMLCanvasElement> {
  if (!Number.isFinite(scale) || scale <= 0) throw new CertificateTemplateError('Invalid scale')

  // The holder's name is a snapshot taken when the certificate was written, so it is the name that
  // was printed even if the account has been renamed since.
  const name = certificate.memberName?.trim() ?? ''
  // Certification date | certificate ID, matching the supplied two-column artwork.
  const metaValues = [
    formatCertificateDate(certificate.certificationDate),
    certificate.certificateId ?? '',
  ]

  const template = await loadTemplate(signal)

  const width = Math.round(TEMPLATE.naturalWidth * scale)
  const height = Math.round(TEMPLATE.naturalHeight * scale)
  if (width * height > MAX_PIXELS) {
    throw new CertificateTemplateError('Certificate canvas exceeds the supported size')
  }

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')
  if (!context) throw new CertificateTemplateError('Canvas is not supported in this browser')

  // A stamped sheet is drained of colour as well as struck, so the state reads before any word
  // does. `ctx.filter` is silently ignored where it is unsupported, in which case the stamp alone
  // still carries the message.
  if (stamp) context.filter = 'grayscale(1)'
  context.drawImage(template, 0, 0, width, height)
  context.filter = 'none'

  context.fillStyle = TEMPLATE.inkColor
  context.textAlign = 'center'

  if (name) {
    const slot = TEMPLATE.memberName
    const nameFont = (size: number) =>
      `italic ${TEMPLATE.weights.memberName} ${size}px ${TEMPLATE.fontFamily}`
    const top = slot.topY * height
    const availableHeight = (slot.bottomY - slot.topY) * height
    const availableWidth = slot.maxWidth * width
    context.textBaseline = 'alphabetic'
    let size = slot.fontSize * height
    context.font = nameFont(size)
    let metrics = context.measureText(name)
    // Ink bounds include stacked Vietnamese accents, descenders and italic overhangs.
    // Advance width alone misses these, and a minimum font size lets long names overflow.
    while (
      size > 1 &&
      (metrics.actualBoundingBoxLeft + metrics.actualBoundingBoxRight > availableWidth ||
        metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent > availableHeight)
    ) {
      size = Math.max(1, size - 1)
      context.font = nameFont(size)
      metrics = context.measureText(name)
    }
    const inkHeight = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent
    const x = slot.centerX * width +
      (metrics.actualBoundingBoxLeft - metrics.actualBoundingBoxRight) / 2
    const baseline = top + (availableHeight - inkHeight) / 2 + metrics.actualBoundingBoxAscent
    context.fillText(name, x, baseline)
  }

  const metaFont = (size: number) => `${TEMPLATE.weights.meta} ${size}px ${TEMPLATE.fontFamily}`
  context.textBaseline = 'alphabetic'
  metaValues.forEach((value, index) => {
    if (!value) return
    const size = fitFontSize(
      context,
      value,
      metaFont,
      TEMPLATE.meta.maxWidth * width,
      TEMPLATE.meta.fontSize * height,
      TEMPLATE.meta.fontSize * height * 0.6,
    )
    context.font = metaFont(size)
    context.fillText(
      value,
      TEMPLATE.meta.columnsX[index] * width,
      TEMPLATE.meta.baselineY * height,
    )
  })

  checkAbort(signal)

  // QR into the blank box. Generated locally by the `qrcode` package rather than fetched from an
  // image service — an external image would taint the canvas and make the download throw.
  const box = {
    x: TEMPLATE.qrBox.x * width,
    y: TEMPLATE.qrBox.y * height,
    width: TEMPLATE.qrBox.width * width,
    height: TEMPLATE.qrBox.height * height,
  }
  if (certificate.certificateId) {
    const inset = Math.min(box.width, box.height) * TEMPLATE.qrInset
    const qrSize = Math.round(Math.min(box.width, box.height) - inset * 2)
    const qrCanvas = document.createElement('canvas')
    await QRCode.toCanvas(qrCanvas, buildCertificateUrl(certificate.certificateId, origin), {
      width: qrSize,
      margin: 0,
      errorCorrectionLevel: 'M',
      color: { dark: TEMPLATE.inkColor, light: '#FFFFFF' },
    })
    context.drawImage(
      qrCanvas,
      Math.round(box.x + (box.width - qrSize) / 2),
      Math.round(box.y + (box.height - qrSize) / 2),
      qrSize,
      qrSize,
    )
  }

  // Last, so it sits over the values and the QR rather than under them.
  if (stamp) drawStamp(context, { width, height }, stamp.label, stamp.tone)

  checkAbort(signal)
  return canvas
}

export function certificateFileName(certificate: CertificateVerificationApiDto): string {
  const id = (certificate.certificateId ?? 'certificate').replace(/[^A-Za-z0-9_-]+/g, '-')
  return `nexora-touch-certificate-${id}.png`
}

export function certificateCanvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob)
      else reject(new CertificateTemplateError('The certificate image could not be exported'))
    }, 'image/png')
  })
}
