// Generates a QR-code image URL from a payout value (web). Replaces the former
// native camera capture — the native app is built from a separate repo.
import { buildPublicQrImageUrl } from '../data/repositories/publicQr'

export async function captureQrImage({ fallbackValue = '' } = {}): Promise<string> {
  await new Promise((resolve) => {
    setTimeout(resolve, 800)
  })
  if (!fallbackValue) return ''
  return buildPublicQrImageUrl(fallbackValue, 200)
}
