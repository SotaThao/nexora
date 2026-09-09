/**
 * Draws a member's details onto the NEXORA TOUCH certificate artwork.
 *
 * The artwork is the source of truth for the layout: it ships with the frame, the headings, the
 * seal, the signatures and the three meta labels already printed, and leaves five slots blank —
 * member name, exam score, certification date, certificate ID, and the QR box. Only those five are
 * drawn here, so a redesign of the sheet is a new image rather than a code change.
 *
 * Every coordinate below is a fraction of the template, measured off the artwork's own ink (the
 * blank QR box was found by scanning for the white rectangle, the meta columns by scanning for the
 * three label clusters) rather than eyeballed from a screenshot. That also means the numbers stay
 * correct if the template is ever re-exported at a different resolution.
 *
 * Same idiom as `renderCheckInBackgroundCanvas.ts`, which composes a QR onto a background for the
 * POS check-in poster.
 */
import QRCode from 'qrcode'
import { CERTIFICATE_EXAM_SCORE_MAX_DEFAULT } from '../../constants/certificate'
import { parseApiUtcDateTime } from '../../utils/localDate'
import {
  CERTIFICATE_FONT_FALLBACK,
  CERTIFICATE_FONT_FAMILY,
  loadCertificateFont,
} from './certificateFont'
import type { CertificateVerificationApiDto } from '../../types/repositories'

/** Public path of the artwork. WebP, re-encoded from the 1.4MB design PNG down to ~119KB. */
export const CERTIFICATE_TEMPLATE_SRC = '/images/certificate-template.webp'

const TEMPLATE = {
  naturalWidth: 1427,
  naturalHeight: 1102,
  /** Ink colour of the artwork's own headings, so the filled values match what is printed. */
  inkColor: '#081F49',
  /**
   * The design sets the sheet in Playfair Display. It is shipped with the app and loaded on demand
   * (see certificateFont.ts); the fallbacks only apply if that load fails, and Times leads them
   * because Georgia renders numbers as old-style figures, which makes "94 / 100" sit unevenly.
   *
   * A variable-font optical-size axis was tried here (pinning `opsz` per role via
   * `variationSettings`) and reverted: it made canvas drop strokes on some glyphs. Every weight
   * below draws from the font's default instance.
   */
  fontFamily: `"${CERTIFICATE_FONT_FAMILY}", ${CERTIFICATE_FONT_FALLBACK}`,
  /** Weights the sheet uses. Playfair Display is a variable font, so one file covers all three. */
  weights: { memberName: 500, meta: 700, stamp: 700 },
  memberName: {
    centerX: 0.5,
    /** Centre of the blank gap between "presented to" (ends y=426) and the gold rule (y≈545). */
    centerY: 0.4410,
    maxWidth: 0.62,
    /** Fractions of the template height. Shrinks from `fontSize` when a long name will not fit. */
    fontSize: 0.069,
    minFontSize: 0.036,
  },
  /** The three meta values sit on one baseline just above the labels printed at y=799..808. */
  meta: {
    baselineY: 0.7132,
    fontSize: 0.0272,
    maxWidth: 0.2,
    /** Centres of the printed EXAM SCORE / CERTIFICATION DATE / CERTIFICATE ID labels. */
    columnsX: [0.2404, 0.4835, 0.7246],
  },
  /** The blank white square in the bottom-right corner, under "VERIFY CERTIFICATE". */
  qrBox: { x: 0.8809, y: 0.7613, width: 0.0897, height: 0.1116 },
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
 * Rendered at twice the artwork's pixel size. The on-screen preview is scaled back down by CSS, so
 * it stays sharp on a retina display, and the downloaded file is large enough for the QR to still
 * scan off paper — at 1x the QR lands at ~113px, which is thin for print.
 */
const DEFAULT_SCALE = 2

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
  // Exam score | certification date | certificate ID, in the order the artwork prints the labels.
  const metaValues = [
    formatExamScore(certificate),
    formatCertificateDate(certificate.certificationDate),
    certificate.certificateId ?? '',
  ]

  // Artwork and font in parallel — both have to be ready before anything is drawn, and neither
  // depends on the other. The font load is given the exact text so only the subsets that text needs
  // are fetched, and it never rejects: a failure just leaves the fallback serif in the stack.
  const [template] = await Promise.all([
    loadTemplate(signal),
    loadCertificateFont([
      { style: 'italic', weight: TEMPLATE.weights.memberName, text: name },
      {
        style: 'normal',
        weight: TEMPLATE.weights.meta,
        text: metaValues.join('') + (stamp ? stamp.label.toUpperCase() : ''),
      },
    ]),
  ])

  const width = Math.round(template.naturalWidth * scale)
  const height = Math.round(template.naturalHeight * scale)
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
    const size = fitFontSize(
      context,
      name,
      nameFont,
      slot.maxWidth * width,
      slot.fontSize * height,
      slot.minFontSize * height,
    )
    context.font = nameFont(size)
    context.textBaseline = 'middle'
    context.fillText(name, slot.centerX * width, slot.centerY * height)
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
  if (certificate.certificateId) {
    const box = {
      x: TEMPLATE.qrBox.x * width,
      y: TEMPLATE.qrBox.y * height,
      width: TEMPLATE.qrBox.width * width,
      height: TEMPLATE.qrBox.height * height,
    }
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
