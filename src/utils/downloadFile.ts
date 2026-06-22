import { Capacitor, CapacitorHttp } from '@capacitor/core'
import { logger } from './logger'

export type DownloadResult = 'downloaded' | 'shared' | 'cancelled'

const FETCH_TIMEOUT_MS = 20000

function isUserCancelled(error: unknown): boolean {
  if (error instanceof DOMException && error.name === 'AbortError') return true
  const message = String((error as Error)?.message || error || '').toLowerCase()
  return message.includes('cancel') || message.includes('dismiss')
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      const result = String(reader.result || '')
      const base64 = result.includes(',') ? result.split(',')[1] : result
      resolve(base64)
    }
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })
}

function base64ToBlob(base64: string, mimeType: string): Blob {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i)
  }
  return new Blob([bytes], { type: mimeType })
}

function sanitizeFilename(filename: string): string {
  return filename.replace(/[^\w.\-]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || 'download'
}

function guessMimeType(filename: string, blob?: Blob | null): string {
  if (blob?.type) return blob.type
  if (filename.endsWith('.pdf')) return 'application/pdf'
  if (filename.endsWith('.png')) return 'image/png'
  if (filename.endsWith('.jpg') || filename.endsWith('.jpeg')) return 'image/jpeg'
  return 'application/octet-stream'
}

async function fetchBlobWithCapacitorHttp(url: string): Promise<Blob | null> {
  if (!Capacitor.isNativePlatform()) return null

  try {
    const response = await CapacitorHttp.get({
      url,
      responseType: 'blob',
    })

    if (!response.data) return null

    const contentType =
      (response.headers && (response.headers['Content-Type'] || response.headers['content-type'])) ||
      'image/png'

    if (typeof response.data === 'string') {
      return base64ToBlob(response.data, contentType)
    }

    return null
  } catch (error) {
    logger.warn('CapacitorHttp blob fetch failed', error)
    return null
  }
}

async function fetchBlobFromUrl(url: string): Promise<Blob> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

  try {
    const response = await fetch(url, { signal: controller.signal })
    if (response.ok) {
      return await response.blob()
    }
  } catch (error) {
    if (!isUserCancelled(error)) {
      logger.warn('Browser fetch for download failed', error)
    }
  } finally {
    clearTimeout(timeoutId)
  }

  const nativeBlob = await fetchBlobWithCapacitorHttp(url)
  if (nativeBlob) return nativeBlob

  throw new Error(`Download failed: ${url}`)
}

async function shareBlobWithWebApi(blob: Blob, filename: string): Promise<DownloadResult | null> {
  if (typeof navigator.share !== 'function' || typeof File === 'undefined') {
    return null
  }

  const file = new File([blob], filename, { type: guessMimeType(filename, blob) })
  const shareData: ShareData = { files: [file], title: filename }

  if (typeof navigator.canShare === 'function' && !navigator.canShare(shareData)) {
    return null
  }

  try {
    await navigator.share(shareData)
    return 'shared'
  } catch (error) {
    if (isUserCancelled(error)) return 'cancelled'
    return null
  }
}

async function shareBlobWithCapacitor(blob: Blob, filename: string): Promise<DownloadResult | null> {
  if (!Capacitor.isNativePlatform()) return null

  try {
    const { Filesystem, Directory } = await import('@capacitor/filesystem')
    const { Share } = await import('@capacitor/share')

    const safeName = `${Date.now()}-${sanitizeFilename(filename)}`
    const base64 = await blobToBase64(blob)
    const writeResult = await Filesystem.writeFile({
      path: safeName,
      data: base64,
      directory: Directory.Cache,
    })

    await Share.share({
      title: safeName,
      url: writeResult.uri,
      dialogTitle: safeName,
    })
    return 'shared'
  } catch (error) {
    if (isUserCancelled(error)) return 'cancelled'
    logger.warn('Capacitor share download failed', error)
    return null
  }
}

function anchorDownload(blob: Blob, filename: string): DownloadResult {
  const url = URL.createObjectURL(blob)
  try {
    const link = document.createElement('a')
    link.href = url
    link.download = sanitizeFilename(filename)
    link.rel = 'noopener'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    return 'downloaded'
  } finally {
    URL.revokeObjectURL(url)
  }
}

/** True when anchor[download] is unreliable (iOS Safari / Capacitor WebView). */
export function shouldUseMobileDownloadFlow(): boolean {
  if (Capacitor.isNativePlatform()) return true
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent || ''
  return /iPhone|iPad|iPod|Android/i.test(ua)
}

export async function downloadBlob(blob: Blob, filename: string): Promise<DownloadResult> {
  const safeFilename = sanitizeFilename(filename)

  if (shouldUseMobileDownloadFlow()) {
    const webShare = await shareBlobWithWebApi(blob, safeFilename)
    if (webShare) return webShare

    const nativeShare = await shareBlobWithCapacitor(blob, safeFilename)
    if (nativeShare) return nativeShare
  }

  return anchorDownload(blob, safeFilename)
}

export async function downloadFromUrl(url: string, filename: string): Promise<DownloadResult> {
  const blob = await fetchBlobFromUrl(url)
  return downloadBlob(blob, filename)
}
