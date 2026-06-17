/**
 * QR Code utility functions
 * Centralises all QR-related fetch/blob operations so components
 * never call fetch() directly.
 */

import { downloadFromUrl, downloadBlob, type DownloadResult } from './downloadFile'
import merchantTouchpointsRepository from '../data/repositories/merchantTouchpoints'

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
