export function readImageFileAsDataUrl(file: Blob): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result)
        return
      }
      reject(new Error('Unable to read the selected image.'))
    }
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

export function dataUrlToFile(dataUrl: string, fileName = 'photo.jpg'): File {
  const [header, base64] = dataUrl.split(',')
  const mime = header.match(/:(.*?);/)?.[1] || 'image/jpeg'
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i)
  }
  return new File([bytes], fileName, { type: mime })
}

/** MIME types the BE image validator accepts (see ImageValidationService). */
const ALLOWED_IMAGE_MIME_TO_EXT: Record<string, '.jpg' | '.jpeg' | '.png' | '.webp'> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
}

const IMAGE_MIME_ALIASES: Record<string, keyof typeof ALLOWED_IMAGE_MIME_TO_EXT> = {
  'image/jpg': 'image/jpeg',
  'image/pjpeg': 'image/jpeg',
  'image/x-png': 'image/png',
}

/**
 * Rebuild the File so Content-Type + extension match what BE's ImageValidationService allows.
 * Browsers (especially Windows) often send empty type or `image/jpg`, which fails server-side.
 */
export function normalizeAllowedImageFile(file: File): File | null {
  if (!file || file.size <= 0) return null

  const rawType = (file.type || '').toLowerCase().trim()
  const extMatch = file.name.match(/\.([a-zA-Z0-9]+)$/)
  const ext = (extMatch?.[1] || '').toLowerCase()

  let mime: keyof typeof ALLOWED_IMAGE_MIME_TO_EXT | null = null
  if (rawType in ALLOWED_IMAGE_MIME_TO_EXT) {
    mime = rawType as keyof typeof ALLOWED_IMAGE_MIME_TO_EXT
  } else if (rawType in IMAGE_MIME_ALIASES) {
    mime = IMAGE_MIME_ALIASES[rawType]
  } else if (ext === 'jpg' || ext === 'jpeg') {
    mime = 'image/jpeg'
  } else if (ext === 'png') {
    mime = 'image/png'
  } else if (ext === 'webp') {
    mime = 'image/webp'
  }

  if (!mime) return null

  const preferredExt =
    mime === 'image/jpeg' && ext === 'jpeg' ? '.jpeg' : ALLOWED_IMAGE_MIME_TO_EXT[mime]
  const baseName = (file.name.replace(/\.[^.]+$/, '') || 'banner').trim() || 'banner'
  const safeName = `${baseName}${preferredExt}`

  if (file.type === mime && file.name.toLowerCase().endsWith(preferredExt)) {
    return file
  }

  return new File([file], safeName, { type: mime, lastModified: file.lastModified })
}
