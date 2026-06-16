import { imagesRepository } from '../data/repositories/images'

async function dataUrlToFile(dataUrl: string): Promise<File> {
  const response = await fetch(dataUrl)
  const blob = await response.blob()
  return new File([blob], 'qr-code.png', { type: blob.type || 'image/png' })
}

/** Upload new file or keep existing remote URL; never send base64/blob to payment-methods API. */
export async function resolvePaymentMethodImageUrl({
  imageFile,
  imageUrl,
}: {
  imageFile?: File | null
  imageUrl?: string | null
}): Promise<string | null> {
  if (imageFile) {
    return imagesRepository.uploadAndGetUrl(imageFile)
  }

  if (!imageUrl) {
    return null
  }

  if (imageUrl.startsWith('data:')) {
    const file = await dataUrlToFile(imageUrl)
    return imagesRepository.uploadAndGetUrl(file)
  }

  if (imageUrl.startsWith('blob:')) {
    return null
  }

  return imageUrl
}
