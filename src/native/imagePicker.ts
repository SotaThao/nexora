import { Camera, CameraResultType, CameraSource } from '@capacitor/camera'
import { Capacitor } from '@capacitor/core'
import { dataUrlToFile } from '../utils/imageFile'
import { logger } from '../utils/logger'
import { ensureNativeCameraPermission } from '../utils/cameraPermission'

function getErrorMessage(error) {
  return String(error?.message || error?.errorMessage || '')
}

function isUserCancelled(error) {
  const message = getErrorMessage(error).toLowerCase()
  return message.includes('cancel') || message.includes('dismiss')
}

function isPermissionDenied(error) {
  const message = getErrorMessage(error).toLowerCase()
  return (
    error?.name === 'PermissionDeniedError'
    || message.includes('permission')
    || message.includes('denied')
    || message.includes('not allowed')
  )
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
  if (source === 'camera') {
    const allowed = await ensureNativeCameraPermission()
    if (!allowed) {
      const error = new Error('Camera permission denied')
      error.name = 'PermissionDeniedError'
      throw error
    }
  }

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

      if (isPermissionDenied(error)) {
        logger.warn('Camera permission denied')
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
