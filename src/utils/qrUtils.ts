/**
 * QR Code utility functions
 * Centralises all QR-related fetch/blob operations so components
 * never call fetch() directly.
 */
export { buildPublicQrImageUrl } from '../data/repositories/publicQr'

import { downloadFromUrl, downloadBlob, type DownloadResult } from './downloadFile'
import merchantTouchpointsRepository from '../data/repositories/merchantTouchpoints'

async function fetchQrBlob(qrUrl: string): Promise<Blob> {
  const response = await fetch(qrUrl)

  if (!response.ok) {
    throw new Error(`QR fetch failed: ${response.status} ${response.statusText}`)
  }

  return response.blob()
}

/**
 * Downloads a QR code image from a remote URL.
 * On iOS/Android uses the native share sheet so users can save to Photos.
 *
 * @param {string} qrUrl    - The remote image URL to download
 * @param {string} filename - Suggested filename (e.g. 'referral-qr-left.png')
 * @returns {Promise<DownloadResult>}
 * @throws {Error} Re-throws after cleanup so callers can handle fallback
 */
export async function downloadQrCode(
  qrUrl: string,
  filename = 'qr-code.png',
): Promise<DownloadResult> {
  return downloadFromUrl(qrUrl, filename)
}

export async function downloadTouchpointQrFile(
  touchpointId: string,
  filename: string,
  format: 'png' | 'pdf' = 'png',
): Promise<DownloadResult> {
  const blob = await merchantTouchpointsRepository.downloadQr(touchpointId, format)
  return downloadBlob(blob, filename)
}

function loadImageFromBlob(blob: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to load QR image'))
    }
    img.src = url
  })
}

function truncateCanvasText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  if (ctx.measureText(text).width <= maxWidth) return text
  const ellipsis = '…'
  let trimmed = text
  while (trimmed.length > 1 && ctx.measureText(`${trimmed}${ellipsis}`).width > maxWidth) {
    trimmed = trimmed.slice(0, -1)
  }
  return `${trimmed}${ellipsis}`
}

export function formatQrOwnerBusinessLabel(ownerName: string, businessName?: string | null) {
  const owner = String(ownerName || '').trim()
  const business = String(businessName || '').trim()
  if (owner && business) return `${owner} @ ${business}`
  return owner || business
}

/** Compose QR PNG with owner + linked business caption for share/download. */
export async function buildLabeledQrImageBlob(
  qrUrl: string,
  {
    ownerName,
    businessName,
  }: {
    ownerName: string
    businessName?: string | null
  },
): Promise<Blob> {
  const qrBlob = await fetchQrBlob(qrUrl)
  const qrImage = await loadImageFromBlob(qrBlob)

  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas not supported')

  const padding = 32
  const contentWidth = 520
  const titleFont = '700 22px system-ui, -apple-system, "Segoe UI", sans-serif'
  const caption = formatQrOwnerBusinessLabel(ownerName, businessName)

  ctx.font = titleFont
  const title = truncateCanvasText(ctx, caption, contentWidth)
  const titleBlockHeight = caption ? 40 : 0
  const gap = caption ? 20 : 0
  const qrSize = Math.min(Math.max(qrImage.width, 256), 512)

  canvas.width = contentWidth + padding * 2
  canvas.height = padding + titleBlockHeight + gap + qrSize + padding

  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  if (caption) {
    ctx.fillStyle = '#0f172a'
    ctx.font = titleFont
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(title, canvas.width / 2, padding + titleBlockHeight / 2)
  }

  const qrX = (canvas.width - qrSize) / 2
  const qrY = padding + titleBlockHeight + gap
  ctx.drawImage(qrImage, qrX, qrY, qrSize, qrSize)

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob)
      else reject(new Error('Failed to export labeled QR image'))
    }, 'image/png')
  })
}

type ShareQrImageOptions = {
  filename?: string
  title?: string
  text?: string
  ownerName?: string
  businessName?: string | null
}

/**
 * Shares a QR image via the native Web Share API (files).
 * Falls back to download when file sharing is unavailable (e.g. desktop).
 */
export async function shareQrImage(
  qrUrl: string,
  {
    filename = 'qr-code.png',
    title,
    text,
    ownerName,
    businessName,
  }: ShareQrImageOptions = {},
): Promise<'shared' | 'downloaded' | 'cancelled'> {
  const blob =
    ownerName?.trim()
      ? await buildLabeledQrImageBlob(qrUrl, { ownerName, businessName })
      : await fetchQrBlob(qrUrl)

  const file = new File([blob], filename, { type: blob.type || 'image/png' })
  const shareData: ShareData = { files: [file] }
  if (title) shareData.title = title
  if (text) shareData.text = text

  if (typeof navigator.share === 'function') {
    const canShareFiles =
      typeof navigator.canShare !== 'function' || navigator.canShare({ files: [file] })
    if (canShareFiles) {
      try {
        await navigator.share(shareData)
        return 'shared'
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') {
          return 'cancelled'
        }
        throw err
      }
    }
  }

  await downloadBlob(blob, filename)
  return 'downloaded'
}
