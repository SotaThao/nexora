import { Camera, CameraResultType, CameraSource } from '@capacitor/camera'
import { Capacitor } from '@capacitor/core'
import { dataUrlToFile } from '../utils/imageFile'
import { logger } from '../utils/logger'

function getErrorMessage(error) {
  return String(error?.message || error?.errorMessage || '')
}

function isUserCancelled(error) {
  const message = getErrorMessage(error).toLowerCase()
  return message.includes('cancel') || message.includes('dismiss')
}

function isCameraUnavailable(error) {
  const message = getErrorMessage(error).toLowerCase()
  return (
    message.includes('simulator')
    || message.includes('not available')
    || message.includes('unavailable')
  )
}

function toSelection(photo) {
  if (!photo?.dataUrl) {
    return null
  }

  return {
    dataUrl: photo.dataUrl,
    file: dataUrlToFile(photo.dataUrl, `photo-${Date.now()}.jpeg`),
  }
}

async function getPhotoFromSource(source) {
  const photo = await Camera.getPhoto({
    quality: 90,
    allowEditing: false,
    resultType: CameraResultType.DataUrl,
    source: source === 'camera' ? CameraSource.Camera : CameraSource.Photos,
  })

  return toSelection(photo)
}

export async function pickImage({ source = 'photos' } = {}) {
  if (!Capacitor.isNativePlatform()) {
    return null
  }

  const sources = source === 'camera' ? ['camera', 'photos'] : ['photos']

  for (const currentSource of sources) {
    try {
      const selection = await getPhotoFromSource(currentSource)
      if (selection) {
        return selection
      }
      return null
    } catch (error) {
      if (isUserCancelled(error)) {
        return null
      }

      if (currentSource === 'camera' && isCameraUnavailable(error)) {
        logger.warn('Camera unavailable, falling back to photo library')
        continue
      }

      logger.error('Failed to pick image', error)
      return null
    }
  }

  return null
}

export async function captureQrImage({ fallbackValue = '' } = {}) {
  if (Capacitor.isNativePlatform()) {
    const result = await pickImage({ source: 'camera' })
    return result?.dataUrl || null
  }

  await new Promise((resolve) => {
    setTimeout(resolve, 800)
  })
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(fallbackValue)}`
}
