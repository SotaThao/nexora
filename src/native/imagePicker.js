import { Camera, CameraResultType, CameraSource } from '@capacitor/camera'
import { Capacitor } from '@capacitor/core'
import { dataUrlToFile } from '../utils/imageFile'

export async function pickImage({ source = 'photos' } = {}) {
  if (!Capacitor.isNativePlatform()) {
    return null
  }

  const photo = await Camera.getPhoto({
    quality: 90,
    allowEditing: false,
    resultType: CameraResultType.DataUrl,
    source: source === 'camera' ? CameraSource.Camera : CameraSource.Photos,
  })

  if (!photo.dataUrl) {
    return null
  }

  return {
    dataUrl: photo.dataUrl,
    file: dataUrlToFile(photo.dataUrl, `photo-${Date.now()}.jpeg`),
  }
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
