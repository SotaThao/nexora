/**
 * QR Code utility functions
 * Centralises all QR-related fetch/blob operations so components
 * never call fetch() directly.
 */

/**
 * Downloads a QR code image from a remote URL and triggers a browser
 * "Save As" prompt.
 *
 * @param {string} qrUrl    - The remote image URL to download
 * @param {string} filename - Suggested filename (e.g. 'referral-qr-left.png')
 * @returns {Promise<void>}
 * @throws {Error} Re-throws after cleanup so callers can handle fallback
 */
export async function downloadQrCode(qrUrl, filename = 'qr-code.png') {
  const response = await fetch(qrUrl)

  if (!response.ok) {
    throw new Error(`QR download failed: ${response.status} ${response.statusText}`)
  }

  const blob = await response.blob()
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
