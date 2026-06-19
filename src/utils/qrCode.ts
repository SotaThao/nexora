// Generates a QR-code image URL from a payout value (web). Replaces the former
// native camera capture — the native app is built from a separate repo.
export async function captureQrImage({ fallbackValue = '' } = {}): Promise<string> {
  await new Promise((resolve) => {
    setTimeout(resolve, 800)
  })
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(fallbackValue)}`
}
