/**
 * pushDevicesRepository — register OneSignal subscription (player id) with backend.
 *
 * Contract (proposed — confirm with BE if path/body differs):
 *   POST /api/v1/UserProfile/push-device
 *   { playerId, platform, pushToken?, onesignalUserId? }
 */

import httpClient from '../../lib/httpClient'
import { isApiError } from '../../types/domain'
import { logger } from '../../utils/logger'
import type { PushDevicePlatform } from '../../auth/pushDeviceStore'

export type RegisterPushDevicePayload = {
  playerId: string
  platform: PushDevicePlatform
  pushToken?: string | null
  onesignalUserId?: string | null
}

const DEFAULT_REGISTER_PATH = '/api/v1/UserProfile/push-device'

function getRegisterPath(): string {
  const configured = import.meta.env.VITE_PUSH_DEVICE_REGISTER_PATH?.trim()
  return configured || DEFAULT_REGISTER_PATH
}

export function createPushDevicesRepository(client: typeof httpClient = httpClient) {
  return {
    async registerPushDevice(payload: RegisterPushDevicePayload): Promise<boolean> {
      try {
        await client.post(getRegisterPath(), {
          playerId: payload.playerId,
          platform: payload.platform,
          pushToken: payload.pushToken ?? null,
          onesignalUserId: payload.onesignalUserId ?? null,
        })
        return true
      } catch (error) {
        if (isApiError(error) && (error.status === 404 || error.status === 501)) {
          logger.warn('Push device registration endpoint is not available yet', {
            path: getRegisterPath(),
            status: error.status,
          })
          return false
        }

        logger.warn('Push device registration failed', error)
        return false
      }
    },
  }
}

export const pushDevicesRepository = createPushDevicesRepository()
export default pushDevicesRepository
