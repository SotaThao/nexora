import { Camera } from '@capacitor/camera'
import { Capacitor } from '@capacitor/core'
import { logger } from './logger'

function isCameraGranted(state: string | undefined) {
  return state === 'granted' || state === 'limited'
}

/**
 * Requests native camera permission (Android/iOS system dialog).
 * On web, returns true — the browser prompt is handled by getUserMedia.
 */
export async function ensureNativeCameraPermission(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) {
    return true
  }

  try {
    const current = await Camera.checkPermissions()
    if (isCameraGranted(current.camera)) {
      return true
    }

    const requested = await Camera.requestPermissions({ permissions: ['camera'] })
    return isCameraGranted(requested.camera)
  } catch (error) {
    logger.error('Failed to request camera permission', error)
    return false
  }
}
